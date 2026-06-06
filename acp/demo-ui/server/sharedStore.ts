import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface SharedCartLine {
  product_id: string;
  quantity: number;
  added_by: "shop" | "agent";
  added_at: string;
}

export interface SharedOrder {
  order_id: string;
  lifecycle_state: string;
  product_id: string;
  title: string;
  payment_method: string;
  placed_at: string;
}

export interface SharedDemoState {
  cart: SharedCartLine[];
  version: number;
  orders: SharedOrder[];
  toast: string | null;
}

interface CatalogProduct {
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
}

const stores = new Map<string, SharedDemoState>();

function findCatalogPath(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = path.join(dir, "data", "catalog.json");
    if (existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error("Unable to locate catalog.json");
}

const catalog = JSON.parse(readFileSync(findCatalogPath(), "utf8")) as CatalogProduct[];
const catalogById = new Map(catalog.map((row) => [row.product_id, row]));

function emptyState(): SharedDemoState {
  return { cart: [], version: 0, orders: [], toast: null };
}

export function getDemoState(demoSessionId: string): SharedDemoState {
  if (!stores.has(demoSessionId)) {
    stores.set(demoSessionId, emptyState());
  }
  return stores.get(demoSessionId)!;
}

export function addToSharedCart(
  demoSessionId: string,
  productId: string,
  source: "shop" | "agent",
  quantity = 1,
): SharedDemoState {
  const state = getDemoState(demoSessionId);
  const existing = state.cart.find((line) => line.product_id === productId);
  if (existing) {
    existing.quantity += quantity;
    existing.added_by = source;
  } else {
    state.cart.push({
      product_id: productId,
      quantity,
      added_by: source,
      added_at: new Date().toISOString(),
    });
  }
  state.version += 1;
  state.toast = source === "agent" ? "Agent added an item to your cart" : "Item added to cart";
  return state;
}

export function removeFromSharedCart(demoSessionId: string, productId: string): SharedDemoState {
  const state = getDemoState(demoSessionId);
  state.cart = state.cart.filter((line) => line.product_id !== productId);
  state.version += 1;
  state.toast = "Item removed from cart";
  return state;
}

export function recordSharedOrder(
  demoSessionId: string,
  order: Omit<SharedOrder, "placed_at">,
): SharedDemoState {
  const state = getDemoState(demoSessionId);
  state.orders.unshift({ ...order, placed_at: new Date().toISOString() });
  state.cart = state.cart.filter((line) => line.product_id !== order.product_id);
  state.version += 1;
  state.toast = `Order ${order.order_id} placed`;
  return state;
}

export function clearSharedToast(demoSessionId: string): void {
  getDemoState(demoSessionId).toast = null;
}

export function getEnrichedCart(demoSessionId: string) {
  const state = getDemoState(demoSessionId);
  const items = state.cart
    .map((line) => {
      const product = catalogById.get(line.product_id);
      if (!product) return null;
      return { ...product, quantity: line.quantity, added_by: line.added_by };
    })
    .filter((item): item is CatalogProduct & { quantity: number; added_by: string } => Boolean(item));

  return {
    demoSessionId,
    version: state.version,
    items,
    orders: state.orders,
    toast: state.toast,
  };
}
