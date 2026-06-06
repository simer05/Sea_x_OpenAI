# OpenAI Agent Strategy

This branch should use OpenAI where it improves seller decisions, not everywhere by default.

## Model Routing

| Task | Recommended model/API | Why |
|---|---|---|
| Review theme extraction | `gpt-5.4-mini` with structured outputs | High-volume classification should be fast and cheaper. |
| Buyer chat/theme extraction | `gpt-5.4-mini` with structured outputs | Repeated operational text does not need the most expensive reasoning pass. |
| Final revenue diagnosis | `gpt-5.5` with higher reasoning | Pricing, margin, conversion, competitor, and fulfillment tradeoffs need deeper reasoning. |
| Listing image audit later | `gpt-5.5` or current vision-capable model | Use only when seller uploads product/listing images. |
| Portfolio batch scan later | Batch API | Nightly analysis across many products can be cheaper and does not need instant latency. |
| Live seller workflow later | Agents SDK / tool-calling workflow | Useful once we connect Shopee APIs and need fetch-normalize-analyze steps. |

## Multi-Agent Workflow

Use multiple agents as roles, not as noise:

1. `Data Quality Agent`: checks missing, mocked, stale, or estimated fields.
2. `Review Agent`: extracts positive/negative review themes.
3. `Chat Experience Agent`: analyzes buyer questions, response timing, and lost-conversion risk.
4. `Competitor Agent`: compares price, rating, vouchers, reviews, shipping, and trust gap.
5. `Pricing and Margin Agent`: protects net margin before recommending discounts.
6. `Revenue Strategy Agent`: merges everything into 3 to 5 seller-safe actions.

## Guardrails

- Do not claim mock data is live.
- Do not recommend price cuts without checking margin.
- Do not show category-specific filters like halal unless the product category and buyer questions make them relevant.
- Keep outputs structured so the dashboard can render them reliably.
- Use Shopee API/tool data when credentials are available; otherwise mark fields as mock or estimated.

## What Not To Use Yet

- Realtime voice is not needed for this dashboard unless we add a seller voice assistant.
- Image generation is not needed for analytics, but vision can be useful later for listing-image audit.
- Computer-use automation is not needed unless Shopee does not expose an approved API/export for a required seller workflow.
- Fine-tuning is not needed for the MVP; structured prompts, schemas, and evaluation examples are enough.
