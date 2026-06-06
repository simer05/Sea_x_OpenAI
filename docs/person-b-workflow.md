# Person B Workflow

## Branch

```text
post_launch_seller
```

## Daily Work

1. Pull latest `main` only when needed.
2. Stay on `post_launch_seller`.
3. Work in `apps/post-launch-seller-app`, `modules/post-launch-seller`, and post-launch docs/data.
4. Use real Shopee API data when credentials are available.
5. Keep sample data in `packages/shared-data/data/post-launch` only as a fallback.
6. Keep analysis output structured and testable.

## Merge Rule

Do not merge Person A pre-product files into this branch. Final integration can happen later in a separate integration branch.
