# OpenAI and API Plan

## OpenAI Usage

Use OpenAI for the judgment-heavy parts of Person B's work:

- Deep product diagnosis
- Review theme extraction
- Buyer-question clustering
- Listing improvement suggestions
- Margin-aware pricing and voucher reasoning
- Final action-plan generation

Recommended setup:

```env
AI_MODE=analysis
OPENAI_MODEL=gpt-5.5
OPENAI_FALLBACK_MODEL=gpt-5.4-mini
```

Use the higher-capability model for final analysis and judging tradeoffs. Use the fallback model for cheaper drafts, quick UI previews, or local testing.

## OpenAI Capabilities To Use

- Responses API for the main analysis call
- Structured outputs so the app receives reliable JSON
- Function calling/tools later when the model needs to call internal analysis functions or Shopee-backed data fetchers
- Vision input later if we add listing-image quality checks
- Batch processing later for nightly product portfolio analysis
- Agents SDK/tool-calling workflow later for multi-step fetch, normalize, analyze, and recommend flows

## API Keys Needed

The dashboard can run locally now. Official seller-data mode needs keys when Shopee API access is approved.

Required:

- `OPENAI_API_KEY` for OpenAI model analysis
- `SHOPEE_PARTNER_ID`, `SHOPEE_PARTNER_KEY`, `SHOPEE_SHOP_ID`, and `SHOPEE_ACCESS_TOKEN` for Shopee Open Platform seller data

## Shopee API Need

For the current build, use curated seller-style product records. For the final demo, switch to seller data through Shopee APIs if the app credentials are approved in time.

For live data, we need Shopee Open Platform or approved seller exports for:

- Product/listing stats
- Orders and sales
- Inventory and cancellations
- Reviews
- Chat or buyer-question data
- Marketing/ads data if available

Competitor data is the hardest part. Use only approved sources: official APIs, affiliate/product discovery access where allowed, seller-provided benchmark files, or curated demo data. Do not scrape Shopee pages or logged-in sessions.

## Real Data Implementation Path

1. Register or use an existing Shopee Open Platform app.
2. Get partner credentials and authorize the target seller shop.
3. Store credentials in `.env`.
4. Pull product, order, inventory, payment, and margin-related data through signed Shopee Open Platform requests.
5. Pull reviews, chat, and ads only if those permissions/endpoints are available to the app.
6. Normalize everything into `PostLaunchInput`.
7. Send the normalized object to OpenAI for structured revenue analysis.

If any Shopee permission is not available, keep that field out of official reporting until an approved source is connected.
