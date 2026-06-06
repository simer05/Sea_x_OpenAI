import assert from "node:assert/strict";
import {
  createOrder,
  getCapabilityManifest,
  getDeliveryOptions,
  getOrderTracking,
  getPaymentOptions,
  runProductSearch,
} from "./acpGateway.js";
import { handleAgentChat } from "./agentLogic.js";
import {
  buildRichOrder,
  cancelCheckoutSession,
  clearCheckoutSessions,
  completeCheckoutSession,
  createCheckoutSession,
  delegatePayment,
  getAcpWellKnown,
  getCheckoutSession,
  getUcpWellKnown,
  toAcpCheckoutResponse,
  toUcpCheckoutResponse,
  updateCheckoutSession,
} from "./checkoutBridge.js";
import { clearOrderWebhookEvents, listOrderWebhookEvents } from "./orderWebhooks.js";
import { clearIdempotencyStore } from "./idempotency.js";

async function smokeJudgeFlow() {
  const manifest = getCapabilityManifest();
  assert.equal(manifest.capabilities.length, 7);
  assert.ok(manifest.capabilities.includes("order_tracking"));

  const search = runProductSearch({
    query: "noodles",
    max_price: 10,
    currency: "SGD",
    category: "groceries",
    halal_required: true,
    location: "Singapore",
    session_id: "smoke-test",
  });

  assert.equal(search.total_found, 12);
  assert.ok(search.eligible_count >= 3);
  assert.equal(search.products.length, 3);
  assert.ok(search.products[0]?.score_breakdown?.halal_trust === 25);
  assert.ok(search.rejections.length >= 5);

  const top = search.products[0];
  const payment = getPaymentOptions(top.product_id, "Singapore");
  assert.ok(payment.options.length >= 4);

  const delivery = getDeliveryOptions(top.product_id, "Singapore");
  assert.equal(delivery.options.length, 3);

  const order = createOrder({
    product_id: top.product_id,
    payment_method: "cod",
    delivery_option_id: "standard",
    demo_session_id: "smoke-test",
    session_id: "smoke-test",
  });
  assert.match(order.order_id, /^ACP-SHP-/);
  assert.equal(order.summary.halal_status, "Verified Halal Certified");

  const tracking = getOrderTracking(order.order_id, "smoke-test");
  assert.ok(tracking.events.length >= 1);
  assert.ok(tracking.current_status.length > 0);
}

async function smokeAcpUcpBridge() {
  clearCheckoutSessions();
  clearOrderWebhookEvents();
  clearIdempotencyStore();

  const base = "http://127.0.0.1:8787";
  const acp = getAcpWellKnown(base);
  assert.equal(acp.protocol.name, "acp");
  assert.equal(acp.protocol.version, "2026-04-17");
  assert.ok(acp.capabilities.services.includes("checkout"));

  const ucp = getUcpWellKnown(base);
  assert.equal(ucp.ucp.version, "2026-04-08");
  assert.ok(ucp.ucp.capabilities["dev.ucp.shopping.checkout"]);

  const search = runProductSearch({
    query: "noodles",
    max_price: 10,
    currency: "SGD",
    category: "groceries",
    halal_required: true,
    location: "Singapore",
    session_id: "bridge-smoke",
  });
  const productId = search.products[0]!.product_id;

  const session = createCheckoutSession({
    items: [{ product_id: productId, quantity: 1 }],
    delivery_option_id: "standard",
    demo_session_id: "bridge-smoke",
    session_id: "bridge-smoke",
  });
  assert.match(session.id, /^cs_/);
  assert.equal(session.status, "ready_for_payment");

  const acpView = toAcpCheckoutResponse(session);
  assert.equal(acpView.protocol.name, "acp");
  assert.ok(acpView.payment_handlers?.length >= 3);
  assert.ok(acpView.capabilities.payment.handlers.length >= 4);
  assert.ok(acpView.line_items[0].base_amount > 0);

  const ucpView = toUcpCheckoutResponse(session);
  assert.equal(ucpView.status, "ready_for_complete");
  assert.ok(ucpView.totals.some((t) => t.type === "total"));

  updateCheckoutSession(session.id, { payment_method: "cod" });
  const updated = getCheckoutSession(session.id);
  assert.equal(updated.payment_method, "cod");

  const delegated = delegatePayment({
    allowance: {
      checkout_session_id: session.id,
      merchant_id: "acct_shopee_acp_sea_demo",
      max_amount: 1500,
      currency: "sgd",
    },
  });
  assert.match(delegated.id, /^vt_/);
  assert.equal(delegated.type, "shared_payment_token");

  const completed = completeCheckoutSession(session.id, {
    payment_method: "cod",
    demo_session_id: "bridge-smoke",
    session_id: "bridge-smoke",
  });
  assert.equal(completed.session.status, "completed");
  assert.ok(completed.session.order_id);
  assert.match(completed.session.order_id!, /^ACP-SHP-/);

  const rich = buildRichOrder(completed.session.order_id!, session.id);
  assert.equal(rich.id, completed.session.order_id);
  assert.ok(rich.totals.length >= 2);

  const events = listOrderWebhookEvents(5);
  assert.ok(events.length >= 2);
  assert.equal(events[0]?.type, "order_create");

  const canceledSession = createCheckoutSession({
    items: [{ product_id: productId, quantity: 1 }],
  });
  const canceled = cancelCheckoutSession(canceledSession.id);
  assert.equal(canceled.status, "canceled");
}

