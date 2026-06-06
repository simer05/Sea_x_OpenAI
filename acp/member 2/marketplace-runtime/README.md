# Member 2 Marketplace Runtime

This module is the Member 2 implementation for ACP-SEA Bridge. It is a from-scratch marketplace runtime, not an ACP schema implementation and not a Shopee integration.

## Scope

- Local runtime fixtures with 5 sellers and 35 SKUs.
- Product search and SEA marketplace filtering.
- Agent-facing marketplace cart creation across multiple sellers.
- Seller-scoped checkout session splitting.
- Payment capability resolution for tokenized card, COD, and BNPL stub eligibility.
- COD commitment behavior with deterministic risk scoring and `settlement_status = pending_cash`.
- BNPL terms acceptance stub only.
- Internal order lifecycle state transitions.
- Escrow, cash, refund, and seller settlement state tracking.
- Runtime service surface for tests and later adapter work.

## Out of Scope

- No official ACP repo dependency.
- No copied ACP schemas or examples.
- No `protocol-kit` import.
- No Shopee scraping or private APIs.
- No real payment gateway.
- No real BNPL underwriting, KYC, or lender integration.
- No demo UI.

## Commands

```bash
pnpm install
pnpm check
```

`pnpm check` runs TypeScript build and the Vitest runtime tests.

## Runtime Surface

The main service is `MarketplaceRuntimeService` in `src/runtime-api/marketplaceRuntimeService.ts`.

It exposes:

- `searchProducts`
- `createMarketplaceCart`
- `getMarketplaceCart`
- `splitSellerCheckoutSessions`
- `resolvePaymentCapability`
- `confirmCODCommitment`
- `createMarketplaceOrder`
- `getOrderLifecycleState`
- `getSettlementState`

The runtime keeps `pending_cash` only in COD settlement state. Seller checkout sessions use only these statuses: `created`, `awaiting_buyer_confirmation`, `confirmed`, `cancelled`, and `failed`.
