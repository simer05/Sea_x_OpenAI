import OpenAI from "openai";

let client: OpenAI | null = null;

export function isOpenAiReady(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return false;
  if (key === "your-openai-api-key") return false;
  if (/^(dummy|invalid|test|placeholder)/i.test(key)) return false;
  return key.length >= 20;
}

export function getOpenAi(): OpenAI | null {
  if (!isOpenAiReady()) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export function isOpenAiAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number }).status;
  if (status === 401 || status === 403) return true;
  const message = String((error as { message?: string }).message ?? "");
  return /invalid.*api.*key|incorrect api key|authentication/i.test(message);
}
