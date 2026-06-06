const products = [
  {
    imageKind: "bottle",
    product: {
      productId: "P-SG-101",
      title: "Insulated Stainless Steel Water Bottle",
      category: "Home & Living > Drinkware",
      price: 18.9,
      stock: 360,
      views: 24600,
      clicks: 1320,
      orders: 96,
      revenue: 1814.4,
      adSpend: 210.5,
      rating: 4.62,
      reviews: 188,
      refundRate: 0.024,
      cancellationRate: 0.012,
      netMarginPercent: 0.26,
      conversionRate: 0.0727,
      ctr: 0.0537
    },
    communication: {
      totalChats: 72,
      averageResponseMinutes: 82,
      responseWithinOneHourPercent: 0.61,
      unansweredRate: 0.06,
      buyerSatisfactionScore: 4.0
    },
    competitors: [
      { title: "Thermal Flask 750ml Leakproof", price: 16.9, rating: 4.72, reviews: 920, shippingDays: 2, voucherPercent: 10, strength: "Lower price and strong review count", weakness: "Dents mentioned in reviews" },
      { title: "Premium Stainless Water Bottle", price: 21.8, rating: 4.68, reviews: 610, shippingDays: 1, voucherPercent: 8, strength: "Premium photos and fast shipping", weakness: "Higher price" },
      { title: "Sports Water Bottle Bundle", price: 17.5, rating: 4.51, reviews: 430, shippingDays: 3, voucherPercent: 12, strength: "Bundle value", weakness: "Material details are weak" }
    ],
    questions: [
      { text: "Will it leak if I put in my bag?", theme: "leakproof", frequency: 20 },
      { text: "Is this 750ml or 1 litre?", theme: "capacity", frequency: 16 },
      { text: "Can wash in dishwasher?", theme: "care", frequency: 8 },
      { text: "Can I buy two colors together?", theme: "bundle", frequency: 6 }
    ],
    themes: {
      positive: [
        { label: "Keeps water cold", value: 32 },
        { label: "Nice color", value: 22 },
        { label: "Fast delivery", value: 18 },
        { label: "Good value", value: 14 }
      ],
      negative: [
        { label: "Leak-proof unclear", value: 24 },
        { label: "Capacity unclear", value: 19 },
        { label: "Care instructions missing", value: 12 },
        { label: "Packaging dents", value: 8 }
      ]
    },
    sentiment: { positive: 0.68, neutral: 0.22, negative: 0.1 },
    actionHints: ["Add a seal close-up image", "Add capacity comparison", "Create quick replies for care and leakproof questions"]
  },
  {
    imageKind: "shirt",
    product: {
      productId: "P-SG-102",
      title: "Oversized Cotton T-Shirt",
      category: "Fashion > Men Clothing",
      price: 15.9,
      stock: 520,
      views: 38200,
      clicks: 1680,
      orders: 74,
      revenue: 1176.6,
      adSpend: 260,
      rating: 4.28,
      reviews: 96,
      refundRate: 0.071,
      cancellationRate: 0.015,
      netMarginPercent: 0.17,
      conversionRate: 0.044,
      ctr: 0.044
    },
    communication: {
      totalChats: 118,
      averageResponseMinutes: 134,
      responseWithinOneHourPercent: 0.48,
      unansweredRate: 0.11,
      buyerSatisfactionScore: 3.5
    },
    competitors: [
      { title: "Plain Oversized Tee", price: 12.9, rating: 4.55, reviews: 1480, shippingDays: 2, voucherPercent: 15, strength: "Lower price and high sales volume", weakness: "Thin fabric complaints" },
      { title: "Heavy Cotton Drop Shoulder T-Shirt", price: 19.9, rating: 4.63, reviews: 730, shippingDays: 1, voucherPercent: 8, strength: "Clear fabric positioning", weakness: "Higher price" },
      { title: "Unisex Streetwear Tee", price: 14.8, rating: 4.34, reviews: 520, shippingDays: 3, voucherPercent: 12, strength: "Better variant photos", weakness: "Slow shipping" }
    ],
    questions: [
      { text: "I am 175cm, what size should I buy?", theme: "size", frequency: 34 },
      { text: "Is the material thick?", theme: "fabric", frequency: 18 },
      { text: "Can exchange if size wrong?", theme: "return", frequency: 13 },
      { text: "Does the color fade after wash?", theme: "washing", frequency: 9 }
    ],
    themes: {
      positive: [
        { label: "Color looks good", value: 26 },
        { label: "Fast delivery", value: 21 },
        { label: "Comfortable fit", value: 18 },
        { label: "Good value", value: 12 }
      ],
      negative: [
        { label: "Size confusion", value: 34 },
        { label: "Fabric thickness", value: 21 },
        { label: "Return concern", value: 16 },
        { label: "Photo mismatch", value: 11 }
      ]
    },
    sentiment: { positive: 0.54, neutral: 0.28, negative: 0.18 },
    actionHints: ["Add model-size chart", "Show close-up fabric texture", "Use variant photos for each color"]
  },
  {
    imageKind: "case",
    product: {
      productId: "P-SG-103",
      title: "Shockproof Clear Phone Case",
      category: "Mobile Accessories > Phone Cases",
      price: 9.9,
      stock: 740,
      views: 42100,
      clicks: 2050,
      orders: 155,
      revenue: 1534.5,
      adSpend: 190,
      rating: 4.71,
      reviews: 312,
      refundRate: 0.022,
      cancellationRate: 0.009,
      netMarginPercent: 0.31,
      conversionRate: 0.0756,
      ctr: 0.0487
    },
    communication: {
      totalChats: 54,
      averageResponseMinutes: 38,
      responseWithinOneHourPercent: 0.81,
      unansweredRate: 0.03,
      buyerSatisfactionScore: 4.4
    },
    competitors: [
      { title: "Transparent iPhone Shockproof Case", price: 8.9, rating: 4.78, reviews: 2100, shippingDays: 1, voucherPercent: 8, strength: "High trust and fast delivery", weakness: "Yellowing complaints" },
      { title: "MagSafe Clear Phone Case", price: 12.5, rating: 4.62, reviews: 980, shippingDays: 2, voucherPercent: 10, strength: "Better feature positioning", weakness: "Higher price" },
      { title: "Slim TPU Case Bundle", price: 7.9, rating: 4.42, reviews: 640, shippingDays: 3, voucherPercent: 15, strength: "Low price bundle", weakness: "Model-fit details are weak" }
    ],
    questions: [
      { text: "Does it fit iPhone 15 Pro Max?", theme: "compatibility", frequency: 24 },
      { text: "Will it turn yellow?", theme: "material", frequency: 15 },
      { text: "Is camera lens protected?", theme: "protection", frequency: 12 },
      { text: "Does it support wireless charging?", theme: "charging", frequency: 7 }
    ],
    themes: {
      positive: [
        { label: "Fits phone well", value: 35 },
        { label: "Good protection", value: 24 },
        { label: "Clear design", value: 18 },
        { label: "Easy buttons", value: 9 }
      ],
      negative: [
        { label: "Yellowing concern", value: 21 },
        { label: "Variant clarity", value: 16 },
        { label: "Camera lip unclear", value: 12 },
        { label: "Wireless charging", value: 8 }
      ]
    },
    sentiment: { positive: 0.74, neutral: 0.18, negative: 0.08 },
    actionHints: ["Put phone models in image one", "Show camera-lip protection", "State material and yellowing expectation"]
  }
];

