const products = [
  {
    product: {
      productId: "P-SG-001",
      title: "Halal Vitamin C Serum",
      category: "Beauty > Skincare",
      price: 19.9,
      stock: 420,
      views: 18400,
      clicks: 920,
      orders: 62,
      revenue: 1233.8,
      adSpend: 155.5,
      rating: 4.55,
      reviews: 126,
      refundRate: 0.035,
      cancellationRate: 0.018,
      netMarginPercent: 0.21,
      conversionRate: 0.0674,
      ctr: 0.05
    },
    context: {
      segment: "Beauty and skincare",
      trustSignals: [
        ["Halal certification", "Repeated buyer questions ask whether this serum is halal certified.", "Show the halal badge only if certification is verified."],
        ["Sensitive-skin suitability", "Ingredient questions appear often in chat and reviews.", "Add ingredient image, patch-test guidance, and sensitive-skin FAQ."],
        ["Delivery expectation", "Delivery is the main negative review theme.", "Clarify ship-out timing and avoid overpromising."]
      ],
      nonApplicableSignals: [
        "Halal is shown because this skincare product has buyer trust questions about it. It should not appear as a universal filter for all products."
      ]
    },
    communication: {
      totalChats: 64,
      averageResponseMinutes: 118,
      responseWithinOneHourPercent: 0.52,
      unansweredRate: 0.09,
      buyerSatisfactionScore: 3.7
    },
    competitors: [
      ["Vitamin C Brightening Serum 30ml", 17.8, 4.82, 1240, 10, "Lower price and stronger review count", "Complaints about sticky texture"],
      ["Halal Glow Serum Sensitive Skin", 21.5, 4.76, 860, 8, "Clear halal trust signal", "Higher price"],
      ["Brightening Face Serum Bundle", 18.9, 4.68, 540, 12, "Bundle value", "Mixed reviews on packaging"]
    ],
    reviewsData: [
      [5, "Nice glow and feels light on skin.", "positive", "product quality"],
      [3, "Works okay but delivery took longer than expected.", "mixed", "delivery"],
      [3, "I wanted clearer ingredient details for sensitive skin.", "negative", "ingredient"]
    ],
    questions: [
      ["Is this halal certified?", "trust", 18],
      ["Can sensitive skin use this?", "ingredient", 14],
      ["When can ship?", "delivery", 9]
    ],
    warnings: [
      "Competitor sales are estimated for demo mode.",
      "Shopee Ads data is mocked until API credentials are connected.",
      "Buyer questions are sample themes, not live chat exports."
    ]
  },
  {
    product: {
      productId: "P-SG-002",
      title: "Wireless Bluetooth Earbuds Pro",
      category: "Electronics > Audio",
      price: 29.9,
      stock: 280,
      views: 32000,
      clicks: 1150,
      orders: 48,
      revenue: 1435.2,
      adSpend: 280,
      rating: 4.32,
      reviews: 74,
      refundRate: 0.052,
      cancellationRate: 0.011,
      netMarginPercent: 0.18,
      conversionRate: 0.0417,
      ctr: 0.0359
    },
    context: {
      segment: "Electronics accessories",
      trustSignals: [
        ["Warranty clarity", "Buyers ask about warranty and authenticity before checkout.", "Add warranty duration, return window, and support terms near the top of the listing."],
        ["Compatibility proof", "Compatibility questions are the highest-frequency buyer friction.", "Add compatible phone models, Bluetooth version, and pairing instructions."],
        ["Battery claim evidence", "Negative reviews mention battery drain.", "Show tested battery range and charging-case capacity without exaggeration."]
      ],
      nonApplicableSignals: [
        "Halal certification is not relevant for this electronics product and should not be shown as a filter."
      ]
    },
    communication: {
      totalChats: 89,
      averageResponseMinutes: 46,
      responseWithinOneHourPercent: 0.76,
      unansweredRate: 0.04,
      buyerSatisfactionScore: 4.1
    },
    competitors: [
      ["TWS Earbuds Noise Cancelling", 24.9, 4.75, 1820, 12, "Cheaper with strong review base", "Battery life complaints"],
      ["Bluetooth 5.3 Gaming Earbuds", 31.5, 4.61, 920, 8, "Clear low-latency positioning", "Higher return concerns"],
      ["Wireless Earbuds With Charging Case", 27.9, 4.5, 610, 15, "Aggressive voucher", "Weak warranty detail"]
    ],
    reviewsData: [
      [4, "Sound is good for the price but battery is shorter than expected.", "mixed", "battery"],
      [3, "Had to ask seller whether it works with iPhone.", "negative", "compatibility"],
      [5, "Fast delivery and easy pairing.", "positive", "setup"]
    ],
    questions: [
      ["Can use with iPhone and Samsung?", "compatibility", 22],
      ["How many hours can the battery last?", "battery", 17],
      ["Is there warranty?", "warranty", 11],
      ["Can ship today?", "delivery", 7]
    ],
    warnings: [
      "Competitor sales are estimated for demo mode.",
      "Compatibility questions are sample chat themes until Shopee chat access is connected.",
      "Ad spend is mocked until Shopee marketing data is connected."
    ]
  }
];

