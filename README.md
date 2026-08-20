# HonestER

Anonymous, crowdsourced ER and walk-in clinic wait times across Canada.

The site works and is browsable right now with sample data — you don't need
to set up anything to look around. To make it live and collecting real
submissions, follow the steps below.

## 1. Create your database (Supabase — free)

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. Once it's created, open **SQL Editor → New query**, paste in the entire
   contents of `supabase/schema.sql`, and run it. This creates all the
   tables, the aggregation view, and the security rules that let anonymous
   visitors submit reports but never edit or delete existing ones.
3. Go to **Settings → API**. Copy the **Project URL** and the **anon public**
   key.
4. Open `js/config.js` and paste them in:
   ```js
   SUPABASE_URL: "https://your-project.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",
   ```

## 2. Turn on facility autocomplete (Google Places API)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create
   a project, and enable the **Places API**.
2. Create an API key under **APIs & Services → Credentials**.
3. **Restrict the key** to your domain (Application restrictions → HTTP
   referrers) once you know it, so nobody else can use your key.
4. Paste the key into `js/config.js`:
   ```js
   GOOGLE_MAPS_API_KEY: "your-key-here",
   ```
   Google gives a monthly free credit that comfortably covers a
   small-to-medium site's autocomplete usage — check current pricing at
   [developers.google.com/maps/billing](https://developers.google.com/maps/billing)
   before launch, since pricing can change.

## 3. Test locally

Any static file server works. From this folder, run:
```
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

## 4. Put it on GitHub

```
git init
git add .
git commit -m "Initial HonestER site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/honester.git
git push -u origin main
```

## 5. Publish it live

Easiest free option: **GitHub Pages**.
1. In your GitHub repo, go to **Settings → Pages**.
2. Under "Build and deployment", set Source to **Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. Save — your site will be live at `https://YOUR_USERNAME.github.io/honester`
   within a minute or two.

Alternatives with similarly free tiers: **Netlify** or **Vercel** — both let
you drag-and-drop this folder or connect the GitHub repo directly, and both
support custom domains.

## 6. Connect your domain

Once you've bought a domain (e.g. through GoDaddy), add a custom domain in
your GitHub Pages / Netlify / Vercel settings, then create the DNS records
they give you (usually a CNAME or a few A records) in your domain
registrar's DNS panel. It typically takes a few minutes to a few hours to
go live.

## Notes on abuse prevention

The database rules already stop anyone from editing or deleting someone
else's report. For stronger protection against fake bulk submissions before
you get real traffic, consider turning on Supabase's built-in bot/abuse
protection (Project Settings → Auth → Bot and Abuse Protection) — see the
comment at the bottom of `supabase/schema.sql`.

## Project structure

```
index.html      Homepage — map + nearby facility list
report.html     The 5-minute anonymous report form
facility.html   Per-facility wait-time trend + staff ratings
about.html      Triage explanation + privacy notes
css/style.css   Sage green / white theme, shared across all pages
js/config.js    <-- the only file you need to edit (API keys)
supabase/schema.sql  Database schema — run once in Supabase
```
