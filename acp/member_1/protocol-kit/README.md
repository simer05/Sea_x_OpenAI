# ACP-SEA Bridge Protocol Kit

This is the Member 1 protocol compatibility kit for ACP-SEA Bridge. It is a
from-scratch ACP-compatible implementation: no official ACP repository, schemas,
examples, SDKs, or starter code are cloned, vendored, imported, or copied.

## Scope

This module owns protocol representation only:

- Base product payload model
- Base checkout session payload model
- SEA extension models for compliance, COD, BNPL, marketplace, and post-purchase state
- Capability declaration model
- Payment handler declarations for `tokenized_card`, `cod`, and `bnpl_stub`
- AJV validators backed by self-written JSON Schema
- Local protocol fixtures and tests

It does not implement marketplace search, cart splitting, real payment
processing, real BNPL underwriting, Shopee integration, scraping, or a demo UI.

## Extension Namespaces

- `dev.acpsea.compliance`
- `dev.acpsea.cod`
- `dev.acpsea.bnpl`
- `dev.acpsea.marketplace`
- `dev.acpsea.postpurchase`

SEA-specific fields are kept out of base product payloads. For example, halal
and BPOM metadata live in `dev.acpsea.compliance`, COD commitment and
`pending_cash` settlement state live in `dev.acpsea.cod`, and escrow/returns
metadata live in `dev.acpsea.postpurchase`.

## Fixtures

Shared mock catalog fixtures live under `../../data` and are mapped by `fixtures/load-fixtures.ts`:

- 5 sellers
- 36 SKU rows
- Multiple countries, cities, currencies, and city-level delivery windows
- Halal-certified beauty SKUs
- BPOM-registered beauty SKUs
- COD-eligible Jakarta SKUs
- BNPL-eligible SKUs
- Non-COD SKUs
- Products with unknown halal status

The fixture builder produces protocol-safe base payloads plus extension payloads
from the compact local catalog rows.

## Commands

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

The validators report the required success messages when valid payloads pass:

- `Base payload valid`
- `SEA extension payload valid`
- `Payment handler declaration valid`
- `Capability declaration valid`
- `No SEA-only fields leaked into base payload`
