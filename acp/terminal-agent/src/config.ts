export const HOSTED_BASE_URL = "https://sea-acp-api.fly.dev";
export const DEFAULT_BASE_URL = HOSTED_BASE_URL;
export const DEFAULT_SESSION_ID = "terminal-demo";

export function baseUrl(): string {
  return (process.env.ACP_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function isRemoteGateway(): boolean {
  const url = baseUrl();
  return !url.includes("127.0.0.1") && !url.includes("localhost");
}

export function isVerbose(): boolean {
  return process.argv.includes("--verbose") || process.env.ACP_VERBOSE === "1";
}

export function sessionId(): string {
  return process.env.ACP_SESSION_ID ?? DEFAULT_SESSION_ID;
}

export function paymentMethod(): "cod" | "tokenized_card" {
  const raw = (process.env.ACP_PAYMENT ?? "cod").toLowerCase();
  if (raw === "card" || raw === "tokenized_card") return "tokenized_card";
  return "cod";
}
