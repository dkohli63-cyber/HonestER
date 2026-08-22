# HonestER

Anonymous, crowdsourced ER and walk-in clinic wait times across Canada.

The site works and is browsable right now with sample data — you don't need
to set up anything to look around. To make it live and collecting real
submissions, follow the steps below.

## 1. Create your database (Supabase — free)

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. Open **SQL Editor → New query**, paste in the entire contents of
   `schema.sql`, and run it. This creates all the tables, the aggregation
   view, and the security rules — including the moderation setup for staff
   ratings (see step 4).
3. Go to **Settings → API**. Copy the **Project URL** and the **anon public** key.
4. Open `config.js` and paste them in.

*(Already done if you're picking this up mid-setup — your keys are already in `config.js`.)*

## 2. Facility autocomplete (Google Places API)

Already set up if you followed the earlier steps — `config.js` has your
Google Places key. If you ever need to redo it: enable **Places API** and
**Maps JavaScript API** in Google Cloud Console, create a key under
Credentials, and restrict it to your site's domain.

## 3. Set up staff rating moderation (new)

Doctor and nurse ratings are now held back from public view until you
approve them — this protects against unverified claims about a named,
identifiable person going live instantly. To moderate:

1. In Supabase, go to **Authentication → Users → Add user**, and create one
   account for yourself (email + password). This is the only account that
   should exist — leave public sign-ups off, which is the default.
2. Visit `admin.html` on your live site and sign in with that email/password.
3. You'll see a queue of pending ratings with Approve/Reject buttons.
   Approved ones become visible on the facility's page; rejected ones are
   deleted. Nothing is public until you act on it.

`admin.html` has `<meta name="robots" content="noindex">` so search engines
won't index it, but the URL itself isn't secret — anyone who finds it just
can't get past the sign-in without your credentials.

## 4. French language toggle

No setup needed — there's a language button in the top-left of the nav on
every page (shows "FR" in English mode, "EN" in French mode). It's
implemented in `i18n.js` and remembers the visitor's choice. Translation
coverage is complete for the homepage, report form, and browse pages; the
About page and facility detail page are currently English-only — let me
know if you'd like those translated too.

## 5. Browse by province

`browse.html` lists all 13 provinces/territories with a live count of
listed facilities, and clicking one filters to just that province's
results — this also gives you shareable, bookmarkable URLs like
`browse.html?province=ON` for each region.

## 6. Install as an app (PWA)

The site has a manifest and service worker already wired in, so on both
desktop and mobile, visitors can "Install" or "Add to Home Screen" from
their browser menu, and it'll open in its own window/icon like a native
app, with the core pages cached for faster repeat visits.

## 7. Test locally

Any static file server works. From this folder, run:
```
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

## 7b. Run the latest migration

`migrate-v3.sql` adds official-source link-out fields for BC facilities
(linking to the Vancouver Coastal Health / Fraser Health wait-time
dashboard) — safe, non-destructive, doesn't touch existing data. Run it
in Supabase → SQL Editor the same way as the earlier migration files.

## 7c. Run the feedback table migration

`migrate-v4.sql` adds a table for the new anonymous feedback/bug-report
button (bottom-right corner on every page). Submissions aren't readable
through the public API — check them directly in Supabase → Table Editor →
feedback.

## 8. Put it on GitHub

```
git init
git add .
git commit -m "HonestER site update"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/honester.git
git push -u origin main
```
If you already have a repo connected, just upload/overwrite the changed
files through GitHub's web uploader the same way as before.

## 9. Publish it live

Already live via **GitHub Pages** if you followed the earlier setup. No
change needed there — just push/upload the updated files and it redeploys
automatically within a minute or two.

## Notes on abuse prevention

The database rules stop anyone from editing or deleting someone else's
report, and staff ratings specifically require your manual approval before
they're public. For stronger protection against fake bulk submissions,
consider turning on Supabase's built-in bot/abuse protection (Project
Settings → Auth → Bot and Abuse Protection).

## Project structure

```
index.html      Homepage — hero, stats, map, nearby facility list, chart
report.html     The 5-minute anonymous report form (AM/PM times, full condition list)
facility.html   Per-facility wait-time trend, freshness note, approved staff ratings
browse.html     Browse-by-province listing
about.html      Triage explanation, disclaimer, privacy notes
admin.html      Sign-in-protected moderation queue for staff ratings
style.css       Shared visual design (Fraunces + Inter, sage/pine palette)
i18n.js         EN/FR translation layer
config.js       <-- the only file you normally need to edit (API keys)
manifest.json / sw.js   PWA install support
schema.sql      Database schema — safe to re-run any time
icon-192.png / icon-512.png   App icons
```
