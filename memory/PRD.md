# PRD — Lunar Coins (FiveM Tebex Store)

## Original Problem Statement
"kannst du für tebex store eine seite design?" (German) — Build a page for a Tebex store.
Clarified by user:
- Type: FiveM/GTA RP server store
- Scope: fully functional shop with cart & real payment, connected to real Tebex account (Headless API)
- Sells: ONLY coins ("Lunar Coins")
- Branding: wide "Lunar" logo in blue; a photo per coin package
- Store view only (no admin area)
- Design: left to us; UI language German
- FiveM account linking step: approved by user

## Architecture
- **Frontend**: React (CRA/craco), Tailwind, Shadcn UI, framer-motion, sonner. Single-page storefront.
- **Backend**: FastAPI proxy to Tebex Headless API (`https://headless.tebex.io`) with graceful DEMO fallback.
- **DB**: MongoDB available but not used (stateless storefront).
- **Assets**: user's GitHub repo `Linux0104/banner-assets` (Logo.png, lunarbanner.png, coins3.png, lunarcoins.png).

### Backend endpoints (all under /api)
- `GET /api/store` — webstore info + flattened coin packages (demo fallback on Tebex error).
- `POST /api/basket/create` — creates Tebex basket, returns FiveM auth URLs (or {demo:true}).
- `POST /api/basket/add` — adds packages to authed basket, returns Tebex checkout URL.

### Frontend flow
- Fetch store → render coin grid. Cart in localStorage.
- Checkout: cart → "FiveM verknüpfen" step → create basket → redirect to Tebex auth → return (`?tebex_return=1`) → add items → redirect to Tebex checkout.
- Demo mode: shows info toast instead of redirect.

## Implemented (2026-07-09)
- Full dark "lunar" storefront: header, hero, coin grid, cart drawer + FiveM linking, trust, FAQ, footer.
- Backend Tebex Headless proxy (store, basket create/add, sidebar) with demo fallback.
- **LIVE**: valid public token configured -> 7 real coin packages (475–27500 Coins, real Tebex CDN images), full checkout redirect to Tebex FiveM auth verified.
- Auto badges ("Beliebt" / "Bester Wert"), Community section (Top-Kunde des Monats + Neueste Käufe via Tebex sidebar), Discord join banner.
- German UI, data-testid everywhere. E2E tested 100% (backend 6/6 + all frontend flows), twice.

## Known limitations
- Discord invite link is a placeholder (`https://discord.gg/lunar` in `src/lib/assets.js`) — replace with the real invite.
- "Top-Kunde des Monats" shows a fallback until Tebex reports a top customer for the month.

## Backlog
- P0: User provides valid Tebex public token → verify real packages load + full checkout redirect.
- P1: Coupon/creator-code input on checkout; per-package real images from Tebex.
- P2: Multi-category support, sidebar top-customer module, localized currency switch.

## Next tasks
- Await valid public token, then re-test the real basket → auth → checkout flow.
