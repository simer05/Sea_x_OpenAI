"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const { analyzePreProduct } = require("../analysis/preProductAnalyzer");
const multiProductIdeas = require("../data/mock/multiProductIdeas.sg.json");
const multiProductCompetitors = require("../data/mock/multiProductCompetitors.sg.json");
const phoneCaseProductIdea = require("../data/mock/phoneCaseProductIdea.sg.json");
const phoneCaseCompetitors = require("../data/mock/phoneCaseCompetitors.sg.json");

loadLocalEnv();

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const DASHBOARD_DIR = path.join(__dirname, "..", "dashboard");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/mock-catalog") {
      return sendJson(response, {
        target_region: "SG",
        data_mode: "mock",
        sample_products: [phoneCaseProductIdea, ...multiProductIdeas],
        competitor_count: phoneCaseCompetitors.length + multiProductCompetitors.length
      });
    }

    if (request.method === "POST" && url.pathname === "/api/analyze") {
      const body = await readJsonBody(request);
      const categoryPath = body.productIdea?.taxonomy?.category_path || [];
      const competitors = chooseCompetitors(categoryPath);
      const report = analyzePreProduct({
        productIdea: body.productIdea,
        competitors
      });

      return sendJson(response, {
        data_mode: "mock",
        target_region: body.productIdea?.fulfillment?.target_region || "SG",
        competitor_source: "Shopee-style mock marketplace data",
        agent_response: report
      });
    }

    if (request.method === "POST" && url.pathname === "/api/prelaunch-draft") {
      const body = await readJsonBody(request, 8_000_000);
      const draft = await buildPrelaunchDraft(body);
      return sendJson(response, draft);
    }

    if (request.method !== "GET") {
      response.writeHead(405);
      return response.end("Method not allowed");
    }

    const filePath = staticFilePath(url.pathname);
    if (!filePath || !filePath.startsWith(DASHBOARD_DIR)) {
      response.writeHead(404);
      return response.end("Not found");
    }

    fs.readFile(filePath, (error, file) => {
      if (error) {
        response.writeHead(404);
        return response.end("Not found");
      }

      response.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream"
      });
      response.end(file);
    });
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AdaptLink dashboard running at http://${HOST}:${PORT}`);
});

function staticFilePath(pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  return path.normalize(path.join(DASHBOARD_DIR, cleanPath));
}

function chooseCompetitors(categoryPath) {
  const key = categoryPath.join(" > ");
  if (key.includes("Cases Covers")) return phoneCaseCompetitors;
  if (key.includes("Water Bottles")) {
    return multiProductCompetitors.filter((item) => item.taxonomy?.category_path?.join(" > ").includes("Water Bottles"));
  }
  if (key.includes("T-Shirts")) {
    return multiProductCompetitors.filter((item) => item.taxonomy?.category_path?.join(" > ").includes("T-Shirts"));
  }
  return [...phoneCaseCompetitors, ...multiProductCompetitors];
}

function readJsonBody(request, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, payload) {
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function loadLocalEnv() {
  const workspaceRoot = path.resolve(__dirname, "..", "..", "..");
  for (const fileName of [".env.local", ".env"]) {
    const envPath = path.join(workspaceRoot, fileName);
    if (!fs.existsSync(envPath)) continue;

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key]) continue;

      process.env[key] = unquoteEnvValue(rawValue);
    }
  }
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function buildPrelaunchDraft(body) {
  const fallback = fallbackPrelaunchDraft(body);
  if (!process.env.OPENAI_API_KEY || !body.photoDataUrl) return fallback;

  try {
    const openaiDraft = await callOpenAiForPrelaunchDraft(body);
    return normalizeDraft({ ...openaiDraft, modeUsed: "openai" }, fallback);
  } catch {
    return fallback;
  }
}

async function callOpenAiForPrelaunchDraft(body) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
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
                "Return only practical marketplace recommendations. Use SGD pricing and Shopee-style category paths.",
                "Do not mention uncertainty in field values; put uncertainty in reasoning.",
                `Image file name: ${body.photoName || "uploaded-product"}`
              ].join("\n")
            },
            {
              type: "input_image",
              image_url: body.photoDataUrl
            }
          ]
        }
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
              reasoning: { type: "string" }
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
              "reasoning"
            ]
          }
        }
      ],
      tool_choice: { type: "function", name: "create_prelaunch_listing_draft" }
    })
  });

  if (!response.ok) throw new Error("OpenAI prelaunch draft failed");
  const payload = await response.json();
  const toolCall = Array.isArray(payload.output)
    ? payload.output.find((item) => item.type === "function_call" && item.name === "create_prelaunch_listing_draft")
    : null;
  if (!toolCall?.arguments) throw new Error("Missing draft arguments");
  return JSON.parse(toolCall.arguments);
}

function fallbackPrelaunchDraft(body) {
  const key = inferDraftKey(`${body.photoName || ""}`);
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
      adCost: "1.5"
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
      adCost: "1"
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
      adCost: "1.2"
    }
  }[key];

  return normalizeDraft({
    modeUsed: "fallback",
    targetRegion: "SG",
    reasoning: "Fallback draft used because OpenAI is not configured or unavailable. Seller should confirm image-specific details before launch.",
    ...seed
  });
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
    reasoning: stringOr(merged.reasoning, fallback.reasoning || "Draft fields are editable and require seller confirmation.")
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
