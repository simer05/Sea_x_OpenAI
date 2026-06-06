"use strict";

const categoryMap = {
  phone_case: {
    categoryPath: ["Mobile & Gadgets", "Mobile Accessories", "Cases Covers & Skins"],
    productType: "phone_case",
    targetUseCase: "protective iphone 15 phone case with strap"
  },
  water_bottle: {
    categoryPath: ["Home & Living", "Kitchenware", "Water Bottles"],
    productType: "water_bottle",
    targetUseCase: "lightweight plastic water bottle for school gym and daily use"
  },
  tumbler: {
    categoryPath: ["Home & Living", "Kitchenware", "Water Bottles"],
    productType: "tumbler",
    targetUseCase: "large stainless steel tumbler with handle straw for office gym commute"
  },
  thermal_bottle: {
    categoryPath: ["Home & Living", "Kitchenware", "Water Bottles"],
    productType: "thermal_bottle",
    targetUseCase: "thermal leakproof stainless steel water bottle for office travel school"
  },
  tshirt: {
    categoryPath: ["Men Clothes", "Tops", "T-Shirts"],
    productType: "tshirt",
    targetUseCase: "plain cotton unisex tshirt for casual bulk daily wear"
  },
  graphic_tshirt: {
    categoryPath: ["Men Clothes", "Tops", "T-Shirts"],
    productType: "graphic_tshirt",
    targetUseCase: "sci fi cyberpunk graphic tshirt for fans casual wear"
  },
  custom_tshirt: {
    categoryPath: ["Men Clothes", "Tops", "T-Shirts"],
    productType: "custom_tshirt",
    targetUseCase: "custom personalized tshirt for events teams birthdays logos photos"
  }
};

const examples = {
  phone_case: {
    name: "Purple iPhone 15 Protective Phone Case with Free Holding String",
    price: 40,
    shippingCost: 1.5,
    packagingCost: 0.8,
    adCost: 2,
    launchStock: 50,
    targetArea: "Central Singapore",
    colors: "purple",
    features: "Purple color, Free holding string, iPhone 15 fit, Scratch protection, Lightweight daily use",
    description: "Purple protective phone case for iPhone 15 with a free holding string. Designed for daily grip, scratch protection, and easy carrying while keeping the phone lightweight and stylish.",
    keywords: "iphone 15 case, purple phone case, phone case with strap, iphone case singapore"
  },
  water_bottle: {
    name: "Simple BPA-Free Plastic Water Bottle 750ml for School and Gym",
    price: 8.9,
    shippingCost: 0.6,
    packagingCost: 0.35,
    adCost: 0.5,
    launchStock: 120,
    targetArea: "West Singapore",
    colors: "blue, pink, black",
    features: "BPA-free plastic, 750ml capacity, Lightweight daily bottle, School and gym use",
    description: "Lightweight BPA-free plastic water bottle for school, gym, office, and daily use. Easy to carry, simple to clean, and available in multiple colors for everyday hydration.",
    keywords: "plastic water bottle, bpa free bottle, school water bottle, gym bottle singapore"
  },
  tumbler: {
    name: "Stanley-Style Stainless Steel Tumbler 1200ml with Handle and Straw",
    price: 32.9,
    shippingCost: 1.8,
    packagingCost: 1.1,
    adCost: 2.4,
    launchStock: 60,
    targetArea: "Central Singapore",
    colors: "cream, pink, black",
    features: "1200ml capacity, Handle and straw included, Stainless steel body, Premium lifestyle design",
    description: "Large stainless steel tumbler inspired by viral handled cup designs. Comes with straw, handle, splash-resistant lid, and premium colors for office, gym, and commute use.",
    keywords: "stanley style tumbler, large tumbler with straw, stainless steel tumbler, handle water bottle"
  },
  thermal_bottle: {
    name: "Thermal Coated Stainless Steel Water Bottle 500ml Leakproof",
    price: 19.9,
    shippingCost: 1,
    packagingCost: 0.8,
    adCost: 1.2,
    launchStock: 80,
    targetArea: "East Singapore",
    colors: "silver, black, green",
    features: "Thermal coated bottle, Hot and cold drink support, Leakproof lid, Compact 500ml size",
    description: "Compact thermal coated stainless steel bottle for hot and cold drinks. Leakproof design for office, school, travel, and commute use in Singapore.",
    keywords: "thermal water bottle, stainless steel bottle, leakproof bottle, hot cold bottle"
  },
  tshirt: {
    name: "Plain Cotton Unisex T-Shirt Multiple Colors",
    price: 12.9,
    shippingCost: 0.8,
    packagingCost: 0.4,
    adCost: 0.8,
    launchStock: 100,
    targetArea: "North-East Singapore",
    colors: "white, black, navy, grey",
    features: "Plain cotton tee, Unisex fit, Multiple colors, Bulk order friendly",
    description: "Comfortable plain cotton unisex T-shirt for casual wear, layering, school events, and bulk orders. Available in multiple colors and sizes.",
    keywords: "plain tshirt, cotton t shirt, unisex tshirt, basic tee singapore"
  },
  graphic_tshirt: {
    name: "Sci-Fi Fiction Graphic T-Shirt Multiple Colors",
    price: 18.9,
    shippingCost: 0.8,
    packagingCost: 0.45,
    adCost: 1.3,
    launchStock: 70,
    targetArea: "Central Singapore",
    colors: "black, purple, white",
    features: "Sci-fi graphic print, Cyberpunk and space theme, Multiple colors, Fan fashion tee",
    description: "Graphic sci-fi fiction T-shirt with futuristic artwork for fans of space, cyberpunk, robots, and retro-futuristic fashion. Available in multiple colors and sizes.",
    keywords: "sci fi tshirt, graphic tee, cyberpunk tshirt, space t shirt"
  },
  custom_tshirt: {
    name: "Customizable T-Shirt with Name Logo or Photo Print",
    price: 24.9,
    shippingCost: 1,
    packagingCost: 0.7,
    adCost: 1.6,
    launchStock: 50,
    targetArea: "Central Singapore",
    colors: "white, black, red, blue",
    features: "Custom name logo or photo, Event and team wear, Multiple colors, Seller proof before print",
    description: "Customizable T-shirt for names, logos, photos, school events, birthdays, and team wear. Seller can upload artwork requirements before production.",
    keywords: "custom tshirt, personalized t shirt, logo print tshirt, custom shirt singapore"
  }
};

