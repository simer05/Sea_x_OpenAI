# Sea x OpenAI

Person B integration branch for **AdaptLink Seller Intelligence**.

This branch brings the common AdaptLink seller dashboard together with pre-launch and post-launch product intelligence for Shopee Singapore.

## Branch

Current branch:

```text
post_launch_seller
```

The current integration keeps the work on `post_launch_seller` and imports the pre-launch analysis source without changing the protected remote branch.

## What Person B Owns

- `apps/post-launch-seller-app`
- `pre-product-analysis`
- `modules/post-launch-seller`
- `docs/post-launch-seller-spec.md`
- Post-launch product data and analysis demo scripts

## Main Goal

Help a Shopee seller answer both sides of the product lifecycle:

```text
Pre-launch: Should I launch this product, at what price, and with what positioning?
Post-launch: How can I improve this product's sales, margin, conversion, and buyer experience?
```

## Feature Scope

The Shopee-style screenshot is a common UI/layout reference only. It does not limit our AdaptLink feature set.

Pre-launch features in scope:

- Product idea input for bottle, T-shirt, phone case, and future seller ideas
- Market readiness score
- Competitor snapshot and price positioning
- Cost, margin, and safe launch stock checks
- Launch recommendation
- Listing readiness and feature differentiation
- Launch action plan powered by OpenAI reasoning

Post-launch features in scope:

- Seller existing product selection
- Timeframe analysis for last 30 days, last 3 months, and last 6 months
- Sales, CTR, conversion, net margin, reviews, and competitor position
- Sales funnel and sales trend
- Product health score with separate score drivers
- Review themes and sentiment
- Buyer question insights
- Seller response timing and communication experience
- Competitor benchmark
- Revenue-focused OpenAI action plan and improvement areas

API-dependent features are still in scope, but need credentials before official live use:

- Shopee Open Platform seller data
- Shopee ads/marketing data where permissions allow
- Seller chat/review/order data through approved access
- OpenAI API calls for structured agent analysis

## API Plan

Needed when connecting official Shopee and OpenAI services:

- Shopee Open Platform app credentials
- Authorized seller shop access token
- OpenAI API key for deep structured analysis

```powershell
npm install
npm run demo:post
npm run dev:post
```

For a dependency-free visual check, open:

```text
apps/post-launch-seller-app/dashboard-preview.html
```

The preview includes:

- Pre-launch/Post-launch mode switch, with Post-launch selected for this branch
- Seller existing product list
- Timeframe selector for last 30 days, last 3 months, and last 6 months
- Timeframe recalculation of revenue, funnel, communication, and health metrics
- Pre-launch idea validation, launch decision, readiness, and action plan
- Post-launch CTR, buyer communication, reviews, sentiment, benchmark, and action plan

OpenAI usage plan:

```text
docs/openai-agent-strategy.md
```
