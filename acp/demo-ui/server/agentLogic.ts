import { toFile } from "openai";
import {
  createOrder,
  getDeliveryOptions,
  getOrderTracking,
  getPaymentOptions,
  parseShoppingIntent,
  runProductSearch,
  type GatewayProductCard,
} from "./acpGateway.js";
import { appendTrace, getTrace } from "./acpTrace.js";
import { normalizeProductCard, normalizeProductCards } from "./normalizeProduct.js";
import { getOpenAi, isOpenAiAuthError, isOpenAiReady } from "./openaiClient.js";
import { addToSharedCart, recordSharedOrder } from "./sharedStore.js";

type AgentStep =
  | "chat"
  | "picks"
  | "confirm"
  | "delivery"
  | "payment"
  | "done"
  | "tracking";

export type { GatewayProductCard as AgentProductCard };

export interface PaymentChoice {
  id: "cod" | "tokenized_card" | "bnpl" | "shopeepay_wallet";
  label: string;
  available: boolean;
  note?: string;
}

export interface DeliveryChoice {
  id: string;
  label: string;
  fee: number;
  currency: string;
  eta: string;
  reliability_score: number;
}

export interface TraceEntry {
  id: string;
  timestamp: string;
  message: string;
  detail?: string;
}

export interface AgentChatResponse {
  sessionId: string;
  step: AgentStep;
  reply: string;
  products?: GatewayProductCard[];
  selected?: GatewayProductCard;
  paymentOptions?: PaymentChoice[];
  deliveryOptions?: DeliveryChoice[];
  order?: {
    order_id: string;
    lifecycle_state: string;
    summary?: Record<string, unknown>;
  };
  tracking?: {
    current_status: string;
    expected_message: string;
    events: Array<{ step: number; label: string; completed: boolean }>;
  };
  trace?: TraceEntry[];
  filterSummary?: {
    total_found: number;
    eligible_count: number;
    rejections: Array<{ title: string; reason: string }>;
  };
  suggestions?: string[];
  cartSynced?: boolean;
}

interface SessionState {
  step: AgentStep;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  candidates: GatewayProductCard[];
  selected?: GatewayProductCard;
  deliveryOptionId?: string;
  paymentMethod?: PaymentChoice["id"];
  orderId?: string;
  acpSessionId: string;
}

const sessions = new Map<string, SessionState>();

function newSession(): SessionState {
  return {
    step: "chat",
    history: [],
    candidates: [],
    acpSessionId: crypto.randomUUID(),
  };
}

function findSelected(session: SessionState, skuId?: string) {
  if (skuId) {
    return session.candidates.find((c) => c.sku_id === skuId);
  }
  return session.selected;
}

async function polishReply(
  session: SessionState,
  userMessage: string,
  structured: Record<string, unknown>,
): Promise<string> {
  const fallback = String(
    structured.fallback ?? "Here are the best Halal noodle options for you.",
  );
  const openai = getOpenAi();
  if (!openai) return fallback;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "You are a Singapore marketplace shopping agent using the Shopee ACP protocol. " +
            "Be concise and explain Halal verification, scoring, payment, and delivery clearly. " +
            "Never invent products not in context. Ask one clear next-step question.",
        },
        ...session.history.slice(-8),
        { role: "user", content: userMessage },
        { role: "system", content: `Structured context:\n${JSON.stringify(structured, null, 2)}` },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() ?? fallback;
  } catch (error) {
    if (isOpenAiAuthError(error)) {
      console.warn("OpenAI unavailable — using deterministic demo reply.");
    }
    return fallback;
  }
}

function isTrackingQuery(text: string) {
  return /where is my order|track(ing)?|order status|delivery status/i.test(text);
}

