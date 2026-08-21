-- HonestER database schema
-- Run this in your Supabase project's SQL editor (Database → SQL Editor → New query)
-- Safe to re-run: it clears out any previous version of these tables first.

-- ── Clean slate ─────────────────────────────────────────────────

drop view if exists facility_wait_stats cascade;
drop function if exists facility_daily_wait(uuid) cascade;
drop table if exists staff_ratings cascade;
drop table if exists visits cascade;
drop table if exists facilities cascade;

-- ── Tables ──────────────────────────────────────────────────────

create table facilities (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  type text check (type in ('er', 'walkin')) default 'er',
  city text,
  province text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table visits (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id) on delete cascade,
  checkin_time time not null,
  seen_by_doctor_time time not null,
  age_bracket text check (age_bracket in ('0-12','13-17','18-64','65+')),
  visit_category text check (visit_category in (
    'general_pain','abdominal_pain','pelvic_pain','chest_pain','back_pain','headache_migraine','kidney_stones','dental_emergency',
    'cuts_lacerations','bruises','fracture_broken_bone','sprain_strain','burn','head_injury','eye_injury','animal_insect_bite','foreign_object',
    'fever_chills','infection','breathing_cardiac','stroke_symptoms','seizure','diabetic_emergency','allergic_reaction','poisoning_overdose',
    'cancer_related','pregnancy_related','pediatric_illness','respiratory_infection','urinary_uti','ent_issue','skin_condition_rash','dizziness_fainting',
    'mental_health','anxiety_panic','dehydration','other'
  )),
  overall_rating int check (overall_rating between 1 and 5),
  created_at timestamptz default now()
);

create table staff_ratings (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  staff_name text not null,
  rating int check (rating between 1 and 5),
  approved boolean default false,
  created_at timestamptz default now()
);

-- ── Aggregated view used by the homepage & facility page ────────

create view facility_wait_stats as
select
  f.id,
  f.name,
  f.type,
  f.city,
  f.province,
  f.lat,
  f.lng,
  avg(extract(epoch from (v.seen_by_doctor_time - v.checkin_time)) / 60)
    filter (where v.created_at > now() - interval '14 days') as avg_wait_minutes,
  avg(v.overall_rating) as avg_rating,
  count(v.id) filter (where v.created_at > now() - interval '48 hours') as recent_report_count
from facilities f
left join visits v on v.facility_id = f.id
group by f.id;

-- ── 7-day trend RPC used by the facility detail page ─────────────

create or replace function facility_daily_wait(fid uuid)
returns table(day date, avg_minutes numeric) as $$
  select
    date(created_at) as day,
    avg(extract(epoch from (seen_by_doctor_time - checkin_time)) / 60) as avg_minutes
  from visits
  where facility_id = fid
    and created_at > now() - interval '7 days'
  group by date(created_at)
  order by day;
$$ language sql stable;

-- ── Row Level Security ────────────────────────────────────────
-- Anyone (anonymous) can read aggregated data and insert new reports.
-- Nobody — including anon — can update or delete existing rows,
-- which prevents a submitter or anyone else from tampering with past reports.
--
-- Staff ratings specifically stay hidden from the public until an admin
-- approves them (see "Admin update staff_ratings" below). To create your
-- admin account: Supabase dashboard → Authentication → Users → Add user,
-- then sign in with that email/password on admin.html. Keep those
-- credentials private — anyone signed in is treated as an admin.

alter table facilities enable row level security;
alter table visits enable row level security;
alter table staff_ratings enable row level security;

create policy "Public read facilities" on facilities for select using (true);
create policy "Public insert facilities" on facilities for insert with check (true);

create policy "Public read visits" on visits for select using (true);
create policy "Public insert visits" on visits for insert with check (true);

create policy "Public read approved staff_ratings" on staff_ratings for select using (approved = true);
create policy "Public insert staff_ratings" on staff_ratings for insert with check (true);
create policy "Admin read all staff_ratings" on staff_ratings for select to authenticated using (true);
create policy "Admin update staff_ratings" on staff_ratings for update to authenticated using (true) with check (true);
create policy "Admin delete staff_ratings" on staff_ratings for delete to authenticated using (true);

-- ── Basic abuse mitigation ────────────────────────────────────
-- Supabase's free tier includes built-in rate limiting on the API.
-- For stronger protection, add a Supabase Edge Function that checks
-- submission frequency per IP before allowing an insert, or enable
-- Supabase's "Bot & Abuse Protection" (Captcha) on the project's Auth
-- settings and require a token on submit even for anonymous inserts.