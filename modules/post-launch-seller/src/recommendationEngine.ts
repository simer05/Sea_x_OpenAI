import type { ActionRecommendation, PostLaunchInput, ProductHealthBreakdown } from "@adaptlink/shared-types";

export function buildRevenueActionPlan(
  input: PostLaunchInput,
  health: ProductHealthBreakdown
): ActionRecommendation[] {
  const actions: ActionRecommendation[] = [];
  const { product, competitors } = input;
  const competitorAveragePrice =
    competitors.reduce((sum, competitor) => sum + competitor.price, 0) / Math.max(competitors.length, 1);
  const topQuestionTheme = mostFrequentQuestionTheme(input.buyerQuestions);
  const topReviewTheme = mostCommon(input.reviews.filter((review) => review.sentiment !== "positive").map((review) => review.theme));

  if (health.conversion < 60) {
    actions.push({
      priority: "High",
      area: "Conversion",
      action: "Update the main image, first title keywords, and first three description bullets around the strongest buyer concern.",
      revenueLogic: "Improves CTR and product-page conversion without cutting price.",
      expectedImpact: "Higher clicks-to-orders conversion"
    });
  }

  if (product.netMarginPercent < 0.25) {
    actions.push({
      priority: "High",
      area: "Pricing",
      action:
        product.price > competitorAveragePrice * 1.08
          ? "Avoid lowering base price. Test a limited new-buyer voucher or bundle discount instead."
          : "Do not stack broad vouchers. Use bundles, minimum-spend vouchers, or ad spend caps to protect contribution margin.",
      revenueLogic: "Protects net margin while still giving buyers a reason to convert.",
      expectedImpact: "Higher revenue quality, not just higher order count"
    });
  }

  if (topQuestionTheme) {
    actions.push({
      priority: "High",
      area: "Buyer Questions",
      action: `Add a visible FAQ block and product image callout for repeated '${topQuestionTheme}' questions.`,
      revenueLogic: "Reduces unanswered objections before checkout.",
      expectedImpact: "Lower chat load and better conversion"
    });
  }

  if (input.communication && input.communication.responseWithinOneHourPercent < 0.7) {
    actions.push({
      priority: "High",
      area: "Seller Response",
      action: "Set quick-reply templates for the top buyer questions and target replies within one hour.",
      revenueLogic: "Slow replies can turn product-page interest into abandoned purchases, especially when questions involve trust, compatibility, delivery, or warranty.",
      expectedImpact: "Higher buyer confidence and fewer lost chats"
    });
  }

  if (topReviewTheme) {
    actions.push({
      priority: "Medium",
      area: "Reviews",
      action: `Address the recurring review issue '${topReviewTheme}' in listing copy, packaging notes, or operations.`,
      revenueLogic: "Improves future rating quality and closes trust gaps against competitors.",
      expectedImpact: "Higher trust and lower refund risk"
    });
  }

  if (health.fulfillment < 70) {
    actions.push({
      priority: "Medium",
      area: "Fulfillment",
      action: "Check cancellation, stock, and delivery timing. Add realistic delivery promise if operations cannot improve immediately.",
      revenueLogic: "Avoids rating damage and revenue loss from cancellations/refunds.",
      expectedImpact: "More stable product health"
    });
  }

  return actions.slice(0, 5);
}

function mostCommon(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }

  return best;
}

function mostFrequentQuestionTheme(questions: PostLaunchInput["buyerQuestions"]): string | null {
  let best: string | null = null;
  let bestFrequency = 0;

  for (const question of questions) {
    if (question.frequency > bestFrequency) {
      best = question.theme;
      bestFrequency = question.frequency;
    }
  }

  return best;
}