const timeframes = [
  {
    label: "Last 30 days",
    range: "May 15 - Jun 13, 2026",
    volumeFactor: 0.34,
    ctrFactor: 0.98,
    conversionFactor: 0.92,
    adSpendFactor: 0.42,
    reviewFactor: 0.28,
    marginDelta: -0.02,
    chatFactor: 0.36,
    responseMinutesFactor: 1.12,
    oneHourDelta: -0.06,
    unansweredDelta: 0.03,
    csatDelta: -0.1,
    trendLabels: ["W1", "W2", "W3", "W4"],
    trendShape: [0.82, 0.94, 1.05, 1.19]
  },
  {
    label: "Last 3 months",
    range: "Mar 15 - Jun 13, 2026",
    volumeFactor: 1,
    ctrFactor: 1,
    conversionFactor: 1,
    adSpendFactor: 1,
    reviewFactor: 1,
    marginDelta: 0,
    chatFactor: 1,
    responseMinutesFactor: 1,
    oneHourDelta: 0,
    unansweredDelta: 0,
    csatDelta: 0,
    trendLabels: ["Mar", "Apr", "May", "Jun"],
    trendShape: [0.78, 0.92, 1.11, 1.19]
  },
  {
    label: "Last 6 months",
    range: "Dec 15 - Jun 13, 2026",
    volumeFactor: 1.92,
    ctrFactor: 1.04,
    conversionFactor: 1.06,
    adSpendFactor: 1.78,
    reviewFactor: 1.72,
    marginDelta: 0.01,
    chatFactor: 1.85,
    responseMinutesFactor: 0.9,
    oneHourDelta: 0.05,
    unansweredDelta: -0.02,
    csatDelta: 0.12,
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    trendShape: [0.69, 0.75, 0.86, 0.98, 1.11, 1.28]
  }
];

const preIdeas = [
  {
    imageKind: "bottle",
    title: "Insulated Stainless Steel Water Bottle",
    category: "Home & Living > Drinkware",
    productType: "water bottle",
    price: 18.9,
    stock: 120,
    features: "Leak-resistant lid, 750ml capacity, stainless steel body, office and school use, bundle-ready colors",
    cost: 7.4,
    demand: 78,
    competition: 62,
    differentiation: 69,
    readiness: 74,
    competitors: [
      ["Thermal Flask 750ml Leakproof", 16.9, 920, "Leak-proof"],
      ["Premium Stainless Water Bottle", 21.8, 610, "Premium design"],
      ["Sports Water Bottle Bundle", 17.5, 430, "Bundle value"]
    ],
    actions: ["Lead with leak-test image", "Use two-pack bundle to protect margin", "Add capacity guide before launch"]
  },
  {
    imageKind: "shirt",
    title: "Oversized Cotton T-Shirt",
    category: "Fashion > Men Clothing",
    productType: "T-shirt",
    price: 15.9,
    stock: 180,
    features: "Oversized fit, cotton fabric, neutral colors, model-size photos, washable daily wear",
    cost: 6.2,
    demand: 72,
    competition: 71,
    differentiation: 58,
    readiness: 63,
    competitors: [
      ["Plain Oversized Tee", 12.9, 1480, "Low price"],
      ["Heavy Cotton Drop Shoulder T-Shirt", 19.9, 730, "Fabric proof"],
      ["Unisex Streetwear Tee", 14.8, 520, "Variant photos"]
    ],
    actions: ["Add model-height size chart", "Show fabric GSM and texture", "Limit launch colors to top variants"]
  },
  {
    imageKind: "case",
    title: "Shockproof Clear Phone Case",
    category: "Mobile Accessories > Phone Cases",
    productType: "phone case",
    price: 9.9,
    stock: 220,
    features: "Clear TPU case, corner protection, camera lip, wireless charging support, iPhone model variants",
    cost: 3.1,
    demand: 84,
    competition: 76,
    differentiation: 66,
    readiness: 79,
    competitors: [
      ["Transparent iPhone Shockproof Case", 8.9, 2100, "High trust"],
      ["MagSafe Clear Phone Case", 12.5, 980, "Feature positioning"],
      ["Slim TPU Case Bundle", 7.9, 640, "Low price"]
    ],
    actions: ["Make model compatibility visible in image one", "Show camera-lip close-up", "Mention realistic yellowing expectation"]
  }
];

const state = {
  mode: "post",
  productIndex: 0,
  timeframeIndex: 1,
  preIdeaIndex: 2,
  preAnalyzed: false,
  photoDataUrl: "",
  photoName: "",
  aiInsight: null,
  aiLoading: false,
  preDraft: {
    productType: "",
    description: "",
    keywords: "",
    targetArea: "Islandwide Singapore"
  }
};

function init() {
  html("timeframe-select", timeframes.map((timeframe, index) => `<option value="${index}">${escapeHtml(timeframe.label)}</option>`).join(""));
  byId("timeframe-select").value = String(state.timeframeIndex);
  byId("timeframe-select").addEventListener("change", (event) => {
    state.timeframeIndex = Number(event.target.value);
    renderPost();
  });

  byId("pre-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void runPreAnalysis();
  });

  const photoInput = byId("prelaunch-photo-upload");
  if (photoInput) {
    photoInput.addEventListener("change", (event) => {
      void handlePrePhoto(event.target.files?.[0] || null);
    });
  }

  ["pre-change-product-header", "pre-change-product-footer"].forEach((id) => {
    const button = byId(id);
    if (button) button.addEventListener("click", cancelPreProduct);
  });

  byId("pre-form").addEventListener("input", updatePreChangeProductButton);

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  clearPreForm();
  renderProductList();
  render();
}

function setMode(mode) {
  const nextMode = mode === "pre" ? "pre" : "post";
  if (nextMode === "pre" && state.mode !== "pre" && !state.photoDataUrl) {
    state.preAnalyzed = false;
    state.aiInsight = null;
    clearPreForm();
    resetPreUploadUi();
  }
  state.mode = nextMode;
  render();
}

