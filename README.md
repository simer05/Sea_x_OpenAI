# Sea x OpenAI

AdaptLink **Seller Intelligence** + **ACP-SEA Bridge** consumer shopping demo for Shopee Singapore.

The repo combines a hosted seller dashboard (pre-launch and post-launch), a standalone pre-product analysis surface, and a consumer agent with terminal + web UIs backed by the Fly.io ACP API.

## Hosted demos (Vercel + Fly)

| Surface | URL | Notes |
|---------|-----|-------|
| **Seller dashboard** (pre + post) | https://acp-virid.vercel.app/seller-dashboard | Shopee Seller shell, dual-mode workflow |
| Pre-product analysis dashboard | https://acp-virid.vercel.app/pre-product | Standalone listing validation UI |
| Consumer agent (web) | https://acp-virid.vercel.app/agent.html | Chat shopping assistant |
| Shopee shop | https://acp-virid.vercel.app | Product browse + checkout demo |
| ACP API (Fly.io) | https://sea-acp-api.fly.dev | Agent, checkout, health |

## Seller dashboard (latest)

Live deploy: **`/seller-dashboard`** — static bundle from `acp/seller-dashboard-preview/`, built into `acp/demo-ui/dist` on Vercel.

### Pre-launch

- Shopee Seller header with **Pre-Launch / Post-Launch** tabs
- Full editable listing form (title, category, product type, price, stock, shipping/packaging/ad cost, target area, colors, features, description, keywords)
- **Product photo upload** (PNG, JPG, WEBP, GIF, HEIC, and other images) with client-side compression
- **`/api/seller-ai`** fills the form from image understanding when `OPENAI_API_KEY` is set on Vercel; demo fallback draft when not
- Launch decision, market readiness, competitor snapshot, margin/stock plan, listing readiness, and action plan panels

### Post-launch

- Live Shopee item picker (water bottle, T-shirt, phone case samples)
- Timeframes: last 30 days, 3 months, 6 months
- KPIs: sales, conversion, health score, margin, reviews, competitor position
- Sales funnel, trend chart, competitor benchmark, health drivers, seller response, review insights/sentiment, buyer questions, AI action plan

### Source of truth

| Layer | Path |
|-------|------|
| React reference app | `apps/post-launch-seller-app/src/app/page.tsx` |
| Vercel static preview | `acp/seller-dashboard-preview/` |
| Seller AI API (Vercel) | `acp/api/seller-ai.js` |
| Pre-product API (Vercel) | `acp/api/pre-product/analyze.js` |

## Consumer agent & terminal

```bash
git pull origin main
pnpm install          # or npm install at repo root
pnpm demo             # web shop + agent instructions
pnpm demo:terminal    # terminal shopping demo (ACP REST + optional Codex SDK)
```

Judge-style browser prompt:

```text
I want to buy a halal noodles pack under 10 dollars
```

## Local seller development

```bash
npm install
npm run dev:post              # Next.js seller app (full React UX)
npm run demo:post             # CLI post-launch report
npm run dashboard:pre         # standalone pre-product dashboard
```

Open static preview locally after building the demo UI:

```bash
cd acp/demo-ui && npm run build
# then serve acp/demo-ui/dist/seller-dashboard/
```

Legacy file (not deployed): `apps/post-launch-seller-app/dashboard-preview.html`

## Vercel deploy (`acp/`)

- **Project root:** `acp/` only (not the full monorepo)
- **Build:** `cd demo-ui && npm install && npm run build` (copies dashboards via `scripts/copy-dashboards.mjs`)
- **Env:** set `OPENAI_API_KEY` in Vercel for live seller-ai vision on photo upload

```bash
cd acp && vercel --prod
```

## Repo layout (high level)

| Area | Role |
|------|------|
| `acp/demo-ui/` | Consumer shop + agent UI, Vercel output |
| `acp/seller-dashboard-preview/` | Seller dashboard static assets |
| `acp/pre-product-analysis/` | Vendored pre-product sources for Vercel |
| `apps/post-launch-seller-app/` | Next.js seller intelligence app |
| `pre-product-analysis/` | Standalone pre-product analysis package |
| `acp/terminal-agent/` | Terminal agent CLI |

## OpenAI & Shopee APIs

Production seller AI uses `OPENAI_API_KEY` on Vercel (`/api/seller-ai`). Official Shopee Open Platform credentials are planned for live seller data; current dashboards use mock Singapore marketplace data.

See `docs/openai-agent-strategy.md` for the broader agent plan.

## Git hooks (optional)

```bash
./scripts/setup-git-hooks.sh
```

Strips automated `Co-authored-by:` trailers from commit messages.
