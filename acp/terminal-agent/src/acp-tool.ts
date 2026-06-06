#!/usr/bin/env node
/**
 * Thin CLI for the OpenAI Codex agent to call the ACP gateway.
 * Invoked by Codex SDK via: pnpm exec tsx src/acp-tool.ts <cmd>
 */
import { baseUrl, paymentMethod, sessionId } from "./config.js";
import {
  checkHealth,
  getDeliveryOptions,
  getPaymentOptions,
  getTracking,
  placeOrder,
  searchProducts,
} from "./acpClient.js";

function usage() {
  console.log(`ACP tool CLI — gateway ${baseUrl()}

Usage:
  acp-tool health
  acp-tool search --query noodles [--max-price 10] [--halal true|false] [--location Singapore]
  acp-tool delivery --product-id <id>
  acp-tool payment --product-id <id>
  acp-tool order --product-id <id> --delivery <option_id> [--payment cod|card]
  acp-tool track --order-id <id>
`);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  return args;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "help" || cmd === "--help") {
    usage();
    return;
  }

  const flags = parseArgs(rest);

  switch (cmd) {
    case "health":
      console.log(JSON.stringify(await checkHealth(), null, 2));
      return;
    case "search": {
      const search = await searchProducts({
        query: flags.query ?? "noodles",
        max_price: flags["max-price"] ? Number(flags["max-price"]) : 10,
        halal_required: flags.halal !== "false",
        location: flags.location ?? "Singapore",
      });
      console.log(JSON.stringify(search, null, 2));
      return;
    }
    case "delivery": {
      const productId = flags["product-id"];
      if (!productId) throw new Error("--product-id is required");
      console.log(JSON.stringify(await getDeliveryOptions(productId), null, 2));
      return;
    }
    case "payment": {
      const productId = flags["product-id"];
      if (!productId) throw new Error("--product-id is required");
      console.log(JSON.stringify(await getPaymentOptions(productId), null, 2));
      return;
    }
    case "order": {
      const productId = flags["product-id"];
      const delivery = flags.delivery;
      if (!productId || !delivery) throw new Error("--product-id and --delivery are required");
      const payRaw = flags.payment ?? paymentMethod();
      const payment =
        payRaw === "card" || payRaw === "tokenized_card" ? "tokenized_card" : "cod";
      console.log(
        JSON.stringify(
          await placeOrder({
            productId,
            deliveryOptionId: delivery,
            payment,
          }),
          null,
          2,
        ),
      );
      return;
    }
    case "track": {
      const orderId = flags["order-id"];
      if (!orderId) throw new Error("--order-id is required");
      console.log(JSON.stringify(await getTracking(orderId), null, 2));
      return;
    }
    default:
      usage();
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`acp-tool error: ${message}`);
  console.error(`Gateway: ${baseUrl()} session: ${sessionId()}`);
  process.exit(1);
});
