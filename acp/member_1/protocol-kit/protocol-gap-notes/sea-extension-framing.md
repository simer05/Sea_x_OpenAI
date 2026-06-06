# SEA Extension Framing Notes

ACP-SEA Bridge is framed as a from-scratch ACP-compatible marketplace gateway.
The base payloads use generic commerce concepts, while Southeast Asia-specific
marketplace behavior is isolated in extension-style namespaces.

The protocol kit intentionally keeps these fields out of base product payloads:

- `halal`
- `bpom`
- `cod`
- `bnpl`
- `escrow`
- `returns`
- `marketplace_cart_id`
- `seller_checkout_sessions`
- `risk_score`

The base checkout status set is generic:

- `created`
- `requires_confirmation`
- `confirmed`
- `cancelled`
- `failed`

COD deferred cash state is represented as `cod.settlement_status = pending_cash`
inside `dev.acpsea.cod`. It is never a base checkout status.

The multi-seller marketplace gap is represented by one agent-facing checkout
surface that can attach a `dev.acpsea.marketplace` extension containing
seller-scoped checkout session summaries, fulfillment groups, and settlement
status summaries.
