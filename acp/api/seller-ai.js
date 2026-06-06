const SAFE_FIELDS = new Set([
  "productType",
  "launchStock",
  "targetArea",
  "keywords",
  "features",
  "description",
  "shippingCost",
  "packagingCost",
  "adCost",
]);
const RISKY_FIELDS = new Set(["title", "category", "price", "photoName", "photoDataUrl"]);

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = request.body || {};
  const fallback = buildFallback(body);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    response.status(200).json(fallback);
    return;
  }

  try {
    const openai = await callOpenAi(body, apiKey);
    response.status(200).json(openai);
  } catch {
    response.status(200).json(fallback);
  }
};

async function callOpenAi(body, apiKey) {
  const inputContent = [
    {
      type: "input_text",
      text: [
        "You are AdaptLink Seller Intelligence for Shopee Singapore sellers.",
        "Use the computed report as the source of truth. Do not invent metrics.",
        "Return seller-friendly recommendations. Safe auto-edits can only use allowed fields.",
        "Block risky auto-edits for title, category, price, and photo changes.",
        "If a pre-launch product photo is provided and details are missing, infer a draft listing from the image and seller context.",
        "For image-first pre-launch drafts, put suggested title, category, and price in blockedChanges because the seller must confirm them before use.",
        "For image-first pre-launch drafts, put productType, targetArea, features, description, keywords, launchStock, shippingCost, packagingCost, and adCost in safeChanges.",
        `Mode: ${body.mode}`,
        `Product input: ${JSON.stringify(body.productInput)}`,
        `Computed report: ${JSON.stringify(body.computedReport)}`,
      ].join("\n"),
    },
  ];

  if (body.photoDataUrl) {
    inputContent.push({
      type: "input_image",
      image_url: body.photoDataUrl,
    });
  }

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: inputContent }],
      tools: [
        {
          type: "function",
          name: "propose_seller_recommendations",
          description:
            "Create a seller summary, image understanding, safe listing changes, blocked risky changes, and ranked action plan.",
          strict: true,
          parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              imageUnderstanding: { type: "string" },
              safeChanges: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    field: { type: "string", enum: [...SAFE_FIELDS] },
                    value: { type: "string" },
                    reason: { type: "string" },
                  },
                  required: ["field", "value", "reason"],
                },
              },
              blockedChanges: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    field: { type: "string", enum: [...RISKY_FIELDS] },
                    value: { type: "string" },
                    reason: { type: "string" },
                  },
                  required: ["field", "value", "reason"],
                },
              },
              actionPlan: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    severity: { type: "string", enum: ["High", "Medium", "Low"] },
                    expectedImpact: { type: "string" },
                    sellerStep: { type: "string" },
                  },
                  required: ["title", "severity", "expectedImpact", "sellerStep"],
                },
              },
            },
            required: ["summary", "imageUnderstanding", "safeChanges", "blockedChanges", "actionPlan"],
          },
        },
      ],
      tool_choice: { type: "function", name: "propose_seller_recommendations" },
    }),
  });

  if (!openaiResponse.ok) throw new Error("OpenAI seller recommendation failed");
  const payload = await openaiResponse.json();
  const toolCall = Array.isArray(payload.output)
    ? payload.output.find(
        (item) => item.type === "function_call" && item.name === "propose_seller_recommendations",
      )
    : null;

  if (!toolCall?.arguments) throw new Error("Missing function call arguments");
  const parsed = JSON.parse(toolCall.arguments);
  return normalizeResponse({ ...parsed, modeUsed: "openai" });
}