const form = document.querySelector("#productForm");
const photoInput = document.querySelector("#photo");
const productTypeInput = document.querySelector("#productType");
const categoryInput = document.querySelector("#category");
let uploadedImageDataUrl = "";
let uploadedImageName = "";

productTypeInput.addEventListener("change", () => {
  const type = inferProductKey(productTypeInput.value);
  categoryInput.value = categoryMap[type].categoryPath.join(" > ");
  updatePreview();
});

categoryInput.addEventListener("change", () => {
  const type = inferProductKey(`${categoryInput.value} ${productTypeInput.value}`);
  productTypeInput.value = productTypeLabel(type);
  updatePreview();
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;

  uploadedImageName = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    uploadedImageDataUrl = reader.result;
    document.querySelector("#photoPreview").innerHTML = `<img src="${uploadedImageDataUrl}" alt="Uploaded product preview">`;
  };
  reader.readAsDataURL(file);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runAnalysis();
});

setExample("phone_case");
runAnalysis();

function setExample(type) {
  const example = examples[type];
  if (!example) return;
  const config = categoryMap[type];
  productTypeInput.value = productTypeLabel(type);
  categoryInput.value = config.categoryPath.join(" > ");
  document.querySelector("#name").value = example.name;
  document.querySelector("#price").value = example.price;
  document.querySelector("#shippingCost").value = example.shippingCost;
  document.querySelector("#packagingCost").value = example.packagingCost;
  document.querySelector("#adCost").value = example.adCost;
  document.querySelector("#launchStock").value = example.launchStock;
  document.querySelector("#targetArea").value = example.targetArea;
  document.querySelector("#colors").value = example.colors;
  document.querySelector("#features").value = example.features;
  document.querySelector("#description").value = example.description;
  document.querySelector("#keywords").value = example.keywords;
  updatePreview();
}

