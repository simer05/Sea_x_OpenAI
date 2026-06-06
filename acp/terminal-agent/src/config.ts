export const DEFAULT_BASE_URL = "http://127.0.0.1:8787";
export const DEFAULT_SESSION_ID = "terminal-demo";

export function baseUrl(): string {
  return (process.env.ACP_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function sessionId(): string {
  return process.env.ACP_SESSION_ID ?? DEFAULT_SESSION_ID;
}

export function paymentMethod(): "cod" | "tokenized_card" {
  const raw = (process.env.ACP_PAYMENT ?? "cod").toLowerCase();
  if (raw === "card" || raw === "tokenized_card") return "tokenized_card";
  return "cod";
}