function buildFallback(body) {
  const report = toRecord(body.computedReport);
  const input = body.productInput || {};
  const imageOnlyDraft = body.mode === "pre" && body.photoDataUrl && !input.title && !report.overall;
  const modeLabel = body.mode === "pre" ? "pre-launch" : "post-launch";
  const overall = typeof report.overall === "number" ? report.overall : readNestedNumber(report, ["health", "overall"]);
  const title = String(input.title || readNestedString(input, ["product", "title"]) || "this listing");
  const stock = readNestedNumber(report, ["stock", "suggested"]);
  const area = readNestedString(report, ["bestRegion", "name"]);
  const actions = Array.isArray(report.actions)
    ? report.actions.map((action) => (typeof action === "string" ? action : action.action || String(action)))
    : [];

  const safeChanges = [];
  if (imageOnlyDraft) {
    safeChanges.push(
      { field: "productType", value: "phone case", reason: "Starter product type for image-first draft; seller should confirm." },
      { field: "targetArea", value: "Islandwide Singapore", reason: "Safe default for first marketplace validation." },
      { field: "features", value: "Clear protection, corner shock absorption, camera lip, wireless charging friendly", reason: "Starter features for a protective phone case listing." },
      { field: "description", value: "Protective clear case draft from uploaded image. Add model compatibility, material proof, and delivery details before launch.", reason: "Creates editable listing copy for seller review." },
      { field: "keywords", value: "phone case singapore, clear case, shockproof case, iphone case", reason: "Starter buyer-search phrases until the seller confirms details." },
      { field: "launchStock", value: "30", reason: "Conservative first-batch test stock for unknown product." },
      { field: "shippingCost", value: "1", reason: "Default demo shipping assumption." },
      { field: "packagingCost", value: "0.5", reason: "Default demo packaging assumption." },
      { field: "adCost", value: "1", reason: "Default demo ad assumption." },
    );
  }
  if (body.mode === "pre" && stock) {
    safeChanges.push({
      field: "launchStock",
      value: String(stock),
      reason: "Suggested first-batch stock is based on demand, competition, readiness, and cost room.",
    });
  }
  if (body.mode === "pre" && area) {
    safeChanges.push({
      field: "targetArea",
      value: area,
      reason: "This Singapore area has the strongest fit for the product type and price position.",
    });
  }
  if (body.mode === "pre") {
    safeChanges.push({
      field: "keywords",
      value: appendKeywords(String(input.keywords || ""), title),
      reason: "Add buyer-search phrases without changing the title or category.",
    });
    safeChanges.push({
      field: "description",
      value: appendProof(String(input.description || ""), title, area || "Singapore"),
      reason: "Add proof points that reduce buyer doubt while preserving seller wording.",
    });
  }

  return normalizeResponse({
    modeUsed: "fallback",
    summary: `${title} is ${overall >= 78 ? "strong" : overall >= 62 ? "promising but needs fixes" : "not ready yet"} for ${modeLabel}. The current report points to ${actions[0] || "listing proof and market-position improvements"} as the first seller move.`,
    imageUnderstanding: body.photoDataUrl
      ? "Image received. OpenAI vision will refine this draft when the API key is active; otherwise the demo fills editable starter listing fields."
      : "No product photo uploaded yet. Add a main product image plus one proof close-up before relying on listing readiness.",
    safeChanges,
    blockedChanges: [
      {
        field: "title",
        value: imageOnlyDraft ? "Shockproof Clear Phone Case with Camera Lip" : title,
        reason: "Title edits are risky because they can alter seller intent and search positioning; seller must approve manually.",
      },
      {
        field: "price",
        value: imageOnlyDraft ? "9.9" : String(input.price || readNestedNumber(input, ["product", "price"]) || ""),
        reason: "Price changes affect margin and campaign strategy; seller confirmation is required.",
      },
      {
        field: "category",
        value: imageOnlyDraft ? "Mobile Accessories > Phone Cases" : String(input.category || readNestedString(input, ["product", "category"]) || ""),
        reason: "Category changes affect Shopee taxonomy and competitor matching; seller confirmation is required.",
      },
    ],
    actionPlan: actions.slice(0, 4).map((action, index) => ({
      title: index === 0 ? "Fix highest-impact listing gap" : `Seller action ${index + 1}`,
      severity: index === 0 ? "High" : "Medium",
      expectedImpact: index === 0 ? "Improves buyer trust and conversion readiness." : "Improves launch confidence or post-launch optimization.",
      sellerStep: action,
    })),
  });
}

function normalizeResponse(response) {
  return {
    modeUsed: response.modeUsed,
    summary: response.summary || "Seller summary unavailable.",
    imageUnderstanding: response.imageUnderstanding || "No image assessment available.",
    safeChanges: (response.safeChanges || []).filter((change) => SAFE_FIELDS.has(change.field)).slice(0, 6),
    blockedChanges: (response.blockedChanges || []).filter((change) => RISKY_FIELDS.has(change.field)).slice(0, 6),
    actionPlan: (response.actionPlan || []).slice(0, 5),
  };
}

function readNestedNumber(source, path) {
  const value = path.reduce((current, key) => (typeof current === "object" && current ? current[key] : undefined), source);
  return typeof value === "number" ? value : 0;
}

function readNestedString(source, path) {
  const value = path.reduce((current, key) => (typeof current === "object" && current ? current[key] : undefined), source);
  return typeof value === "string" ? value : "";
}

function toRecord(value) {
  return typeof value === "object" && value ? value : {};
}

function appendKeywords(existing, title) {
  const base = existing.split(",").map((item) => item.trim()).filter(Boolean);
  const additions = title.toLowerCase().includes("case")
    ? ["phone case with strap", "iphone case singapore"]
    : title.toLowerCase().includes("shirt")
      ? ["size chart", "cotton t shirt"]
      : ["fast delivery singapore", "local seller"];
  return [...new Set([...base, ...additions])].join(", ");
}

function appendProof(existing, title, area) {
  const sentence = title.toLowerCase().includes("case")
    ? `Add proof of strap attachment, phone fit, and scratch protection for ${area} buyers.`
    : title.toLowerCase().includes("shirt")
      ? `Add size guidance, fabric proof, and wash-care detail for ${area} buyers.`
      : `Add product proof, capacity or size detail, and local delivery clarity for ${area} buyers.`;
  return existing.toLowerCase().includes(sentence.toLowerCase()) ? existing : `${existing.trim()} ${sentence}`.trim();
}