const scoreLabels = [
  ["conversion", "Conversion"],
  ["margin", "Margin"],
  ["reviewRating", "Reviews"],
  ["competitorPosition", "Competition"],
  ["traffic", "Traffic"],
  ["customerInteraction", "Buyer clarity"],
  ["fulfillment", "Fulfilment"]
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scoreRatio(value, weak, strong) {
  return clamp(((value - weak) / (strong - weak)) * 100, 0, 100);
}

function scoreInverseGap(value, benchmark, maxGapPercent) {
  if (benchmark <= 0) return 50;
  return clamp(100 - (Math.abs(value - benchmark) / benchmark / maxGapPercent) * 100, 0, 100);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function analyze(input) {
  const product = input.product;
  const avgPrice = average(input.competitors.map((item) => item[1]));
  const avgRating = average(input.competitors.map((item) => item[2]));
  const avgReviews = average(input.competitors.map((item) => item[3]));
  const conversion = scoreRatio(product.conversionRate, 0.025, 0.085);
  const margin = scoreRatio(product.netMarginPercent, 0.12, 0.42);
  const reviewRating = scoreRatio(product.rating, 3.8, 4.9);
  const traffic = scoreRatio(product.views, 2500, 30000);
  const fulfillment = 100 - clamp(product.cancellationRate * 800 + product.refundRate * 700, 0, 100);
  const competitorPosition = Math.round(
    scoreInverseGap(product.price, avgPrice, 0.35) * 0.35 +
      scoreRatio(product.reviews, avgReviews * 0.25, avgReviews) * 0.3 +
      scoreRatio(product.rating, avgRating - 0.4, avgRating + 0.1) * 0.35
  );
  const totalQuestionFrequency = input.questions.reduce((sum, question) => sum + question[2], 0);
  const frictionThemes = new Set(["trust", "size", "delivery", "ingredient", "price", "compatibility", "battery", "warranty"]);
  const frictionFrequency = input.questions
    .filter((question) => frictionThemes.has(question[1]))
    .reduce((sum, question) => sum + question[2], 0);
  const buyerFriction = Math.round(100 - clamp((frictionFrequency / totalQuestionFrequency) * 65, 0, 85));
  const responseSpeed = scoreRatio(input.communication.averageResponseMinutes, 180, 15);
  const oneHourRate = scoreRatio(input.communication.responseWithinOneHourPercent, 0.35, 0.9);
  const unanswered = scoreRatio(1 - input.communication.unansweredRate, 0.8, 1);
  const satisfaction = scoreRatio(input.communication.buyerSatisfactionScore, 3.2, 4.8);
  const customerInteraction = Math.round(
    buyerFriction * 0.45 + responseSpeed * 0.2 + oneHourRate * 0.15 + unanswered * 0.1 + satisfaction * 0.1
  );
  const health = {
    conversion: Math.round(conversion),
    margin: Math.round(margin),
    reviewRating: Math.round(reviewRating),
    competitorPosition,
    traffic: Math.round(traffic),
    customerInteraction,
    fulfillment: Math.round(fulfillment)
  };
  health.overall = Math.round(
    health.conversion * 0.2 +
      health.margin * 0.2 +
      health.reviewRating * 0.15 +
      health.competitorPosition * 0.15 +
      health.traffic * 0.1 +
      health.customerInteraction * 0.1 +
      health.fulfillment * 0.1
  );

  const actions = buildActions(input, health, avgPrice);
  const weakAreas = [
    health.conversion < 60 ? "conversion" : null,
    health.margin < 60 ? "margin" : null,
    health.competitorPosition < 60 ? "competitor position" : null,
    health.customerInteraction < 60 ? "buyer confusion" : null,
    health.fulfillment < 70 ? "fulfillment" : null
  ].filter(Boolean);

  return {
    health,
    actions,
    diagnosis:
      weakAreas.length > 0
        ? `${product.title} needs action on ${weakAreas.join(", ")}. Focus on changes that raise conversion while protecting net margin.`
        : `${product.title} is healthy. Keep monitoring competitor moves and protect margin while testing listing improvements.`
  };
}

function buildActions(input, health, avgPrice) {
  const product = input.product;
  const topQuestion = input.questions.reduce((best, question) => (question[2] > best[2] ? question : best), input.questions[0]);
  const topReview = input.reviewsData.filter((review) => review[2] !== "positive")[0];
  const actions = [];

  if (health.conversion < 60) {
    actions.push(["High", "Conversion", "Refresh the main image/title around the strongest unanswered buyer question.", "Improve click-to-order conversion without cutting price."]);
  }
  if (product.netMarginPercent < 0.25) {
    actions.push([
      "High",
      "Pricing",
      product.price > avgPrice * 1.08
        ? "Avoid lowering base price. Test a limited new-buyer voucher or bundle discount instead."
        : "Do not stack broad vouchers. Use bundles, minimum-spend vouchers, or ad spend caps to protect contribution margin.",
      "Protect net margin while still giving buyers a reason to convert."
    ]);
  }
  if (topQuestion) {
    actions.push(["High", "Buyer Questions", `Add a visible FAQ and image callout for repeated ${topQuestion[1]} questions.`, "Remove objections before checkout and reduce chat load."]);
  }
  if (input.communication.responseWithinOneHourPercent < 0.7) {
    actions.push([
      "High",
      "Seller Response",
      "Set quick-reply templates for the top buyer questions and target replies within one hour.",
      "Slow replies can turn product-page interest into abandoned purchases."
    ]);
  }
  if (topReview) {
    actions.push(["Medium", "Reviews", `Address the recurring ${topReview[3]} issue in listing copy or operations.`, "Improve future ratings and reduce refund risk."]);
  }
  if (health.fulfillment < 70) {
    actions.push(["Medium", "Fulfillment", "Check cancellation, stock, and delivery timing. Add a realistic delivery promise.", "Avoid rating damage and lost orders."]);
  }
  return actions.slice(0, 5);
}

function render(productIndex) {
  const input = products[productIndex];
  const product = input.product;
  const report = analyze(input);
  const avgPrice = average(input.competitors.map((item) => item[1]));
  const avgRating = average(input.competitors.map((item) => item[2]));
  const avgReviews = Math.round(average(input.competitors.map((item) => item[3])));
  const roas = product.adSpend > 0 ? product.revenue / product.adSpend : 0;

  text("product-title", product.title);
  text("product-subhead", `${input.context.segment} | ${product.category} | ${product.productId}`);
  text("health-score", report.health.overall);
  text("health-label", healthLabel(report.health.overall));
  text("diagnosis-text", report.diagnosis);
  text("top-action-area", report.actions[0]?.[1] || "Monitor");
  text("top-action-impact", report.actions[0]?.[3] || "Keep watching product health.");
  text("metric-revenue", currency(product.revenue));
  text("metric-orders", `${product.orders} orders`);
  text("metric-ctr", percent(product.ctr));
  text("metric-clicks", `${product.clicks.toLocaleString()} clicks from views`);
  text("metric-conversion", percent(product.conversionRate));
  text("metric-margin", percent(product.netMarginPercent));
  text("metric-roas", `ROAS ${roas.toFixed(1)}x`);
  text("metric-rating", product.rating.toFixed(2));
  text("metric-reviews", `${product.reviews} reviews`);
  text("metric-stock", product.stock.toLocaleString());
  text("score-breakdown-total", `${report.health.overall}/100`);
  text("funnel-category", product.category);
  text("trust-segment", input.context.segment);
  text("non-applicable-note", input.context.nonApplicableSignals.join(" "));
  text("competitor-summary", `Avg ${currency(avgPrice)} | ${avgRating.toFixed(2)} rating | ${avgReviews.toLocaleString()} reviews`);
  text("question-count", `${input.questions.reduce((sum, question) => sum + question[2], 0)} signals`);
  text("review-count", `${input.reviewsData.length} samples`);
  text("action-count", `${report.actions.length} priorities`);
  text("communication-summary", `${input.communication.totalChats} chats`);
  text("comm-response", `${input.communication.averageResponseMinutes}m`);
  text("comm-one-hour", percent(input.communication.responseWithinOneHourPercent));
  text("comm-unanswered", percent(input.communication.unansweredRate));
  text("comm-csat", `${input.communication.buyerSatisfactionScore.toFixed(1)}/5`);

  html("score-list", scoreLabels.map(([key, label]) => scoreRow(label, report.health[key])).join(""));
  html("health-chart", scoreLabels.map(([key, label]) => chartBar(label, report.health[key])).join(""));
  html("funnel-list", [
    funnelStep("Visibility", product.views.toLocaleString(), "listing impressions/views"),
    funnelStep("Clicks", product.clicks.toLocaleString(), percent(product.ctr)),
    funnelStep("Orders", product.orders.toLocaleString(), percent(product.conversionRate))
  ].join(""));
  html("trust-list", input.context.trustSignals.map((signal) => trustCard(signal)).join(""));
  html("competitor-table", input.competitors.map(competitorRow).join(""));
  html("buyer-questions", input.questions.map(questionRow).join(""));
  html("review-list", input.reviewsData.map(reviewRow).join(""));
  html("action-grid", report.actions.map(actionCard).join(""));
  html("warning-list", input.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join(""));

  document.querySelectorAll(".product-tab").forEach((button, index) => {
    button.classList.toggle("active", index === productIndex);
  });
}

function init() {
  const select = document.getElementById("product-select");
  select.innerHTML = products.map((item, index) => `<option value="${index}">${escapeHtml(item.product.title)}</option>`).join("");
  select.addEventListener("change", () => render(Number(select.value)));
  html(
    "product-tabs",
    products
      .map(
        (item, index) =>
          `<button class="product-tab" type="button" data-index="${index}"><strong>${escapeHtml(item.product.title)}</strong><span>${escapeHtml(item.product.category)}</span></button>`
      )
      .join("")
  );
  document.querySelectorAll(".product-tab").forEach((button) => {
    button.addEventListener("click", () => {
      select.value = button.dataset.index;
      render(Number(button.dataset.index));
    });
  });
  render(0);
}

function text(id, value) {
  document.getElementById(id).textContent = String(value);
}

function html(id, value) {
  document.getElementById(id).innerHTML = value;
}

function scoreRow(label, value) {
  const state = value < 50 ? "weak" : value < 70 ? "watch" : "strong";
  return `<div class="score-row"><div class="score-label"><span>${label}</span><strong>${value}</strong></div><div class="bar-track"><div class="bar-fill ${state}" style="width:${value}%"></div></div></div>`;
}

function chartBar(label, value) {
  const state = value < 50 ? "weak" : value < 70 ? "watch" : "strong";
  return `<div class="chart-row"><span>${label}</span><div><i class="${state}" style="height:${Math.max(value, 8)}%"></i></div><strong>${value}</strong></div>`;
}

function funnelStep(label, value, detail) {
  return `<div class="funnel-step"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`;
}

function trustCard(signal) {
  return `<article class="trust-card"><strong>${escapeHtml(signal[0])}</strong><p>${escapeHtml(signal[1])}</p><small>${escapeHtml(signal[2])}</small></article>`;
}

function competitorRow(competitor) {
  return `<tr><td><strong>${escapeHtml(competitor[0])}</strong><span>${escapeHtml(competitor[5])}</span></td><td>${currency(competitor[1])}</td><td>${competitor[2].toFixed(2)}</td><td>${competitor[3].toLocaleString()}</td><td>${competitor[4]}%</td><td>${escapeHtml(competitor[6])}</td></tr>`;
}

function questionRow(question) {
  return `<div class="signal-row"><div><strong>${escapeHtml(question[1])}</strong><span>${escapeHtml(question[0])}</span></div><b>${question[2]}</b></div>`;
}

function reviewRow(review) {
  return `<article class="review-row ${review[2]}"><div><strong>${escapeHtml(review[3])}</strong><span>${escapeHtml(review[1])}</span></div><b>${review[0]}/5</b></article>`;
}

function actionCard(action, index) {
  return `<article class="action-card"><div class="action-index">${index + 1}</div><div><div class="action-title"><span class="priority ${action[0].toLowerCase()}">${action[0]}</span><strong>${escapeHtml(action[1])}</strong></div><p>${escapeHtml(action[2])}</p><small>${escapeHtml(action[3])}</small></div></article>`;
}

function currency(value) {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2 }).format(value);
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function healthLabel(value) {
  if (value >= 80) return "Strong";
  if (value >= 65) return "Good";
  if (value >= 50) return "Needs action";
  return "High risk";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

init();
