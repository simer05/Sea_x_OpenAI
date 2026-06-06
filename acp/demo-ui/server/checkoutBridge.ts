import { catalogById } from "./catalogLoader.js";
import { createOrder, getDeliveryOptions, getGatewayOrder, getPaymentOptions } from "./acpGateway.js";
import { emitOrderEvent } from "./orderWebhooks.js";
import { acpPaymentHandlers, protocolKitPaymentHandlers } from "./paymentHandlers.js";

export type CheckoutStatus =
  | "not_ready_for_payment"
  | "ready_for_payment"
  | "completed"
  | "canceled";

export type BridgeCheckoutSession = {
  id: string;
  product_id: string;
  quantity: number;
  currency: string;
  delivery_option_id: string;
  payment_method?: "cod" | "tokenized_card" | "bnpl" | "shopeepay_wallet";
  payment_token?: string;
  status: CheckoutStatus;
  order_id?: string;
  demo_session_id: string;
  acp_session_id: string;
  created_at: string;
  updated_at: string;
};

const sessions = new Map<string, BridgeCheckoutSession>();

const ACP_VERSION = "2026-04-17";
const UCP_VERSION = "2026-04-08";

function minorUnits(amount: number, currency: string) {
  const decimals = currency === "IDR" || currency === "VND" ? 0 : 2;
  const factor = decimals === 0 ? 1 : 100;
  return Math.round(amount * factor);
}

function fromMinorUnits(amount: number, currency: string) {
  const decimals = currency === "IDR" || currency === "VND" ? 0 : 2;
  const factor = decimals === 0 ? 1 : 100;
  return amount / factor;
}

function lineItem(productId: string, quantity: number) {
  const product = catalogById.get(productId);
  if (!product) throw new Error(`Unknown product_id ${productId}`);
  const unitMinor = minorUnits(product.price, product.currency);
  return {
    id: product.product_id,
    product_id: product.product_id,
    title: product.title,
    quantity,
    base_amount: unitMinor,
    subtotal: unitMinor * quantity,
    currency: product.currency,
  };
}

function deliveryMinor(productId: string, deliveryOptionId: string) {
  const delivery = getDeliveryOptions(productId).options.find((o) => o.id === deliveryOptionId);
  if (!delivery) return 0;
  const product = catalogById.get(productId)!;
  return minorUnits(delivery.fee, product.currency);
}

function buildTotals(productId: string, quantity: number, deliveryOptionId: string) {
  const product = catalogById.get(productId)!;
  const item = lineItem(productId, quantity);
  const shipping = deliveryMinor(productId, deliveryOptionId);
  const subtotal = item.subtotal;
  const total = subtotal + shipping;
  return {
    currency: product.currency,
    subtotal,
    shipping,
    tax: 0,
    total,
    items: [{ type: "subtotal", amount: subtotal }, { type: "fulfillment", amount: shipping }, { type: "total", amount: total }],
  };
}

function seaExtensions(productId: string) {
  const product = catalogById.get(productId);
  if (!product) return {};
  return {
    "dev.acpsea.compliance": {
      halal_status: product.halal_status,
      bpom_status: product.bpom_status,
      city: product.city,
      country: product.country,
    },
  };
}

