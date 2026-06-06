const path = require("node:path");

const { analyzePreProduct } = require(
  path.join(__dirname, "../../../pre-product-analysis/src/analysis/preProductAnalyzer.js"),
);
const multiProductCompetitors = require(
  path.join(__dirname, "../../../pre-product-analysis/src/data/mock/multiProductCompetitors.sg.json"),
);
const phoneCaseCompetitors = require(
  path.join(__dirname, "../../../pre-product-analysis/src/data/mock/phoneCaseCompetitors.sg.json"),
);

function chooseCompetitors(categoryPath) {
  const key = (categoryPath || []).join(" > ");
  if (key.includes("Cases Covers")) return phoneCaseCompetitors;
  if (key.includes("Water Bottles")) {
    return multiProductCompetitors.filter((item) =>
      item.taxonomy?.category_path?.join(" > ").includes("Water Bottles"),
    );
  }
  if (key.includes("T-Shirts")) {
    return multiProductCompetitors.filter((item) =>
      item.taxonomy?.category_path?.join(" > ").includes("T-Shirts"),
    );
  }
  return [...phoneCaseCompetitors, ...multiProductCompetitors];
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = request.body || {};
    const categoryPath = body.productIdea?.taxonomy?.category_path || [];
    const competitors = chooseCompetitors(categoryPath);
    const report = analyzePreProduct({
      productIdea: body.productIdea,
      competitors,
    });

    response.status(200).json({
      data_mode: "mock",
      target_region: body.productIdea?.fulfillment?.target_region || "SG",
      competitor_source: "Shopee-style mock marketplace data",
      agent_response: report,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Analysis failed",
    });
  }
};