export async function handleAgentChat(input: {
  sessionId?: string;
  demoSessionId?: string;
  message: string;
  action?:
    | "select_product"
    | "confirm"
    | "select_delivery"
    | "pay"
    | "track"
    | "cancel";
  skuId?: string;
  deliveryOptionId?: string;
  paymentMethod?: PaymentChoice["id"];
}): Promise<AgentChatResponse> {
  const sessionId = input.sessionId ?? crypto.randomUUID();
  const demoSessionId = input.demoSessionId ?? "demo-default";
  const session = sessions.get(sessionId) ?? newSession();
  sessions.set(sessionId, session);

  const text = input.message.trim();

  if (input.action === "cancel") {
    sessions.delete(sessionId);
    return {
      sessionId,
      step: "chat",
      reply: "Cancelled. Ask anytime for Halal noodles under $10 in Singapore.",
      suggestions: ["I want to buy a Halal noodles pack under $10"],
    };
  }

  if ((input.action === "track" || isTrackingQuery(text)) && session.orderId) {
    const tracking = getOrderTracking(session.orderId, session.acpSessionId);
    const reply = await polishReply(session, text || "Where is my order?", {
      fallback: tracking.expected_message,
      tracking,
    });
    session.step = "tracking";
    session.history.push({ role: "user", content: text || "Where is my order?" });
    session.history.push({ role: "assistant", content: reply });
    return {
      sessionId,
      step: "tracking",
      reply,
      tracking,
      trace: getTrace(session.acpSessionId),
      suggestions: ["Track again", "Order more noodles"],
    };
  }

  if (input.action === "select_product" && input.skuId) {
    const pick = findSelected(session, input.skuId);
    if (!pick) {
      return { sessionId, step: session.step, reply: "Please pick one of the scored cards shown." };
    }
    session.selected = pick;
    session.step = "confirm";
    addToSharedCart(demoSessionId, pick.product_id, "agent", 1);
    appendTrace(session.acpSessionId, "payment_options pending product selection complete");

    const reply = await polishReply(session, text || `I want option ${pick.rank}`, {
      fallback: `Great choice: ${pick.title} at SGD ${pick.price}. Overall score ${pick.overall_score}/100 (${pick.tier}). Added to your Shopee cart. Shall I show payment and delivery options?`,
      selected: pick,
    });
    session.history.push({ role: "user", content: text || pick.title });
    session.history.push({ role: "assistant", content: reply });
    return {
      sessionId,
      step: "confirm",
      reply,
      selected: pick,
      cartSynced: true,
      trace: getTrace(session.acpSessionId),
      suggestions: ["Yes, continue", "Show delivery options"],
    };
  }

  if (input.action === "confirm" || (/^(yes|ok|confirm|continue|go ahead)/i.test(text) && session.step === "confirm")) {
    if (!session.selected) {
      return {
        sessionId,
        step: "chat",
        reply: 'Try: "I want to buy a Halal noodles pack under $10."',
      };
    }

    const delivery = getDeliveryOptions(session.selected.product_id);
    appendTrace(session.acpSessionId, "delivery_options called");
    session.step = "delivery";

    const reply = await polishReply(session, text || "continue", {
      fallback: `Choose a delivery option for ${session.selected.title}. Standard is SGD 1.50 (2-3 days), Express is SGD 3.90 (tomorrow), Economy is free (4-5 days).`,
      deliveryOptions: delivery.options,
    });
    session.history.push({ role: "user", content: text || "continue" });
    session.history.push({ role: "assistant", content: reply });

    return {
      sessionId,
      step: "delivery",
      reply,
      selected: session.selected,
      deliveryOptions: delivery.options.map((option) => ({
        id: option.id,
        label: option.label,
        fee: option.fee,
        currency: option.currency,
        eta: option.eta,
        reliability_score: option.reliability_score,
      })),
      trace: getTrace(session.acpSessionId),
      suggestions: ["Use standard delivery", "Use express delivery", "Use economy delivery"],
    };
  }

  if (input.action === "select_delivery" && input.deliveryOptionId && session.selected) {
    session.deliveryOptionId = input.deliveryOptionId;
    const payment = getPaymentOptions(session.selected.product_id);
    appendTrace(session.acpSessionId, "payment_options called");

    const paymentOptions = payment.options.map((option) => ({
      id: option.id as PaymentChoice["id"],
      label: option.label,
      available: option.available,
      note: option.note,
    }));
    session.step = "payment";

    const deliveryLabel =
      getDeliveryOptions(session.selected.product_id).options.find(
        (o) => o.id === input.deliveryOptionId,
      )?.label ?? input.deliveryOptionId;

    const reply = await polishReply(session, text || deliveryLabel, {
      fallback: `Delivery set to ${deliveryLabel}. This seller supports card, ShopeePay wallet, COD, and BNPL where available. Which payment method would you like?`,
      paymentOptions,
    });
    session.history.push({ role: "user", content: text || deliveryLabel });
    session.history.push({ role: "assistant", content: reply });

    return {
      sessionId,
      step: "payment",
      reply,
      selected: session.selected,
      paymentOptions,
      trace: getTrace(session.acpSessionId),
      suggestions: ["Pay with COD", "Pay with card", "Use PayLater"],
    };
  }

  if (/standard delivery/i.test(text) && session.step === "delivery" && session.selected) {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      action: "select_delivery",
      deliveryOptionId: "standard",
    });
  }
  if (/express delivery/i.test(text) && session.step === "delivery" && session.selected) {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      action: "select_delivery",
      deliveryOptionId: "express",
    });
  }
  if (/economy delivery/i.test(text) && session.step === "delivery" && session.selected) {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      action: "select_delivery",
      deliveryOptionId: "economy",
    });
  }

  if (input.action === "pay" && input.paymentMethod && session.selected && session.deliveryOptionId) {
    session.paymentMethod = input.paymentMethod;
    const created = createOrder({
      product_id: session.selected.product_id,
      payment_method: input.paymentMethod,
      delivery_option_id: session.deliveryOptionId,
      demo_session_id: demoSessionId,
      session_id: session.acpSessionId,
    });

    session.orderId = created.order_id;
    session.step = "done";

    recordSharedOrder(demoSessionId, {
      order_id: created.order_id,
      lifecycle_state: created.lifecycle_state,
      product_id: session.selected.product_id,
      title: session.selected.title,
      payment_method: input.paymentMethod,
    });

    const reply = await polishReply(session, text || `pay with ${input.paymentMethod}`, {
      fallback: `Order placed successfully. Order ID: ${created.order_id}. Total SGD ${created.summary.total} (${created.summary.product}, ${created.summary.delivery}, ${created.summary.payment}). Halal Status: Verified Halal Certified.`,
      order: created,
    });
    session.history.push({ role: "user", content: text || input.paymentMethod });
    session.history.push({ role: "assistant", content: reply });

    return {
      sessionId,
      step: "done",
      reply,
      selected: session.selected,
      order: {
        order_id: created.order_id,
        lifecycle_state: created.lifecycle_state,
        summary: created.summary,
      },
      trace: getTrace(session.acpSessionId),
      cartSynced: true,
      suggestions: ["Where is my order?", "Order more noodles"],
    };
  }

  if (/cod/i.test(text) && session.step === "payment") {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      action: "pay",
      paymentMethod: "cod",
      deliveryOptionId: session.deliveryOptionId,
    });
  }
  if (/card|wallet|shopeepay/i.test(text) && session.step === "payment") {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      action: "pay",
      paymentMethod: /wallet|shopeepay/i.test(text) ? "shopeepay_wallet" : "tokenized_card",
      deliveryOptionId: session.deliveryOptionId,
    });
  }
  if (/paylater|bnpl|installment/i.test(text) && session.step === "payment") {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      action: "pay",
      paymentMethod: "bnpl",
      deliveryOptionId: session.deliveryOptionId,
    });
  }

  const intent = parseShoppingIntent(text || "I want to buy a Halal noodles pack under $10");
  const search = runProductSearch({ ...intent, session_id: session.acpSessionId });
  const products = normalizeProductCards(search.products);
  session.candidates = products;
  session.step = "picks";

  const reply = await polishReply(session, text || "Halal noodles under $10", {
    fallback:
      products.length > 0
        ? `I searched via Shopee ACP and found ${search.total_found} noodle products. After Halal verification and hard filters, ${search.eligible_count} qualified — here are the top ${products.length} explainable picks.`
        : "No eligible Halal noodles matched your constraints in Singapore.",
    products,
    filterSummary: {
      total_found: search.total_found,
      eligible_count: search.eligible_count,
      rejections: search.rejections.slice(0, 6),
    },
  });

  session.history.push({ role: "user", content: text || "Halal noodles under $10" });
  session.history.push({ role: "assistant", content: reply });

  return {
    sessionId,
    step: "picks",
    reply,
    products,
    filterSummary: {
      total_found: search.total_found,
      eligible_count: search.eligible_count,
      rejections: search.rejections.slice(0, 8),
    },
    trace: search.trace,
    suggestions: products.length
      ? [`I'll go with option ${products[0]?.rank}`, "Which has the best Halal score?", "Show cheaper options"]
      : ["I want to buy a Halal noodles pack under $10"],
  };
}

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  const openai = getOpenAi();
  if (!openai) {
    throw new Error("Voice input requires a valid OPENAI_API_KEY");
  }

  try {
    const file = await toFile(buffer, "speech.webm", { type: mimeType || "audio/webm" });
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });
    return result.text.trim();
  } catch (error) {
    if (isOpenAiAuthError(error)) {
      throw new Error("OpenAI voice transcription is unavailable — check OPENAI_API_KEY");
    }
    throw error;
  }
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const openai = getOpenAi();
  if (!openai) {
    throw new Error("Voice output requires a valid OPENAI_API_KEY");
  }

  try {
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text.slice(0, 800),
    });
    return Buffer.from(await speech.arrayBuffer());
  } catch (error) {
    if (isOpenAiAuthError(error)) {
      throw new Error("OpenAI text-to-speech is unavailable — check OPENAI_API_KEY");
    }
    throw error;
  }
}

export function agentOpenAiStatus() {
  return { configured: isOpenAiReady() };
}
