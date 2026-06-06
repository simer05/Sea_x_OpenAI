import { toFile } from "openai";
import {
  createOrder,
  getCatalogProduct,
  getDeliveryOptions,
  getOrderTracking,
  getPaymentOptions,
  getProductCard,
  parseShoppingIntent,
  runProductSearch,
  type GatewayProductCard,
} from "./acpGateway.js";
import { appendTrace, getTrace } from "./acpTrace.js";
import {
  deliveryReply,
  orderReply,
  paymentReply,
  picksReply,
  selectReply,
  trackingReply,
} from "./demoReplies.js";
import { normalizeProductCards } from "./normalizeProduct.js";
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
  _session: SessionState,
  _userMessage: string,
  structured: Record<string, unknown>,
): Promise<string> {
  return String(structured.fallback ?? "Here are the best Halal noodle options for you.");
}

function isTrackingQuery(text: string) {
  return /where is my order|track(ing)?|order status|delivery status/i.test(text);
}

function isNewSearchRequest(text: string) {
  return /^(start a new search|new search|search again|shop again)$/i.test(text.trim());
}

function parseDeliveryId(text: string): string | null {
  if (/\b(standard|regular)\b/i.test(text)) return "standard";
  if (/\bexpress\b/i.test(text)) return "express";
  if (/\beconomy\b/i.test(text)) return "economy";
  return null;
}

