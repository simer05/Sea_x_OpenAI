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

Open:

```text
http://127.0.0.1:5173/
```

Manual checks:

- Search for `charger`, `baby`, or `serum`.
- Toggle COD, BNPL, and Halal/BPOM filters.
- Add `Halal Glow Serum` and `Jakarta-Ready Vitamin C Mask` to see two seller checkout sessions.
- Resize to mobile width and verify the cart, filters, and product cards do not overflow.
