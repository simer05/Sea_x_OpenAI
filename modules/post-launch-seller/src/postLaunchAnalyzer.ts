import type { PostLaunchInput, PostLaunchReport } from "@adaptlink/shared-types";
import { calculateProductHealth } from "./productHealthScorer";
import { buildRevenueActionPlan } from "./recommendationEngine";

export function analyzePostLaunchProduct(input: PostLaunchInput): PostLaunchReport {
  const health = calculateProductHealth(input);
  const actions = buildRevenueActionPlan(input, health);
  const diagnosis = buildDiagnosis(input, health);

  return {
    productId: input.product.productId,
    productTitle: input.product.title,
    health,
    diagnosis,
    actions,
    dataQualityWarnings: input.dataQualityWarnings
  };
}

function buildDiagnosis(input: PostLaunchInput, health: PostLaunchReport["health"]): string {
  const weakAreas = [
    health.conversion < 60 ? "conversion" : null,
    health.margin < 60 ? "margin" : null,
    health.competitorPosition < 60 ? "competitor position" : null,
    health.customerInteraction < 60 ? "buyer confusion" : null,
    health.fulfillment < 70 ? "fulfillment" : null
  ].filter(Boolean);

  if (weakAreas.length === 0) {
    return `${input.product.title} is healthy, but the next revenue lift should come from controlled listing tests and competitor monitoring.`;
  }

  return `${input.product.title} needs action on ${weakAreas.join(", ")}. Focus on changes that raise conversion while protecting net margin.`;
}
