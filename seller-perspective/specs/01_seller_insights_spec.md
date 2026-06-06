# Spec 01: Seller Insights and Analytics

## Owner

Person 1

## Goal

Build a seller-facing intelligence layer for Shopee Singapore that helps sellers understand product performance, pricing opportunities, catalog gaps, and market movement.

## Scope

- Seller product catalog overview
- Sales and order trend summaries
- Pricing and discount recommendations
- Competitor/product comparison signals, subject to approved data access
- Inventory and low-stock alerts
- OpenAI-generated business summaries and next-best-action suggestions

## Data Sources

Preferred sources:

- Shopee Open Platform for seller-owned shop, item, order, and inventory data
- Shopee Affiliate API or approved partner APIs for product/deal discovery where allowed
- Seller-provided CSV exports for early prototyping

Avoid:

- Login-protected scraping without permission
- Circumventing anti-bot systems
- Collecting personal customer data beyond what is needed and allowed

## OpenAI Usage

- Summarize weekly/monthly seller performance
- Cluster products by category, margin, and movement
- Generate pricing rationale in plain language
- Identify unusual changes in orders, ratings, or stock
- Convert raw metrics into seller-friendly action items

## MVP Features

1. Import seller product/order data from CSV or API.
2. Show product-level performance table.
3. Generate an OpenAI seller summary.
4. Flag products needing attention.
5. Export insights as a short report.

## Questions To Resolve

- Which Shopee API access do we have: seller Open Platform, affiliate, or neither?
- Do we need live data, daily batch data, or manual CSV uploads for the MVP?
- What seller metrics matter most: revenue, conversion, stock, reviews, price position, or ad spend?
