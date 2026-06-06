# ACP-SEA Bridge — FINAL From-Scratch Codex Build Plan

## 0. Final decision

This project must be built **from scratch**.

We are **not** using the official ACP GitHub repo as a dependency, starter template, submodule, vendored folder, copied schema source, or copied example source.

We are building:

```text
A from-scratch ACP-compatible Southeast Asia marketplace gateway
```

We are **not** building:

```text
A fork of ACP
A custom replacement for ACP
A Shopee scraper
A wrapper around an existing ACP implementation
```

Correct framing:

```text
We built a new ACP-compatible implementation from scratch.
It aligns with the public ACP concepts, but all code, schemas, fixtures,
validators, runtime logic, payment handlers, and extensions are our own.
```

---

## 1. Project name

```text
acp-sea-bridge
```

---

## 2. Project goal

Build an **ACP-SEA Bridge** for a Shopee-style marketplace.

The system should support Southeast Asian marketplace realities:

```text
Multi-seller marketplace carts
Seller-scoped checkout sessions
Cash-on-delivery payment flow
BNPL metadata and terms acceptance stub
Halal certification metadata
BPOM registration metadata
City-level delivery windows
Local currencies
Marketplace escrow state
Returns and post-purchase settlement state
COD commitment token
COD risk scoring
```

The project should prove:

```text
ACP-style agentic commerce can work for Southeast Asia only if a marketplace
gateway layer handles multi-seller orchestration, local payment methods,
local compliance, and post-purchase marketplace settlement.
```

---

## 3. Core judging constraint

Because judging criteria require original work:

### Do not use

```text
Official ACP GitHub repo
ACP repo as submodule
ACP repo as vendored folder
ACP copied JSON schemas
ACP copied OpenAPI files
ACP copied examples
ACP starter code
Shopee scraping
Shopee private APIs
Existing ACP SDKs
Existing agentic commerce boilerplate
```

### Allowed

```text
Read public ACP documentation as conceptual reference
Write your own compatible models
Write your own schemas
Write your own validators
Write your own fixtures
Write your own runtime logic
Write your own extension objects
Write your own payment handler models
```

This is the correct position:

```text
Reference the standard conceptually.
Implement everything ourselves.
```

---

## 4. Important correctness rules

### 4.1 Build upon ACP concepts, not ACP code

The implementation should align with these ACP-style concepts:

```text
Checkout session
Seller-owned checkout logic
Capability declaration
Payment handler declaration
Extension namespace
Agent-facing commerce response
```

But the implementation must be original.

---

### 4.2 Do not create a separate ACP replacement

Do not pitch this as:

```text
Our own ACP protocol
```

Pitch it as:

```text
A from-scratch ACP-compatible SEA marketplace gateway
```

---

### 4.3 Do not put SEA fields into base checkout fields

SEA-specific fields must live in extension-like objects.

Use namespaces such as:

```text
dev.acpsea.compliance
dev.acpsea.cod
dev.acpsea.bnpl
dev.acpsea.marketplace
dev.acpsea.postpurchase
```

---

### 4.4 Do not use `pending_cash` as a core checkout status

Correct:

```text
cod.settlement_status = pending_cash
```

Incorrect:

```text
checkout.status = pending_cash
```

Base checkout status should stay generic, for example:

```text
created
requires_confirmation
confirmed
cancelled
failed
```

COD settlement state can be:

```text
pending_cash
```

inside the COD extension/payment-handler state.

---

### 4.5 Multi-seller gap framing

Do not say:

```text
ACP cannot have multiple items
```

Say:

```text
A marketplace needs one agent-facing cart that can split into multiple
seller-scoped checkout sessions, each with its own fulfillment, payment,
risk, and settlement state.
```

---

## 5. Recommended technical stack

Use this unless the team has already chosen another stack:

