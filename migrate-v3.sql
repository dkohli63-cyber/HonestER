-- HonestER migration v3 — adds official-source link-out fields.
-- Non-destructive: only adds columns and refreshes view definitions.
-- Run in Supabase SQL Editor → New query.

-- ── 1. Add official source fields to facilities ──────────────────
-- These hold a LINK to an official government wait-time dashboard, not a
-- copied number — see the app's About/methodology pages for why we link
-- out rather than republish a hospital-reported figure ourselves.

alter table facilities add column if not exists official_source_name text;
alter table facilities add column if not exists official_source_url text;

-- ── 2. Populate the known BC facilities ───────────────────────────
-- Vancouver Coastal Health + Fraser Health + Providence Health Care jointly
-- run a public ER wait-time dashboard covering the Lower Mainland, Sea-to-
-- Sky, and Sunshine Coast. This links to their site directly — nothing is
-- copied or stored from it.

update facilities
set official_source_name = 'Emergency Department Wait Times (VCH / Fraser Health)',
    official_source_url = 'https://www.edwaittimes.ca/legacy'
where province = 'BC' and type = 'er';

-- ── 3. Refresh the facility stats view to expose the new fields ──

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
  count(v.id) filter (where v.created_at > now() - interval '48 hours') as recent_report_count,
  f.official_source_name,
  f.official_source_url
from facilities f
left join visits v on v.facility_id = f.id
group by f.id;

select 'Migration v3 complete' as status;
