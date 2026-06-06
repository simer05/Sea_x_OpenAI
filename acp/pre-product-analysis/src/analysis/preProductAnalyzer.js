"use strict";

const { findSimilarCompetitors } = require("./competitorMatcher");
const { calculateMargin, scoreMargin } = require("./marginCalculator");
const { createProductIntelligence } = require("../normalizers/productIntelligence");

const SCORE_WEIGHTS = {
  demand: 0.22,
  competition: 0.18,
  margin: 0.24,
  differentiation: 0.2,
  listingReadiness: 0.16
};

function analyzePreProduct({ productIdea, competitors = [] }) {
  const product = createProductIntelligence(productIdea);
  const normalizedCompetitors = competitors.map(createProductIntelligence);
  const matches = findSimilarCompetitors(product, normalizedCompetitors);
  const matchedProducts = matches.map((match) => match.product);
  const margin = calculateMargin({
    sellingPrice: product.commerce.listing_price,
    productCost: product.fees_and_margin.product_cost,
    feeAssumptions: product.fees_and_margin.fee_assumptions
  });

  const scores = {
    demand: scoreDemand(matchedProducts),
    competition: scoreCompetition(matches, matchedProducts),
    margin: scoreMargin(margin),
    differentiation: scoreDifferentiation(product, matchedProducts),
    listingReadiness: scoreListingReadiness(product)
  };

  const overallLaunchScore = weightedAverage(scores, SCORE_WEIGHTS);
  const recommendation = launchRecommendation(overallLaunchScore, scores.margin);

  return {
    analysis_type: "pre_product",
    schema_version: "1.0",
    decision: {
      launch_recommendation: recommendation,
      overall_launch_score: overallLaunchScore,
      confidence: confidence(product, matches),
      summary: summaryFor(recommendation, margin)
    },
    scores,
    market_research: {
      similar_listing_count: matches.length,
      direct_competitor_count: matches.filter((match) => match.tier === "direct").length,
      comparable_competitor_count: matches.filter((match) => match.tier === "comparable").length,
      competitor_saturation: saturationLabel(scores.competition),
      top_competitors: matches.slice(0, 5).map(({ product, ...safeMatch }) => ({
        ...safeMatch,
        price: product.commerce?.listing_price ?? null,
        currency: product.commerce?.currency || "SGD",
        rating: product.trust_and_reviews?.rating ?? null,
        review_count: product.trust_and_reviews?.review_count ?? null,
        seller_type: product.shop_identity?.seller_type ?? null,
        ships_from_region: product.fulfillment?.ships_from_region ?? null
      }))
    },
    margin_analysis: {
      ...margin,
      cost_basis: product.fees_and_margin.cost_basis || "full_net_margin",
      buying_cost_included: product.fees_and_margin.buying_cost_included ?? true
    },
    listing_readiness: listingChecklist(product),
    differentiation_gaps: differentiationGaps(product, matchedProducts),
    initial_stock_recommendation: recommendInitialStock(product, scores, matches),
    risks: buildRisks(scores, matches, margin, product),
    recommended_actions_before_launch: buildActions(scores, margin, product, matchedProducts),
    data_quality: product.data_quality
  };
}

function recommendInitialStock(product, scores, matches) {
  const plannedStock = Number(product.variants?.[0]?.stock);
  const hasPlannedStock = Number.isFinite(plannedStock) && plannedStock > 0;
  const directCompetitors = matches.filter((match) => match.tier === "direct").length;
  const demandLevel = scores.demand >= 80 ? "high" : scores.demand >= 55 ? "moderate" : "low";
  const readinessRisk = scores.listingReadiness < 80;
  const competitionRisk = scores.competition < 65 || directCompetitors >= 2;
  const operatingRoom = scores.margin >= 78 ? "strong" : scores.margin >= 60 ? "healthy" : "thin";

  let min = demandLevel === "high" ? 50 : demandLevel === "moderate" ? 30 : 15;
  let max = demandLevel === "high" ? 90 : demandLevel === "moderate" ? 60 : 35;

  if (operatingRoom === "strong") max += 20;
  if (competitionRisk) {
    min = Math.max(10, min - 15);
    max = Math.max(min + 10, max - 25);
  }
  if (readinessRisk) {
    min = Math.max(10, min - 15);
    max = Math.max(min + 10, max - 30);
  }

  const recommendation = {
    planned_units: hasPlannedStock ? plannedStock : null,
    min_units: min,
    max_units: max,
    suggested_units: Math.round((min + max) / 2),
    demand_level: demandLevel,
    fit: "not_provided",
    guidance: "Add planned launch stock to compare seller intent against the suggested test quantity.",
    rationale: stockRationale(demandLevel, competitionRisk, readinessRisk, operatingRoom)
  };

  if (hasPlannedStock && plannedStock < min) {
    recommendation.fit = "too_low";
    recommendation.guidance = "Planned launch stock may be too small to learn from demand and conversion.";
  } else if (hasPlannedStock && plannedStock > max) {
    recommendation.fit = "too_high";
    recommendation.guidance = "Planned launch stock is above the suggested test range; validate conversion before scaling inventory.";
  } else if (hasPlannedStock) {
    recommendation.fit = "within_range";
    recommendation.guidance = "Planned launch stock is aligned with the suggested test range.";
  }

  return recommendation;
}

