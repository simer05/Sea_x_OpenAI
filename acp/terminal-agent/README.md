# ACP Terminal Agent

Terminal demo for placing a halal noodle order through the ACP gateway at `http://127.0.0.1:8787`.

Two entry points:

| Script | Command | Needs `CURSOR_API_KEY` |
|--------|---------|------------------------|
| **REST CLI** (default) | `pnpm demo` | No |
| **Cursor SDK agent** | `pnpm demo:sdk` | Yes (falls back to REST CLI if unset) |

## Prerequisites

1. Node.js 18+ and [pnpm](https://pnpm.io/)
2. ACP API running on port `8787`

```bash
cd acp/demo-ui
pnpm install
pnpm dev:api
```

Leave that terminal open. In a second terminal:

```bash
cd acp/terminal-agent
pnpm install
pnpm demo
```

## REST demo (deterministic, no cloud)

```bash
cd acp/terminal-agent
pnpm demo
```

Optional env vars:

```bash
export ACP_BASE_URL=http://127.0.0.1:8787   # default
export ACP_SESSION_ID=terminal-demo         # default
export ACP_PAYMENT=cod                      # cod | card
pnpm demo
```

Expected flow:

1. `GET /api/health`
2. `POST /v1/products/search` — halal noodles under $10 SGD
3. Select rank #1 product
4. `GET /v1/delivery/options` — standard delivery
5. `GET /v1/payment/options` — COD or card
6. `POST /v1/orders` — place order
7. `GET /v1/orders/:id/tracking` — print status

## Cursor SDK demo

Uses `@cursor/sdk` with `local.customTools` that wrap the same REST endpoints.

```bash
export CURSOR_API_KEY="cursor_..."   # Cursor Dashboard → Integrations
cd acp/terminal-agent
pnpm demo:sdk
```

If `CURSOR_API_KEY` is missing, `demo:sdk` automatically runs the REST CLI instead.

**Note:** The SDK path requires native build scripts for `@cursor/sdk` (sqlite3). If install skipped them, run `pnpm approve-builds` in this directory and allow `sqlite3`, or use `pnpm demo` which has no native deps.

## Smoke test

Requires the API to be running:

```bash
cd acp/terminal-agent
pnpm test
```

## Manual curl reference

```bash
BASE=http://127.0.0.1:8787
curl -s "$BASE/api/health" | jq .

curl -s -X POST "$BASE/v1/products/search" \
  -H 'Content-Type: application/json' \
  -d '{"query":"noodles","max_price":10,"currency":"SGD","halal_required":true,"location":"Singapore","session_id":"terminal-demo"}' \
  | jq '.products[0] | {product_id, title, price, tier}'
```
