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

Help a Shopee seller answer:

```text
How can I improve this product's sales, margin, and conversion after it is already launched?
```

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

OpenAI usage plan:

```text
docs/openai-agent-strategy.md
```