export function createCheckoutSession(input: {
  items?: Array<{ product_id?: string; id?: string; quantity?: number }>;
  line_items?: Array<{ product_id?: string; id?: string; quantity?: number }>;
  delivery_option_id?: string;
  selected_fulfillment_options?: Array<{ id: string }>;
  demo_session_id?: string;
  session_id?: string;
}) {
  const rows = input.items ?? input.line_items ?? [];
  const first = rows[0];
  const productId = String(first?.product_id ?? first?.id ?? "");
  if (!productId) throw new Error("items[0].product_id is required");

  const quantity = Number(first?.quantity ?? 1);
  const product = catalogById.get(productId);
  if (!product) throw new Error(`Unknown product_id ${productId}`);

  const deliveryOptionId =
    input.delivery_option_id ??
    input.selected_fulfillment_options?.[0]?.id ??
    "standard";

  const id = `cs_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();
  const session: BridgeCheckoutSession = {
    id,
    product_id: productId,
    quantity,
    currency: product.currency,
    delivery_option_id: deliveryOptionId,
    status: "ready_for_payment",
    demo_session_id: input.demo_session_id ?? "demo-default",
    acp_session_id: input.session_id ?? "public",
    created_at: now,
    updated_at: now,
  };
  sessions.set(id, session);
  return session;
}

export function getCheckoutSession(id: string) {
  const session = sessions.get(id);
  if (!session) throw new Error("checkout_session_not_found");
  return session;
}

export function updateCheckoutSession(
  id: string,
  input: {
    delivery_option_id?: string;
    selected_fulfillment_options?: Array<{ id: string }>;
    payment_method?: BridgeCheckoutSession["payment_method"];
  },
) {
  const session = getCheckoutSession(id);
  if (session.status === "completed" || session.status === "canceled") {
    throw new Error("checkout_session_not_mutable");
  }
  if (input.delivery_option_id) session.delivery_option_id = input.delivery_option_id;
  if (input.selected_fulfillment_options?.[0]?.id) {
    session.delivery_option_id = input.selected_fulfillment_options[0].id;
  }
  if (input.payment_method) session.payment_method = input.payment_method;
  session.updated_at = new Date().toISOString();
  sessions.set(id, session);
  return session;
}

export function cancelCheckoutSession(id: string) {
  const session = getCheckoutSession(id);
  if (session.status === "completed") throw new Error("checkout_already_completed");
  session.status = "canceled";
  session.updated_at = new Date().toISOString();
  sessions.set(id, session);
  return session;
}

export function completeCheckoutSession(
  id: string,
  input: {
    payment_data?: {
      handler_id?: string;
      payment_method?: string;
      instrument?: { credential?: { type?: string; token?: string } };
    };
    payment_method?: string;
    demo_session_id?: string;
    session_id?: string;
  },
) {
  const session = getCheckoutSession(id);
  if (session.status === "canceled") throw new Error("checkout_session_canceled");
  if (session.status === "completed" && session.order_id) {
    const richOrder = buildRichOrder(session.order_id, session.id);
    return { session, order: { order_id: session.order_id }, richOrder };
  }

  const handlerId = input.payment_data?.handler_id ?? "";
  const token = input.payment_data?.instrument?.credential?.token;
  const method =
    (input.payment_method as BridgeCheckoutSession["payment_method"]) ??
    mapHandlerToMethod(handlerId, input.payment_data?.payment_method);

  if ((handlerId === "card_tokenized" || method === "tokenized_card") && !token && !session.payment_token) {
    throw new Error("requires_delegate_payment");
  }

  if (token) session.payment_token = token;

  const payMethod = method ?? session.payment_method ?? "cod";
  const created = createOrder({
    product_id: session.product_id,
    payment_method: payMethod,
    delivery_option_id: session.delivery_option_id,
    demo_session_id: input.demo_session_id ?? session.demo_session_id,
    session_id: input.session_id ?? session.acp_session_id,
  });

  session.status = "completed";
  session.payment_method = payMethod;
  session.order_id = created.order_id;
  session.updated_at = new Date().toISOString();
  sessions.set(id, session);

  const richOrder = buildRichOrder(created.order_id, session.id);
  emitOrderEvent("order_create", richOrder);
  emitOrderEvent("order_update", richOrder);

  return { session, order: created, richOrder };
}

function mapHandlerToMethod(handlerId: string, fallback?: string): BridgeCheckoutSession["payment_method"] {
  const raw = (fallback ?? handlerId).toLowerCase();
  if (raw.includes("cod")) return "cod";
  if (raw.includes("bnpl") || raw.includes("paylater")) return "bnpl";
  if (raw.includes("wallet") || raw.includes("shopeepay")) return "shopeepay_wallet";
  if (raw.includes("card") || raw.includes("tokenized")) return "tokenized_card";
  return "cod";
}

export function delegatePayment(input: {
  allowance: {
    checkout_session_id: string;
    merchant_id: string;
    max_amount: number;
    currency: string;
    expires_at?: string;
  };
  credential?: { type?: string };
}) {
  const sessionId = input.allowance.checkout_session_id;
  const session = sessions.get(sessionId);
  if (!session) throw new Error("unknown_checkout_session");

  const token = `vt_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  session.payment_token = token;
  session.updated_at = new Date().toISOString();
  sessions.set(sessionId, session);

  return {
    id: token,
    type: "shared_payment_token",
    allowance: input.allowance,
    created_at: new Date().toISOString(),
    credential_type: input.credential?.type ?? "fpan",
  };
}

export function buildRichOrder(orderId: string, checkoutSessionId?: string) {
  const order = getGatewayOrder(orderId);
  const product = catalogById.get(order.product_id)!;
  const subtotalMinor = minorUnits(order.price, order.currency);
  const shippingMinor = minorUnits(order.delivery_fee, order.currency);
  const totalMinor = minorUnits(order.total, order.currency);

  return {
    id: order.order_id,
    checkout_session_id: checkoutSessionId,
    order_number: order.order_id,
    status: order.lifecycle_state,
    currency: order.currency,
    line_items: [
      {
        id: order.product_id,
        product_id: order.product_id,
        title: order.title,
        quantity: { ordered: 1, current: 1, fulfilled: 0 },
        base_amount: subtotalMinor,
        total: subtotalMinor,
      },
    ],
    fulfillments: [
      {
        id: `ful_${order.order_id}`,
        status: "processing",
        events: [{ label: "Order placed", completed: true }],
      },
    ],
    totals: [
      { type: "subtotal", amount: subtotalMinor },
      { type: "fulfillment", amount: shippingMinor },
      { type: "total", amount: totalMinor },
    ],
    payment_method: order.payment_method,
    halal_status: order.halal_status,
    permalink_url: productUrl(order.product_id),
    placed_at: order.placed_at,
    extensions: seaExtensions(order.product_id),
  };
}

function productUrl(productId: string) {
  return `/?highlight=${productId}`;
}