function stockRationale(demandLevel, competitionRisk, readinessRisk, operatingRoom) {
  const reasons = [`Demand signal is ${demandLevel}.`, `Operating room is ${operatingRoom}.`];
  if (competitionRisk) reasons.push("Competitor pressure suggests testing before committing too much inventory.");
  if (readinessRisk) reasons.push("Listing gaps should be fixed before scaling stock.");
  if (!competitionRisk && !readinessRisk) reasons.push("Launch signals support a moderate first batch.");
  return reasons.join(" ");
}

function scoreDemand(competitors) {
  if (!competitors.length) return 25;
  const reviewSignal = average(competitors.map((item) => item.trust_and_reviews?.review_count || 0));
  const salesSignal = average(competitors.map((item) => item.performance?.estimated_monthly_sales || 0));
  const reviewScore = Math.min(45, Math.log10(reviewSignal + 1) * 18);
  const salesScore = Math.min(45, Math.log10(salesSignal + 1) * 20);
  return clamp(Math.round(10 + reviewScore + salesScore), 0, 100);
}

function scoreCompetition(matches, competitors) {
  if (!matches.length) return 82;
  const directPressure = matches.filter((match) => match.tier === "direct").length * 12;
  const reviewDominance = average(competitors.map((item) => item.trust_and_reviews?.review_count || 0)) > 500 ? 18 : 0;
  const priceWar = priceSpread(competitors) < 0.18 ? 14 : 0;
  return clamp(Math.round(100 - directPressure - reviewDominance - priceWar), 15, 95);
}

function scoreDifferentiation(product, competitors) {
  const sellerFeatures = new Set([
    ...normalizeList(product.text_content?.bullet_features),
    ...normalizeList(product.attributes?.certifications),
    ...normalizeList(product.attributes?.ingredient_highlights),
    ...normalizeList(product.visual_content?.vision_tags)
  ]);
  if (!sellerFeatures.size) return 30;

  const competitorFeatures = new Set(
    competitors.flatMap((item) => [
      ...normalizeList(item.text_content?.bullet_features),
      ...normalizeList(item.attributes?.certifications),
      ...normalizeList(item.attributes?.ingredient_highlights),
      ...normalizeList(item.visual_content?.vision_tags)
    ])
  );

  const uniqueCount = [...sellerFeatures].filter((feature) => !competitorFeatures.has(feature)).length;
  const trustBonus = product.attributes?.certifications?.length ? 10 : 0;
  const localFitBonus = product.commerce?.cod_available || product.commerce?.bnpl_available ? 8 : 0;
  return clamp(Math.round(45 + (uniqueCount / sellerFeatures.size) * 35 + trustBonus + localFitBonus), 0, 100);
}

function scoreListingReadiness(product) {
  const checklist = listingChecklist(product);
  return Math.round((checklist.filter((item) => item.status === "complete").length / checklist.length) * 100);
}

function listingChecklist(product) {
  return [
    check("title", "Title includes category and key feature", Boolean(product.text_content?.name && product.text_content.name.length >= 18)),
    check("photos", "Photos are present and tagged", product.visual_content?.image_count >= 3 && product.visual_content?.vision_tags?.length >= 2),
    check("description", "Description explains buyer benefits", Boolean(product.text_content?.description && product.text_content.description.length >= 80)),
    check("keywords", "Buyer search keywords are included", product.text_content?.keywords?.length >= 3),
    check("variants", "Variants or single-SKU choice are clear", product.variants?.length > 0 || product.attributes?.size),
    check("trust_proof", "Warranty, certification, or proof is visible", hasTrustProof(product)),
    check("local_relevance", "Local payment or logistics details are known", product.commerce?.cod_available !== null || product.commerce?.bnpl_available !== null || product.fulfillment?.ships_from_region)
  ];
}