async function smokeAgentChatWithoutOpenAi() {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const response = await handleAgentChat({
      message: "I want to buy a Halal noodles pack under $10",
      demoSessionId: "smoke-agent",
    });

    assert.equal(response.step, "picks");
    assert.ok(response.reply.length > 0);
    assert.equal(response.products?.length, 3);
    assert.ok(response.products?.[0]?.score_breakdown?.halal_trust === 25);
    assert.ok(response.trace && response.trace.length > 0);
  } finally {
    if (previous) process.env.OPENAI_API_KEY = previous;
  }
}

async function smokeAgentChatWithInvalidOpenAi() {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-invalid-demo-key-xxxxxxxxxxxxxxxxxxxx";

  try {
    const response = await handleAgentChat({
      message: "I want to buy a Halal noodles pack under $10",
      demoSessionId: "smoke-agent-invalid",
    });

    assert.equal(response.step, "picks");
    assert.ok(response.reply.includes("Found") || response.reply.includes("Halal"));
    assert.equal(response.products?.length, 3);
  } finally {
    if (previous) process.env.OPENAI_API_KEY = previous;
    else delete process.env.OPENAI_API_KEY;
  }
}

async function smokeAgentNaturalLanguageFlow() {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    let sessionId = crypto.randomUUID();
    const demoSessionId = "smoke-nl";

    const picks = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "I want to buy halal noodles under 10 dollar",
    });
    sessionId = picks.sessionId;
    assert.equal(picks.step, "picks");
    const top = picks.products?.[0];
    assert.ok(top?.title);

    const selected = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: `I'll take ${top!.title}`,
    });
    assert.equal(selected.step, "delivery");
    assert.ok(selected.deliveryOptions?.length);

    const delivery = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "Use standard delivery",
    });
    assert.equal(delivery.step, "payment");
    assert.ok(delivery.paymentOptions?.length);

    const paid = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "Pay with shopeepay_wallet",
    });
    assert.equal(paid.step, "done");
    assert.ok(paid.order?.order_id);

    const track1 = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "Where is my order?",
      orderId: paid.order?.order_id,
    });
    assert.equal(track1.step, "tracking");
    assert.ok(track1.tracking?.current_status);

    const track2 = await handleAgentChat({
      sessionId: crypto.randomUUID(),
      demoSessionId,
      message: "Where is my order?",
      orderId: paid.order?.order_id,
      clientStep: "done",
    });
    assert.equal(track2.step, "tracking");
    assert.ok(track2.tracking?.current_status);
  } finally {
    if (previous) process.env.OPENAI_API_KEY = previous;
  }
}

async function smokeAgentTrackingAfterNewSearch() {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    let sessionId = crypto.randomUUID();
    const demoSessionId = "smoke-tracking";

    const picks = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "I want to buy a Halal noodles pack under $10",
    });
    sessionId = picks.sessionId;
    const sku = picks.products?.[0]?.sku_id;
    assert.ok(sku);

    await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "pick",
      action: "select_product",
      skuId: sku,
    });
    await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "standard",
      action: "select_delivery",
      deliveryOptionId: "standard",
    });
    const paid = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "cod",
      action: "pay",
      paymentMethod: "cod",
      deliveryOptionId: "standard",
    });
    assert.equal(paid.step, "done");
    assert.ok(paid.order?.order_id);

    const newSearch = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "I want halal snacks under 5 dollars",
    });
    assert.equal(newSearch.step, "picks");

    const tracking = await handleAgentChat({
      sessionId,
      demoSessionId,
      message: "Where is my order?",
    });
    assert.equal(tracking.step, "tracking");
    assert.ok(tracking.tracking?.current_status);
  } finally {
    if (previous) process.env.OPENAI_API_KEY = previous;
  }
}

async function main() {
  await smokeJudgeFlow();
  await smokeAcpUcpBridge();
  await smokeAgentChatWithoutOpenAi();
  await smokeAgentChatWithInvalidOpenAi();
  await smokeAgentNaturalLanguageFlow();
  await smokeAgentTrackingAfterNewSearch();
  console.log("demo-ui smoke tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
