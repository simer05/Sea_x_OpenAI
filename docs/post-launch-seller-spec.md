# Post-Launch Seller Spec

Branch: `post_launch_seller`

Owner: Person B

## Goal

Build the post-launch side of AdaptLink Seller Intelligence for Shopee Singapore sellers. The module should help a seller improve a live product's revenue, margin, conversion, trust, and competitive position.

## Integration Note

The branch now includes the shared seller dashboard shell with working Pre-Launch and Post-Launch tabs. The reference screenshot guides layout only; AdaptLink feature scope is defined by our seller-intelligence logic.

## Inputs

- Live product stats from Shopee APIs or approved seller exports: views, clicks, orders, revenue, stock, cancellation, refund, conversion, CTR
- Ads data from Shopee marketing/ads access when available: impressions, spend, ROAS
- Reviews from seller-owned review access: rating, review text, theme, sentiment
- Buyer questions from approved chat access or sanitized seller export: repeated chat or FAQ themes
- Competitor snapshot from approved source: price, rating, review count, estimated sales, shipping speed, voucher strength
- Fee and margin data: product cost, platform fees, voucher cost, ad spend, shipping cost where available

## Product Health Score

```text
Product Health Score =
20% conversion
+ 20% margin
+ 15% review rating
+ 15% competitor position
+ 10% traffic
+ 10% customer interaction
+ 10% fulfilment performance
```

## Revenue Logic

The system should not blindly recommend lower prices. It should first check:

- Whether conversion is weak because of listing quality, price, trust, delivery, or unclear information
- Whether lowering base price would damage net margin
- Whether a voucher, bundle, image update, FAQ update, or title update can improve conversion with less margin loss
- Whether review and chat themes reveal fixable objections

## Final Output

The report should include:

- Product health score
- Diagnosis
- Top revenue leaks
- Competitor position
- Review themes
- Buyer-question themes
- Margin-aware pricing/voucher recommendation
- Top 3 to 5 actions ranked by priority
- Source readiness notes

## Post-Launch Features In Scope

- Seller existing product selection
- Timeframe analysis
- CTR, conversion, sales, margin, reviews, and stock monitoring
- Sales funnel and sales trend
- Product health score and score drivers
- Review themes and sentiment
- Buyer question insights
- Seller response timing and communication experience
- Competitor benchmark
- Margin-aware action plan and next improvement areas

## Official Data Rule

Anything displayed as official live data must come from Shopee API access or a seller-owned export.
