"use strict";

const productIdea = require("../data/mock/productIdea.json");
const competitors = require("../data/mock/competitors.json");
const { analyzePreProduct } = require("../analysis/preProductAnalyzer");

const report = analyzePreProduct({ productIdea, competitors });

console.log(JSON.stringify(report, null, 2));
