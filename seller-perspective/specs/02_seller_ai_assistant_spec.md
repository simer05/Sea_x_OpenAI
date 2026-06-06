# Spec 02: Seller AI Assistant and Workflow Automation

## Owner

Person 2

## Goal

Build an AI assistant for Shopee Singapore sellers that helps with product listing quality, buyer communication, review understanding, and daily operational tasks.

## Scope

- Product title and description improvement
- Listing quality checks
- Buyer message draft replies
- Review summarization and issue detection
- FAQ and policy-aware seller support
- Task reminders and suggested seller actions

## Data Sources

Preferred sources:

- Seller-provided listing content
- Seller-owned order/message/review data through approved APIs
- Manually uploaded product files for prototype testing
- Internal seller FAQ and store policies

Avoid:

- Using private buyer data in prompts unless necessary and allowed
- Sending sensitive data to any model without filtering or consent
- Scraping pages or messages from logged-in Shopee sessions

## OpenAI Usage

- Rewrite product titles and descriptions for clarity
- Classify buyer messages by intent and urgency
- Draft polite seller replies
- Summarize review themes and recurring complaints
- Generate checklist-style listing improvement suggestions

## MVP Features

1. Upload or paste a product listing.
2. Generate improved title and description.
3. Analyze sample buyer messages.
4. Draft seller replies.
5. Summarize reviews into issues and recommended actions.

## Questions To Resolve

- Should the assistant support English only or English plus Singapore-style multilingual phrasing?
- Do we need human approval before sending any generated reply?
- What store policy and product constraints should the assistant follow?
