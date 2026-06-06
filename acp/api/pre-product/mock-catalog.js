const path = require("node:path");

const multiProductIdeas = require(
  path.join(__dirname, "../../../pre-product-analysis/src/data/mock/multiProductIdeas.sg.json"),
);
const phoneCaseProductIdea = require(
  path.join(__dirname, "../../../pre-product-analysis/src/data/mock/phoneCaseProductIdea.sg.json"),
);
const multiProductCompetitors = require(
  path.join(__dirname, "../../../pre-product-analysis/src/data/mock/multiProductCompetitors.sg.json"),
);
const phoneCaseCompetitors = require(
  path.join(__dirname, "../../../pre-product-analysis/src/data/mock/phoneCaseCompetitors.sg.json"),
);

module.exports = async function handler(_request, response) {
  response.status(200).json({
    target_region: "SG",
    data_mode: "mock",
    sample_products: [phoneCaseProductIdea, ...multiProductIdeas],
    competitor_count: phoneCaseCompetitors.length + multiProductCompetitors.length,
  });
};