async function runAnalysis() {
  updatePreview();
  setLoadingState();

  const productIdea = buildProductIdea();
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIdea })
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`);
  }

  const payload = await response.json();
  renderReport(payload);
}

function buildProductIdea() {
  const type = inferProductKey(`${productTypeInput.value} ${categoryInput.value} ${document.querySelector("#name").value}`);
  const config = categoryMap[type] || categoryMap.phone_case;
  const price = Number(document.querySelector("#price").value || 0);
  const region = document.querySelector("#region").value;
  const shippingCost = Number(document.querySelector("#shippingCost").value || 0);
  const packagingCost = Number(document.querySelector("#packagingCost").value || 0);
  const adCost = Number(document.querySelector("#adCost").value || 0);
  const launchStock = Number(document.querySelector("#launchStock").value || 0);
  const targetArea = document.querySelector("#targetArea").value || "Islandwide Singapore";
  const features = splitList(document.querySelector("#features").value);
  const keywords = splitList(document.querySelector("#keywords").value);
  const colors = splitList(document.querySelector("#colors").value);

  return {
    source: {
      region,
      data_mode: "mock",
      fetched_at: new Date().toISOString(),
      source_endpoints: ["seller_dashboard_input", "mock.shopee.search.item"],
      raw_snapshot_id: "dashboard_seller_input",
      is_live_data: false
    },
    product_identity: {
      seller_sku: makeSku(document.querySelector("#name").value),
      item_status: "PLANNED"
    },
    shop_identity: {
      shop_name: "Seller Draft SG",
      seller_type: "local_seller",
      region
    },
    text_content: {
      name: document.querySelector("#name").value.trim(),
      description: document.querySelector("#description").value.trim(),
      bullet_features: features,
      keywords,
      language: "en",
      detected_languages: ["en"]
    },
    visual_content: {
      image_urls: uploadedImageName ? [`local-upload://${uploadedImageName}`] : [],
      main_image_url: uploadedImageName ? `local-upload://${uploadedImageName}` : null,
      image_count: uploadedImageName ? 1 : 0,
      image_alt_text: uploadedImageName ? [document.querySelector("#name").value.trim()] : [],
      vision_tags: inferVisionTags(type, features, colors),
      image_quality_score: null,
      missing_visuals: uploadedImageName
        ? ["no secondary lifestyle photo", "no close-up proof photo"]
        : ["no product photo uploaded", "no lifestyle photo", "no close-up proof photo"]
    },
    taxonomy: {
      category_path: normalizeCategoryPath(categoryInput.value, config.categoryPath),
      category_depth: normalizeCategoryPath(categoryInput.value, config.categoryPath).length,
      product_type: config.productType,
      condition: "new"
    },
    attributes: {
      color: colors,
      material: inferMaterial(type),
      size: inferSize(type),
      includes: features.filter((feature) => feature.toLowerCase().includes("string") || feature.toLowerCase().includes("straw") || feature.toLowerCase().includes("handle")),
      custom_attributes: {
        target_region: region
      }
    },
    variants: [
      {
        model_sku: makeSku(document.querySelector("#name").value),
        variation_name: colors[0] || "Default",
        price,
        currency: "SGD",
        stock: launchStock || null,
        model_status: "PLANNED"
      }
    ],
    commerce: {
      listing_price: price,
      currency: "SGD",
      voucher_available: true,
      cod_available: type === "custom_tshirt" ? false : true,
      bnpl_available: true,
      promotion_tags: ["dashboard test", region]
    },
    fees_and_margin: {
      product_cost: 0,
      buying_cost_included: false,
      cost_basis: "operating_costs_only",
      fee_assumptions: feeAssumptionsFor(price, shippingCost, packagingCost, adCost)
    },
    fulfillment: {
      ships_from_region: region,
      target_region: region,
      target_area: targetArea,
      delivery_type: type === "custom_tshirt" ? "made_to_order" : "local_delivery",
      estimated_delivery_days: type === "custom_tshirt" ? 5 : 2
    },
    agent_processing: {
      target_use_case: config.targetUseCase,
      seller_question: "Should I launch this product?"
    },
    data_quality: {
      missing_fields: uploadedImageName ? [] : ["product_photo"],
      warnings: [
        "Live Shopee Open API credentials are unavailable; this dashboard uses Shopee-style mock SG marketplace data.",
        "Buying cost is intentionally excluded in this prototype; margin is operating room after platform, shipping, packaging, voucher, and ad assumptions.",
        uploadedImageName ? "Uploaded photo preview is local; no computer vision model is connected yet." : "No product photo uploaded yet."
      ],
      confidence: "low"
    }
  };
}

