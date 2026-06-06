import sampleData from "../packages/shared-data/data/post-launch/halal-vitamin-c-serum.sample.json" with { type: "json" };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scoreRatio(value, weak, strong) {
  if (strong === weak) {
    return 50;
  }

  return clamp(((value - weak) / (strong - weak)) * 100, 0, 100);
}

function scoreInverseGap(value, benchmark, maxGapPercent) {
  if (benchmark <= 0) {
    return 50;
  }

  const gap = Math.abs(value - benchmark) / benchmark;
  return clamp(100 - (gap / maxGapPercent) * 100, 0, 100);
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let best = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }

  return best;
}

function calculateProductHealth(input) {
  const { product, competitors } = input;
  const competitorAveragePrice = average(competitors.map((item) => item.price));
  const competitorAverageRating = average(competitors.map((item) => item.rating));
  const competitorAverageReviews = average(competitors.map((item) => item.reviews));

  const conversion = scoreRatio(product.conversionRate, 0.025, 0.085);
  const margin = scoreRatio(product.netMarginPercent, 0.12, 0.42);
  const rating = scoreRatio(product.rating, 3.8, 4.9);
  const traffic = scoreRatio(product.views, 2500, 30000);
  const fulfillment = 100 - clamp(product.cancellationRate * 800 + product.refundRate * 700, 0, 100);

  const pricePosition = scoreInverseGap(product.price, competitorAveragePrice, 0.35);
  const trustPosition = scoreRatio(product.reviews, competitorAverageReviews * 0.25, competitorAverageReviews);
  const ratingPosition = scoreRatio(product.rating, competitorAverageRating - 0.4, competitorAverageRating + 0.1);
  const competitorPosition = Math.round(pricePosition * 0.35 + trustPosition * 0.3 + ratingPosition * 0.35);

  const highFrictionCount = input.buyerQuestions.filter((question) =>
    ["trust", "size", "delivery", "ingredient", "price"].includes(question.theme)
  ).length;
  const customerInteraction = Math.round(100 - clamp((highFrictionCount / input.buyerQuestions.length) * 65, 0, 85));

  const overall = Math.round(
    conversion * 0.2 +
      margin * 0.2 +
      rating * 0.15 +
      competitorPosition * 0.15 +
      traffic * 0.1 +
      customerInteraction * 0.1 +
      fulfillment * 0.1
  );

  return {
    overall,
    conversion: Math.round(conversion),
    margin: Math.round(margin),
    reviewRating: Math.round(rating),
    competitorPosition,
    traffic: Math.round(traffic),
    customerInteraction,
    fulfillment: Math.round(fulfillment)
  };
}

function buildRevenueActionPlan(input, health) {
  const actions = [];
  const { product, competitors } = input;
  const competitorAveragePrice =
    competitors.reduce((sum, competitor) => sum + competitor.price, 0) / Math.max(competitors.length, 1);
  const topQuestionTheme = mostCommon(input.buyerQuestions.map((question) => question.theme));
  const topReviewTheme = mostCommon(
    input.reviews.filter((review) => review.sentiment !== "positive").map((review) => review.theme)
  );

  if (health.conversion < 60) {
    actions.push({
      priority: "High",
      area: "Conversion",
      action: "Update the main image, first title keywords, and first three description bullets around the strongest buyer concern.",
      revenueLogic: "Improves CTR and product-page conversion without cutting price.",
      expectedImpact: "Higher clicks-to-orders conversion"
    });
  }

  if (product.price > competitorAveragePrice * 1.08 && product.netMarginPercent < 0.25) {
    actions.push({
      priority: "High",
      area: "Pricing",
      action: "Avoid lowering base price. Test a limited new-buyer voucher or bundle discount instead.",
      revenueLogic: "Protects margin while reducing buyer hesitation against cheaper competitors.",
      expectedImpact: "Better conversion with less margin leakage"
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

function analyzePostLaunchProduct(input) {
  const health = calculateProductHealth(input);
  const actions = buildRevenueActionPlan(input, health);
  const weakAreas = [
    health.conversion < 60 ? "conversion" : null,
    health.margin < 60 ? "margin" : null,
    health.competitorPosition < 60 ? "competitor position" : null,
    health.customerInteraction < 60 ? "buyer confusion" : null,
    health.fulfillment < 70 ? "fulfillment" : null
  ].filter(Boolean);

  return {
    productId: input.product.productId,
    productTitle: input.product.title,
    health,
    diagnosis: `${input.product.title} needs action on ${weakAreas.join(", ")}. Focus on changes that raise conversion while protecting net margin.`,
    actions,
    dataQualityWarnings: input.dataQualityWarnings
  };
}

console.log(JSON.stringify(analyzePostLaunchProduct(sampleData), null, 2));
