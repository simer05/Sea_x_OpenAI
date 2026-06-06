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

async function main() {
  await smokeJudgeFlow();
  await smokeAgentChatWithoutOpenAi();
  await smokeAgentChatWithInvalidOpenAi();
  console.log("demo-ui smoke tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
