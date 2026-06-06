#!/usr/bin/env node
/**
 * Deterministic ACP terminal demo — hits gateway REST directly.
 * No CURSOR_API_KEY required.
 */
import { baseUrl, paymentMethod, sessionId } from "./config.js";
import { runOrderFlow } from "./acpClient.js";

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}

async function main() {
  console.log("ACP Terminal Agent — REST demo");
  console.log(`Gateway: ${baseUrl()}`);
  console.log(`Session: ${sessionId()}`);
  console.log(`Payment preference: ${paymentMethod()}`);
  console.log("");

  const result = await runOrderFlow();

  console.log("✓ Health");
  console.log(`  acp=${result.health.acp} openai_mode=${result.health.openai_mode ?? "n/a"}`);
  console.log("");

  console.log("✓ Search — halal noodles under $10 SGD");
  console.log(`  total_found=${result.search.total_found} eligible=${result.search.eligible_count}`);
  console.log(`  top pick: #${result.product.rank} ${result.product.title}`);
  console.log(
    `  price=${formatMoney(result.product.price, result.product.currency)} score=${result.product.overall_score} tier=${result.product.tier}`,
  );
  console.log(`  halal=${result.product.halal_status}`);
  console.log("");

  console.log("✓ Delivery");
  console.log(
    `  ${result.delivery.label} (${result.delivery.id}) — fee ${formatMoney(result.delivery.fee, result.delivery.currency)} · ${result.delivery.eta}`,
  );
  console.log("");

  console.log("✓ Payment");
  console.log(`  method=${result.paymentId}`);
  if (result.checkoutSessionId) {
    console.log(`  checkout_session_id=${result.checkoutSessionId}`);
  }
  console.log("");

  console.log("✓ Order placed");
  console.log(`  order_id=${result.order.order_id}`);
  console.log(`  runtime_order_id=${result.order.runtime_order_id}`);
  console.log(`  state=${result.order.lifecycle_state}`);
  console.log(
    `  total=${formatMoney(result.order.summary.total, result.order.summary.currency)} (${result.order.summary.product})`,
  );
  console.log("");

  console.log("✓ Tracking");
  console.log(`  status=${result.tracking.current_status}`);
  console.log(`  message=${result.tracking.expected_message}`);
  console.log(
    `  events=${result.tracking.events.map((e) => e.label).join(" → ")}`,
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nDemo failed: ${message}`);
  console.error("\nStart the API first:");
  console.error("  cd acp/demo-ui && pnpm dev:api");
  process.exit(1);
});
