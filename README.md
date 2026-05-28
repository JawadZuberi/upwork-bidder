# Upwork Auto-Bidder — Quill Forge Publishing

AI-powered Upwork proposal system. Automatically finds ghostwriting and publishing jobs from Upwork RSS feeds, scores them by relevance, and uses Claude AI to write personalized proposals. You review and send.

## How It Works

```
Upwork RSS (every 30 min) → Job Scorer → Dashboard → Claude AI → Proposal → You Copy & Send
```

- **Automatic job fetching** via Vercel Cron every 30 minutes
- **Relevance scoring** — 0–100 score based on keywords and budget
- **Claude AI proposals** — personalized to each job post, under 180 words
- **One-click workflow** — review, copy, paste into Upwork

---

## Deployment (15 minutes)

### Step 1 — Push to GitHub

1. Create a new GitHub repository (private recommended)
2. Push this project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy** (first deploy, no env vars yet — it'll deploy but won't work fully)

### Step 3 — Add Vercel KV (Database)

1. In your Vercel project → **Storage** tab → **Create Database**
2. Choose **KV** → **Create**
3. Go to the KV database → **Settings** → **Environment Variables**
4. Click **Pull** to auto-add all KV environment variables to your project

### Step 4 — Add Environment Variables

In Vercel → **Settings** → **Environment Variables**, add:

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `CRON_SECRET` | Any random string | Run: `openssl rand -hex 32` |

The KV variables (`KV_URL`, `KV_REST_API_URL`, etc.) are added automatically in Step 3.

### Step 5 — Redeploy

After adding env vars:
1. Vercel → **Deployments** → click the three dots on the latest → **Redeploy**
2. Your app is now live at `https://your-project.vercel.app`

---

## Vercel Cron (Auto Job Fetching)

The `vercel.json` file configures a cron job at `/api/cron` that runs every 30 minutes.

> ⚠️ **Vercel Cron requires a Pro plan** ($20/month). On the free Hobby plan, you can still manually trigger job fetching by clicking "Fetch Jobs" in the dashboard.

If you're on Hobby plan, the app works perfectly — just click "Fetch Jobs" manually when you want fresh jobs.

---

## Local Development

```bash
npm install

# Copy env template
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY (KV vars optional for local dev — uses in-memory store)

npm run dev
# Open http://localhost:3000
```

---

## Customizing Job Searches

Edit `lib/upwork.js` → `SEARCH_QUERIES` array to add or change search terms:

```javascript
const SEARCH_QUERIES = [
  'ghostwriter memoir',
  'ghostwriter business book',
  'book publishing consultant',
  // Add your own:
  'fiction ghostwriter',
  'kindle publishing',
];
```

## Customizing Your Profile

Edit `lib/claude.js` → `SYSTEM_PROMPT` to update your credentials, services, and tone.

---

## Architecture

```
app/
  page.jsx                    # Dashboard UI (React)
  api/
    jobs/route.js             # GET/PUT jobs from KV storage
    generate-proposal/route.js # POST: Claude proposal generation
    fetch-jobs/route.js       # POST: Manual RSS fetch trigger
    cron/route.js             # GET: Automated cron endpoint

lib/
  upwork.js                   # RSS fetching + parsing + scoring
  claude.js                   # Anthropic API integration
  storage.js                  # Vercel KV with memory fallback
```

## Security

- `ANTHROPIC_API_KEY` is server-side only — never exposed to the browser
- Cron endpoint protected by `CRON_SECRET`
- All proposal generation happens in serverless functions
