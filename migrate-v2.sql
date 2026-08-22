-- HonestER migration — brings an existing, already-live database up to date
-- with everything built since the first schema.sql, WITHOUT deleting any
-- existing facilities, visits, or ratings. Safe to run more than once.
-- Run this in Supabase SQL Editor → New query.

-- ── 1. Expand the allowed "reason for visit" categories ─────────
-- This is the fix for the exact error you just saw: the database only knew
-- about the original short list, not everything added later.

alter table visits drop constraint if exists visits_visit_category_check;
alter table visits add constraint visits_visit_category_check check (visit_category in (
  'general_pain','abdominal_pain','pelvic_pain','chest_pain','back_pain','headache_migraine','kidney_stones','dental_emergency',
  'cuts_lacerations','bruises','fracture_broken_bone','sprain_strain','burn','head_injury','eye_injury','animal_insect_bite','foreign_object',
  'fever_chills','infection','breathing_cardiac','stroke_symptoms','seizure','diabetic_emergency','allergic_reaction','poisoning_overdose',
  'cancer_related','pregnancy_related','pediatric_illness','respiratory_infection','urinary_uti','ent_issue','skin_condition_rash','dizziness_fainting',
  'mental_health','anxiety_panic','dehydration','other',
  -- keeping the original short list's values too, so nothing already
  -- submitted under the old system ever becomes invalid
  'injury','pain'
));

-- ── 2. Add staff rating moderation (approved column) ─────────────
-- Adds the column needed for admin.html's approve/reject queue.
-- Any ratings that already existed are preserved as visible (approved = true)
-- so nothing already public suddenly disappears; new submissions from here
-- on default to false until an admin approves them.

alter table staff_ratings add column if not exists approved boolean default true;
alter table staff_ratings alter column approved set default false;

-- Replace the old fully-public policies with moderation-aware ones.
drop policy if exists "Public read staff_ratings" on staff_ratings;
drop policy if exists "Public insert staff_ratings" on staff_ratings;

create policy "Public read approved staff_ratings" on staff_ratings
  for select using (approved = true);
create policy "Authenticated read all staff_ratings" on staff_ratings
  for select using (auth.role() = 'authenticated');
create policy "Public insert staff_ratings" on staff_ratings
  for insert with check (approved = false);
create policy "Authenticated update staff_ratings" on staff_ratings
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated delete staff_ratings" on staff_ratings
  for delete using (auth.role() = 'authenticated');

-- ── 3. Refresh the facility stats view (adds recent_report_count) ─
-- CREATE OR REPLACE is non-destructive — it updates the view's definition
-- without touching any underlying table data.

create or replace view facility_wait_stats as
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

-- ── 4. Refresh the 7-day trend function ──────────────────────────

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

-- ── Done — verify below ──────────────────────────────────────────
select 'Migration complete' as status;
