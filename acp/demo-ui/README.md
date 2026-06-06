# ACP-SEA Demo UI

This is a local Shopee-inspired demo interface for the ACP-SEA Bridge shared mock data.

It uses:

- `../data/catalog.json`
- `../data/sellers.json`

It does not call Shopee, payment gateways, BNPL lenders, or any external marketplace API.

## Test Locally

```bash
pnpm install
pnpm build
pnpm dev
```

Open the URL printed by Vite (usually `http://127.0.0.1:5173/`). If that port is busy, Vite picks the next free port — use the terminal output, not a cached tab.

## What this UI is for

This is an optional visual demo on top of the shared mock catalog in `acp/data/`. The official Codex plan marks demo UI as out of scope for Member 1 and Member 2 deliverables, but this page helps manually show the marketplace goal:

- browse synthetic Shopee-style products
- build a multi-seller cart
- preview seller-split checkout sessions for ACP-SEA Bridge

The real protocol and runtime work lives in `member_1/protocol-kit/` and `member 2/marketplace-runtime/`.

## Manual checks

- Browse 15 products across 3 categories: `Bottle`, `T-Shirt`, `Phone Case` (5 each).
- Search for `iPhone Case`, `Polo T-Shirt`, or `Serum`.
- Toggle `COD Available` and use `Clear filters` if the grid becomes empty.
- Add `Halal Glow Serum Bottle` and `iPhone Tempered Glass Screen Protector` to see two seller checkout sessions.
- Click `Preview N seller sessions` in the cart to inspect the grouped session payload.
- Resize to mobile width and verify the cart drawer, filters, and product cards do not overflow.

## Troubleshooting

- `0 products` usually means an active filter combination has no matches. Click `All` or `Clear filters`.
- If the page looks unstyled or buttons do nothing, make sure you are using `pnpm dev`, not opening `index.html` directly.
