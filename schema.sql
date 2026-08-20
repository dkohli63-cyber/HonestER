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
  visit_category text check (visit_category in ('injury','pain','breathing_cardiac','pediatric_illness','mental_health','other')),
  overall_rating int check (overall_rating between 1 and 5),
  created_at timestamptz default now()
);

create table staff_ratings (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  staff_name text not null,
  rating int check (rating between 1 and 5),
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
  avg(v.overall_rating) as avg_rating
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

alter table facilities enable row level security;
alter table visits enable row level security;
alter table staff_ratings enable row level security;

create policy "Public read facilities" on facilities for select using (true);
create policy "Public insert facilities" on facilities for insert with check (true);

create policy "Public read visits" on visits for select using (true);
create policy "Public insert visits" on visits for insert with check (true);

create policy "Public read staff_ratings" on staff_ratings for select using (true);
create policy "Public insert staff_ratings" on staff_ratings for insert with check (true);

-- ── Basic abuse mitigation ────────────────────────────────────
-- Supabase's free tier includes built-in rate limiting on the API.
-- For stronger protection, add a Supabase Edge Function that checks
-- submission frequency per IP before allowing an insert, or enable
-- Supabase's "Bot & Abuse Protection" (Captcha) on the project's Auth
-- settings and require a token on submit even for anonymous inserts.
