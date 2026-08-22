-- HonestER migration v4 — adds anonymous feedback/bug reports.
-- Non-destructive: only adds a new table. Run in Supabase SQL Editor.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('bug', 'idea', 'other')) default 'other',
  message text not null,
  page_url text,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

-- Anyone can submit feedback anonymously; nobody (including anon) can read
-- it back — you'll review submissions directly in the Supabase Table
-- Editor, same low-key approach as the rest of the site's admin model.
drop policy if exists "Public insert feedback" on feedback;
create policy "Public insert feedback" on feedback for insert with check (true);

select 'Migration v4 complete' as status;
