import assert from "node:assert/strict";
import { baseUrl } from "./config.js";
import { checkHealth, runOrderFlow } from "./acpClient.js";

async function smokeTerminalAgent() {
  const health = await checkHealth();
  assert.equal(health.ok, true);
  assert.equal(health.acp, true);

  const result = await runOrderFlow();
  assert.equal(result.search.total_found, 12);
  assert.ok(result.search.eligible_count >= 3);
  assert.equal(result.search.products.length, 3);
  assert.ok(result.product.product_id.startsWith("prod_"));
  assert.match(result.order.order_id, /^ACP-SHP-/);
  assert.equal(result.order.summary.halal_status, "Verified Halal Certified");
  assert.ok(result.tracking.current_status.length > 0);
}

async function main() {
  try {
    await smokeTerminalAgent();
    console.log(`terminal-agent smoke passed (${baseUrl()})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`terminal-agent smoke failed: ${message}`);
    console.error("Start API: cd acp/demo-ui && pnpm dev:api");
    process.exit(1);
  }
}

main();
