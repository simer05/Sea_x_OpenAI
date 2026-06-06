import type { PostLaunchInput, ProductHealthBreakdown } from "@adaptlink/shared-types";
import { clamp, scoreInverseGap, scoreRatio } from "@adaptlink/utils";

export function calculateProductHealth(input: PostLaunchInput): ProductHealthBreakdown {
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

  const customerInteraction = scoreBuyerFriction(input.buyerQuestions);

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

function scoreBuyerFriction(questions: PostLaunchInput["buyerQuestions"]): number {
  if (questions.length === 0) {
    return 70;
  }

  const totalFrequency = questions.reduce((sum, question) => sum + question.frequency, 0);
  const highFrictionFrequency = questions
    .filter((question) => ["trust", "size", "delivery", "ingredient", "price"].includes(question.theme))
    .reduce((sum, question) => sum + question.frequency, 0);

  return Math.round(100 - clamp((highFrictionFrequency / totalFrequency) * 65, 0, 85));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
