#!/usr/bin/env node
/**
 * Interactive ACP shopping via the official OpenAI Codex SDK.
 * @see https://developers.openai.com/codex/sdk
 */
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Codex, type ThreadEvent } from "@openai/codex-sdk";
import { baseUrl } from "./config.js";
import { checkHealth } from "./acpClient.js";
import { loadDemoUiEnv } from "./loadEnv.js";

loadDemoUiEnv();

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const acpTool = join(here, "acp-tool.ts");

function resolveApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim() ?? process.env.CODEX_API_KEY?.trim();
  if (!key) {
    console.error("OPENAI_API_KEY is required for the Codex SDK.");
    console.error("Set it in acp/demo-ui/.env.local or export OPENAI_API_KEY in your shell.");
    process.exit(1);
  }
  return key;
}

/** Short, stable instructions — no separate bootstrap LLM turn. */
function promptWithContext(userMessage: string, primed: boolean): string {
  if (primed) return userMessage;
  return `ACP shopping agent. Gateway: ${baseUrl()}. Run tools with:
pnpm exec tsx ${acpTool} health|search|delivery|payment|order|track (see --help).
Example: pnpm exec tsx ${acpTool} search --query noodles --max-price 10 --halal true
Show top 3 picks. Use JSON output IDs only. Plain text replies.

User: ${userMessage}`;
}

async function printStream(events: AsyncGenerator<ThreadEvent>) {
  for await (const event of events) {
    if (event.type === "item.completed") {
      const item = event.item;
      if (item.type === "command_execution" && item.status === "completed") {
        const out = item.aggregated_output?.trim();
        if (out) console.log(`\n  [tool] ${out.slice(0, 400)}${out.length > 400 ? "…" : ""}`);
      }
      if (item.type === "agent_message") {
        process.stdout.write(`\nAgent: ${item.text}`);
      }
    }
    if (event.type === "turn.failed") {
      console.error(`\nTurn failed: ${event.error.message}`);
    }
    if (event.type === "error") {
      console.error(`\nError: ${event.message}`);
    }
  }
}

async function main() {
  console.log("ACP Shopping Agent — OpenAI Codex SDK");
  console.log("https://developers.openai.com/codex/sdk\n");

  try {
    const health = await checkHealth();
    if (!health.ok) throw new Error("Gateway unhealthy");
    console.log(`Gateway: ${baseUrl()} (acp=${health.acp})\n`);
  } catch {
    console.error("Start the API first:\n  cd acp/terminal-agent && pnpm check\n");
    process.exit(1);
  }

  const codex = new Codex({
    apiKey: resolveApiKey(),
    config: {
      sandbox_workspace_write: { network_access: true },
    },
  });

  const thread = codex.startThread({
    workingDirectory: join(here, ".."),
    sandboxMode: "workspace-write",
    networkAccessEnabled: true,
    approvalPolicy: "never",
    webSearchEnabled: false,
    modelReasoningEffort: "low",
  });

  const rl = readline.createInterface({ input, output });
  console.log("What would you like to buy? (type 'exit' to quit)\n");

  let primed = false;

  try {
    while (true) {
      let line: string;
      try {
        line = (await rl.question("You: ")).trim();
      } catch {
        break;
      }
      if (!line) continue;
      if (/^(exit|quit|q)$/i.test(line)) break;

      process.stdout.write("\n… ");
      const turn = await thread.runStreamed(promptWithContext(line, primed));
      primed = true;
      await printStream(turn.events);
      console.log("\n");
    }
  } finally {
    rl.close();
  }

  console.log("Bye.");
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nCodex agent failed: ${message}`);
  process.exit(1);
});