```text
Language: TypeScript
Runtime: Node.js
Package manager: pnpm
API framework: Fastify or Express
Validation: self-written JSON Schema + AJV
Testing: Vitest
Data: local JSON fixtures
Database: none for this phase
External integrations: none for this phase
```

Do not add unnecessary infrastructure.

---

## 6. End-to-end architecture

```text
AI Agent Request
      ↓
ACP-SEA Gateway Interface
      ↓
Marketplace Runtime Engine
      ↓
Search across sellers
      ↓
Marketplace cart creation
      ↓
Seller checkout session split
      ↓
Payment capability resolver
      ↓
COD / BNPL handler layer
      ↓
Order lifecycle
      ↓
Escrow and settlement tracking
      ↓
ACP-compatible response model
      ↓
SEA extension payloads
```

During this phase, team members build independent modules.

Final integration happens later.

---

## 7. Two independent workstreams

The split must avoid interdependency.

### Member 1

```text
ACP-Compatible Protocol Kit Lead
```

Builds from scratch:

```text
Protocol models
Extension models
Capability declarations
Payment handler declarations
Validators
Protocol fixtures
Protocol tests
```

### Member 2

```text
Marketplace Runtime and COD Lead
```

Builds from scratch:

```text
Marketplace search
Cart engine
Seller checkout splitter
COD handler
BNPL stub
Risk engine
Order lifecycle
Settlement engine
Runtime tests
```

---

## 8. Critical rule: no dependency between members

Member 1 must not wait for Member 2.

Member 2 must not wait for Member 1.

Both members create their own local fixtures.

Both members work in separate folders.

Only the shared naming contract is agreed at the beginning.

---

## 9. Repository structure

Codex should create this repository structure:

```text
acp-sea-bridge/
│
├── README.md
│
├── contracts/
│   ├── frozen-domain-contract.md
│   ├── object-naming.md
│   └── later-integration-contract.md
│
├── protocol-kit/
│   ├── README.md
│   ├── fixtures/
│   ├── base-models/
│   ├── extension-models/
│   ├── capability-model/
│   ├── payment-handler-models/
│   ├── validators/
│   ├── sample-payloads/
│   ├── protocol-gap-notes/
│   └── tests/
│
├── marketplace-runtime/
│   ├── README.md
│   ├── fixtures/
│   ├── search-engine/
│   ├── cart-engine/
│   ├── seller-session-splitter/
│   ├── payment-capability-resolver/
│   ├── cod-handler/
│   ├── bnpl-handler-stub/
│   ├── risk-engine/
│   ├── order-lifecycle/
│   ├── settlement-engine/
│   ├── runtime-api/
│   └── tests/
│
├── integration/
│   ├── README.md
│   └── adapter-placeholder.md
│
└── docs/
    ├── architecture.md
    ├── assumptions.md
    ├── out-of-scope.md
    └── final-positioning.md
```

---

## 10. Shared contract created before splitting

Spend only 30 minutes agreeing on these names.

Do not build shared logic here.

### 10.1 Shared object names

```text
Seller
SKU
ProductVariant
ComplianceProfile
DeliveryPromise
PaymentCapability
MarketplaceCart
CartSellerGroup
SellerCheckoutSession
PaymentHandler
CODCommitment
BNPLTerms
Order
OrderSettlement
EscrowState
ReturnPolicy
CapabilityDeclaration
ExtensionDeclaration
```

### 10.2 Shared ID names

```text
seller_id
sku_id
variant_id
marketplace_cart_id
seller_group_id
checkout_session_id
payment_handler_id
commitment_token
order_id
settlement_id
extension_id
capability_id
```

### 10.3 ID examples

```text
seller_001
sku_001
variant_001
cart_001
seller_group_001
checkout_seller_001
cod_commit_001
order_001
settlement_001
```

### 10.4 Supported countries for fixtures

```text
Indonesia
Singapore
Malaysia
Philippines
Thailand
Vietnam
```

### 10.5 Supported cities for fixtures

