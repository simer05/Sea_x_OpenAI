"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const productIdea = require("../src/data/mock/productIdea.json");
const competitors = require("../src/data/mock/competitors.json");
const phoneCaseProductIdea = require("../src/data/mock/phoneCaseProductIdea.sg.json");
const phoneCaseCompetitors = require("../src/data/mock/phoneCaseCompetitors.sg.json");
const rawPhoneCaseSnapshots = require("../src/data/mock/rawShopeePhoneCaseSnapshots.sg.json");
const multiProductIdeas = require("../src/data/mock/multiProductIdeas.sg.json");
const multiProductCompetitors = require("../src/data/mock/multiProductCompetitors.sg.json");
const rawMultiProductSnapshots = require("../src/data/mock/rawShopeeMultiProductSnapshots.sg.json");
const { analyzePreProduct } = require("../src/analysis/preProductAnalyzer");
const { calculateMargin } = require("../src/analysis/marginCalculator");
const { scoreCompetitorSimilarity } = require("../src/analysis/competitorMatcher");
const { createProductIntelligence } = require("../src/normalizers/productIntelligence");

test("pre-product analyzer returns the Person 1 launch checklist output", () => {
  const report = analyzePreProduct({ productIdea, competitors });

  assert.equal(report.analysis_type, "pre_product");
  assert.ok(["Launch", "Proceed with caution", "Do not launch yet"].includes(report.decision.launch_recommendation));
  assert.equal(typeof report.decision.overall_launch_score, "number");
  assert.ok(report.market_research.similar_listing_count >= 2);
  assert.equal(report.listing_readiness.length, 7);
  assert.ok(report.margin_analysis.netMarginPercent > 0);
  assert.ok(report.recommended_actions_before_launch.length > 0);
});

test("margin calculator uses true net margin inputs", () => {
  const margin = calculateMargin({
    sellingPrice: 18.9,
    productCost: 7.2,
    feeAssumptions: {
      shopeeFeeRate: 0.08,
      transactionFeeRate: 0.022,
      shippingSubsidy: 1,
      voucherCost: 0.8,
      packagingCost: 0.6,
      adCostPerOrder: 1.2
    }
  });

  assert.equal(margin.sellingPrice, 18.9);
  assert.equal(margin.netProfit, 6.17);
  assert.equal(margin.netMarginPercent, 32.7);
  assert.equal(margin.safeAdSpendCap, 2.78);
});

test("competitor matcher labels close serum products as comparable or direct", () => {
  const product = createProductIntelligence(productIdea);
  const competitor = createProductIntelligence(competitors[0]);
  const match = scoreCompetitorSimilarity(product, competitor);

  assert.ok(match.score >= 60);
  assert.ok(["comparable", "direct"].includes(match.tier));
  assert.equal(match.components.category, 20);
});

test("phone case SG mock data produces a regional pre-product report", () => {
  const report = analyzePreProduct({
    productIdea: phoneCaseProductIdea,
    competitors: phoneCaseCompetitors
  });

  assert.equal(phoneCaseProductIdea.source.region, "SG");
  assert.equal(phoneCaseProductIdea.commerce.currency, "SGD");
  assert.equal(phoneCaseProductIdea.fulfillment.target_region, "SG");
  assert.equal(rawPhoneCaseSnapshots.region, "SG");
  assert.ok(rawPhoneCaseSnapshots.mock_endpoints["product.get_item_base_info"].length >= 3);
  assert.ok(report.market_research.similar_listing_count >= 3);
  assert.equal(report.margin_analysis.sellingPrice, 40);
  assert.ok(report.data_quality.warnings.some((warning) => warning.includes("mock SG marketplace data")));
});

test("pre-product analyzer recommends initial launch stock size", () => {
  const productIdeaWithStock = {
    ...phoneCaseProductIdea,
    variants: [
      {
        ...phoneCaseProductIdea.variants[0],
        stock: 250
      }
    ]
  };
  const report = analyzePreProduct({
    productIdea: productIdeaWithStock,
    competitors: phoneCaseCompetitors
  });

  assert.equal(report.initial_stock_recommendation.planned_units, 250);
  assert.equal(report.initial_stock_recommendation.fit, "too_high");
  assert.ok(report.initial_stock_recommendation.suggested_units > 0);
  assert.ok(report.initial_stock_recommendation.max_units < 250);
});

test("multi-product SG mock catalog covers bottles and t-shirts", () => {
  const productTypes = new Set(multiProductIdeas.map((idea) => idea.taxonomy.product_type));
  const categories = new Set(multiProductIdeas.map((idea) => idea.taxonomy.category_path.join(" > ")));
  const reports = multiProductIdeas.map((productIdea) =>
    analyzePreProduct({ productIdea, competitors: multiProductCompetitors })
  );

  assert.equal(multiProductIdeas.length, 6);
  assert.ok(productTypes.has("water_bottle"));
  assert.ok(productTypes.has("tumbler"));
  assert.ok(productTypes.has("thermal_bottle"));
  assert.ok(productTypes.has("tshirt"));
  assert.ok(productTypes.has("graphic_tshirt"));
  assert.ok(productTypes.has("custom_tshirt"));
  assert.ok(categories.has("Home & Living > Kitchenware > Water Bottles"));
  assert.ok(categories.has("Men Clothes > Tops > T-Shirts"));
  assert.equal(rawMultiProductSnapshots.region, "SG");
  assert.ok(reports.every((report) => Number.isFinite(report.decision.overall_launch_score)));
  assert.ok(reports.every((report) => report.market_research.similar_listing_count >= 1));
});
