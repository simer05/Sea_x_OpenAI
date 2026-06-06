export interface TraceEntry {
  id: string;
  timestamp: string;
  message: string;
  detail?: string;
}

const traces = new Map<string, TraceEntry[]>();

export function appendTrace(sessionId: string, message: string, detail?: string) {
  const entries = traces.get(sessionId) ?? [];
  entries.push({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    message,
    detail,
  });
  traces.set(sessionId, entries);
  return entries;
}

export function getTrace(sessionId: string) {
  return traces.get(sessionId) ?? [];
}

export function resetTrace(sessionId: string) {
  traces.set(sessionId, []);
}

export function ensureTraceSession(sessionId: string) {
  if (!traces.has(sessionId)) traces.set(sessionId, []);
}