```text
Jakarta
Singapore
Kuala Lumpur
Manila
Bangkok
Ho Chi Minh City
```

### 10.6 Supported currencies for fixtures

```text
SGD
IDR
MYR
PHP
THB
VND
```

---

# PART A — MEMBER 1 PLAN

## 11. Member 1 role

```text
ACP-Compatible Protocol Kit Lead
```

Member 1 owns:

```text
protocol-kit/
```

Member 1 must not edit:

```text
marketplace-runtime/
```

---

## 12. Member 1 objective

Build a from-scratch protocol compatibility kit that proves:

```text
A Southeast Asian marketplace can produce ACP-compatible base payloads
while keeping SEA-specific needs in formal extension-style objects.
```

Member 1 does not build marketplace runtime behavior.

Member 1 builds the protocol representation and validation layer.

---

## 13. Member 1 local fixtures

Create local fixtures in:

```text
protocol-kit/fixtures/
```

Fixture requirements:

```text
5 sellers
30-40 SKUs
At least 2 halal-certified beauty SKUs
At least 2 BPOM-registered beauty SKUs
At least 2 COD-eligible Jakarta SKUs
At least 2 BNPL-eligible SKUs
At least 2 non-COD SKUs
At least 2 products with unknown halal status
Multiple currencies
Multiple countries
Multiple city-level delivery windows
```

These fixtures are independent.

They do not need to match Member 2 fixtures.

---

## 14. Member 1 deliverable 1 — Base product model

Create from-scratch base product payload models.

Base product fields:

```text
product_id
variant_id
seller_reference
title
description
category
price
currency
availability
image_url
product_url
```

Do not include these in base model:

```text
halal
bpom
cod
bnpl
escrow
returns
marketplace_cart_id
seller_checkout_sessions
risk_score
```

Those belong in extensions.

---

## 15. Member 1 deliverable 2 — Base checkout session model

Create from-scratch checkout session payload model.

Fields:

```text
checkout_session_id
status
line_items
fulfillment_options
totals
messages
capabilities
payment_handlers
extensions
```

Allowed base statuses:

```text
created
requires_confirmation
confirmed
cancelled
failed
```

Do not add:

```text
pending_cash
```

as a base checkout status.

---

## 16. Member 1 deliverable 3 — Compliance extension model

Create extension namespace:

```text
dev.acpsea.compliance
```

Fields:

```text
halal.status
halal.certifier
halal.certificate_id
halal.expires_at
bpom.status
bpom.registration_number
bpom.expires_at
country_rules
```

Allowed halal statuses:

```text
certified
not_certified
unknown
```

Allowed BPOM statuses:

```text
registered
not_registered
not_required
unknown
```

---

## 17. Member 1 deliverable 4 — COD extension model

Create extension namespace:

```text
dev.acpsea.cod
```

Fields:

```text
cod.available
cod.max_amount
cod.currency
cod.supported_cities
cod.requires_buyer_confirmation
cod.commitment_required
cod.commitment_token
cod.settlement_status
cod.risk_score
cod.seller_action
```

Allowed COD settlement states:

```text
not_started
pending_cash
cash_collected
failed_delivery
cancelled
settled
```

Allowed seller actions:

```text
allow_cod
require_prepaid
manual_review
reject_cod
```

---

## 18. Member 1 deliverable 5 — BNPL extension model

Create extension namespace:

```text
dev.acpsea.bnpl
```

Fields:

```text
bnpl.available
bnpl.provider
bnpl.installments
bnpl.total_payable
bnpl.currency
bnpl.terms_url
bnpl.acceptance_required
bnpl.acceptance_status
```

Allowed acceptance statuses:

```text
not_required
required
accepted
rejected
expired
```

BNPL is only a stub in this phase.

---

## 19. Member 1 deliverable 6 — Marketplace extension model

Create extension namespace:

```text
dev.acpsea.marketplace
```

