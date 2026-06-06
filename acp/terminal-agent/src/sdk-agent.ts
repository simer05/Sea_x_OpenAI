#!/usr/bin/env node
/**
 * Cursor SDK demo — agent uses custom tools that call the ACP REST gateway.
 * Requires CURSOR_API_KEY. Falls back to acp-cli when the key is missing.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { baseUrl, paymentMethod, sessionId } from "./config.js";
import {
  checkHealth,
  getDeliveryOptions,
  getPaymentOptions,
  getTracking,
  placeOrder,
  searchHalalNoodles,
} from "./acpClient.js";

const acpTools = {
  acp_health: async () => JSON.stringify(await checkHealth()),
  acp_search_halal_noodles: async () => {
    const search = await searchHalalNoodles();
    return JSON.stringify({
      total_found: search.total_found,
      eligible_count: search.eligible_count,
      top: search.products[0] ?? null,
      products: search.products,
    });
  },
  acp_delivery_options: async (args: { product_id: string }) =>
    JSON.stringify(await getDeliveryOptions(args.product_id)),
  acp_payment_options: async (args: { product_id: string }) =>
    JSON.stringify(await getPaymentOptions(args.product_id)),
  acp_place_order: async (args: {
    product_id: string;
    delivery_option_id: string;
    payment_method?: string;
  }) =>
    JSON.stringify(
      await placeOrder({
        productId: args.product_id,
        deliveryOptionId: args.delivery_option_id,
        payment: (args.payment_method as "cod" | "tokenized_card") ?? paymentMethod(),
      }),
    ),
  acp_track_order: async (args: { order_id: string }) =>
    JSON.stringify(await getTracking(args.order_id)),
};

function sdkPrompt() {
  return `You are a terminal shopping agent for the ACP gateway at ${baseUrl()}.

Place an order for halal noodles under $10 SGD in Singapore using ONLY the acp_* custom tools:
1. acp_health — verify gateway is up
2. acp_search_halal_noodles — find products; pick rank #1
3. acp_delivery_options — choose "standard" delivery
4. acp_payment_options — choose ${paymentMethod()} if available, else first available method
5. acp_place_order — place the order
6. acp_track_order — fetch initial tracking for the new order_id

Reply with a short plain-text summary: product title, order_id, total, payment, delivery, and current tracking status.
Do not invent IDs — use values returned by the tools.`;
}

async function runRestFallback() {
  console.log("CURSOR_API_KEY not set — running REST fallback (acp-cli) instead.\n");
  const dir = dirname(fileURLToPath(import.meta.url));
  const cli = join(dir, "acp-cli.ts");
  const child = spawn("pnpm", ["exec", "tsx", cli], {
    stdio: "inherit",
    cwd: join(dir, ".."),
    env: process.env,
  });
  const code = await new Promise<number>((resolve) => child.on("close", resolve));
  process.exit(code);
}

async function runSdkDemo() {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    await runRestFallback();
    return;
  }

  const { Agent, CursorAgentError } = await import("@cursor/sdk");

  console.log("ACP Terminal Agent — Cursor SDK demo");
  console.log(`Gateway: ${baseUrl()}`);
  console.log(`Session: ${sessionId()}`);
  console.log("");

  try {
    await using agent = await Agent.create({
      apiKey,
      model: { id: "composer-2.5" },
      local: {
        cwd: process.cwd(),
        customTools: acpTools,
      },
    });

    const run = await agent.send(sdkPrompt());
    for await (const event of run.stream()) {
      if (event.type === "assistant") {
        for (const block of event.message.content) {
          if (block.type === "text") process.stdout.write(block.text);
        }
      }
    }

    const result = await run.wait();
    if (result.status === "error") {
      console.error("\nSDK run failed:", result.id);
      process.exit(2);
    }
    console.log("\n");
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`SDK startup failed: ${err.message} (retryable=${err.isRetryable})`);
      process.exit(1);
    }
    throw err;
  }
}

runSdkDemo().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nSDK demo failed: ${message}`);
  process.exit(1);
});
