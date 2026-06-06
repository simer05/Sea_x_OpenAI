#!/usr/bin/env node
/**
 * Interactive ACP shopping via the official OpenAI Codex SDK.
 * @see https://developers.openai.com/codex/sdk
 */
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Codex, type Thread, type ThreadEvent } from "@openai/codex-sdk";
import { baseUrl, isRemoteGateway, isVerbose } from "./config.js";
import { checkHealth } from "./acpClient.js";
import { loadDemoUiEnv } from "./loadEnv.js";
import {
  createSpinner,
  formatToolOutput,
  printAgentMessage,
  printGatewayError,
  printHelp,
  printStatus,
  printVerboseHeader,
  printWelcome,
} from "./terminal-ui.js";

loadDemoUiEnv();

const here = dirname(fileURLToPath(import.meta.url));
const acpTool = join(here, "acp-tool.ts");

function resolveApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim() ?? process.env.CODEX_API_KEY?.trim();
  if (!key) {
    console.error("OPENAI_API_KEY is required.");
    console.error("Add it to acp/demo-ui/.env.local or export OPENAI_API_KEY.");
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
Show top 3 picks with prices. Use JSON output IDs only. Plain text replies.
Guide checkout: product pick → delivery → payment → order → tracking.

User: ${userMessage}`;
}

function startThread(codex: Codex): Thread {
  return codex.startThread({
    workingDirectory: join(here, ".."),
    sandboxMode: "workspace-write",
    networkAccessEnabled: true,
    approvalPolicy: "never",
    webSearchEnabled: false,
    modelReasoningEffort: "low",
  });
}

async function printStream(events: AsyncGenerator<ThreadEvent>, stopSpinner: () => void) {
  let spinnerStopped = false;
  const endSpinner = () => {
    if (!spinnerStopped) {
      stopSpinner();
      spinnerStopped = true;
    }
  };

  try {
    for await (const event of events) {
      if (event.type === "item.completed") {
        endSpinner();
        const item = event.item;
        if (item.type === "command_execution" && item.status === "completed") {
          const out = item.aggregated_output?.trim();
          if (!out) continue;
          const formatted = formatToolOutput(out);
          if (formatted) {
            console.log(`\n${formatted}`);
          } else if (isVerbose()) {
            console.log(`\n[tool] ${out.slice(0, 400)}${out.length > 400 ? "…" : ""}`);
          }
        }
        if (item.type === "agent_message") {
          printAgentMessage(item.text);
        }
      }
      if (event.type === "turn.failed") {
        endSpinner();
        console.error(`\nSomething went wrong: ${event.error.message}`);
      }
      if (event.type === "error") {
        endSpinner();
        console.error(`\nError: ${event.message}`);
      }
    }
  } finally {
    endSpinner();
  }
}

function isSlashCommand(line: string): boolean {
  return line.startsWith("/");
}

async function handleCommand(
  line: string,
  state: { thread: Thread; primed: boolean; codex: Codex },
): Promise<"continue" | "quit" | "handled"> {
  const cmd = line.slice(1).toLowerCase().split(/\s+/)[0];

  switch (cmd) {
    case "help":
    case "h":
      printHelp();
      return "handled";
    case "status":
      try {
        printStatus(await checkHealth());
      } catch {
        printGatewayError(isRemoteGateway());
      }
      return "handled";
    case "new":
      state.thread = startThread(state.codex);
      state.primed = false;
      console.log("New session started.\n");
      return "handled";
    case "quit":
    case "exit":
    case "q":
      return "quit";
    default:
      console.log(`Unknown command: ${line}. Type /help for options.\n`);
      return "handled";
  }
}

async function main() {
  if (isVerbose()) printVerboseHeader();
  printWelcome();

  let health;
  try {
    health = await checkHealth();
    if (!health.ok) throw new Error("Gateway unhealthy");
    if (isVerbose()) {
      console.log(`Gateway: ${baseUrl()} (acp=${health.acp})\n`);
    }
  } catch {
    printGatewayError(isRemoteGateway());
    process.exit(1);
  }

  const codex = new Codex({
    apiKey: resolveApiKey(),
    config: {
      sandbox_workspace_write: { network_access: true },
    },
  });

  const state = {
    thread: startThread(codex),
    primed: false,
    codex,
  };

  const rl = readline.createInterface({ input, output });

  try {
    while (true) {
      let line: string;
      try {
        line = (await rl.question("› ")).trim();
      } catch {
        break;
      }
      if (!line) continue;
      if (/^(exit|quit|q)$/i.test(line)) break;
      if (isSlashCommand(line)) {
        const result = await handleCommand(line, state);
        if (result === "quit") break;
        if (result === "handled") continue;
      }

      const stopSpinner = createSpinner("Thinking…");
      try {
        const turn = await state.thread.runStreamed(promptWithContext(line, state.primed));
        state.primed = true;
        await printStream(turn.events, stopSpinner);
      } catch (err: unknown) {
        stopSpinner();
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\nRequest failed: ${message}`);
      }
      console.log("");
    }
  } finally {
    rl.close();
  }

  console.log("Goodbye.");
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nAgent failed: ${message}`);
  process.exit(1);
});
