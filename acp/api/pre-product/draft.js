function fallbackPrelaunchDraft(body) {
  const key = inferDraftKey(body.photoName || "");
  const seed = {
    phone_case: {
      title: "Protective Phone Case with Strap",
      category: "Mobile & Gadgets > Mobile Accessories > Cases Covers & Skins",
      productType: "phone case",
      price: "19.9",
      targetArea: "Central Singapore",
      colors: "clear, purple, black",
      features: "Shock protection, strap-ready grip, slim fit, lightweight daily use",
      description: "Protective phone case for daily use with a strap-friendly design, lightweight feel, and scratch protection. Add model compatibility, close-up photos, and durability proof before launch.",
      keywords: "phone case singapore, protective phone case, phone case with strap, shopee phone accessories",
      launchStock: "50",
      shippingCost: "1.2",
      packagingCost: "0.6",
      adCost: "1.5",
    },
    water_bottle: {
      title: "Reusable Water Bottle for School Gym and Office",
      category: "Home & Living > Kitchenware > Water Bottles",
      productType: "water bottle",
      price: "12.9",
      targetArea: "West Singapore",
      colors: "blue, black, pink",
      features: "Reusable bottle, lightweight carry, daily hydration, school and gym use",
      description: "Reusable water bottle for school, gym, office, and daily Singapore use. Add capacity, leakproof proof, material details, and lifestyle photos before launch.",
      keywords: "water bottle singapore, reusable bottle, gym bottle, school water bottle",
      launchStock: "80",
      shippingCost: "0.8",
      packagingCost: "0.5",
      adCost: "1",
    },
    tshirt: {
      title: "Casual Graphic T-Shirt Multiple Colors",
      category: "Men Clothes > Tops > T-Shirts",
      productType: "T-shirt",
      price: "18.9",
      targetArea: "Central Singapore",
      colors: "black, white, purple",
      features: "Comfortable fabric, casual fit, graphic print, multiple colors",
      description: "Casual T-shirt for daily wear with a clean fit and graphic style. Add size chart, fabric close-up, wash-care proof, and model photos before launch.",
      keywords: "t shirt singapore, graphic tee, casual tshirt, shopee fashion",
      launchStock: "70",
      shippingCost: "0.8",
      packagingCost: "0.5",
      adCost: "1.2",
    },
  }[key];

  return normalizeDraft({
    modeUsed: "fallback",
    targetRegion: "SG",
    reasoning: "Fallback draft used because OpenAI is not configured or unavailable. Seller should confirm image-specific details before launch.",
    ...seed,
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = request.body || {};
  const fallback = fallbackPrelaunchDraft(body);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !body.photoDataUrl) {
    response.status(200).json(fallback);
    return;
  }

  try {
    const draft = await callOpenAiForPrelaunchDraft(body, apiKey);
    response.status(200).json(normalizeDraft({ ...draft, modeUsed: "openai" }, fallback));
  } catch {
    response.status(200).json(fallback);
  }
};

async function callOpenAiForPrelaunchDraft(body, apiKey) {
  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "You are AdaptLink Seller Intelligence for Shopee Singapore pre-launch sellers.",
                "Look at the uploaded product image and create editable seller-review fields.",
                "Return practical marketplace recommendations. Use SGD pricing and Shopee-style category paths.",
                "Return a suggested product title, category, product type, selling price, target region, features, description, and keywords.",
                `Image file name: ${body.photoName || "uploaded-product"}`,
              ].join("\n"),
            },
            {
              type: "input_image",
              image_url: body.photoDataUrl,
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          name: "create_prelaunch_listing_draft",
          description: "Create an editable Shopee Singapore pre-launch product draft from an uploaded image.",
          strict: true,
          parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              category: { type: "string" },
              productType: { type: "string" },
              price: { type: "string" },
              targetRegion: { type: "string", enum: ["SG", "MY", "ID"] },
              targetArea: { type: "string" },
              colors: { type: "string" },
              features: { type: "string" },
              description: { type: "string" },
              keywords: { type: "string" },
              launchStock: { type: "string" },
              shippingCost: { type: "string" },
              packagingCost: { type: "string" },
              adCost: { type: "string" },
              reasoning: { type: "string" },
            },
            required: [
              "title",
              "category",
              "productType",
              "price",
              "targetRegion",
              "targetArea",
              "colors",
              "features",
              "description",
              "keywords",
              "launchStock",
              "shippingCost",
              "packagingCost",
              "adCost",
              "reasoning",
            ],
          },
        },
      ],
      tool_choice: { type: "function", name: "create_prelaunch_listing_draft" },
    }),
  });

  if (!openaiResponse.ok) throw new Error("OpenAI prelaunch draft failed");
  const payload = await openaiResponse.json();
  const toolCall = Array.isArray(payload.output)
    ? payload.output.find((item) => item.type === "function_call" && item.name === "create_prelaunch_listing_draft")
    : null;
  if (!toolCall?.arguments) throw new Error("Missing draft arguments");
  return JSON.parse(toolCall.arguments);
}

function normalizeDraft(draft, fallback = {}) {
  const merged = { ...fallback, ...draft };
  return {
    modeUsed: merged.modeUsed || "fallback",
    title: stringOr(merged.title, fallback.title || "New Shopee Product Draft"),
    category: stringOr(merged.category, fallback.category || "Mobile & Gadgets > Mobile Accessories > Cases Covers & Skins"),
    productType: stringOr(merged.productType, fallback.productType || "product"),
    price: numericString(merged.price, fallback.price || "19.9"),
    targetRegion: ["SG", "MY", "ID"].includes(merged.targetRegion) ? merged.targetRegion : "SG",
    targetArea: stringOr(merged.targetArea, fallback.targetArea || "Islandwide Singapore"),
    colors: stringOr(merged.colors, fallback.colors || ""),
    features: stringOr(merged.features, fallback.features || ""),
    description: stringOr(merged.description, fallback.description || ""),
    keywords: stringOr(merged.keywords, fallback.keywords || ""),
    launchStock: numericString(merged.launchStock, fallback.launchStock || "50"),
    shippingCost: numericString(merged.shippingCost, fallback.shippingCost || "1"),
    packagingCost: numericString(merged.packagingCost, fallback.packagingCost || "0.5"),
    adCost: numericString(merged.adCost, fallback.adCost || "1"),
    reasoning: stringOr(merged.reasoning, fallback.reasoning || "Draft fields are editable and require seller confirmation."),
  };
}

function inferDraftKey(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("bottle") || text.includes("tumbler") || text.includes("cup")) return "water_bottle";
  if (text.includes("shirt") || text.includes("tee") || text.includes("apparel")) return "tshirt";
  return "phone_case";
}

function stringOr(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function numericString(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? String(number) : String(fallback);
}