function renderReport(payload) {
  const report = payload.agent_response;
  const projection = buildProjection(report);
  const score = report.decision.overall_launch_score;
  const currency = report.margin_analysis.assumptions ? "SGD" : "";

  document.querySelector("#recommendation").textContent = report.decision.launch_recommendation;
  document.querySelector("#summary").textContent = report.decision.summary;
  document.querySelector("#scoreGauge").textContent = score;
  document.querySelector("#scoreGauge").style.background = `conic-gradient(${scoreColor(score)} ${score * 3.6}deg, #eee7dc 0deg)`;

  setScore("demandScore", report.scores.demand);
  setScore("competitionScore", report.scores.competition);
  setScore("marginScore", report.scores.margin);
  setScore("differentiationScore", report.scores.differentiation);
  setScore("readinessScore", report.scores.listingReadiness);
  renderComparisonInsights(report);
  renderRegionDashboard(report);

  document.querySelector("#regionBadge").textContent = `${payload.target_region} · ${payload.data_mode}`;
  document.querySelector("#confidenceBadge").textContent = `Confidence: ${report.decision.confidence}`;
  document.querySelector("#saturationBadge").textContent = `Saturation: ${report.market_research.competitor_saturation}`;

  document.querySelector("#sellingPrice").textContent = money(report.margin_analysis.sellingPrice, currency);
  document.querySelector("#netProfit").textContent = money(report.margin_analysis.netProfit, currency);
  document.querySelector("#netMargin").textContent = `${report.margin_analysis.netMarginPercent}%`;
  document.querySelector("#safeAds").textContent = money(report.margin_analysis.safeAdSpendCap, currency);

  renderReadiness(report.listing_readiness);
  renderCompetitors(report.market_research.top_competitors);
  renderList("#actionList", report.recommended_actions_before_launch);
  renderList("#riskList", [...report.risks, ...(report.data_quality.warnings || [])]);
  renderScoreChart(report.scores, projection.scores);
  renderMarketChart(report, projection);
  document.querySelector("#projectionBadge").textContent = `Potential score: ${projection.overall}/100`;
}

function renderReadiness(items) {
  const list = document.querySelector("#readinessList");
  list.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.className = item.status;
    li.textContent = `${item.status === "complete" ? "Complete" : "Missing"}: ${item.label}`;
    list.append(li);
  }
}