function render() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  byId("post-view").classList.toggle("hidden", state.mode !== "post");
  byId("pre-view").classList.toggle("hidden", state.mode !== "pre");
  byId("post-head-actions").classList.toggle("hidden", state.mode !== "post");
  text("workspace-title", state.mode === "post" ? "Post-Launch Seller Intelligence" : "Pre-Launch Seller Intelligence");
  text("seller-perspective-copy", state.mode === "post"
    ? "Optimize live listings, reviews, and campaign spend"
    : "Validate new listing ideas before launch");
  byId("page-title").textContent = state.mode === "post" ? "Post-Launch Product Dashboard" : "Pre-Launch Product Validation";
  byId("page-copy").textContent =
    state.mode === "post"
      ? "Choose a live seller product to generate product health, market trend, competitor, review, and action dashboards."
      : "Enter a new product idea to estimate launch fit, comparison pressure, Singapore target area, and initial stock size.";
  renderProductList();
  if (state.mode === "post") {
    renderPost();
  } else if (state.preAnalyzed) {
    renderPre();
  } else {
    togglePrePanels(false);
  }
}

function renderProductList() {
  byId("sidebar-product-count").textContent = `${products.length} live items`;
  html(
    "product-list",
    products
      .map((item, index) => {
        const product = item.product;
        const isActive = state.mode === "post" && index === state.productIndex;
        return `<button class="live-product-card ${isActive ? "active" : ""}" type="button" data-product-index="${index}">
          ${productImage(item.imageKind, product.title)}
          <span><strong>${escapeHtml(product.title)}</strong><small>${escapeHtml(product.productId)} · ${escapeHtml(product.category)}</small></span>
          <b>${currency(product.price)}</b>
          <em>${product.orders} orders</em>
        </button>`;
      })
      .join("")
  );
  document.querySelectorAll("[data-product-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.productIndex = Number(button.dataset.productIndex);
      state.mode = "post";
      render();
    });
  });
}

function renderPost() {
  const timeframe = timeframes[state.timeframeIndex];
  const input = applyTimeframe(products[state.productIndex], timeframe);
  const product = input.product;
  const report = analyzePost(input);
  const competitorAverage = competitorAverages(input.competitors);
  const rank = competitorRank(product, input.competitors);

  byId("timeframe-select").value = String(state.timeframeIndex);
  text("kpi-sales", currency(product.revenue));
  text("kpi-sales-delta", deltaLine(0.186, "vs previous period"));
  text("kpi-conversion", percent(product.conversionRate));
  text("kpi-conversion-delta", deltaLine(product.conversionRate - 0.036, "conversion lift"));
  text("kpi-health", report.health.overall);
  text("kpi-health-delta", deltaLine((report.health.overall - 72) / 100, "score movement"));
  text("kpi-margin", percent(product.netMarginPercent));
  text("kpi-margin-delta", deltaLine(product.netMarginPercent - 0.21, "margin gap"));
  text("kpi-reviews", product.reviews.toLocaleString());
  text("kpi-reviews-delta", deltaLine(product.reviews / Math.max(1, competitorAverage.reviews) - 0.25, "review base"));
  text("kpi-competitor", `#${rank}`);
  text("kpi-competitor-delta", rank === 1 ? "Leading current set" : `${rank - 1} position gap to close`);

  html("spark-sales", sparkline(timeframe.trendShape, "#ee4d2d"));
  html("spark-conversion", sparkline(timeframe.trendShape.map((value, index) => value + index * 0.03), "#ee4d2d"));
  html("spark-health", sparkline([0.74, 0.7, 0.76, report.health.overall / 100], "#10b981"));
  html("spark-margin", sparkline([0.82, 0.88, 0.86, product.netMarginPercent / 0.4], "#ee4d2d"));
  html("spark-reviews", sparkline([0.51, 0.56, 0.6, 0.68, 0.74], "#8b5cf6"));
  html("spark-competitor", sparkline([0.62, 0.7, 0.66, 0.78], "#3b82f6"));

  renderFunnel(input);
  html("sales-trend", lineChart(input, timeframe));
  renderBenchmark(input, competitorAverage, rank);
  renderHealthDrivers(report.health);
  renderResponseExperience(input);
  renderThemes(input);
  renderSentiment(input);
  renderQuestions(input);
  renderActions(report.actions);
  renderImprovementAreas(input, report.health, report.actions);
}

function renderFunnel(input) {
  const product = input.product;
  const addToCart = Math.max(product.orders, Math.round(product.clicks * 0.22));
  const stages = [
    ["Impressions", product.views, 1],
    ["Clicks", product.clicks, product.ctr],
    ["Add-to-Cart", addToCart, addToCart / product.views],
    ["Orders", product.orders, product.orders / product.views],
    ["Conversion Rate", product.conversionRate, product.conversionRate]
  ];
  text("funnel-summary", `${product.orders.toLocaleString()} orders from ${product.views.toLocaleString()} views`);
  html(
    "funnel-visual",
    stages
      .slice(0, 4)
      .map((stage, index) => `<div class="funnel-slice slice-${index + 1}"><span>${escapeHtml(stage[0])}</span></div>`)
      .join("") + `<div class="funnel-circle">${percent(product.conversionRate)}</div>`
  );
  html(
    "funnel-table",
    stages
      .map(([label, value, rate], index) => {
        const shownValue = label === "Conversion Rate" ? percent(value) : Number(value).toLocaleString();
        const lift = index === 0 ? 0.124 : index === 1 ? 0.157 : index === 2 ? 0.091 : index === 3 ? 0.163 : 0.0068;
        return `<div class="funnel-row"><span>${escapeHtml(label)}</span><strong>${shownValue}</strong><small>${label === "Impressions" ? "" : percent(rate)}</small><b>${deltaLine(lift, "")}</b></div>`;
      })
      .join("")
  );
  text(
    "ctr-note",
    "CTR means click-through rate: clicks divided by listing views. It shows whether shoppers who saw the product were interested enough to click."
  );
}

function renderBenchmark(input, averages, rank) {
  const product = input.product;
  const priceGap = product.price <= averages.price ? `Better by ${percent((averages.price - product.price) / averages.price)}` : `Higher by ${percent((product.price - averages.price) / averages.price)}`;
  text("benchmark-summary", `Current rank #${rank}`);
  html(
    "competitor-benchmark",
    `<div class="table-row head"><span>Metric</span><span>You</span><span>Competitor Avg</span><span>Gap</span></div>
    ${benchmarkRow("Price", currency(product.price), currency(averages.price), priceGap, product.price <= averages.price)}
    ${benchmarkRow("Rating", product.rating.toFixed(2), averages.rating.toFixed(2), signed(product.rating - averages.rating, "pts"), product.rating >= averages.rating)}
    ${benchmarkRow("Reviews", product.reviews.toLocaleString(), averages.reviews.toLocaleString(), signed(product.reviews - averages.reviews, ""), product.reviews >= averages.reviews)}
    ${benchmarkRow("Shipping Days", "2.0", averages.shippingDays.toFixed(1), signed(averages.shippingDays - 2, "days"), averages.shippingDays >= 2)}
    ${benchmarkRow("Voucher Coverage", "9%", `${Math.round(averages.voucherPercent)}%`, signed(9 - averages.voucherPercent, "pp"), 9 >= averages.voucherPercent)}`
  );
}

