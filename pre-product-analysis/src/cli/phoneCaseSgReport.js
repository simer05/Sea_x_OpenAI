"use strict";

const productIdea = require("../data/mock/phoneCaseProductIdea.sg.json");
const competitors = require("../data/mock/phoneCaseCompetitors.sg.json");
const rawSnapshots = require("../data/mock/rawShopeePhoneCaseSnapshots.sg.json");
const { analyzePreProduct } = require("../analysis/preProductAnalyzer");

const report = analyzePreProduct({ productIdea, competitors });

console.log(JSON.stringify({
  demo_context: {
    product: "Purple iPhone 15 phone case with free holding string",
    target_region: "SG",
    data_mode: "mock",
    mock_raw_snapshot_note: rawSnapshots.note,
    mock_raw_snapshot_endpoints: Object.keys(rawSnapshots.mock_endpoints)
  },
  agent_response: report
}, null, 2));
