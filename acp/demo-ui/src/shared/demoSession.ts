export const DEMO_SESSION_KEY = "acp-demo-session-id";
export const DEMO_SYNC_CHANNEL = "acp-demo-sync";

export type SharedCartItem = {
  product_id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  availability: string;
  country: string;
  city: string;
  delivery_starts_at: string;
  delivery_ends_at: string;
  halal_status: string;
  bpom_status: string;
  cod_available: boolean;
  bnpl_available: boolean;
  return_window_days: number;
  image_url?: string;
  rating?: number;
  sold_count?: number;
  discount_pct?: number;
  quantity: number;
  added_by: string;
};

export type SharedCartResponse = {
  demoSessionId: string;
  version: number;
  items: SharedCartItem[];
  orders: Array<{
    order_id: string;
    lifecycle_state: string;
    product_id: string;
    title: string;
    payment_method: string;
    placed_at: string;
  }>;
  toast: string | null;
};

export function getDemoSessionId(): string {
  let id = localStorage.getItem(DEMO_SESSION_KEY);
  if (!id) {
    id = `demo-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(DEMO_SESSION_KEY, id);
  }
  return id;
}

export function notifyCartSync() {
  try {
    const channel = new BroadcastChannel(DEMO_SYNC_CHANNEL);
    channel.postMessage({ type: "cart-updated", at: Date.now() });
    channel.close();
  } catch {
    // BroadcastChannel may be unavailable in some contexts.
  }
}

export function subscribeCartSync(onChange: () => void) {
  try {
    const channel = new BroadcastChannel(DEMO_SYNC_CHANNEL);
    channel.onmessage = () => onChange();
    return () => channel.close();
  } catch {
    return () => undefined;
  }
}

export async function fetchSharedCart(): Promise<SharedCartResponse> {
  const demoSessionId = getDemoSessionId();
  const res = await fetch(`/api/demo/cart?demoSessionId=${encodeURIComponent(demoSessionId)}`);
  if (!res.ok) {
    throw new Error("Unable to load shared cart");
  }
  return res.json() as Promise<SharedCartResponse>;
}

export async function addToSharedCart(productId: string, source: "shop" | "agent", quantity = 1) {
  const demoSessionId = getDemoSessionId();
  const res = await fetch("/api/demo/cart/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demoSessionId, product_id: productId, source, quantity }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Unable to add to cart");
  }
  notifyCartSync();
  return res.json() as Promise<SharedCartResponse>;
}

export async function removeFromSharedCart(productId: string) {
  const demoSessionId = getDemoSessionId();
  const res = await fetch("/api/demo/cart/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demoSessionId, product_id: productId }),
  });
  if (!res.ok) {
    throw new Error("Unable to remove from cart");
  }
  notifyCartSync();
  return res.json() as Promise<SharedCartResponse>;
}

export async function checkAgentApiHealth(): Promise<{ ok: boolean; openai: boolean }> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return { ok: false, openai: false };
    return res.json() as Promise<{ ok: boolean; openai: boolean }>;
  } catch {
    return { ok: false, openai: false };
  }
}
