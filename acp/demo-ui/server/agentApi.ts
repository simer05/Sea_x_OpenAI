import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";

function loadEnvFile(filename: string) {
  const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", filename);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").trim();
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

import {
  createOrder,
  getCapabilityManifest,
  getDeliveryOptions,
  getOrderTracking,
  getPaymentOptions,
  runProductSearch,
  scoreProductIds,
  verifyHalalByProductId,
} from "./acpGateway.js";
import {
  agentOpenAiStatus,
  handleAgentChat,
  synthesizeSpeech,
  transcribeAudio,
} from "./agentLogic.js";
import { isOpenAiReady } from "./openaiClient.js";
import {
  addToSharedCart,
  clearSharedToast,
  getEnrichedCart,
  removeFromSharedCart,
} from "./sharedStore.js";
import { registerAcpRoutes } from "./acpRoutes.js";
import { registerUcpRoutes } from "./ucpRoutes.js";

const app = express();
const port = Number(process.env.AGENT_API_PORT ?? 8787);
const baseUrl = process.env.ACP_BASE_URL ?? `http://127.0.0.1:${port}`;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    openai: isOpenAiReady(),
    openai_mode: isOpenAiReady() ? "live" : "deterministic_fallback",
    acp: true,
    ...agentOpenAiStatus(),
  });
});

app.get("/.well-known/shopee-acp.json", (_req, res) => {
  res.json(getCapabilityManifest());
});

registerAcpRoutes(app, baseUrl);
registerUcpRoutes(app, baseUrl);

app.post("/v1/products/search", (req, res) => {
  try {
    res.json(runProductSearch(req.body ?? {}));
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "product_search failed",
    });
  }
});

app.post("/v1/halal/verify", (req, res) => {
  try {
    const productId = String(req.body?.product_id ?? "");
    const halalRequired = req.body?.halal_required !== false;
    if (!productId) {
      res.status(400).json({ error: "product_id is required" });
      return;
    }
    res.json(verifyHalalByProductId(productId, halalRequired));
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "halal_verify failed",
    });
  }
});

app.post("/v1/products/score", (req, res) => {
  try {
    const productIds = (req.body?.product_ids ?? []) as string[];
    res.json({
      scores: scoreProductIds(productIds, {
        max_price: Number(req.body?.max_price ?? 10),
        location: String(req.body?.location ?? "Singapore"),
        halal_required: req.body?.halal_required !== false,
      }),
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "product_score failed",
    });
  }
});

app.get("/v1/payment/options", (req, res) => {
  try {
    const productId = String(req.query.product_id ?? "");
    const location = String(req.query.location ?? "Singapore");
    if (!productId) {
      res.status(400).json({ error: "product_id is required" });
      return;
    }
    res.json(getPaymentOptions(productId, location));
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "payment_options failed",
    });
  }
});

app.get("/v1/delivery/options", (req, res) => {
  try {
    const productId = String(req.query.product_id ?? "");
    const location = String(req.query.location ?? "Singapore");
    if (!productId) {
      res.status(400).json({ error: "product_id is required" });
      return;
    }
    res.json(getDeliveryOptions(productId, location));
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "delivery_options failed",
    });
  }
});

app.post("/v1/orders", (req, res) => {
  try {
    res.json(
      createOrder({
        product_id: String(req.body?.product_id ?? ""),
        payment_method: req.body?.payment_method ?? "cod",
        delivery_option_id: String(req.body?.delivery_option_id ?? "standard"),
        demo_session_id: String(req.body?.demo_session_id ?? "demo-default"),
        session_id: String(req.body?.session_id ?? "public"),
      }),
    );
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "order_create failed",
    });
  }
});

app.get("/v1/orders/:orderId/tracking", (req, res) => {
  try {
    res.json(getOrderTracking(String(req.params.orderId), String(req.query.session_id ?? "public")));
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "order_tracking failed",
    });
  }
});

app.get("/api/demo/cart", (req, res) => {
  const demoSessionId = String(req.query.demoSessionId ?? "demo-default");
  res.json(getEnrichedCart(demoSessionId));
});

app.post("/api/demo/cart/add", (req, res) => {
  try {
    const demoSessionId = String(req.body?.demoSessionId ?? "demo-default");
    const productId = String(req.body?.product_id ?? "");
    const source = req.body?.source === "agent" ? "agent" : "shop";
    const quantity = Number(req.body?.quantity ?? 1);
    if (!productId) {
      res.status(400).json({ error: "product_id is required" });
      return;
    }
    addToSharedCart(demoSessionId, productId, source, quantity);
    res.json(getEnrichedCart(demoSessionId));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to add to cart",
    });
  }
});

app.post("/api/demo/cart/remove", (req, res) => {
  try {
    const demoSessionId = String(req.body?.demoSessionId ?? "demo-default");
    const productId = String(req.body?.product_id ?? "");
    if (!productId) {
      res.status(400).json({ error: "product_id is required" });
      return;
    }
    removeFromSharedCart(demoSessionId, productId);
    res.json(getEnrichedCart(demoSessionId));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to remove from cart",
    });
  }
});

app.post("/api/demo/cart/clear-toast", (req, res) => {
  const demoSessionId = String(req.body?.demoSessionId ?? "demo-default");
  clearSharedToast(demoSessionId);
  res.json(getEnrichedCart(demoSessionId));
});

app.post("/api/agent/chat", async (req, res) => {
  try {
    const result = await handleAgentChat(req.body ?? {});
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Agent request failed",
    });
  }
});

app.post("/api/agent/transcribe", express.raw({ type: "*/*", limit: "12mb" }), async (req, res) => {
  try {
    if (!isOpenAiReady()) {
      res.status(400).json({ error: "OPENAI_API_KEY is not configured or invalid" });
      return;
    }
    const mimeType = String(req.headers["content-type"] ?? "audio/webm");
    const text = await transcribeAudio(Buffer.from(req.body), mimeType);
    res.json({ text });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Transcription failed",
    });
  }
});

app.post("/api/agent/tts", async (req, res) => {
  try {
    if (!isOpenAiReady()) {
      res.status(400).json({ error: "OPENAI_API_KEY is not configured or invalid" });
      return;
    }
    const text = String(req.body?.text ?? "").trim();
    if (!text) {
      res.status(400).json({ error: "Missing text" });
      return;
    }
    const audio = await synthesizeSpeech(text);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "TTS failed",
    });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Shopee ACP Gateway listening on http://127.0.0.1:${port}`);
  console.log(`Capability discovery: http://127.0.0.1:${port}/.well-known/shopee-acp.json`);
  console.log(`ACP bridge: http://127.0.0.1:${port}/.well-known/acp.json`);
  console.log(`UCP bridge: http://127.0.0.1:${port}/.well-known/ucp`);
});