function renderHealthDrivers(health) {
  const drivers = [
    ["Conversion", health.conversion, "Click-to-order strength"],
    ["Margin", health.margin, "Profit after costs and ads"],
    ["Reviews", health.reviewRating, "Rating and trust quality"],
    ["Competition", health.competitorPosition, "Price, reviews, rating position"],
    ["Traffic", health.traffic, "Listing demand and reach"],
    ["Buyer response", health.customerInteraction, "Chat speed and answer coverage"],
    ["Fulfillment", health.fulfillment, "Refund and cancellation control"]
  ];
  text("health-driver-summary", `${health.overall}/100 overall`);
  html("health-drivers", drivers.map(([label, value, note]) => driverCard(label, value, note)).join(""));
}

function renderResponseExperience(input) {
  const communication = input.communication;
  const responseRisk =
    communication.averageResponseMinutes > 120 || communication.unansweredRate > 0.1
      ? "Response timing may be hurting conversion"
      : communication.responseWithinOneHourPercent >= 0.75
        ? "Fast response supports buyer confidence"
        : "Response timing should be watched";
  text("response-summary", responseRisk);
  html(
    "response-metrics",
    [
      ["Avg response", `${communication.averageResponseMinutes}m`, "Lower is better"],
      ["Within 1h", percent(communication.responseWithinOneHourPercent), "Fast-answer rate"],
      ["Unanswered", percent(communication.unansweredRate), "Lost confidence risk"],
      ["Buyer CSAT", `${communication.buyerSatisfactionScore.toFixed(1)}/5`, "Chat experience"]
    ]
      .map(([label, value, note]) => `<div class="response-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`)
      .join("")
  );
}

function renderThemes(input) {
  const product = input.product;
  text("review-base", `Based on ${product.reviews.toLocaleString()} reviews`);
  html("positive-themes", input.themes.positive.map((theme) => themeBar(theme, "positive")).join(""));
  html("negative-themes", input.themes.negative.map((theme) => themeBar(theme, "negative")).join(""));
}

function renderSentiment(input) {
  const sentiment = input.sentiment;
  const positiveEnd = sentiment.positive * 100;
  const neutralEnd = positiveEnd + sentiment.neutral * 100;
  const score = Math.round((sentiment.positive - sentiment.negative) * 100);
  const donut = byId("sentiment-donut");
  donut.style.background = `conic-gradient(#10b981 0 ${positiveEnd}%, #e5e7eb ${positiveEnd}% ${neutralEnd}%, #ef4444 ${neutralEnd}% 100%)`;
  donut.innerHTML = `<span>${score > 0 ? "+" : ""}${score}</span>`;
  html(
    "sentiment-legend",
    [
      ["Positive", sentiment.positive, "#10b981"],
      ["Neutral", sentiment.neutral, "#9ca3af"],
      ["Negative", sentiment.negative, "#ef4444"]
    ]
      .map(([label, value, color]) => `<div><i style="background:${color}"></i><span>${label}</span><strong>${percent(value)}</strong></div>`)
      .join("")
  );
  text("sentiment-score", `${score > 0 ? "+" : ""}${score}`);
}

function renderQuestions(input) {
  const total = input.questions.reduce((sum, question) => sum + question.frequency, 0);
  text("question-total", `${total} signals`);
  html(
    "buyer-questions",
    input.questions
      .map((question) => `<div class="question-row"><span>${escapeHtml(question.text)}</span><strong>${question.frequency}</strong></div>`)
      .join("")
  );
}

function renderActions(actions) {
  text("action-priority-count", `${actions.length} actions`);
  html(
    "ai-actions",
    actions
      .map((action, index) => `<div class="action-item">
        <span class="action-number">${index + 1}</span>
        <p>${escapeHtml(action.text)}</p>
        <b class="${action.priority.toLowerCase()}">${escapeHtml(action.priority)}</b>
      </div>`)
      .join("")
  );
}

function renderImprovementAreas(input, health, actions) {
  const weakDrivers = [
    ["Margin", health.margin, "Protect profit with bundles, voucher limits, and ad caps."],
    ["Conversion", health.conversion, "Improve image one, title clarity, FAQ, and trust proof."],
    ["Buyer response", health.customerInteraction, "Use quick replies for repeated buyer questions."],
    ["Reviews", health.reviewRating, "Fix repeated negative themes before asking for more reviews."],
    ["Competition", health.competitorPosition, "Watch competitor voucher, price, shipping, and review gaps."]
  ]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4);
  text("improvement-summary", `${weakDrivers.length} ranked areas`);
  html(
    "improvement-areas",
    weakDrivers
      .map(([label, value, note], index) => `<div class="improvement-row">
        <span>${index + 1}</span>
        <div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(note)}</small></div>
        <b>${value}</b>
      </div>`)
      .join("")
  );
}

function togglePrePanels(showResults) {
  byId("pre-empty-panel").classList.toggle("hidden", showResults || state.aiLoading);
  byId("pre-decision-panel").classList.toggle("hidden", !showResults);
  document.querySelectorAll(".pre-result-panel").forEach((panel) => {
    if (panel.id === "pre-ai-panel") return;
    panel.classList.toggle("hidden", !showResults);
  });
  updatePreChangeProductButton();
}

function hasPreProductDraft() {
  const form = readPreForm();
  return Boolean(
    state.photoDataUrl ||
      state.preAnalyzed ||
      form.title ||
      form.category ||
      form.productType ||
      form.description ||
      form.features
  );
}

function updatePreChangeProductButton() {
  const show = hasPreProductDraft();
  const headerButton = byId("pre-change-product-header");
  if (headerButton) headerButton.classList.toggle("hidden", !show);
}

function cancelPreProduct() {
  state.preAnalyzed = false;
  state.aiInsight = null;
  state.aiLoading = false;
  state.photoDataUrl = "";
  state.photoName = "";
  clearPreForm();
  resetPreUploadUi();
  togglePrePanels(false);
  updatePreChangeProductButton();
}

