# OpportunityHub

A web app for secondary school students in Kathmandu to discover opportunities, track portfolio activities, and build CVs.

Built for NEB, IGCSE, AS, and A-Level students preparing university portfolios.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Auth & DB | Supabase |
| AI (optional) | Google Gemini API |
| Hosting | Vercel |

## Features

- Sign up / log in with education level and dream university
- Browse and filter opportunities (search, subject, type, deadline, format)
- Save opportunities to a personal list
- Log portfolio activities by category
- Rule-based portfolio strength score (6 categories)
- AI suggestions for next steps and opportunity picks (optional)
- CV builder with copy-to-clipboard and optional AI enhancement

## Quick start (local)

### 1. Install

```bash
cd opportunityhub
npm install
cp .env.local.example .env.local
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy **Project URL** and **anon key** into `.env.local`
3. In **SQL Editor**, run:
   - `supabase/complete-schema.sql` (all tables)
   - `supabase/migrate-opportunity-ai-fields.sql` (AI detail columns — if you already ran an older schema)
   - `supabase/migrate-ai-usage.sql` (per-user AI credit tracking)
   - `supabase/seed-opportunities.sql` (sample data)
4. **Authentication → Providers → Email** — turn off **Confirm email** for easier local testing

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Enable AI (Gemini)

1. Get a key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add `GEMINI_API_KEY=...` to `.env.local`
3. Restart the dev server: `npm run dev`

**What AI does in this app:**

| Feature | Where | Behavior |
|---------|-------|----------|
| Suggestions | Dashboard, `/ai-suggestions` | Picks opportunities from your database |
| CV enhance | `/cv-builder` | Bullet points from your activities |
| Opportunity details | Each opportunity page | Generates prep resources, steps, timeline — **saved to Supabase** |

**Opportunity enrichment flow:**

1. Open any opportunity → click **Generate AI details** (first time)
2. Gemini structures prep resources, application steps, eligibility, portfolio tips
3. Results are **written to the `opportunities` table** (`ai_summary`, `prep_resources`, etc.)
4. Next visit loads from the database instantly — no API call
5. Click **Refresh with AI (latest)** only when you want to re-fetch the registration page and update

Without Gemini, suggestions use simple rules and opportunity pages show only seed/description data.

### 5. Troubleshooting Gemini

Your key format may be **`AQ.`** (new Google auth key) or **`AIza`** (older standard key) — both are valid.

Test connectivity:

```bash
npm run test:gemini
```

| Error from test | What to do |
|-----------------|------------|
| `OK: gemini-... works` | Restart `npm run dev`, try **Generate AI details** again |
| `quota` / `rate limit` | Wait 1 minute, retry. Check https://ai.dev/rate-limit |
| `denied access` on 2.5 models | Normal — app falls back to 2.0-flash-lite automatically |
| `limit: 0` on free tier | Enable billing in Google AI Studio or create a fresh API key/project |

**Important:** After changing `.env.local`, always restart the dev server.

### AI credits (per user)

Each logged-in user gets a **monthly credit budget** so one person cannot exhaust your Gemini quota:

| Tier | Default credits/month | Model quality |
|------|----------------------|---------------|
| Main AI | 8 | Best (gemini-2.0-flash) |
| Standard AI | 15 | Lighter model |
| Basic AI | 25 | Shortest answers |

- Requests start on **Main AI** and automatically move down when that tier runs out.
- **Page refresh does not use credits** — only clicking AI buttons does.
- Saved opportunity details load from Supabase without calling Gemini.
- Credits reset on the 1st of each month (UTC).
- Override limits with `AI_TIER_PREMIUM_LIMIT`, `AI_TIER_STANDARD_LIMIT`, `AI_TIER_BASIC_LIMIT` in env.

Run `supabase/migrate-ai-usage.sql` in Supabase if credits are not tracking.

## Deploy to Vercel (step by step)

### 1. Put code on GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Initial OpportunityHub MVP"
```

Create an empty repo on [github.com/new](https://github.com/new), then:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/opportunityhub.git
git push -u origin main
```

### 2. Import on Vercel

1. Sign in at [vercel.com](https://vercel.com) (GitHub login is easiest).
2. Click **Add New → Project** ([vercel.com/new](https://vercel.com/new)).
3. Select your `opportunityhub` repository.
4. Leave **Framework Preset** as Next.js — defaults are fine.
5. Under **Environment Variables**, add:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same page |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your Vercel URL, e.g. `https://opportunityhub.vercel.app` |
| `GEMINI_API_KEY` | For AI | From Google AI Studio |
| `AI_TIER_PREMIUM_LIMIT` | No | Default 8 |
| `AI_TIER_STANDARD_LIMIT` | No | Default 15 |
| `AI_TIER_BASIC_LIMIT` | No | Default 25 |

6. Click **Deploy** — first build takes ~1–2 minutes.
7. When done, Vercel gives you a live URL like `https://opportunityhub-xxx.vercel.app`.

**Alternative (CLI):** install Vercel CLI (`npm i -g vercel`), run `vercel login`, then `vercel` in the project folder and follow prompts.

### 3. Configure Supabase for production

In Supabase **Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` (keep for local dev) |

Update `NEXT_PUBLIC_SITE_URL` on Vercel to match your production URL, then **Redeploy** (Deployments → ⋯ → Redeploy).

### 4. After deploy

- Sign up on the live site to confirm auth works.
- Open an opportunity → **Generate AI details** once to test Gemini.
- Every git push to `main` can auto-deploy if you enabled that in Vercel project settings.

## Project structure

```
app/
  (auth)/           Login, signup
  (app)/            Dashboard, opportunities, portfolio, CV, profile, AI
  auth/callback/    Supabase auth redirect handler
components/
  ai/               AI suggestions panel
  auth/             Login, signup, profile forms
  cv/               CV preview and builder
  layout/           Header, nav, footer, page headers
  opportunities/    Feed, cards, filters, save button
  portfolio/        Activities, scores, forms
  ui/               Button, Card, Input, Select, etc.
lib/
  actions/          Server actions (auth, activities, AI, opportunities)
  ai/               Gemini client, prompts, fallback
  cv/               CV generation helpers
  portfolio/        Score calculation
  queries/          Supabase read helpers
  supabase/         Browser, server, middleware clients
supabase/
  setup-all.sql     Full database schema (run once)
  seed-opportunities.sql  Sample opportunities
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Environment variables

See `.env.local.example` for all variables.

**Never commit `.env.local`** — it is gitignored. The example file is safe to commit.

## Database tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (education, dream university, interests) |
| `opportunities` | Opportunity listings |
| `saved_opportunities` | User bookmarks |
| `activities` | Portfolio activity log |
| `ai_user_usage` | Per-user monthly AI credit counters |

## MVP limits

Designed for ~10–50 users on free tiers. No custom ML — AI uses Gemini API only when configured.

## License

Private / learning project.
