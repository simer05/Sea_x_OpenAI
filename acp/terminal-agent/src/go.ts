#!/usr/bin/env node
/** Ensure API is up, then launch interactive Codex agent. */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDemoUiEnv } from "./loadEnv.js";
import { ensureApiRunning } from "./ensure-api.js";

loadDemoUiEnv();

if (!process.env.ACP_BASE_URL) {
  process.env.ACP_BASE_URL = "https://sea-acp-api.fly.dev";
}

const here = dirname(fileURLToPath(import.meta.url));

async function main() {
  await ensureApiRunning();
  const child = spawn("pnpm", ["exec", "tsx", "src/codex-agent.ts"], {
    cwd: join(here, ".."),
    stdio: "inherit",
    env: process.env,
  });
  const code = await new Promise<number>((resolve) => child.on("close", resolve));
  process.exit(code);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
