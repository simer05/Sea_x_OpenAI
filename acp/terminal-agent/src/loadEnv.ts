import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

/** Pull OPENAI_API_KEY (and friends) from demo-ui if not already in the shell. */
export function loadDemoUiEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const demoUi = join(here, "..", "..", "demo-ui");
  loadEnvFile(join(demoUi, ".env.local"));
  loadEnvFile(join(demoUi, ".env"));
}