function renderCompetitors(matches) {
  const body = document.querySelector("#competitorRows");
  body.innerHTML = "";
  for (const match of matches) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(match.name)}</td>
      <td>${escapeHtml(match.tier)}</td>
      <td>${match.price ? money(match.price, match.currency) : "Unknown"}</td>
      <td>${match.review_count ?? "Unknown"}</td>
      <td>${escapeHtml(match.ships_from_region || "Unknown")}</td>
      <td>${match.score}/100</td>
    `;
    body.append(row);
  }
}

function renderComparisonInsights(report) {
  const competitors = report.market_research.top_competitors || [];
  const competitorPrices = competitors.map((item) => Number(item.price)).filter(Number.isFinite);
  const sellerPrice = report.margin_analysis.sellingPrice;
  const avgPrice = average(competitorPrices);
  const minPrice = competitorPrices.length ? Math.min(...competitorPrices) : null;
  const maxPrice = competitorPrices.length ? Math.max(...competitorPrices) : null;
  const reviewCounts = competitors.map((item) => Number(item.review_count)).filter(Number.isFinite);
  const avgReviews = Math.round(average(reviewCounts));
  const strongest = competitors[0];
  const priceGap = avgPrice ? ((sellerPrice - avgPrice) / avgPrice) * 100 : 0;
  const missingItems = report.listing_readiness.filter((item) => item.status === "missing");

  document.querySelector("#demandInsight").textContent = competitors.length
    ? `${competitors.length} matched competitors; average review base around ${avgReviews || "unknown"}.`
    : "No close competitors in the mock set, so demand confidence is low.";

  document.querySelector("#competitionInsight").textContent = strongest
    ? `Closest rival: ${strongest.name} (${strongest.tier}, ${strongest.score}/100 match).`
    : "No direct competitor found in this mock category.";

  document.querySelector("#marginInsight").textContent = avgPrice
    ? `${priceGap >= 0 ? "Priced above" : "Priced below"} competitor average by ${Math.abs(priceGap).toFixed(0)}%; operating room is ${report.margin_analysis.netMarginPercent}% before buying cost.`
    : `Operating room is ${report.margin_analysis.netMarginPercent}% before buying cost; add competitor prices for benchmark.`;

  document.querySelector("#differentiationInsight").textContent = report.differentiation_gaps?.length
    ? differentiationResponse(report)
    : "Current features look differentiated against matched competitors.";

  document.querySelector("#readinessInsight").textContent = missingItems.length
    ? `Fix ${missingItems.length} item(s): ${missingItems.map((item) => item.id.replace("_", " ")).join(", ")}.`
    : "Listing basics are complete for pre-launch testing.";

  document.querySelector("#yourPriceComparison").textContent = money(sellerPrice, "SGD");
  document.querySelector("#priceComparisonText").textContent = avgPrice
    ? `${priceGap >= 0 ? "Premium" : "Value"} position vs mock Shopee SG competitors.`
    : "No competitor price benchmark available.";

  document.querySelector("#competitorPriceComparison").textContent = avgPrice
    ? `${money(avgPrice, "SGD")} avg`
    : "--";
  document.querySelector("#competitorComparisonText").textContent = minPrice !== null
    ? `Range: ${money(minPrice, "SGD")} to ${money(maxPrice, "SGD")}.`
    : "No price range available.";

  document.querySelector("#reviewPressure").textContent = avgReviews ? `${avgReviews} avg` : "--";
  document.querySelector("#reviewPressureText").textContent = avgReviews > 1000
    ? "Established competitors have heavy review moats."
    : avgReviews > 300
      ? "Competitors have proof, but entry is still realistic."
      : "Review pressure looks manageable in this mock set.";

  const bestAngle = bestLaunchAngle(report, priceGap);
  document.querySelector("#bestAngle").textContent = bestAngle.title;
  document.querySelector("#bestAngleText").textContent = bestAngle.detail;

  const stock = report.initial_stock_recommendation;
  document.querySelector("#stockRecommendation").textContent = stock
    ? `${stock.suggested_units} units`
    : "--";
  document.querySelector("#stockRecommendationText").textContent = stock
    ? `Suggested range: ${stock.min_units}-${stock.max_units}. ${stock.guidance}`
    : "No stock recommendation available.";
}

function renderList(selector, items) {
  const list = document.querySelector(selector);
  list.innerHTML = "";
  for (const item of items.length ? items : ["No issues found."]) {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  }
}

function updatePreview() {
  const name = document.querySelector("#name").value || "Product draft";
  const price = Number(document.querySelector("#price").value || 0);
  const region = document.querySelector("#region").value;
  const targetArea = document.querySelector("#targetArea").value || "Islandwide Singapore";
  const categoryLabel = categoryInput.value.split(">").pop()?.trim() || "Custom category";

  document.querySelector("#previewTitle").textContent = name;
  document.querySelector("#previewMeta").textContent = `SGD ${price.toFixed(2)} · ${region} · ${targetArea} · ${categoryLabel}`;
}

function setLoadingState() {
  document.querySelector("#recommendation").textContent = "Analyzing";
  document.querySelector("#summary").textContent = "Running competitor matching, margin checks, and launch scoring.";
}

function setScore(id, value) {
  const node = document.querySelector(`#${id}`);
  node.textContent = value;
  node.style.color = scoreColor(value);
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeSku(value) {
  return String(value || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}

function inferVisionTags(type, features, colors) {
  const base = [...features, ...colors].map((item) => item.toLowerCase());
  if (type === "phone_case") return [...base, "phone accessory", "iphone case"];
  if (type.includes("bottle") || type === "tumbler") return [...base, "water bottle", "drinkware"];
  return [...base, "apparel", "tshirt"];
}

function inferProductKey(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("custom") && (text.includes("shirt") || text.includes("tee"))) return "custom_tshirt";
  if ((text.includes("sci") || text.includes("cyber") || text.includes("graphic")) && (text.includes("shirt") || text.includes("tee"))) return "graphic_tshirt";
  if (text.includes("shirt") || text.includes("tee") || text.includes("apparel")) return "tshirt";
  if (text.includes("stanley") || text.includes("tumbler") || text.includes("handle cup")) return "tumbler";
  if (text.includes("thermal") || text.includes("vacuum") || text.includes("insulated")) return "thermal_bottle";
  if (text.includes("bottle") || text.includes("drinkware") || text.includes("hydration")) return "water_bottle";
  if (text.includes("case") || text.includes("cover") || text.includes("iphone") || text.includes("phone")) return "phone_case";
  return "phone_case";
}

