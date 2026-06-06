import type { HealthResponse } from "./acpClient.js";
import { baseUrl, isVerbose, sessionId } from "./config.js";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function printWelcome(): void {
  console.log("Sea Shop — AI grocery assistant");
  console.log("Describe what you want, or type /help\n");
}

export function printVerboseHeader(): void {
  console.log("ACP Shopping Agent — OpenAI Codex SDK");
  console.log("https://developers.openai.com/codex/sdk\n");
}

export function printHelp(): void {
  console.log(`
Commands
  /help     Show this help
  /status   API and session status
  /new      Start a fresh shopping session
  /quit     Exit

Examples
  halal noodles under $10
  option 1 with standard delivery, pay COD
`);
}

export function printStatus(health: HealthResponse): void {
  const gateway = baseUrl();
  const api = health.ok ? "online" : "offline";
  const acp = health.acp ? "ready" : "unavailable";
  console.log(`Gateway  ${gateway}`);
  console.log(`API      ${api} · ACP ${acp}`);
  console.log(`Session  ${sessionId()}`);
  if (isVerbose()) {
    console.log(`OpenAI   ${health.openai ? "configured" : "not configured"}`);
  }
}

export function printGatewayError(remote: boolean): void {
  if (remote) {
    console.error("Can't reach the shopping API right now. Check your connection and try again.");
    if (isVerbose()) console.error(`Gateway: ${baseUrl()}`);
    return;
  }
  console.error("Start the local API first:");
  console.error("  cd acp/demo-ui && pnpm dev:api");
}

export function createSpinner(label: string): () => void {
  let frame = 0;
  const timer = setInterval(() => {
    process.stdout.write(`\r${SPINNER_FRAMES[frame++ % SPINNER_FRAMES.length]} ${label}`);
  }, 90);
  return () => {
    clearInterval(timer);
    process.stdout.write("\r\x1b[K");
  };
}

function money(amount: number, currency = "SGD"): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/** Turn acp-tool JSON into compact, human-friendly lines. */
export function formatToolOutput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;

  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;

    if (Array.isArray(data)) {
      return formatList(data);
    }

    if (typeof data.ok === "boolean" && "acp" in data) {
      const h = data as HealthResponse;
      return h.ok ? "API online · ACP ready" : "API unhealthy";
    }

    if (Array.isArray(data.products)) {
      const products = data.products as Array<{
        rank?: number;
        title: string;
        price: number;
        currency?: string;
        halal_status?: string;
        product_id: string;
      }>;
      const picks = products.slice(0, 3);
      const totalFound = data.total_found as number | undefined;
      const eligibleCount = data.eligible_count as number | undefined;
      const headline =
        totalFound !== undefined && eligibleCount !== undefined
          ? `Found ${totalFound} matches — ${eligibleCount} passed Halal & filters. Top ${picks.length} picks:`
          : `Top ${picks.length} pick${picks.length === 1 ? "" : "s"}:`;
      const lines = [headline];
      for (const p of picks) {
        const halal = p.halal_status?.toLowerCase().includes("halal") ? " · halal" : "";
        lines.push(`  ${p.rank ?? "•"}. ${p.title} — ${money(p.price, p.currency)}${halal}`);
      }
      if (products.length > picks.length) {
        lines.push(`  … +${products.length - picks.length} more in response`);
      }
      return lines.join("\n");
    }

    if (Array.isArray(data.options)) {
      const options = data.options as Array<{
        id: string;
        label: string;
        fee?: number;
        currency?: string;
        eta?: string;
        available?: boolean;
      }>;
      const kind = options.some((o) => o.fee !== undefined) ? "Delivery" : "Payment";
      const lines = [`${kind} options:`];
      for (const o of options) {
        if (o.available === false) continue;
        const fee = o.fee !== undefined ? ` — ${money(o.fee, o.currency)}` : "";
        const eta = o.eta ? ` · ${o.eta}` : "";
        lines.push(`  • ${o.label}${fee}${eta} (${o.id})`);
      }
      return lines.join("\n");
    }

    if (typeof data.order_id === "string" && data.summary) {
      const summary = data.summary as {
        product: string;
        total: number;
        currency: string;
        payment: string;
        delivery: string;
      };
      return [
        `Order ${data.order_id}`,
        `  ${summary.product}`,
        `  ${summary.delivery} · ${summary.payment}`,
        `  Total ${money(summary.total, summary.currency)}`,
      ].join("\n");
    }

    if (typeof data.order_id === "string" && data.current_status) {
      const events = (data.events as Array<{ label: string; completed: boolean }> | undefined) ?? [];
      const done = events.filter((e) => e.completed).map((e) => e.label);
      const progress = done.length ? done.join(" → ") : data.current_status;
      return `Tracking ${data.order_id}\n  ${data.current_status}\n  ${progress}`;
    }

    return null;
  } catch {
    return null;
  }
}

function formatList(items: unknown[]): string | null {
  if (!items.length) return null;
  const first = items[0] as Record<string, unknown>;
  if ("label" in first && "fee" in first) {
    return formatToolOutput(JSON.stringify({ options: items }));
  }
  return null;
}

export function printAgentMessage(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  console.log(`\n${trimmed}`);
}
