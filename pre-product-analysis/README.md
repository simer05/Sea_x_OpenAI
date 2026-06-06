# Pre-Product Analysis

Standalone Person 1 checklist implementation for AdaptLink Seller Intelligence.

This module helps a Shopee seller decide whether a planned product is worth launching by scoring:

- market demand,
- competitor saturation,
- price and net margin feasibility,
- differentiation gaps,
- listing readiness.

It uses mock Shopee-like Product Intelligence Objects for hackathon testing. The analysis code is data-mode agnostic, so mock inputs can later be replaced by approved Shopee API data without changing the scoring module.

## Run

```bash
npm test
npm run demo
```

## Output

The demo prints a recommendation JSON with:

- launch recommendation,
- overall launch score,
- competitor matches,
- margin analysis,
- listing checklist,
- risks,
- recommended actions before launch.