Fields:

```text
marketplace_cart_id
merchant_of_record_mode
seller_checkout_sessions
seller_fulfillment_groups
seller_settlement_statuses
```

Allowed merchant-of-record modes:

```text
marketplace_as_merchant_of_record
seller_as_merchant_of_record
hybrid
```

---

## 20. Member 1 deliverable 7 — Post-purchase extension model

Create extension namespace:

```text
dev.acpsea.postpurchase
```

Fields:

```text
escrow.status
escrow.release_rule
returns.return_window_days
returns.return_method
refund.refund_method
dispute.allowed
```

Allowed escrow states:

```text
not_applicable
held
release_pending
released
refund_pending
refunded
disputed
```

---

## 21. Member 1 deliverable 8 — Capability declaration model

Create from-scratch capability declarations.

Fields:

```text
supported_extensions
supported_payment_handlers
supported_countries
supported_currencies
supported_fulfillment_modes
supported_marketplace_modes
```

Supported extensions:

```text
dev.acpsea.compliance
dev.acpsea.cod
dev.acpsea.bnpl
dev.acpsea.marketplace
dev.acpsea.postpurchase
```

Supported payment handlers:

```text
tokenized_card
cod
bnpl_stub
```

---

## 22. Member 1 deliverable 9 — Payment handler models

Create from-scratch payment handler declarations.

### Tokenized card handler

Fields:

```text
handler_id
handler_type
supported_countries
supported_currencies
requires_delegate_payment
```

### COD handler

Fields:

```text
handler_id
handler_type
supported_countries
supported_currencies
supported_cities
requires_delegate_payment
requires_buyer_confirmation
settlement_mode
commitment_token_required
risk_score_supported
```

### BNPL stub handler

Fields:

```text
handler_id
handler_type
provider
supported_countries
supported_currencies
installment_options
terms_acceptance_required
redirect_required
underwriting_mode
```

---

## 23. Member 1 deliverable 10 — Validators

Create from-scratch validators for:

```text
Base product payload
Base checkout session payload
Compliance extension payload
COD extension payload
BNPL extension payload
Marketplace extension payload
Post-purchase extension payload
Capability declaration payload
Payment handler declaration payload
```

Validator output should clearly show:

```text
Base payload valid
SEA extension payload valid
Payment handler declaration valid
Capability declaration valid
No SEA-only fields leaked into base payload
```

---

## 24. Member 1 tests

Create tests proving:

```text
Base product payload rejects halal, BPOM, COD, BNPL, escrow, returns
Base checkout session rejects pending_cash as status
Compliance extension accepts halal and BPOM metadata
COD extension accepts pending_cash as settlement_status
BNPL extension accepts terms metadata
Marketplace extension accepts multiple seller checkout sessions
Post-purchase extension accepts escrow and return metadata
Capability declaration includes COD and BNPL handlers
Invalid extension namespace is rejected
```

---

## 25. Member 1 acceptance criteria

Member 1 is done when:

```text
protocol-kit builds successfully
protocol-kit has independent fixtures
protocol-kit generates base product payloads
protocol-kit generates base checkout payloads
protocol-kit generates extension payloads
protocol-kit validates base payloads
protocol-kit validates extension payloads
protocol-kit declares COD and BNPL payment handlers
protocol-kit documents correct ACP-compatible framing
all protocol-kit tests pass
```

---

## 26. Member 1 Codex prompt

Use this prompt for Codex:

```text
Build the protocol-kit module for ACP-SEA Bridge from scratch.

Do not clone, vendor, import, or copy the official ACP GitHub repo.
Do not touch marketplace-runtime.

Create a standalone ACP-compatible Protocol Kit using TypeScript, local fixtures, self-written models, self-written schemas, validators, and tests.

The module must:
1. Define base product and checkout session models inspired by ACP-style concepts.
2. Keep SEA-specific fields out of base payloads.
3. Define extension-style models for compliance, COD, BNPL, marketplace, and post-purchase.
4. Define capability declaration models.
5. Define payment handler declaration models for tokenized_card, COD, and BNPL stub.
6. Keep pending_cash only as cod.settlement_status, never as checkout.status.
7. Create local fixtures under protocol-kit/fixtures.
8. Add validators and tests proving valid and invalid payloads.
9. Add README documentation explaining that this is a from-scratch ACP-compatible implementation.

Do not build demo UI.
Do not build real Shopee integration.
Do not implement real payment processing.
Do not depend on marketplace-runtime.
```

---

# PART B — MEMBER 2 PLAN

## 27. Member 2 role

```text
Marketplace Runtime and COD Lead
```

Member 2 owns:

```text
marketplace-runtime/
```

Member 2 must not edit:

```text
protocol-kit/
```

---

## 28. Member 2 objective

Build a from-scratch marketplace runtime engine that proves:

```text
A Shopee-style marketplace can search across sellers, build one agent-facing
cart, split it into seller checkout sessions, and process COD settlement state.
```

Member 2 does not build protocol validation.

Member 2 builds the marketplace behavior.

---

## 29. Member 2 local fixtures

Create local fixtures in:

```text
marketplace-runtime/fixtures/
```

Fixture requirements:

```text
5 sellers
30-40 SKUs
Beauty category SKUs
Halal-certified SKUs
BPOM-registered SKUs
COD-eligible Jakarta SKUs
Non-COD SKUs
BNPL-eligible SKUs
Multiple prices
Multiple currencies
Different seller ratings
Different stock quantities
Different delivery windows
Mock buyer profiles
Mock failed delivery history
Mock seller COD return rates
```

These fixtures are independent.

They do not need to match Member 1 fixtures.

---

## 30. Member 2 deliverable 1 — Search engine

Create a product search and filter engine.

Filters:

```text
keyword
category
price_ceiling
currency
country
city
delivery_deadline
halal_status
bpom_status
cod_available
bnpl_available
stock_available
seller_rating_min
```

Search result fields:

```text
sku_id
seller_id
title
price
currency
city_delivery_window
halal_status
bpom_status
cod_available
bnpl_available
stock_quantity
seller_rating
```

---

## 31. Member 2 deliverable 2 — Marketplace cart engine

Create one agent-facing marketplace cart.

Fields:

```text
marketplace_cart_id
items
currency
subtotal
seller_groups
city
delivery_summary
payment_capability_summary
```

Cart must support items from multiple sellers.

---

## 32. Member 2 deliverable 3 — Seller checkout session splitter

Convert one marketplace cart into one checkout session per seller.

Each seller checkout session contains:

```text
checkout_session_id
seller_id
items
seller_subtotal
delivery_promise
eligible_payment_methods
session_status
```

Allowed session statuses:

```text
created
awaiting_buyer_confirmation
confirmed
cancelled
failed
```

---

## 33. Member 2 deliverable 4 — Payment capability resolver

Resolve available payment methods for each seller group.

Inputs:

```text
seller payment settings
city
order amount
SKU eligibility
buyer profile
```

Outputs:

```text
tokenized_card_available
cod_available
bnpl_available
rejection_reasons
```

---

## 34. Member 2 deliverable 5 — COD handler

Implement COD runtime behavior.

COD flow:

```text
Check seller COD support
Check city COD support
Check SKU COD eligibility
Check amount limit
Check buyer risk
Generate commitment token
Set settlement_status = pending_cash
Return seller action
```

Allowed COD settlement states:

```text
not_started
pending_cash
cash_collected
failed_delivery
cancelled
settled
```

Allowed seller actions:

```text
allow_cod
require_prepaid
manual_review
reject_cod
```

---

## 35. Member 2 deliverable 6 — COD risk engine

Create deterministic risk scoring.

Inputs:

