type StoredResponse = {
  status: number;
  body: unknown;
  bodyHash: string;
};

const store = new Map<string, StoredResponse>();

function hashBody(body: unknown) {
  return JSON.stringify(body ?? null);
}

export function requireIdempotencyKey(header: string | undefined): string {
  const key = header?.trim();
  if (!key) throw new Error("idempotency_key_required");
  return key;
}

export function replayIdempotent(key: string, body: unknown): StoredResponse | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.bodyHash !== hashBody(body)) {
    throw new Error("idempotency_conflict");
  }
  return hit;
}

export function saveIdempotent(key: string, body: unknown, status: number, response: unknown) {
  store.set(key, { status, body: response, bodyHash: hashBody(body) });
}

export function clearIdempotencyStore() {
  store.clear();
}