function differentiationGaps(product, competitors) {
  const gaps = [];
  const complaints = competitors.flatMap((item) => item.trust_and_reviews?.review_pain_points || []);
  const sellerText = [
    product.text_content?.name,
    product.text_content?.description,
    ...(product.text_content?.bullet_features || [])
  ].join(" ").toLowerCase();

  for (const complaint of unique(complaints)) {
    const firstWord = complaint.toLowerCase().split(" ")[0];
    if (!sellerText.includes(firstWord)) gaps.push(`Competitors show pain point: ${complaint}`);
  }

  if (!hasTrustProof(product)) gaps.push("Add warranty, certification, authenticity, or safety proof.");
  if (product.visual_content?.image_count < 5) gaps.push("Add more images showing size, usage, packaging, and proof badges.");
  return gaps.slice(0, 6);
}

function buildRisks(scores, matches, margin, product) {
  const risks = [];
  if (scores.competition < 55) risks.push("High competitor pressure from similar listings.");
  if (scores.margin < 55) risks.push(`Weak net margin at ${margin.netMarginPercent}%. Avoid discounting below break-even.`);
  if (matches.filter((match) => match.tier === "direct").length >= 3) risks.push("Several direct competitors may limit launch visibility.");
  if (product.source.data_mode === "mock") risks.push("Competitor data is mock/sample data, so confidence is limited until API data is connected.");
  return risks;
}

function buildActions(scores, margin, product, competitors) {
  const actions = [];
  if (scores.listingReadiness < 80) actions.push("Complete missing listing readiness items before publishing.");
  if (!hasTrustProof(product)) actions.push("Add warranty/certification proof in title, description, and image badges.");
  if (scores.competition < 65) actions.push("Position around a clear differentiator instead of competing only on price.");
  if (margin.safeAdSpendCap > 0) actions.push(`Keep first campaign ad spend below ${product.commerce.currency} ${margin.safeAdSpendCap} per order until conversion is proven.`);
  if (competitors.length) actions.push(`Benchmark against ${competitors[0].text_content?.name} before final price lock.`);
  actions.push("Launch with limited stock first and review conversion before scaling inventory.");
  return unique(actions).slice(0, 6);
}

function hasTrustProof(product) {
  return Boolean(
    product.attributes?.warranty ||
    product.attributes?.certifications?.length ||
    product.text_content?.description?.toLowerCase().includes("warranty")
  );
}

function confidence(product, matches) {
  if (product.source.is_live_data && matches.length >= 3) return "high";
  if (matches.length >= 2) return "medium";
  return "low";
}

function launchRecommendation(score, marginScore) {
  if (score >= 78 && marginScore >= 60) return "Launch";
  if (score >= 62 && marginScore >= 45) return "Proceed with caution";
  return "Do not launch yet";
}

function summaryFor(recommendation, margin) {
  if (recommendation === "Launch") {
    return `Launch looks feasible with ${margin.netMarginPercent}% estimated net margin and strong pre-product signals.`;
  }
  if (recommendation === "Proceed with caution") {
    return `Demand exists, but the seller should tighten differentiation, listing quality, and ad spend before launch. Net margin is ${margin.netMarginPercent}%.`;
  }
  return `The product is not ready to launch yet because one or more core signals are weak. Current estimated net margin is ${margin.netMarginPercent}%.`;
}

function saturationLabel(competitionScore) {
  if (competitionScore >= 75) return "low";
  if (competitionScore >= 55) return "moderate";
  return "high";
}

function weightedAverage(scores, weights) {
  return Math.round(Object.entries(weights).reduce((total, [key, weight]) => total + scores[key] * weight, 0));
}

function check(id, label, passed) {
  return { id, label, status: passed ? "complete" : "missing" };
}

function priceSpread(competitors) {
  const prices = competitors.map((item) => Number(item.commerce?.listing_price)).filter(Boolean);
  if (prices.length < 2) return 1;
  return (Math.max(...prices) - Math.min(...prices)) / average(prices);
}

function average(values) {
  const safe = values.filter((value) => Number.isFinite(Number(value)));
  return safe.length ? safe.reduce((sum, value) => sum + Number(value), 0) / safe.length : 0;
}

function normalizeList(values = []) {
  return values.map((value) => String(value).trim().toLowerCase()).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

module.exports = {
  SCORE_WEIGHTS,
  analyzePreProduct
};