```text
buyer_failed_delivery_count
buyer_cod_order_count
order_amount
city
seller_category
delivery_window_days
seller_cod_return_rate
```

Outputs:

```text
risk_score
risk_band
seller_action
risk_reasons
```

Risk bands:

```text
low
medium
high
blocked
```

Decision mapping:

```text
low -> allow_cod
medium -> allow_cod or manual_review
high -> manual_review or require_prepaid
blocked -> reject_cod
```

---

## 36. Member 2 deliverable 7 — BNPL handler stub

Create BNPL stub behavior.

BNPL flow:

```text
Check BNPL eligibility
Return installment options
Mark terms_acceptance_required
Accept or reject mock terms acceptance
```

Do not implement:

```text
Credit scoring
Underwriting
Repayment schedule
Real lender integration
```

---

## 37. Member 2 deliverable 8 — Order lifecycle engine

Create internal order lifecycle states.

Allowed states:

```text
cart_created
seller_sessions_created
buyer_confirmed
cod_committed
order_confirmed
awaiting_delivery
pending_cash_collection
cash_collected
seller_settlement_pending
seller_settled
cancelled
failed_delivery
returned
```

The lifecycle engine should reject illegal transitions.

---

## 38. Member 2 deliverable 9 — Settlement engine

Track marketplace settlement.

States:

```text
escrow_held
cash_pending
cash_collected
escrow_release_pending
escrow_released
seller_settlement_pending
seller_settled
refund_pending
refunded
disputed
```

Settlement should support:

```text
COD pending cash
Cash collected
Escrow held
Escrow released
Seller settlement pending
Seller settled
Refund pending
```

---

## 39. Member 2 deliverable 10 — Runtime API surface

Create service methods or internal endpoints for:

```text
Search products
Create marketplace cart
Get marketplace cart
Split seller checkout sessions
Resolve payment capability
Confirm COD commitment
Create marketplace order
Get order lifecycle state
Get settlement state
```

No demo UI required.

---

## 40. Member 2 tests

Create tests proving:

```text
Search returns products across multiple sellers
Search filters halal-certified products correctly
Search filters BPOM-registered products correctly
Search filters COD-eligible Jakarta products correctly
Search filters delivery-this-week products correctly
Cart can contain items from two or more sellers
Cart splitter creates one checkout session per seller
Payment resolver rejects COD when seller or SKU disallows COD
COD handler generates commitment token
COD handler sets settlement_status to pending_cash
COD risk engine returns deterministic risk bands
Order lifecycle rejects illegal transitions
Settlement engine tracks escrow and seller settlement states
BNPL stub requires terms acceptance
```

---

## 41. Member 2 acceptance criteria

Member 2 is done when:

```text
marketplace-runtime builds successfully
marketplace-runtime has independent fixtures
marketplace-runtime searches across multiple sellers
marketplace-runtime creates a multi-seller marketplace cart
marketplace-runtime splits the cart into seller checkout sessions
marketplace-runtime resolves payment capabilities per seller group
marketplace-runtime processes COD as deferred settlement
marketplace-runtime generates COD commitment token
marketplace-runtime calculates COD risk score
marketplace-runtime tracks order lifecycle
marketplace-runtime tracks escrow and settlement state
all marketplace-runtime tests pass
```

---

## 42. Member 2 Codex prompt

Use this prompt for Codex:

```text
Build the marketplace-runtime module for ACP-SEA Bridge from scratch.

Do not clone, vendor, import, or copy the official ACP GitHub repo.
Do not touch protocol-kit.

Create a standalone Marketplace Runtime Engine using TypeScript, local fixtures, service modules, and tests.

The module must:
1. Create independent runtime fixtures with 5 sellers and 30-40 SKUs.
2. Implement product search and filtering for SEA marketplace attributes.
3. Build one agent-facing marketplace cart that can contain items from multiple sellers.
4. Split one marketplace cart into seller-scoped checkout sessions.
5. Resolve payment capabilities per seller group.
6. Implement COD runtime behavior with eligibility checks, commitment token, risk score, and settlement_status = pending_cash.
7. Implement BNPL as a stub with terms acceptance only.
8. Implement order lifecycle state transitions.
9. Implement escrow and settlement state tracking.
10. Add tests proving the runtime behavior.

Do not build demo UI.
Do not build real Shopee integration.
Do not implement real payment or BNPL underwriting.
Do not depend on protocol-kit.
```

