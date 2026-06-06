"use strict";

function createProductIntelligence(input) {
  const now = input.source?.fetched_at || new Date().toISOString();

  return {
    schema_version: "1.0",
    source: {
      platform: "shopee",
      region: input.source?.region || "SG",
      data_mode: input.source?.data_mode || "mock",
      fetched_at: now,
      source_endpoints: input.source?.source_endpoints || ["seller_input", "mock_competitor_dataset"],
      raw_snapshot_id: input.source?.raw_snapshot_id || null,
      is_live_data: input.source?.is_live_data ?? false
    },
    product_identity: {
      item_id: input.product_identity?.item_id || null,
      shop_id: input.product_identity?.shop_id || null,
      product_url: input.product_identity?.product_url || null,
      item_status: input.product_identity?.item_status || "PLANNED",
      seller_sku: input.product_identity?.seller_sku || null,
      parent_sku: input.product_identity?.parent_sku || null
    },
    shop_identity: {
      shop_id: input.shop_identity?.shop_id || null,
      shop_name: input.shop_identity?.shop_name || "Seller draft",
      seller_type: input.shop_identity?.seller_type || "local_seller",
      is_official_shop: input.shop_identity?.is_official_shop ?? null,
      is_preferred_seller: input.shop_identity?.is_preferred_seller ?? null,
      region: input.shop_identity?.region || "SG"
    },
    text_content: {
      name: input.text_content?.name || "",
      normalized_name: input.text_content?.normalized_name || normalizeTitle(input.text_content?.name),
      description: input.text_content?.description || "",
      short_description: input.text_content?.short_description || "",
      bullet_features: input.text_content?.bullet_features || [],
      keywords: input.text_content?.keywords || [],
      language: input.text_content?.language || "en",
      detected_languages: input.text_content?.detected_languages || ["en"]
    },
    visual_content: {
      image_urls: input.visual_content?.image_urls || [],
      main_image_url: input.visual_content?.main_image_url || input.visual_content?.image_urls?.[0] || null,
      image_count: input.visual_content?.image_count ?? input.visual_content?.image_urls?.length ?? 0,
      image_alt_text: input.visual_content?.image_alt_text || [],
      vision_tags: input.visual_content?.vision_tags || [],
      image_quality_score: input.visual_content?.image_quality_score ?? null,
      missing_visuals: input.visual_content?.missing_visuals || []
    },
    taxonomy: {
      category_id: input.taxonomy?.category_id || null,
      category_path: input.taxonomy?.category_path || [],
      category_depth: input.taxonomy?.category_depth ?? input.taxonomy?.category_path?.length ?? 0,
      product_type: input.taxonomy?.product_type || null,
      brand: input.taxonomy?.brand || null,
      condition: input.taxonomy?.condition || "new"
    },
    attributes: input.attributes || {},
    variants: input.variants || [],
    commerce: {
      listing_price: input.commerce?.listing_price ?? null,
      min_price: input.commerce?.min_price ?? input.commerce?.listing_price ?? null,
      max_price: input.commerce?.max_price ?? input.commerce?.listing_price ?? null,
      currency: input.commerce?.currency || "SGD",
      voucher_available: input.commerce?.voucher_available ?? null,
      cod_available: input.commerce?.cod_available ?? null,
      bnpl_available: input.commerce?.bnpl_available ?? null,
      promotion_tags: input.commerce?.promotion_tags || []
    },
    fees_and_margin: input.fees_and_margin || {},
    fulfillment: input.fulfillment || {},
    trust_and_reviews: input.trust_and_reviews || {},
    performance: input.performance || {},
    customer_interactions: input.customer_interactions || {},
    competitor_context: input.competitor_context || {},
    agent_processing: input.agent_processing || {},
    data_quality: {
      missing_fields: [],
      warnings: [],
      confidence: "medium",
      ...(input.data_quality || {})
    }
  };
}

function normalizeTitle(title = "") {
  return String(title).trim().replace(/\s+/g, " ");
}

module.exports = {
  createProductIntelligence
};
