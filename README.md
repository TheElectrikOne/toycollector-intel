# ToyVerse Intel

An automated toy collector intelligence platform that monitors official brand websites and retailer pages for new product announcements, extracts product data using AI, and publishes news articles automatically.

## What It Does

- **Monitors** toy brand and retailer websites 24/7 for new product listings (Good Smile, NECA, Hasbro Pulse, McFarlane Toys, and more)
- **Detects** page changes using SHA256 hashing
- **Extracts** product details (name, brand, price, release date, franchise) using Kimi AI
- **Classifies** detections by type (new release, preorder, rumor) and urgency
- **Deduplicates** against existing products to avoid repeat coverage
- **Auto-publishes** news articles for trusted sources (trust level ≥ 5)
- **Alerts** via Discord when high-urgency preorder announcements are detected

## Tech Stack

| Layer | Technology |
|---|---|
| Website | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database | PostgreSQL via Supabase + Drizzle ORM |
| Scraper | Python, Playwright, APScheduler |
| AI | Kimi (Moonshot AI) via OpenAI-compatible SDK |
| Hosting | Vercel (web) + Railway (scraper) |

## Architecture

```
Railway (Python scraper)
  └── Monitors toy sites every 15min–24hr
  └── Detects page changes
  └── Extracts products with Kimi AI
  └── Writes detections to Supabase
        │
        ▼
Supabase (PostgreSQL database)
  └── sources, page_monitors, raw_detections
  └── products, news_posts, preorder_alerts
        │
        ▼
Vercel (Next.js website)
  └── Public: /news, /franchises, /brands, /preorders
  └── Admin: /admin — dashboard, queue, posts
```

## Project Structure

```
toycollector-intel/
├── apps/
│   └── web/                  # Next.js web application
│       ├── src/app/          # App Router pages and API routes
│       ├── src/components/   # UI components
│       └── src/lib/          # DB, AI, scraper utilities
└── services/
    └── scraper/              # Python scraper (lives in toycollector-scraper repo)
```

> The Python scraper is deployed from a separate repo: [toycollector-scraper](https://github.com/TheElectrikOne/toycollector-scraper)

## Environment Variables

### Vercel (web app)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `DATABASE_URL` | Direct PostgreSQL connection string |
| `ADMIN_SECRET` | Secret token for admin API routes |
| `KIMI_API_KEY` | Moonshot AI API key |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the deployed site |
| `NEXT_PUBLIC_SITE_NAME` | Site display name |

### Railway (scraper)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `KIMI_API_KEY` | Moonshot AI API key |
| `WEB_APP_URL` | Vercel app URL (for auto-publish calls) |
| `ADMIN_SECRET` | Must match the value set in Vercel |
| `AUTO_PUBLISH_MIN_TRUST_LEVEL` | Minimum trust level to auto-publish (default: 5) |
| `LOG_LEVEL` | Logging verbosity (default: INFO) |
| `DRY_RUN` | Set to `true` to skip writes (default: false) |

## Source Trust Levels

| Level | Type |
|---|---|
| 5 | Official brand (auto-publishes) |
| 4 | Major retailer |
| 3 | Established fan site |
| 2 | Community source |
| 1 | Unverified |

## Admin Dashboard

Visit `/admin` to:
- View pending detections and approve/reject them
- Manage news posts and drafts
- Monitor scraper activity
- Manually trigger a scraper run