---

# PART C — LATER INTEGRATION PLAN

This is included only for end-to-end completeness.

Do not assign this until both members finish their independent modules.

---

## 43. Integration objective

Create a small adapter that maps:

```text
marketplace-runtime output
        ↓
protocol-kit base response
        ↓
SEA extension payloads
```

---

## 44. Integration adapter responsibilities

The adapter should:

```text
Read marketplace cart output
Read seller checkout session output
Read COD commitment output
Read order lifecycle output
Read settlement output
Map generic fields to base checkout response
Attach compliance extension
Attach COD extension
Attach BNPL extension if applicable
Attach marketplace extension
Attach post-purchase extension
Run protocol-kit validators
Return final ACP-compatible response
```

---

## 45. Integration acceptance criteria

Integration is complete when:

```text
Runtime multi-seller cart converts into protocol-safe response
Seller checkout sessions appear only in marketplace extension
COD pending_cash appears only in COD extension
Escrow appears only in post-purchase extension
Base payload contains no SEA-only fields
All protocol-kit validators pass
All marketplace-runtime tests still pass
```

---

# PART D — OUT OF SCOPE NOW

Do not build these in the current phase:

```text
Demo UI
Pitch deck
Real Shopee integration
Shopee scraping
Real payment gateway
Real BNPL underwriting
Real KYC
Real login/authentication
Production database
Production deployment
Mobile app
Recommendation engine
LLM agent frontend
Official ACP repo dependency
Official ACP copied schemas
```

---

# PART E — Branch strategy

Use separate branches:

```text
main
feature/member-1-protocol-kit
feature/member-2-marketplace-runtime
feature/later-integration-adapter
```

Rules:

```text
Member 1 works only in feature/member-1-protocol-kit
Member 2 works only in feature/member-2-marketplace-runtime
Integration starts only after both modules pass tests
No shared module edits without agreement
```

---

# PART F — Pull request checklist

Each PR must confirm:

```text
Does this PR avoid official ACP repo dependency?
Does this PR contain original implementation only?
Does this PR touch only the owner module?
Do tests pass?
Are fixtures local to the module?
Is demo work excluded?
Are real external integrations excluded?
Is README updated?
Are SEA fields kept outside base payloads?
Is pending_cash kept out of checkout.status?
```

---

# PART G — Final success criteria

The full build phase is successful when:

```text
Member 1 module works independently
Member 2 module works independently
No module imports from the other
No official ACP repo is used
No official ACP schema/example is copied
Both modules have local fixtures
Both modules have tests
Protocol-kit validates base and extension payloads
Marketplace-runtime performs search, cart, split, COD, risk, order, and settlement behavior
pending_cash is never used as a base checkout status
SEA-specific fields are isolated in extension-style objects
BNPL is clearly stubbed
Demo work is not included in current tasks
```

---

# PART H — Final positioning

Use this wording:

```text
ACP-SEA Bridge is a from-scratch ACP-compatible marketplace gateway for Southeast Asia.

We did not build on top of an existing ACP repo or implementation.
We built our own protocol models, validators, marketplace runtime, COD handler,
BNPL stub, compliance extensions, cart orchestration, and settlement logic.

The project shows how agentic commerce can work in Southeast Asia's real
marketplace environment: multi-seller carts, COD, BNPL, halal/BPOM compliance,
escrow, delivery windows, and post-purchase settlement.
```