function productTypeLabel(type) {
  return {
    phone_case: "phone case",
    water_bottle: "simple plastic bottle",
    tumbler: "Stanley-style tumbler",
    thermal_bottle: "thermal coated bottle",
    tshirt: "plain T-shirt",
    graphic_tshirt: "sci-fi graphic T-shirt",
    custom_tshirt: "customizable T-shirt"
  }[type] || type;
}

function normalizeCategoryPath(value, fallback) {
  const parts = String(value || "")
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts : fallback;
}

function inferMaterial(type) {
  if (type === "water_bottle") return "plastic";
  if (type === "tumbler" || type === "thermal_bottle") return "stainless steel";
  if (type.includes("tshirt")) return "cotton blend";
  return null;
}

function buildProjection(report) {
  const scores = { ...report.scores };
  const hasMissingPhotos = report.listing_readiness.some((item) => item.id === "photos" && item.status === "missing");
  const hasMissingTrust = report.listing_readiness.some((item) => item.id === "trust_proof" && item.status === "missing");
  const currentScore = report.decision.overall_launch_score;

  if (hasMissingPhotos) {
    scores.listingReadiness = Math.min(100, scores.listingReadiness + 14);
    scores.differentiation = Math.min(100, scores.differentiation + 5);
  }
  if (hasMissingTrust) {
    scores.listingReadiness = Math.min(100, scores.listingReadiness + 10);
    scores.differentiation = Math.min(100, scores.differentiation + 8);
  }
  if (report.market_research.competitor_saturation !== "low") {
    scores.competition = Math.min(100, scores.competition + 6);
  }
  if (report.margin_analysis.safeAdSpendCap > 0) {
    scores.margin = Math.min(100, scores.margin + 3);
  }

  const overall = Math.min(100, Math.round(
    scores.demand * 0.22 +
    scores.competition * 0.18 +
    scores.margin * 0.24 +
    scores.differentiation * 0.2 +
    scores.listingReadiness * 0.16
  ));

  return {
    scores,
    overall: Math.max(currentScore, overall),
    lift: Math.max(0, overall - currentScore),
    marketPosition: {
      currentOpportunity: Math.round((report.scores.demand + report.scores.margin + report.scores.differentiation - (100 - report.scores.competition)) / 3),
      potentialOpportunity: Math.round((scores.demand + scores.margin + scores.differentiation - (100 - scores.competition)) / 3)
    }
  };
}

function renderScoreChart(current, projected) {
  const canvas = document.querySelector("#scoreChart");
  const ctx = canvas.getContext("2d");
  const labels = ["Demand", "Competition", "Margin", "Differentiation", "Readiness"];
  const currentValues = [current.demand, current.competition, current.margin, current.differentiation, current.listingReadiness];
  const projectedValues = [projected.demand, projected.competition, projected.margin, projected.differentiation, projected.listingReadiness];
  drawGroupedBars(ctx, canvas, labels, currentValues, projectedValues, "Current", "After fixes");
}

function renderMarketChart(report, projection) {
  const canvas = document.querySelector("#marketChart");
  const ctx = canvas.getContext("2d");
  const labels = ["Current opportunity", "Potential opportunity", "Market demand", "Competition fit"];
  const currentValues = [
    projection.marketPosition.currentOpportunity,
    0,
    report.scores.demand,
    report.scores.competition
  ];
  const projectedValues = [
    0,
    projection.marketPosition.potentialOpportunity,
    projection.scores.demand,
    projection.scores.competition
  ];
  drawGroupedBars(ctx, canvas, labels, currentValues, projectedValues, "Current", "Potential");
}