function renderPre() {
  const input = readPreForm();
  const analysis = analyzePre(input);
  text("pre-confidence", `${analysis.confidence}% confidence`);
  text("pre-recommendation", analysis.recommendation);
  text("pre-summary", analysis.summary);
  text("pre-score", analysis.score);
  byId("pre-score").style.background = `conic-gradient(#ee4d2d 0 ${analysis.score}%, #eef0f4 ${analysis.score}% 100%)`;
  html(
    "pre-metrics",
    [
      ["Demand vs market", analysis.metrics.demand, "Search and category demand signals"],
      ["Competition pressure", analysis.metrics.competition, "Lower score means easier entry"],
      ["Price and cost room", analysis.metrics.margin, "Profit room after costs and ads"],
      ["Differentiation", analysis.metrics.differentiation, "How clear the product angle is"],
      ["Listing readiness", analysis.metrics.readiness, "Title, features, stock, and visual readiness"]
    ]
      .map(([label, value, detail]) => metricTile(label, value, detail))
      .join("")
  );
  html(
    "pre-comparison",
    `<div class="table-row head"><span>Competitor</span><span>Price</span><span>Reviews</span><span>Main angle</span></div>` +
      input.competitors
        .map((row) => `<div class="table-row"><span>${escapeHtml(row[0])}</span><span>${currency(row[1])}</span><span>${Number(row[2]).toLocaleString()}</span><span>${escapeHtml(row[3])}</span></div>`)
        .join("")
  );
  text("pre-action-count", `${analysis.actions.length} actions`);
  text("pre-margin-badge", `${currency(input.price)} target`);
  html(
    "pre-margin",
    [
      ["Target price", currency(input.price), "Seller selling price"],
      ["Unit cost", currency(input.cost), "Product cost"],
      ["Safe ad room", currency(analysis.safeAdSpend), "Before margin becomes weak"],
      ["Launch stock", `${analysis.launchStock} units`, "Controlled first batch"]
    ]
      .map(([label, value, note]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`)
      .join("")
  );
  text("pre-readiness-badge", `${analysis.metrics.readiness}/100`);
  html(
    "pre-readiness",
    analysis.readinessChecks
      .map((item) => `<div class="readiness-row ${item.ready ? "ready" : "watch"}"><span>${item.ready ? "✓" : "!"}</span><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.note)}</small></div></div>`)
      .join("")
  );
  html(
    "pre-actions",
    analysis.actions
      .map((action, index) => `<div class="action-item"><span class="action-number">${index + 1}</span><p>${escapeHtml(action)}</p><b class="${index === 0 ? "high" : "medium"}">${index === 0 ? "High" : "Medium"}</b></div>`)
      .join("")
  );
  togglePrePanels(true);
}

async function runPreAnalysis() {
  state.preAnalyzed = true;
  state.aiLoading = true;
  renderAiSummary();
  const report = analyzePre(readPreForm());
  renderPre();
  const insight = await requestSellerAi("pre", readPreFormPayload(), report);
  state.aiInsight = insight || state.aiInsight || localPhotoFallbackInsight();
  state.aiLoading = false;
  renderAiSummary();
}

async function handlePrePhoto(file) {
  if (!file) {
    state.photoDataUrl = "";
    state.photoName = "";
    resetPreUploadUi();
    return;
  }

  if (!isImageFile(file)) {
    setPreUploadUi("", false, "Please choose a PNG, JPG, WEBP, GIF, HEIC, or other image file.");
    return;
  }

  state.aiLoading = true;
  state.preAnalyzed = false;
  state.aiInsight = null;
  setPreUploadUi(file.name, true);
  togglePrePanels(false);

  try {
    state.photoDataUrl = await preparePhotoDataUrl(file);
    state.photoName = file.name;
    const imageOnlyForm = emptyPrePayload(state.photoName, state.photoDataUrl);
    const insight = await requestSellerAi("pre", imageOnlyForm, {}, state.photoDataUrl);
    const draftForm = buildPreDraftForm(imageOnlyForm, insight || localPhotoFallbackInsight());
    applyPreDraftToDom(draftForm);
    state.preAnalyzed = true;
    state.aiInsight = insight || localPhotoFallbackInsight();
    renderPre();
    setPreUploadUi(file.name, false);
  } catch (error) {
    const draftForm = buildPreDraftForm(emptyPrePayload(file.name, ""), localPhotoFallbackInsight());
    applyPreDraftToDom(draftForm);
    state.preAnalyzed = true;
    state.aiInsight = localPhotoFallbackInsight();
    renderPre();
    setPreUploadUi(file.name, false, error instanceof Error ? error.message : "Could not read image. Try PNG or JPG.");
  } finally {
    state.aiLoading = false;
    renderAiSummary();
    togglePrePanels(state.preAnalyzed);
  }
}

async function requestSellerAi(mode, productInput, computedReport, photoDataUrlOverride) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("/api/seller-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        mode,
        productInput,
        computedReport,
        photoDataUrl: photoDataUrlOverride
      })
    });
    if (!response.ok) throw new Error("Seller AI request failed");
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isImageFile(file) {
  if (file.type && file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|tiff?|heic|heif|avif)$/i.test(file.name);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

async function preparePhotoDataUrl(file) {
  const original = await readFileAsDataUrl(file);
  try {
    return await compressDataUrl(original, 1280, 0.82);
  } catch {
    return original;
  }
}

function compressDataUrl(dataUrl, maxEdge, quality) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image."));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => reject(new Error("This image format is not supported in the browser. Try PNG or JPG."));
    image.src = dataUrl;
  });
}

function localPhotoFallbackInsight() {
  return {
    modeUsed: "fallback",
    summary: "Image uploaded. Review the AI-filled draft on the left, then run pre-launch analysis.",
    imageUnderstanding: "Product photo received. OpenAI vision refines this draft when the API key is active.",
    safeChanges: [
      { field: "productType", value: "phone case" },
      { field: "targetArea", value: "Islandwide Singapore" },
      { field: "features", value: "Clear protection, corner shock absorption, camera lip, wireless charging friendly" },
      { field: "description", value: "Protective clear case draft from uploaded image. Add model compatibility, material proof, and delivery details before launch." },
      { field: "keywords", value: "phone case singapore, clear case, shockproof case" },
      { field: "launchStock", value: "30" },
      { field: "shippingCost", value: "1" },
      { field: "packagingCost", value: "0.5" },
      { field: "adCost", value: "1" }
    ],
    blockedChanges: [
      { field: "title", value: "Shockproof Clear Phone Case with Camera Lip" },
      { field: "price", value: "9.9" },
      { field: "category", value: "Mobile Accessories > Phone Cases" }
    ],
    actionPlan: []
  };
}

function emptyPrePayload(photoName, photoDataUrl) {
  return {
    title: "",
    category: "",
    productType: "",
    price: "",
    launchStock: "",
    shippingCost: "",
    packagingCost: "",
    adCost: "",
    targetArea: "",
    colors: "",
    features: "",
    description: "",
    keywords: "",
    photoName,
    photoDataUrl,
  };
}

function buildPreDraftForm(base, insight) {
  const draft = { ...base };
  for (const change of [...(insight.safeChanges || []), ...(insight.blockedChanges || [])]) {
    if (change.field in draft && change.value) draft[change.field] = change.value;
  }
  return {
    ...draft,
    title: draft.title || "AI drafted product title",
    category: draft.category || "Mobile Accessories > Phone Cases",
    productType: draft.productType || "image-detected product",
    price: draft.price || "19.9",
    launchStock: draft.launchStock || "30",
    shippingCost: draft.shippingCost || "1",
    packagingCost: draft.packagingCost || "0.5",
    adCost: draft.adCost || "1",
    targetArea: draft.targetArea || "Islandwide Singapore",
    colors: draft.colors || "",
    features: draft.features || "Visible product photo, local seller, fast delivery",
    description: draft.description || "AI drafted product description. Seller should confirm product proof, sizing, compatibility, and local delivery details before launch.",
    keywords: draft.keywords || "shopee singapore, local seller, fast delivery",
  };
}

function applyPreDraftToDom(draft) {
  byId("pre-title").value = draft.title;
  byId("pre-category").value = draft.category;
  byId("pre-product-type").value = draft.productType;
  byId("pre-price").value = draft.price;
  byId("pre-stock").value = draft.launchStock;
  byId("pre-shipping").value = draft.shippingCost;
  byId("pre-packaging").value = draft.packagingCost;
  byId("pre-ad-cost").value = draft.adCost;
  byId("pre-target-area").value = draft.targetArea;
  byId("pre-colors").value = draft.colors || "";
  byId("pre-features").value = draft.features;
  byId("pre-description").value = draft.description;
  byId("pre-keywords").value = draft.keywords;
}

function readPreFormPayload(includePhoto = false) {
  const idea = readPreForm();
  return {
    title: idea.title,
    category: idea.category,
    productType: idea.productType,
    price: String(idea.price),
    launchStock: String(idea.stock),
    shippingCost: String(idea.shippingCost),
    packagingCost: String(idea.packagingCost),
    adCost: String(idea.adCost),
    targetArea: idea.targetArea,
    colors: idea.colors,
    features: idea.features,
    description: idea.description,
    keywords: idea.keywords,
    photoName: state.photoName,
    photoDataUrl: includePhoto ? state.photoDataUrl : ""
  };
}

function resetPreUploadUi() {
  text("pre-upload-label", "Upload Product Photo");
  text("pre-upload-status", "No image added yet");
  text("pre-empty-title", "No pre-launch product loaded");
  text("pre-empty-copy", "Upload a product photo here. OpenAI will fill the editable form with suggested title, category, price, target region, features, description, and keywords.");
  const input = byId("prelaunch-photo-upload");
  if (input) input.value = "";
}

function setPreUploadUi(fileName, loading, errorMessage) {
  text("pre-upload-label", loading ? "Reading product image..." : errorMessage ? "Upload failed" : "Upload Product Photo");
  text("pre-upload-status", loading ? "OpenAI is filling the form." : errorMessage || fileName || "Image added");
  if (!loading && fileName && !errorMessage) {
    text("pre-empty-title", "Pre-launch draft ready");
    text("pre-empty-copy", "Review the editable form on the left, then run analysis or adjust any AI-filled fields.");
  }
  if (errorMessage) {
    text("pre-empty-title", "No pre-launch product loaded");
    text("pre-empty-copy", errorMessage);
  }
}

function renderAiSummary() {
  const panel = byId("pre-ai-panel");
  if (!panel) return;
  panel.classList.add("hidden");
  const insight = state.aiInsight;
  text("pre-ai-mode", state.aiLoading ? "Generating" : insight ? `${insight.modeUsed === "openai" ? "OpenAI" : "Fallback"} mode` : "Waiting");
  text("pre-ai-summary", state.aiLoading
    ? "Reading seller metrics, listing details, and uploaded product evidence..."
    : insight?.summary || "Run analysis or upload a product photo to generate seller guidance.");
  text("pre-ai-image-note", insight?.imageUnderstanding || "Upload a product photo to include visual understanding.");
}

function clearPreForm() {
  const defaults = {
    "pre-title": "",
    "pre-category": "",
    "pre-product-type": "",
    "pre-price": "",
    "pre-stock": "",
    "pre-shipping": "1",
    "pre-packaging": "0.5",
    "pre-ad-cost": "1",
    "pre-target-area": "Islandwide Singapore",
    "pre-colors": "",
    "pre-features": "",
    "pre-description": "",
    "pre-keywords": ""
  };
  for (const [id, value] of Object.entries(defaults)) {
    const field = byId(id);
    if (field) field.value = value;
  }
}

function pickPreContext(form) {
  const hay = `${form.category} ${form.productType} ${form.title}`.toLowerCase();
  if (hay.includes("bottle") || hay.includes("drinkware") || hay.includes("water")) return preIdeas[0];
  if (hay.includes("shirt") || hay.includes("clothing") || hay.includes("tee")) return preIdeas[1];
  return preIdeas[2];
}

function readPreForm() {
  const form = {
    title: byId("pre-title").value.trim(),
    category: byId("pre-category").value.trim(),
    productType: byId("pre-product-type").value.trim(),
    price: Number(byId("pre-price").value) || 0,
    stock: Number(byId("pre-stock").value) || 30,
    shippingCost: Number(byId("pre-shipping").value) || 1,
    packagingCost: Number(byId("pre-packaging").value) || 0.5,
    adCost: Number(byId("pre-ad-cost").value) || 1,
    targetArea: byId("pre-target-area").value.trim() || "Islandwide Singapore",
    colors: byId("pre-colors").value.trim(),
    features: byId("pre-features").value.trim(),
    description: byId("pre-description").value.trim(),
    keywords: byId("pre-keywords").value.trim()
  };
  const ctx = pickPreContext(form);
  return {
    ...ctx,
    ...form,
    price: form.price || ctx.price,
    stock: form.stock || ctx.stock,
    features: form.features || ctx.features,
    description: form.description || form.features || ctx.features
  };
}

function applyTimeframe(input, timeframe) {
  const adjusted = JSON.parse(JSON.stringify(input));
  const base = input.product;
  const product = adjusted.product;

  product.views = Math.max(1, Math.round(base.views * timeframe.volumeFactor));
  product.ctr = clamp(base.ctr * timeframe.ctrFactor, 0.005, 0.2);
  product.clicks = Math.max(1, Math.round(product.views * product.ctr));
  product.conversionRate = clamp(base.conversionRate * timeframe.conversionFactor, 0.005, 0.2);
  product.orders = Math.max(1, Math.round(product.clicks * product.conversionRate));
  product.revenue = roundMoney(product.orders * product.price);
  product.adSpend = roundMoney(base.adSpend * timeframe.adSpendFactor);
  product.netMarginPercent = clamp(base.netMarginPercent + timeframe.marginDelta, 0.03, 0.6);
  product.reviews = Math.max(1, Math.round(base.reviews * timeframe.reviewFactor));
  product.rating = clamp(base.rating + timeframe.csatDelta * 0.25, 1, 5);
  adjusted.communication.totalChats = Math.max(1, Math.round(input.communication.totalChats * timeframe.chatFactor));
  adjusted.communication.averageResponseMinutes = Math.max(1, Math.round(input.communication.averageResponseMinutes * timeframe.responseMinutesFactor));
  adjusted.communication.responseWithinOneHourPercent = clamp(input.communication.responseWithinOneHourPercent + timeframe.oneHourDelta, 0, 1);
  adjusted.communication.unansweredRate = clamp(input.communication.unansweredRate + timeframe.unansweredDelta, 0, 1);
  adjusted.communication.buyerSatisfactionScore = clamp(input.communication.buyerSatisfactionScore + timeframe.csatDelta, 1, 5);

  return adjusted;
}

function analyzePost(input) {
  const product = input.product;
  const averages = competitorAverages(input.competitors);
  const health = {
    conversion: Math.round(scoreRatio(product.conversionRate, 0.025, 0.085)),
    margin: Math.round(scoreRatio(product.netMarginPercent, 0.12, 0.42)),
    reviewRating: Math.round(scoreRatio(product.rating, 3.8, 4.9)),
    competitorPosition: Math.round(scoreRatio(4 - competitorRank(product, input.competitors), 0, 3)),
    traffic: Math.round(scoreRatio(product.views, 2500, 30000)),
    customerInteraction: Math.round(
      scoreRatio(1 - input.communication.unansweredRate, 0.82, 1) * 0.35 +
        scoreRatio(input.communication.responseWithinOneHourPercent, 0.35, 0.9) * 0.35 +
        scoreRatio(input.communication.buyerSatisfactionScore, 3.2, 4.8) * 0.3
    ),
    fulfillment: Math.round(100 - clamp(product.cancellationRate * 800 + product.refundRate * 700, 0, 100))
  };
  health.overall = Math.round(
    health.conversion * 0.22 +
      health.margin * 0.18 +
      health.reviewRating * 0.14 +
      health.competitorPosition * 0.14 +
      health.traffic * 0.1 +
      health.customerInteraction * 0.12 +
      health.fulfillment * 0.1
  );

  return {
    health,
    actions: buildPostActions(input, health, averages)
  };
}

function buildPostActions(input, health, averages) {
  const product = input.product;
  const questions = [...input.questions].sort((a, b) => b.frequency - a.frequency);
  const actions = [];

  if (health.conversion < 70) {
    actions.push({ priority: "High", text: `Improve image one and title around ${questions[0].theme} to lift click-to-order conversion.` });
  }
  if (product.price > averages.price * 1.05) {
    actions.push({ priority: "High", text: "Use a limited voucher or bundle instead of lowering the base price broadly." });
  }
  if (input.communication.responseWithinOneHourPercent < 0.7) {
    actions.push({ priority: "High", text: "Add quick replies for repeated questions so buyers receive answers within one hour." });
  }
  if (health.reviewRating < 75) {
    actions.push({ priority: "Medium", text: `Address recurring review concern: ${input.themes.negative[0].label.toLowerCase()}.` });
  }
  actions.push({ priority: "Medium", text: input.actionHints[0] });
  actions.push({ priority: "Low", text: "Monitor competitor voucher coverage weekly before campaign periods." });

  return actions.slice(0, 5);
}

function analyzePre(input) {
  const averagePrice = average(input.competitors.map((row) => row[1]));
  const featureCount = input.features.split(",").filter(Boolean).length;
  const marginRate = (input.price - input.cost - 2.3) / Math.max(input.price, 1);
  const priceFit = scoreRatio(1 - Math.abs(input.price - averagePrice) / Math.max(averagePrice, 1), 0.55, 1);
  const metrics = {
    demand: input.demand,
    competition: Math.round(100 - input.competition * 0.55),
    margin: Math.round(clamp(scoreRatio(marginRate, 0.12, 0.42) * 0.72 + priceFit * 0.28, 0, 100)),
    differentiation: Math.round(clamp(input.differentiation + featureCount * 2, 0, 100)),
    readiness: Math.round(clamp(input.readiness + Math.min(input.stock, 250) / 25, 0, 100))
  };
  const score = Math.round(
    metrics.demand * 0.25 +
      metrics.competition * 0.17 +
      metrics.margin * 0.22 +
      metrics.differentiation * 0.18 +
      metrics.readiness * 0.18
  );
  const recommendation = score >= 78 ? "Launch with focused positioning" : score >= 65 ? "Launch after improvements" : "Improve before launch";
  const summary =
    score >= 78
      ? `${input.title} has enough market pull and margin room. Keep the launch narrow and prove the strongest feature first.`
      : `${input.title} needs clearer positioning before launch. Fix the first action item before increasing stock.`;
  const actions = [
    ...input.actions,
    `Set launch stock near ${Math.max(40, Math.round(input.stock * 0.65))} units first, then scale after conversion proof.`,
    "Prepare FAQ answers before launch to reduce first-week chat friction."
  ];
  const launchStock = Math.max(40, Math.round(input.stock * 0.65));
  const safeAdSpend = Math.max(0.5, roundMoney(input.price - input.cost - input.price * 0.22));
  const readinessChecks = [
    { label: "Title and category", ready: input.title.length > 18 && input.category.includes(">"), note: "Clear enough for Shopee category matching." },
    { label: "Feature differentiation", ready: featureCount >= 4, note: "Enough proof points for launch positioning." },
    { label: "Margin room", ready: marginRate >= 0.25, note: "Enough room for ads, vouchers, and shipping buffer." },
    { label: "Initial stock control", ready: input.stock <= 250, note: "First batch avoids overstock risk before conversion proof." }
  ];

  return {
    score,
    confidence: Math.min(94, Math.max(62, score + 8)),
    recommendation,
    summary,
    metrics,
    launchStock,
    safeAdSpend,
    readinessChecks,
    actions: actions.slice(0, 5)
  };
}

function competitorAverages(competitors) {
  return {
    price: average(competitors.map((item) => item.price)),
    rating: average(competitors.map((item) => item.rating)),
    reviews: Math.round(average(competitors.map((item) => item.reviews))),
    shippingDays: average(competitors.map((item) => item.shippingDays)),
    voucherPercent: average(competitors.map((item) => item.voucherPercent))
  };
}

function competitorRank(product, competitors) {
  const sellerScore = product.rating * 23 + Math.log10(product.reviews + 1) * 16 - product.price * 0.8;
  const betterCompetitors = competitors.filter((competitor) => {
    const competitorScore = competitor.rating * 23 + Math.log10(competitor.reviews + 1) * 16 - competitor.price * 0.8;
    return competitorScore > sellerScore;
  }).length;
  return Math.min(competitors.length + 1, betterCompetitors + 1);
}

function lineChart(input, timeframe) {
  const values = timeframe.trendShape.map((value) => Math.round(input.product.revenue * (value / average(timeframe.trendShape))));
  const previous = values.map((value, index) => Math.round(value * (0.72 + index * 0.035)));
  const width = 640;
  const height = 260;
  const pad = 38;
  const allValues = values.concat(previous);
  const max = Math.max(...allValues) * 1.18;
  const min = Math.min(...allValues) * 0.72;
  const points = values.map((value, index) => chartPoint(value, index, values.length, min, max, width, height, pad));
  const previousPoints = previous.map((value, index) => chartPoint(value, index, previous.length, min, max, width, height, pad));
  const areaPath = `${pathFromPoints(points)} L ${points[points.length - 1][0]} ${height - pad} L ${points[0][0]} ${height - pad} Z`;

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Sales trend chart">
    <defs>
      <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ee4d2d" stop-opacity="0.2"></stop>
        <stop offset="100%" stop-color="#ee4d2d" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    ${[0, 1, 2, 3].map((line) => `<line x1="${pad}" x2="${width - pad}" y1="${pad + line * 48}" y2="${pad + line * 48}" class="grid-line"></line>`).join("")}
    <path d="${areaPath}" fill="url(#salesArea)"></path>
    <path d="${pathFromPoints(previousPoints)}" class="trend-line previous"></path>
    <path d="${pathFromPoints(points)}" class="trend-line current"></path>
    ${points.map((point) => `<circle cx="${point[0]}" cy="${point[1]}" r="4" class="trend-dot"></circle>`).join("")}
    ${timeframe.trendLabels.map((label, index) => `<text x="${points[index][0]}" y="${height - 10}" text-anchor="middle">${escapeHtml(label)}</text>`).join("")}
  </svg>`;
}

function sparkline(values, color) {
  const width = 150;
  const height = 42;
  const pad = 5;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / Math.max(0.001, max - min)) * (height - pad * 2);
    return [round(x), round(y)];
  });
  return `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true"><path d="${pathFromPoints(points)}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"></path></svg>`;
}

