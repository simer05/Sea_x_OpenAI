"use strict";

const STOP_WORDS = new Set(["and", "for", "the", "with", "new", "original", "official", "sg", "sale"]);

const WEIGHTS = {
  category: 20,
  title: 20,
  image: 15,
  attributes: 15,
  price: 10,
  useCase: 10,
  sellerType: 5,
  shippingPayment: 5
};

function scoreCompetitorSimilarity(product, competitor) {
  const category = sameCategory(product, competitor) ? WEIGHTS.category : 0;
  const title = jaccardScore(tokens(product.text_content?.name), tokens(competitor.text_content?.name)) * WEIGHTS.title;
  const image = visualScore(product, competitor) * WEIGHTS.image;
  const attributes = attributeScore(product.attributes, competitor.attributes) * WEIGHTS.attributes;
  const price = priceBandScore(product.commerce?.listing_price, competitor.commerce?.listing_price) * WEIGHTS.price;
  const useCase = jaccardScore(tokens(product.agent_processing?.target_use_case), tokens(competitor.agent_processing?.target_use_case)) * WEIGHTS.useCase;
  const sellerType = product.shop_identity?.seller_type === competitor.shop_identity?.seller_type ? WEIGHTS.sellerType : 0;
  const shippingPayment = shippingPaymentScore(product, competitor) * WEIGHTS.shippingPayment;
  const total = category + title + image + attributes + price + useCase + sellerType + shippingPayment;

  return {
    competitorId: competitor.product_identity?.item_id || competitor.product_identity?.seller_sku || "unknown",
    name: competitor.text_content?.name || "Unnamed competitor",
    score: Math.round(total),
    tier: similarityTier(total),
    components: {
      category: round(category),
      title: round(title),
      image: round(image),
      attributes: round(attributes),
      price: round(price),
      useCase: round(useCase),
      sellerType: round(sellerType),
      shippingPayment: round(shippingPayment)
    },
    product: competitor
  };
}

function findSimilarCompetitors(product, competitors, minimumScore = 40) {
  return competitors
    .map((competitor) => scoreCompetitorSimilarity(product, competitor))
    .filter((match) => match.score >= minimumScore)
    .sort((a, b) => b.score - a.score);
}

function sameCategory(a, b) {
  const aPath = a.taxonomy?.category_path || [];
  const bPath = b.taxonomy?.category_path || [];
  return Boolean(aPath.length && bPath.length && aPath.join(">").toLowerCase() === bPath.join(">").toLowerCase());
}

function visualScore(a, b) {
  return jaccardScore(
    (a.visual_content?.vision_tags || []).map(normalize),
    (b.visual_content?.vision_tags || []).map(normalize)
  );
}

function attributeScore(a = {}, b = {}) {
  const keys = Object.keys(a).filter((key) => a[key] !== null && b[key] !== null && b[key] !== undefined);
  if (!keys.length) return 0;
  const matches = keys.filter((key) => normalizeValue(a[key]) === normalizeValue(b[key])).length;
  return matches / keys.length;
}

function priceBandScore(productPrice, competitorPrice) {
  const price = Number(productPrice);
  const other = Number(competitorPrice);
  if (!price || !other) return 0;
  const delta = Math.abs(price - other) / price;
  if (delta <= 0.3) return 1;
  if (delta <= 0.5) return 0.5;
  return 0;
}

function shippingPaymentScore(a, b) {
  const checks = [
    ["commerce", "cod_available"],
    ["commerce", "bnpl_available"],
    ["fulfillment", "ships_from_region"]
  ];
  const comparable = checks.filter(([section, key]) => a[section]?.[key] !== undefined && b[section]?.[key] !== undefined);
  if (!comparable.length) return 0;
  const matches = comparable.filter(([section, key]) => a[section][key] === b[section][key]).length;
  return matches / comparable.length;
}

function jaccardScore(a = [], b = []) {
  const left = new Set(a.filter(Boolean));
  const right = new Set(b.filter(Boolean));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

function tokens(value = "") {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(normalize)
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeValue(value) {
  return Array.isArray(value) ? value.map(normalize).sort().join("|") : normalize(value);
}

function similarityTier(score) {
  if (score >= 80) return "direct";
  if (score >= 60) return "comparable";
  if (score >= 40) return "adjacent";
  return "not_useful";
}

function round(value) {
  return Math.round(value * 10) / 10;
}

module.exports = {
  WEIGHTS,
  findSimilarCompetitors,
  scoreCompetitorSimilarity
};