export function toAcpCheckoutResponse(session: BridgeCheckoutSession) {
  const product = catalogById.get(session.product_id)!;
  const item = lineItem(session.product_id, session.quantity);
  const totals = buildTotals(session.product_id, session.quantity, session.delivery_option_id);
  const delivery = getDeliveryOptions(session.product_id);

  return {
    id: session.id,
    protocol: { name: "acp", version: ACP_VERSION },
    status: session.status,
    currency: session.currency.toLowerCase(),
    line_items: [
      {
        id: item.id,
        title: item.title,
        quantity: session.quantity,
        base_amount: item.base_amount,
        subtotal: item.subtotal,
      },
    ],
    fulfillment_options: delivery.options.map((o) => ({
      id: o.id,
      label: o.label,
      amount: minorUnits(o.fee, product.currency),
      eta: o.eta,
    })),
    selected_fulfillment_options: [{ id: session.delivery_option_id }],
    totals: totals.items,
    capabilities: {
      payment: { handlers: acpPaymentHandlers() },
      extensions: [
        { name: "dev.acpsea.compliance", spec: "https://acp-sea.demo/dev.acpsea.compliance" },
        { name: "dev.acpsea.marketplace", spec: "https://acp-sea.demo/dev.acpsea.marketplace" },
      ],
    },
    payment_handlers: protocolKitPaymentHandlers(),
    extensions: seaExtensions(session.product_id),
    messages: [],
    ...(session.order_id
      ? {
          order: {
            id: session.order_id,
            checkout_session_id: session.id,
            permalink_url: productUrl(session.product_id),
          },
        }
      : {}),
  };
}

export function toUcpCheckoutResponse(session: BridgeCheckoutSession) {
  const product = catalogById.get(session.product_id)!;
  const totals = buildTotals(session.product_id, session.quantity, session.delivery_option_id);
  const delivery = getDeliveryOptions(session.product_id);
  const payment = getPaymentOptions(session.product_id);

  const statusMap: Record<CheckoutStatus, string> = {
    not_ready_for_payment: "incomplete",
    ready_for_payment: "ready_for_complete",
    completed: "completed",
    canceled: "canceled",
  };

  return {
    ucp: {
      version: UCP_VERSION,
      capabilities: {
        "dev.ucp.shopping.checkout": { version: UCP_VERSION },
        "dev.ucp.shopping.fulfillment": { version: UCP_VERSION },
        "dev.acpsea.compliance": { version: "1.0.0" },
      },
    },
    id: session.id,
    status: statusMap[session.status],
    currency: session.currency,
    line_items: [
      {
        id: session.product_id,
        title: product.title,
        quantity: session.quantity,
        price: { amount: minorUnits(product.price, product.currency), currency: session.currency },
      },
    ],
    fulfillment_options: delivery.options.map((o) => ({
      id: o.id,
      label: o.label,
      price: { amount: minorUnits(o.fee, product.currency), currency: product.currency },
      eta: o.eta,
    })),
    payment_handlers: payment.options.map((o) => ({
      id: o.id,
      label: o.label,
      available: o.available,
    })),
    totals: totals.items.map((t) => ({ type: t.type, amount: { amount: t.amount, currency: session.currency } })),
    extensions: seaExtensions(session.product_id),
    ...(session.order_id ? { order: { id: session.order_id, permalink_url: productUrl(session.product_id) } } : {}),
  };
}

export function getAcpWellKnown(baseUrl: string) {
  return {
    protocol: {
      name: "acp",
      version: ACP_VERSION,
      supported_versions: ["2026-04-17", "2026-01-30", "2025-12-12"],
    },
    api_base_url: `${baseUrl}/acp/v1`,
    transports: ["rest"],
    capabilities: {
      services: ["checkout", "orders", "delegate_payment", "carts"],
      extensions: [
        { name: "dev.acpsea.compliance", spec: "https://acp-sea.demo/dev.acpsea.compliance" },
        { name: "dev.acpsea.marketplace", spec: "https://acp-sea.demo/dev.acpsea.marketplace" },
        { name: "dev.acpsea.cod", spec: "https://acp-sea.demo/dev.acpsea.cod" },
      ],
      intervention_types: [],
      supported_currencies: ["sgd", "idr", "myr", "php", "thb", "vnd"],
      supported_locales: ["en-SG", "en-US"],
    },
  };
}

export function getUcpWellKnown(baseUrl: string) {
  return {
    ucp: {
      version: UCP_VERSION,
      services: {
        "dev.ucp.shopping": {
          version: UCP_VERSION,
          endpoint: `${baseUrl}/ucp/v1`,
          transport: ["rest"],
        },
      },
      capabilities: {
        "dev.ucp.shopping.checkout": { version: UCP_VERSION, schema: "https://ucp.dev/2026-04-08/schemas/shopping/checkout.json" },
        "dev.ucp.shopping.cart": { version: UCP_VERSION },
        "dev.ucp.shopping.order": { version: UCP_VERSION },
        "dev.ucp.common.identity_linking": { version: UCP_VERSION },
        "dev.acpsea.compliance": { version: "1.0.0" },
      },
      payment_handlers: acpPaymentHandlers(),
    },
  };
}

export function clearCheckoutSessions() {
  sessions.clear();
}