function productImage(kind, title) {
  const svgByKind = {
    bottle: `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92"><rect width="92" height="92" rx="14" fill="#fff1ec"/><rect x="35" y="13" width="22" height="11" rx="3" fill="#ee4d2d"/><rect x="30" y="24" width="32" height="54" rx="12" fill="#f97316"/><rect x="37" y="32" width="18" height="32" rx="8" fill="#fed7aa"/><path d="M36 71h20" stroke="#9a3412" stroke-width="3" stroke-linecap="round"/></svg>`,
    shirt: `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92"><rect width="92" height="92" rx="14" fill="#eff6ff"/><path d="M32 21l10 8h8l10-8 16 12-8 14-8-4v31H32V43l-8 4-8-14 16-12z" fill="#2563eb"/><path d="M40 30h12" stroke="#bfdbfe" stroke-width="4" stroke-linecap="round"/></svg>`,
    case: `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92"><rect width="92" height="92" rx="14" fill="#f5f3ff"/><rect x="28" y="12" width="36" height="68" rx="10" fill="#7c3aed"/><rect x="33" y="18" width="26" height="56" rx="7" fill="#ddd6fe"/><circle cx="54" cy="27" r="5" fill="#4c1d95"/><path d="M39 68h15" stroke="#4c1d95" stroke-width="3" stroke-linecap="round"/></svg>`
  };
  return `<img class="product-thumb" alt="${escapeHtml(title)}" src="data:image/svg+xml,${encodeURIComponent(svgByKind[kind])}">`;
}