function drawGroupedBars(ctx, canvas, labels, currentValues, projectedValues, currentLabel, projectedLabel) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f8f4ee";
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 56, right: 24, bottom: 86, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = chartWidth / labels.length;
  const barWidth = Math.min(28, groupWidth / 4);

  ctx.strokeStyle = "#ddd5ca";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#6d7178";
  ctx.font = "12px Inter, sans-serif";
  for (let tick = 0; tick <= 100; tick += 25) {
    const y = padding.top + chartHeight - (tick / 100) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(String(tick), 8, y + 4);
  }

  labels.forEach((label, index) => {
    const x = padding.left + index * groupWidth + groupWidth / 2;
    const currentHeight = (Math.max(0, currentValues[index]) / 100) * chartHeight;
    const projectedHeight = (Math.max(0, projectedValues[index]) / 100) * chartHeight;
    const yBase = padding.top + chartHeight;

    ctx.fillStyle = "#2367c7";
    ctx.fillRect(x - barWidth - 3, yBase - currentHeight, barWidth, currentHeight);
    ctx.fillStyle = "#17885b";
    ctx.fillRect(x + 3, yBase - projectedHeight, barWidth, projectedHeight);

    ctx.fillStyle = "#4c5157";
    ctx.textAlign = "center";
    ctx.font = "12px Inter, sans-serif";
    drawWrappedLabel(ctx, label, x, yBase + 20, Math.max(64, groupWidth - 10), 15);
  });

  drawLegend(ctx, canvas, currentLabel, projectedLabel);
}

function drawLegend(ctx, canvas, currentLabel, projectedLabel) {
  ctx.font = "12px Inter, sans-serif";
  ctx.textAlign = "left";
  const items = [
    { label: currentLabel, color: "#2367c7" },
    { label: projectedLabel, color: "#17885b" }
  ];
  const itemWidths = items.map((item) => 18 + ctx.measureText(item.label).width);
  const totalWidth = itemWidths.reduce((sum, width) => sum + width, 0) + 28;
  let x = Math.max(44, (canvas.width - totalWidth) / 2);
  const y = 18;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, 11, 11);
    ctx.fillStyle = "#4c5157";
    ctx.fillText(item.label, x + 17, y + 10);
    x += itemWidths[index] + 28;
  }
}

