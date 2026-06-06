import type { PostLaunchInput } from "@adaptlink/shared-types";

export function buildPostLaunchRevenuePrompt(input: PostLaunchInput): string {
  return [
    "You are AdaptLink Seller Intelligence for a Shopee Singapore seller.",
    "Analyze only post-launch performance for a product that is already live.",
    "Do not discuss launch/no-launch decisions.",
    "Prioritize revenue lift, margin protection, conversion improvement, and trust repair.",
    "Return structured JSON with: diagnosis, health_score_rationale, top_revenue_leaks, competitor_position, review_themes, buyer_question_themes, pricing_strategy, and prioritized_actions.",
    "Use data quality warnings when a field is mocked, estimated, stale, missing, or weak.",
    "",
    "Input:",
    JSON.stringify(input, null, 2)
  ].join("\n");
}
