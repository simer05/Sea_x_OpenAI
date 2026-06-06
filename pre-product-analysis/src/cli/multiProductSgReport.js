"use strict";

const productIdeas = require("../data/mock/multiProductIdeas.sg.json");
const competitors = require("../data/mock/multiProductCompetitors.sg.json");
const rawSnapshots = require("../data/mock/rawShopeeMultiProductSnapshots.sg.json");
const { analyzePreProduct } = require("../analysis/preProductAnalyzer");

const reports = productIdeas.map((productIdea) => {
  const report = analyzePreProduct({ productIdea, competitors });

  return {
    product_name: productIdea.text_content.name,
    seller_sku: productIdea.product_identity.seller_sku,
    category: productIdea.taxonomy.category_path.join(" > "),
    target_region: productIdea.fulfillment.target_region,
    data_mode: productIdea.source.data_mode,
    launch_recommendation: report.decision.launch_recommendation,
    overall_launch_score: report.decision.overall_launch_score,
    confidence: report.decision.confidence,
    scores: report.scores,
    margin: {
      selling_price: report.margin_analysis.sellingPrice,
      net_margin_percent: report.margin_analysis.netMarginPercent,
      safe_ad_spend_cap: report.margin_analysis.safeAdSpendCap
    },
    market_research: report.market_research,
    top_actions: report.recommended_actions_before_launch.slice(0, 3),
    risks: report.risks
  };
});

console.log(JSON.stringify({
  demo_context: {
    target_region: "SG",
    data_mode: "mock",
    product_count: productIdeas.length,
    categories: rawSnapshots.categories,
    mock_raw_snapshot_note: rawSnapshots.note,
    mock_raw_snapshot_endpoints: Object.keys(rawSnapshots.mock_endpoints)
  },
  dashboard_products: reports
}, null, 2));
