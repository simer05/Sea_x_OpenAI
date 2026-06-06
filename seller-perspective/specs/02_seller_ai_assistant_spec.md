# Spec 02: Seller Assistant

## Owner

Person 2

## Goal

Build a helper for Shopee Singapore sellers that can improve listings, draft buyer replies, summarize reviews, and point out day-to-day tasks.

## Scope

- Product title and description edits
- Listing quality checks
- Draft replies for buyer messages
- Review summaries and recurring issue detection
- Store FAQ and policy support
- Task reminders and next actions

## Data Sources

Use first:

- Seller-provided listing content
- Seller-owned order/message/review data through approved APIs
- Manually uploaded product files for prototype testing
- Internal seller FAQ and store policies

Do not use:

- Private buyer data unless it is necessary and allowed
- Sensitive data without filtering or consent
- Scraping pages or messages from logged-in Shopee sessions

## OpenAI Use

- Rewrite product titles and descriptions for clarity
- Classify buyer messages by intent and urgency
- Draft polite seller replies
- Summarize review themes and recurring complaints
- Produce listing improvement checklists

## MVP Features

1. Upload or paste a product listing.
2. Suggest a better title and description.
3. Analyze sample buyer messages.
4. Draft seller replies.
5. Summarize reviews into issues and recommended actions.

## Open Questions

- Should the assistant support English only or English plus Singapore-style multilingual phrasing?
- Do we need human approval before sending any generated reply?
- What store policy and product constraints should the assistant follow?
