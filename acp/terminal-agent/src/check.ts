#!/usr/bin/env node
/** One-shot: ensure API is up, run full order flow, print result. */
import { loadDemoUiEnv } from "./loadEnv.js";
import { ensureApiRunning } from "./ensure-api.js";
import { runOrderFlow } from "./acpClient.js";

loadDemoUiEnv();

async function main() {
  await ensureApiRunning();
  const r = await runOrderFlow();
  console.log("✓ Working");
  console.log(`  product: ${r.product.title}`);
  console.log(`  order:   ${r.order.order_id}`);
  console.log(`  track:   ${r.tracking.current_status}`);
}

main().catch((err: unknown) => {
  console.error("✗ Failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