function matchProductFromText(
  session: SessionState,
  text: string,
): GatewayProductCard | undefined {
  if (!session.candidates.length) return undefined;
  const optionMatch = text.match(/(?:option|#|pick|number)\s*(\d+)/i) ?? text.match(/^(\d+)$/);
  if (optionMatch) {
    const rank = Number(optionMatch[1]);
    return session.candidates.find((c) => c.rank === rank);
  }
  const stripped = text
    .replace(/^(i'?ll take|i will take|i want|pick|choose|select|go with|get)\s+/i, "")
    .trim();
  const needle = (stripped.length > 3 ? stripped : text).toLowerCase();
  return session.candidates.find(
    (c) =>
      needle.includes(c.title.toLowerCase()) ||
      c.title.toLowerCase().includes(needle) ||
      (needle.length > 8 && c.title.toLowerCase().startsWith(needle.slice(0, 12))),
  );
}

function isShoppingQuery(text: string, session: SessionState) {
  if (isTrackingQuery(text) || isNewSearchRequest(text)) return false;
  if (/^(i'?ll take|use |pay with)/i.test(text.trim())) return false;
  if (parseDeliveryId(text) && session.selected) return false;
  if (matchProductFromText(session, text)) return false;
  return (
    /(buy|want|need|looking for|search for|show me|find me)/i.test(text) ||
    (/(under|below|\$|sgd)\s*\d/i.test(text) && /(halal|noodle|snack|food|grocery)/i.test(text))
  );
}

function resetCheckoutState(session: SessionState, preserveOrderId = false) {
  session.selected = undefined;
  session.deliveryOptionId = undefined;
  session.paymentMethod = undefined;
  if (!preserveOrderId) session.orderId = undefined;
  session.candidates = [];
}

function parsePaymentMethod(text: string): PaymentChoice["id"] | null {
  if (/cod|cash on delivery/i.test(text)) return "cod";
  if (/wallet|shopeepay/i.test(text)) return "shopeepay_wallet";
  if (/paylater|bnpl|installment/i.test(text)) return "bnpl";
  if (/\bcard\b/i.test(text)) return "tokenized_card";
  return null;
}

function restoreClientContext(
  session: SessionState,
  input: {
    orderId?: string;
    clientStep?: string;
    skuId?: string;
    deliveryOptionId?: string;
    clientProducts?: Array<Partial<GatewayProductCard>>;
  },
) {
  if (input.orderId) session.orderId = input.orderId;
  if (input.deliveryOptionId) session.deliveryOptionId = input.deliveryOptionId;

  if (input.clientProducts?.length && !session.candidates.length) {
    session.candidates = normalizeProductCards(input.clientProducts);
  }

  if (input.skuId && !session.selected) {
    let pick = session.candidates.find((c) => c.sku_id === input.skuId);
    if (!pick) {
      const catalog = getCatalogProduct(input.skuId);
      if (catalog) {
        const card = getProductCard(catalog.product_id);
        if (card) {
          pick = card;
          if (!session.candidates.some((c) => c.sku_id === pick!.sku_id)) {
            session.candidates.push(pick);
          }
        }
      }
    }
    if (pick) session.selected = pick;
  }

  const step = input.clientStep;
  if (
    step &&
    (step === "picks" ||
      step === "delivery" ||
      step === "payment" ||
      step === "done" ||
      step === "tracking")
  ) {
    session.step = step;
  }
}

export async function handleAgentChat(input: {
  sessionId?: string;
  demoSessionId?: string;
  message: string;
  orderId?: string;
  clientStep?: string;
  skuId?: string;
  deliveryOptionId?: string;
  clientProducts?: Array<Partial<GatewayProductCard>>;
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

  restoreClientContext(session, input);

  const text = input.message.trim();
  const resolvedOrderId = session.orderId ?? input.orderId;

  if (input.action === "cancel" || isNewSearchRequest(text)) {
    sessions.delete(sessionId);
    const freshSessionId = crypto.randomUUID();
    return {
      sessionId: freshSessionId,
      step: "chat",
      reply: "Fresh start — tell me what you'd like to shop for.",
      suggestions: [],
    };
  }

  if ((input.action === "track" || isTrackingQuery(text)) && resolvedOrderId) {
    session.orderId = resolvedOrderId;
    const tracking = getOrderTracking(resolvedOrderId, session.acpSessionId);
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
      suggestions: ["Where is my order?", "Start a new search"],
    };
  }

  if (input.action === "select_product" && input.skuId) {
    const pick = findSelected(session, input.skuId);
    if (!pick) {
      return { sessionId, step: session.step, reply: "Please pick one of the cards shown." };
    }
    session.selected = pick;
    addToSharedCart(demoSessionId, pick.product_id, "agent", 1);

    const delivery = getDeliveryOptions(pick.product_id);
    appendTrace(session.acpSessionId, "delivery_options called");
    session.step = "delivery";

    const reply = await polishReply(session, text || `I want option ${pick.rank}`, {
      fallback: selectReply(pick) + " " + deliveryReply(pick.title),
    });
    session.history.push({ role: "user", content: text || pick.title });
    session.history.push({ role: "assistant", content: reply });
    return {
      sessionId,
      step: "delivery",
      reply,
      selected: pick,
      cartSynced: true,
      deliveryOptions: delivery.options.map((option) => ({
        id: option.id,
        label: option.label,
        fee: option.fee,
        currency: option.currency,
        eta: option.eta,
        reliability_score: option.reliability_score,
      })),
      suggestions: [],
    };
  }

  if (input.action === "confirm" || (/^(yes|ok|confirm|continue|go ahead)/i.test(text) && session.step === "confirm")) {
    if (!session.selected) {
      return {
        sessionId,
        step: "chat",
        reply: "Tell me what you're looking for — product, budget, Halal preference, and city.",
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
      suggestions: [],
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
      fallback: `Delivery set to ${deliveryLabel}. ${paymentReply(session.selected.title)}`,
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
      suggestions: [],
    };
  }

  const typedDelivery = parseDeliveryId(text);
  if (typedDelivery && session.selected && !session.deliveryOptionId) {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      orderId: input.orderId,
      action: "select_delivery",
      deliveryOptionId: typedDelivery,
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
      fallback: orderReply(created.order_id, Number(created.summary.total)),
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
      suggestions: ["Where is my order?", "Start a new search"],
    };
  }

  const typedPayment = parsePaymentMethod(text);
  if (
    (input.action === "pay" || typedPayment) &&
    session.selected &&
    session.deliveryOptionId &&
    (input.paymentMethod ?? typedPayment)
  ) {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      orderId: input.orderId,
      clientStep: input.clientStep,
      skuId: input.skuId ?? session.selected.sku_id,
      deliveryOptionId: session.deliveryOptionId,
      action: "pay",
      paymentMethod: input.paymentMethod ?? typedPayment!,
    });
  }

  if (!text) {
    return {
      sessionId,
      step: "chat",
      reply: "Type your request in the chat — what product, budget, Halal preference, and city?",
      suggestions: [],
    };
  }

  const typedPick = matchProductFromText(session, text);
  if (typedPick && (session.step === "picks" || session.step === "chat") && !session.selected) {
    return handleAgentChat({
      sessionId,
      demoSessionId,
      message: text,
      orderId: input.orderId,
      action: "select_product",
      skuId: typedPick.sku_id,
    });
  }

  if (isTrackingQuery(text)) {
    return {
      sessionId,
      step: session.step === "done" ? "done" : "chat",
      reply:
        'I do not have an order to track yet. Complete checkout first, then ask "Where is my order?"',
      suggestions: session.orderId ? ["Where is my order?"] : [],
    };
  }

  if (session.step === "done" || session.step === "tracking" || session.step === "payment" || session.step === "delivery") {
    if (isShoppingQuery(text, session)) {
      resetCheckoutState(session, true);
    }
  }

  const intent = parseShoppingIntent(text);
  const search = runProductSearch({ ...intent, session_id: session.acpSessionId });
  const products = normalizeProductCards(search.products);
  session.candidates = products;
  session.step = "picks";

  const reply = await polishReply(session, text, {
    fallback: picksReply(search.total_found, search.eligible_count, products),
    products,
    filterSummary: {
      total_found: search.total_found,
      eligible_count: search.eligible_count,
      rejections: search.rejections.slice(0, 6),
    },
  });

  session.history.push({ role: "user", content: text });
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
    suggestions: [],
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
