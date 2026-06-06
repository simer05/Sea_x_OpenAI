import { baseUrl, paymentMethod, sessionId } from "./config.js";

export interface HealthResponse {
  ok: boolean;
  openai: boolean;
  openai_mode?: string;
  acp: boolean;
  configured?: boolean;
}

export interface ProductCard {
  rank: number;
  product_id: string;
  sku_id: string;
  title: string;
  price: number;
  currency: string;
  halal_status: string;
  overall_score: number;
  tier: string;
  cod_available: boolean;
}

export interface SearchResponse {
  total_found: number;
  eligible_count: number;
  products: ProductCard[];
}

export interface DeliveryOption {
  id: string;
  label: string;
  fee: number;
  currency: string;
  eta: string;
}

export interface PaymentOption {
  id: string;
  label: string;
  available: boolean;
}

export interface OrderSummary {
  product: string;
  price: number;
  currency: string;
  payment: string;
  delivery: string;
  delivery_fee: number;
  total: number;
  halal_status: string;
}

export interface OrderResponse {
  order_id: string;
  runtime_order_id: string;
  lifecycle_state: string;
  summary: OrderSummary;
}

export interface TrackingResponse {
  order_id: string;
  current_status: string;
  expected_message: string;
  events: Array<{ step: number; label: string; completed: boolean }>;
  lifecycle_state: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} ${path} failed (${response.status}): ${body}`);
  }
  return (await response.json()) as T;
}

export async function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export async function searchProducts(input?: {
  query?: string;
  max_price?: number;
  halal_required?: boolean;
  location?: string;
}): Promise<SearchResponse> {
  return request<SearchResponse>("/v1/products/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: input?.query ?? "noodles",
      max_price: input?.max_price ?? 10,
      currency: "SGD",
      category: "groceries",
      halal_required: input?.halal_required !== false,
      location: input?.location ?? "Singapore",
      session_id: sessionId(),
    }),
  });
}

export async function searchHalalNoodles(): Promise<SearchResponse> {
  return searchProducts({ query: "noodles", max_price: 10, halal_required: true });
}

export async function getDeliveryOptions(productId: string): Promise<DeliveryOption[]> {
  const data = await request<{ options: DeliveryOption[] }>(
    `/v1/delivery/options?product_id=${encodeURIComponent(productId)}&location=Singapore`,
  );
  return data.options;
}

export async function getPaymentOptions(productId: string): Promise<{
  options: PaymentOption[];
  checkout_session_id?: string;
}> {
  return request(
    `/v1/payment/options?product_id=${encodeURIComponent(productId)}&location=Singapore`,
  );
}

export async function placeOrder(input: {
  productId: string;
  deliveryOptionId: string;
  payment?: "cod" | "tokenized_card";
}): Promise<OrderResponse> {
  const sid = sessionId();
  return request<OrderResponse>("/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: input.productId,
      payment_method: input.payment ?? paymentMethod(),
      delivery_option_id: input.deliveryOptionId,
      demo_session_id: sid,
      session_id: sid,
    }),
  });
}

export async function getTracking(orderId: string): Promise<TrackingResponse> {
  return request<TrackingResponse>(
    `/v1/orders/${encodeURIComponent(orderId)}/tracking?session_id=${encodeURIComponent(sessionId())}`,
  );
}

export interface OrderFlowResult {
  health: HealthResponse;
  search: SearchResponse;
  product: ProductCard;
  delivery: DeliveryOption;
  paymentId: string;
  checkoutSessionId?: string;
  order: OrderResponse;
  tracking: TrackingResponse;
}

export async function runOrderFlow(): Promise<OrderFlowResult> {
  const health = await checkHealth();
  if (!health.ok) {
    throw new Error("ACP gateway health check failed");
  }

  const search = await searchHalalNoodles();
  const product = search.products[0];
  if (!product) {
    throw new Error("No eligible halal noodle products under $10 SGD");
  }

  const deliveryOptions = await getDeliveryOptions(product.product_id);
  const delivery = deliveryOptions.find((o) => o.id === "standard") ?? deliveryOptions[0];
  if (!delivery) {
    throw new Error("No delivery options returned");
  }

  const payment = await getPaymentOptions(product.product_id);
  const preferred = paymentMethod();
  const paymentOption =
    payment.options.find((o) => o.id === preferred && o.available) ??
    payment.options.find((o) => o.available);
  if (!paymentOption) {
    throw new Error("No available payment methods");
  }

  const order = await placeOrder({
    productId: product.product_id,
    deliveryOptionId: delivery.id,
    payment: paymentOption.id as "cod" | "tokenized_card",
  });

  const tracking = await getTracking(order.order_id);

  return {
    health,
    search,
    product,
    delivery,
    paymentId: paymentOption.id,
    checkoutSessionId: payment.checkout_session_id,
    order,
    tracking,
  };
}
