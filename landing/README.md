# Jess Trading — Landing Page

Next.js 14 (App Router) + Tailwind CSS. Lives at `jesstrading.xyz`. Pre-Whop conversion layer.

## Stack
- Next.js 14 (App Router, RSC)
- Tailwind CSS 3.4 (brand tokens in `tailwind.config.ts`)
- Inter font via `next/font/google`
- Brand: Carbon Black radial gradient + Neon Green highlights + Electric Blue CTAs

## Run

```bash
cd landing
npm install
npm run dev
# → http://localhost:3001
```

Backend API (FastAPI) runs on a different port — they don't conflict.

## Structure

```
landing/
├── app/
│   ├── layout.tsx          # Inter font, metadata, viewport, RootLayout
│   ├── page.tsx            # Home (LP). Composes section components.
│   └── globals.css         # Base styles + brand background
├── components/
│   ├── ui/                 # Primitives (Button, etc.)
│   └── sections/           # LP sections (Hero, etc.)
├── lib/
│   └── utils.ts            # cn() helper
├── tailwind.config.ts      # Brand colors, font, glow shadows
├── next.config.mjs
├── tsconfig.json
└── .env.example            # Copy to .env.local
```

## Env vars

See `.env.example`. `.env.local` is gitignored.

## Deploy to Vercel

This is a monorepo — `landing/` is one of multiple projects. Vercel needs to be told to build only this folder.

### One-time setup
1. Push the repo to GitHub if not already there
2. Go to vercel.com → Add New Project → Import the repo
3. **Root Directory: `landing`** (this is the critical setting for the monorepo)
4. Framework preset: Next.js (auto-detected)
5. Build command + output directory: leave defaults (`next build`, `.next`)
6. Add environment variables (see table below)
7. Deploy

### Connect the domain
1. Vercel project → Settings → Domains → Add `jesstrading.xyz`
2. Follow Vercel's DNS instructions on your registrar (Namecheap / Cloudflare)
3. SSL is automatic
4. Set `NEXT_PUBLIC_SITE_URL=https://jesstrading.xyz` in Vercel env vars after the domain is live

### Environment variables (set in Vercel dashboard)

| Variable | Scope | When to add | Where it comes from |
|----------|-------|-------------|---------------------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Production + Preview | After V2 (Meta BM) | Meta Events Manager → your Pixel ID |
| `META_CAPI_ACCESS_TOKEN` | Production + Preview | After V2 | Events Manager → Settings → Generate Access Token |
| `META_CAPI_TEST_EVENT_CODE` | Preview only (testing) | While testing CAPI | Events Manager → Test Events tab |
| `WHOP_WEBHOOK_SECRET` | Production | After V4 (Whop webhook setup) | Whop → Developers → Webhooks → Signing secret |
| `CONVERTKIT_API_KEY` | Production + Preview | After V5 + C5 | ConvertKit → Account → API Keys |
| `CONVERTKIT_API_SECRET` | Production | After V5 + C5 | ConvertKit → Account → API Keys |
| `CONVERTKIT_LEADMAGNET_FORM_ID` | Production + Preview | After V5 + C5 | ConvertKit → form ID from URL |
| `NEXT_PUBLIC_SITE_URL` | Production + Preview | After domain is live | `https://jesstrading.xyz` |

`NEXT_PUBLIC_*` vars are exposed to the browser — only put non-secrets there.

### After deploy — checklist
- [ ] Open the deployed URL — LP renders correctly
- [ ] DevTools → Network → confirm `fbevents.js` loads (Pixel is firing)
- [ ] Meta Events Manager → Test Events → see `PageView` and `InitiateCheckout` from your visit
- [ ] `GET /api/whop-webhook` → `{ "ok": true, "endpoint": "whop-webhook" }`
- [ ] Set webhook URL in Whop dashboard → trigger a test event → confirm in logs
- [ ] Run a real $0 test purchase via a hidden Whop coupon → confirm `Purchase` appears in Meta Events Manager
- [ ] Lighthouse mobile score > 90

### Local production build (sanity check before deploy)
```bash
cd landing
npm run build
npm run start
# → http://localhost:3001
```

## TODO map (from next.md)
- [x] C1 — Init project
- [x] C2 — Build LP sections (Hero, Performance, WhoFor, HowItWorks, Offer, Backtest, Testimonials, FAQ, FinalCTA, Footer)
- [x] C3 — Whop webhook → Meta CAPI server-side (`app/api/whop-webhook/route.ts` + `lib/meta-capi.ts`)
- [x] C4 — Meta Pixel + client-side events (`components/meta-pixel.tsx` + `components/checkout-button.tsx` + `lib/pixel.ts`)
- [ ] C5 — Lead capture → ConvertKit
- [ ] C6 — Meta domain verification meta tag (placeholder in `app/layout.tsx`)
- [x] C7 — Vercel deploy config (`vercel.json` + `app/robots.ts` + `app/sitemap.ts`)

## Pixel + CAPI events

| Event | Where it fires | Source |
|-------|----------------|--------|
| `PageView` | Every page load | Pixel (client) |
| `InitiateCheckout` | Click any "Get the bot" CTA | Pixel (client) |
| `Purchase` | Whop notifies us of payment | CAPI (server) — `/api/whop-webhook` |
| `Lead` | _(C5)_ Email captured for lead magnet | Pixel + CAPI |

### Setting up the Whop webhook
1. Whop dashboard → Developers → Webhooks → New webhook
2. URL: `https://jesstrading.xyz/api/whop-webhook`
3. Events: `payment.succeeded` (and/or `membership.went_valid`)
4. Copy the signing secret → set `WHOP_WEBHOOK_SECRET` in env vars
5. Test by triggering a test event from Whop — server logs should show the event acknowledged

## Content TODOs (placeholders to swap)
- [ ] `live-performance.tsx` — `MYFXBOOK_URL` + real stats once tracker has 30+ days
- [ ] `live-performance.tsx` — replace SVG demo curve with MyFXBook iframe / chart screenshot
- [ ] `hero.tsx` — replace video placeholder with `<video>` of bot executing trade in MT5
- [ ] `backtest-proof.tsx` — `BACKTEST_PDF_URL` once PDF generated
- [ ] `testimonials.tsx` — swap 3 placeholder testimonials with real ones from beta users
- [ ] `footer.tsx` — create `/terms`, `/privacy`, `/refund-policy`, `/risk-disclosure` pages
