# Sea x OpenAI

Person B branch for **AdaptLink Seller Intelligence**.

This branch focuses only on post-launch seller intelligence for Shopee Singapore: live product performance, competitor benchmarking, review and buyer-question analysis, margin protection, and revenue-growth recommendations.

## Branch

Current branch:

```text
post_launch_seller
```

Person A will work separately later on their own pre-launch branch. This branch should not add pre-product upload, launch/no-launch scoring, or pre-launch competitor validation logic.

## What Person B Owns

- `apps/post-launch-seller-app`
- `modules/post-launch-seller`
- `docs/post-launch-seller-spec.md`
- Post-launch mock data and analysis demo scripts

## Main Goal

Help a live Shopee seller answer:

```text
How can I improve this product's sales, margin, and conversion after it is already launched?
```

## Data Plan

For now, we will use mock Shopee-style data so the Person B branch can run and demo without being blocked by API approval.

The real-data path stays documented and scaffolded. When credentials are ready, switch `DATA_MODE=real`.

Needed for real mode:

- Shopee Open Platform app credentials
- Authorized seller shop access token
- OpenAI API key for deep structured analysis

```powershell
npm install
npm run demo:post
npm run dev:post
```

Keep any mocked or estimated field clearly marked with a data quality warning.

For a dependency-free visual check, open:

```text
apps/post-launch-seller-app/dashboard-preview.html
```

The preview includes:

- Pre-launch/Post-launch mode switch, with Post-launch selected for this branch
- Seller existing product list
- Timeframe selector for last 30 days, last 3 months, and last 6 months
- Mock recalculation of revenue, funnel, communication, and health metrics by selected timeframe

OpenAI usage plan:

```text
docs/openai-agent-strategy.md
```