function benchmarkRow(label, you, averageValue, gap, positive) {
  return `<div class="table-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(you)}</span><span>${escapeHtml(averageValue)}</span><span class="${positive ? "positive" : "negative"}">${escapeHtml(gap)}</span></div>`;
}

function themeBar(theme, type) {
  const negative = type === "negative";
  return `<div class="theme-bar${negative ? " negative" : ""}"><span>${escapeHtml(theme.label)}</span><div><i style="width:${theme.value}%"></i></div><strong>${theme.value}%</strong></div>`;
}

function metricTile(label, value, detail) {
  const stateClass = value >= 75 ? "strong" : value >= 60 ? "watch" : "weak";
  return `<div class="pre-metric ${stateClass}"><span>${escapeHtml(label)}</span><strong>${value}</strong><p>${escapeHtml(detail)}</p></div>`;
}

function driverCard(label, value, note) {
  const stateClass = value >= 75 ? "strong" : value >= 60 ? "watch" : "weak";
  return `<div class="driver-card ${stateClass}">
    <div><span>${escapeHtml(label)}</span><strong>${value}</strong></div>
    <div class="driver-track"><i style="width:${value}%"></i></div>
    <small>${escapeHtml(note)}</small>
  </div>`;
}

function chartPoint(value, index, length, min, max, width, height, pad) {
  const x = pad + (index / Math.max(1, length - 1)) * (width - pad * 2);
  const y = height - pad - ((value - min) / Math.max(1, max - min)) * (height - pad * 2);
  return [round(x), round(y)];
}

function pathFromPoints(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ");
}

function shortProductName(title) {
  return title.replace("Insulated Stainless Steel ", "").replace("Shockproof Clear ", "");
}

function deltaLine(value, suffix) {
  const label = `${value >= 0 ? "+" : ""}${percent(value)}`;
  return `${label}${suffix ? ` ${suffix}` : ""}`;
}

function signed(value, unit) {
  const rounded = Math.abs(value) >= 10 ? Math.round(value) : round(value);
  return `${value >= 0 ? "+" : "-"}${Math.abs(rounded).toLocaleString()}${unit ? ` ${unit}` : ""}`;
}

function byId(id) {
  return document.getElementById(id);
}

function text(id, value) {
  byId(id).textContent = String(value);
}

function html(id, value) {
  byId(id).innerHTML = value;
}

function currency(value) {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2 }).format(value);
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function scoreRatio(value, weak, strong) {
  return clamp(((value - weak) / (strong - weak)) * 100, 0, 100);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

init();
