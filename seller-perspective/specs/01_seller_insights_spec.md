# Spec 01: Seller Insights

## Owner

Person 1

## Goal

Help a Shopee Singapore seller see what is happening with their products: what is selling, what is weak, where price or stock needs attention, and what actions are worth taking next.

## Scope

- Product catalog summary
- Sales and order trends
- Price and discount checks
- Competitor/product comparison if we have approved data access
- Stock and low-inventory flags
- Short seller-facing summaries and action points

## Data Sources

Use first:

- Shopee Open Platform for seller-owned shop, item, order, and inventory data
- Shopee Affiliate API or approved partner API data where allowed
- Seller CSV exports for early testing

Do not use:

- Login-protected scraping without permission
- Circumventing anti-bot systems
- Customer personal data unless it is clearly needed and allowed

## OpenAI Use

- Summarize weekly or monthly seller performance
- Cluster products by category, margin, and movement
- Generate pricing rationale in plain language
- Identify unusual changes in orders, ratings, or stock
- Turn raw metrics into seller action items

## MVP Features

1. Import seller product/order data from CSV or API.
2. Show product-level performance table.
3. Generate a seller summary.
4. Flag products needing attention.
5. Export insights as a short report.

## Open Questions

- Which Shopee API access do we have: seller Open Platform, affiliate, or neither?
- Do we need live data, daily batch data, or manual CSV uploads for the MVP?
- What seller metrics matter most: revenue, conversion, stock, reviews, price position, or ad spend?
