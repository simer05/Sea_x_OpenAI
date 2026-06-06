import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { baseUrl } from "./config.js";

const here = dirname(fileURLToPath(import.meta.url));
const demoUiDir = join(here, "..", "..", "demo-ui");

async function isHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl()}/api/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return false;
    const body = (await res.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  }
}

function isLocalGateway(): boolean {
  const url = baseUrl();
  return url.includes("127.0.0.1") || url.includes("localhost");
}

export async function ensureApiRunning(): Promise<void> {
  if (await isHealthy()) return;
  if (!isLocalGateway()) {
    throw new Error(`Remote API not reachable at ${baseUrl()}`);
  }

  console.log("Starting ACP API in background…");
  const child = spawn("pnpm", ["dev:api"], {
    cwd: demoUiDir,
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isHealthy()) {
      console.log(`API ready at ${baseUrl()}\n`);
      return;
    }
  }

  throw new Error(`API did not start on ${baseUrl()} — run manually: cd acp/demo-ui && pnpm dev:api`);
}