function drawWrappedLabel(ctx, label, x, y, maxWidth, lineHeight) {
  const words = String(label).split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  lines.slice(0, 3).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function inferSize(type) {
  if (type === "water_bottle") return "750ml";
  if (type === "tumbler") return "1200ml";
  if (type === "thermal_bottle") return "500ml";
  if (type.includes("tshirt")) return ["S", "M", "L", "XL"];
  return "iPhone 15";
}

function feeAssumptionsFor(price, shippingCost, packagingCost, adCost) {
  return {
    shopeeFeeRate: 0.08,
    transactionFeeRate: 0.022,
    shippingSubsidy: shippingCost,
    voucherCost: price >= 25 ? 1 : 0.5,
    packagingCost,
    adCostPerOrder: adCost
  };
}

function renderRegionDashboard(report) {
  const type = inferProductKey(`${productTypeInput.value} ${categoryInput.value} ${document.querySelector("#name").value}`);
  const selectedArea = document.querySelector("#targetArea").value || "Islandwide Singapore";
  const regions = scoreSingaporeAreas(type, report, selectedArea);
  const best = regions[0];

  document.querySelector("#areaBadge").textContent = `Best fit: ${best.name}`;
  document.querySelector("#bestRegionTitle").textContent = `Best area: ${best.name}`;
  document.querySelector("#bestRegionReason").textContent = best.reason;

  const map = document.querySelector("#regionMap");
  map.innerHTML = "";
  const layout = ["North Singapore", "Central Singapore", "North-East Singapore", "West Singapore", "Islandwide Singapore", "East Singapore"];
  for (const name of layout) {
    const region = regions.find((item) => item.name === name);
    const tile = document.createElement("div");
    tile.className = `region-tile${region.name === best.name ? " best" : ""}`;
    tile.innerHTML = `
      <strong>${escapeHtml(region.name.replace(" Singapore", ""))}</strong>
      <span>${region.score}/100</span>
      <div class="region-score-bar"><i style="width:${region.score}%"></i></div>
    `;
    map.append(tile);
  }

  const reasons = document.querySelector("#regionReasonList");
  reasons.innerHTML = "";
  for (const note of best.notes) {
    const li = document.createElement("li");
    li.className = "complete";
    li.textContent = note;
    reasons.append(li);
  }
}

function scoreSingaporeAreas(type, report, selectedArea) {
  const price = report.margin_analysis.sellingPrice;
  const base = [
    { name: "Central Singapore", score: 72, reason: "Strongest for premium, office, lifestyle, and fast-delivery positioning.", notes: ["Good for premium products and office buyers.", "Use local delivery and quality proof in the listing."] },
    { name: "East Singapore", score: 68, reason: "Good fit for commuters, families, travel, and daily-use products.", notes: ["Useful for travel, commute, and family-oriented products.", "Highlight practical use and delivery speed."] },
    { name: "West Singapore", score: 66, reason: "Good fit for students, value buys, school items, and everyday basics.", notes: ["Useful for school, campus, and value-led products.", "Bundles and multi-color variants can work well."] },
    { name: "North-East Singapore", score: 64, reason: "Good fit for younger household, casual apparel, and daily lifestyle products.", notes: ["Good for casual wear and household repeat-use products.", "Show colors, sizing, and everyday use cases clearly."] },
    { name: "North Singapore", score: 60, reason: "Better for value-led listings and practical daily essentials.", notes: ["Works for affordable essentials and practical accessories.", "Keep price and delivery promise easy to understand."] },
    { name: "Islandwide Singapore", score: 70, reason: "Best when the seller does not want to narrow targeting too early.", notes: ["Safer for early test launch.", "Use all-SG delivery promise and compare conversion by area later."] }
  ];

  for (const region of base) {
    if (region.name === selectedArea) region.score += 4;
    if (type === "phone_case" && ["Central Singapore", "North-East Singapore", "Islandwide Singapore"].includes(region.name)) region.score += 8;
    if ((type === "tumbler" || type === "thermal_bottle") && ["Central Singapore", "East Singapore", "Islandwide Singapore"].includes(region.name)) region.score += 8;
    if (type === "water_bottle" && ["West Singapore", "North Singapore", "Islandwide Singapore"].includes(region.name)) region.score += 8;
    if (type === "tshirt" && ["North-East Singapore", "West Singapore", "Islandwide Singapore"].includes(region.name)) region.score += 8;
    if ((type === "graphic_tshirt" || type === "custom_tshirt") && ["Central Singapore", "North-East Singapore", "Islandwide Singapore"].includes(region.name)) region.score += 8;
    if (price >= 30 && region.name === "Central Singapore") region.score += 6;
    if (price <= 15 && ["West Singapore", "North Singapore"].includes(region.name)) region.score += 5;
    if (report.scores.listingReadiness < 80 && region.name !== "Islandwide Singapore") region.score -= 4;
    region.score = Math.max(0, Math.min(100, region.score));
  }

  return base.sort((a, b) => b.score - a.score);
}

function bestLaunchAngle(report, priceGap) {
  if (report.scores.margin >= 78 && priceGap > 20) {
    return {
      title: "Premium proof",
      detail: "Justify the higher price with better photos, warranty, local delivery, or bundle value."
    };
  }
  if (report.scores.competition < 65) {
    return {
      title: "Differentiate",
      detail: "Avoid price war; lead with a feature competitors struggle with."
    };
  }
  if (report.scores.listingReadiness < 80) {
    return {
      title: "Fix listing",
      detail: "Better images and trust proof can lift projected launch score."
    };
  }
  return {
    title: "Test launch",
    detail: "Start with limited stock and keep ads within the safe spend cap."
  };
}

function differentiationResponse(report) {
  const gaps = report.differentiation_gaps.join(" ").toLowerCase();
  if (gaps.includes("strap") || gaps.includes("string") || gaps.includes("hook")) {
    return "Lead with strap durability: show attachment close-ups, pull strength, and replacement/defect promise.";
  }
  if (gaps.includes("delivery") || gaps.includes("late")) {
    return "Use local fulfilment as the edge: promise clear SG delivery timing and event-date reliability.";
  }
  if (gaps.includes("thin") || gaps.includes("quality") || gaps.includes("fabric")) {
    return "Differentiate on material proof: show thickness, texture, and durability instead of only design.";
  }
  if (gaps.includes("expensive")) {
    return "If priced premium, prove why: bundle value, warranty, better photos, or a clearer use case.";
  }
  return "Turn competitor complaints into proof points in your photos, title, and description.";
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function scoreColor(score) {
  if (score >= 78) return "#17885b";
  if (score >= 62) return "#b7791f";
  return "#b42318";
}

function money(value, currency = "SGD") {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
