-- Run this ONCE in Supabase SQL Editor to fix facilities submitted before
-- city/province were being captured (the browse-by-province bug).
-- Unlike schema.sql, this does NOT drop or recreate any tables — it only
-- updates existing rows, so your real submitted data is safe.

update facilities set province = 'BC', city = 'Abbotsford' where name ilike '%abbotsford%' and province is null;
update facilities set province = 'BC', city = 'Langley' where name ilike '%langley%' and province is null;
update facilities set province = 'BC', city = 'Surrey' where name ilike '%surrey%' and province is null;

-- Check it worked:
select name, city, province from facilities;
