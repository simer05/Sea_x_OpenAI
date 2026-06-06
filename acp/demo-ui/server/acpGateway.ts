import {
  MarketplaceRuntimeService,
  buyerProfiles,
} from "../../member 2/marketplace-runtime/dist/src/index.js";
import {
  catalogById,
  catalogBySku,
  productUrl,
  reviewCount,
  sellerById,
  skuId,
  type CatalogProduct,
} from "./catalogLoader.js";
import { appendTrace, ensureTraceSession, getTrace, resetTrace } from "./acpTrace.js";
import { verifyHalalProduct, type HalalVerificationResult } from "./halalVerification.js";
import { scoreProducts, type ScoredProduct } from "./scoringEngine.js";

const runtime = new MarketplaceRuntimeService();
const singaporeBuyer =
  buyerProfiles.find((b) => b.buyer_id === "buyer_bnpl_ready_singapore") ??
  buyerProfiles[0];

const NOODLE_KEYWORDS = ["noodle", "mee", "laksa", "udon", "pho", "mi goreng", "curry mee"];

export interface ProductSearchInput {
  query: string;
  max_price?: number;
  currency?: string;
  category?: string;
  halal_required?: boolean;
  location?: string;
  session_id?: string;
}

export interface FilterRejection {
  product_id: string;
  title: string;
  reason: string;
}

export interface ProductSearchOutput {
  total_found: number;
  eligible_count: number;
  rejections: FilterRejection[];
  halal_verifications: HalalVerificationResult[];
  products: GatewayProductCard[];
  trace: ReturnType<typeof getTrace>;
}

export interface GatewayProductCard {
  rank: number;
  product_id: string;
  sku_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  seller_name: string;
  seller_id: string;
  rating: number;
  review_count: number;
  sold_count: number;
  stock_status: string;
  halal_status: string;
  halal_verification: HalalVerificationResult;
  certificate_authority: string | null;
  certificate_status: string;
  overall_score: number;
  tier: string;
  score_breakdown: ScoredProduct["breakdown"];
  recommendation_reason: string;
  product_url: string;
  image_url: string;
  cod_available: boolean;
  bnpl_available: boolean;
  delivery_days: string;
  city: string;
  country: string;
}

interface GatewayOrder {
  order_id: string;
  product_id: string;
  sku_id: string;
  title: string;
  price: number;
  currency: string;
  payment_method: string;
  delivery_option_id: string;
  delivery_fee: number;
  total: number;
  halal_status: string;
  lifecycle_state: string;
  tracking_step: number;
  placed_at: string;
  demo_session_id: string;
}

const orders = new Map<string, GatewayOrder>();

const TRACKING_STEPS = [
  "Order placed",
  "Seller accepted",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

function isNoodle(product: CatalogProduct) {
  const haystack = `${product.title} ${product.description}`.toLowerCase();
  return NOODLE_KEYWORDS.some((hint) => haystack.includes(hint));
}

function searchCatalog(input: ProductSearchInput): CatalogProduct[] {
  const query = input.query.trim().toLowerCase();
  const category = input.category?.toLowerCase();

  return [...catalogById.values()].filter((product) => {
    const haystack = `${product.title} ${product.description} ${product.category}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query) || isNoodle(product);
    const matchesCategory =
      !category || product.category.toLowerCase().includes(category.replace(/&/g, "").trim());
    const matchesCurrency = !input.currency || product.currency === input.currency;
    const matchesLocation =
      !input.location || product.city.toLowerCase() === input.location.toLowerCase();
    return matchesQuery && matchesCategory && matchesCurrency && matchesLocation;
  });
}

function buildRejections(
  products: CatalogProduct[],
  verifications: Map<string, HalalVerificationResult>,
  input: ProductSearchInput,
): FilterRejection[] {
  const rejections: FilterRejection[] = [];

  for (const product of products) {
    const verification = verifications.get(product.product_id)!;

    if (input.max_price !== undefined && product.price > input.max_price) {
      rejections.push({
        product_id: product.product_id,
        title: product.title,
        reason: `Price ${product.price} ${product.currency} exceeds budget ${input.max_price}`,
      });
      continue;
    }

    if (product.availability !== "in_stock") {
      rejections.push({
        product_id: product.product_id,
        title: product.title,
        reason: "Out of stock",
      });
      continue;
    }

    if (input.location && product.city.toLowerCase() !== input.location.toLowerCase()) {
      rejections.push({
        product_id: product.product_id,
        title: product.title,
        reason: `Not deliverable to ${input.location}`,
      });
      continue;
    }

    if (input.halal_required && !verification.eligible_for_halal_request) {
      rejections.push({
        product_id: product.product_id,
        title: product.title,
        reason: verification.reason,
      });
    }
  }

  return rejections;
}

function toGatewayCard(
  product: CatalogProduct,
  scored: ScoredProduct,
  verification: HalalVerificationResult,
  rank: number,
): GatewayProductCard {
  const seller = sellerById.get(product.seller_id);
  const runtimeMatch = runtime
    .searchProducts({ keyword: product.title.split(" ")[0], city: product.city, stock_available: true })
    .find((row) => row.sku_id === skuId(product.product_id));
  const delivery = runtimeMatch?.city_delivery_window;

  return {
    rank,
    product_id: product.product_id,
    sku_id: skuId(product.product_id),
    title: product.title,
    description: product.description,
    price: product.price,
    currency: product.currency,
    seller_name: seller?.seller_name ?? product.seller_id,
    seller_id: product.seller_id,
    rating: product.rating,
    review_count: reviewCount(product),
    sold_count: product.sold_count,
    stock_status: product.availability,
    halal_status: verification.status,
    halal_verification: verification,
    certificate_authority: verification.certificate_authority,
    certificate_status: verification.certificate_active
      ? `${verification.certificate_authority} Active`
      : verification.certificate_expired
        ? "Certificate expired"
        : "No active certificate",
    overall_score: scored.overall_score,
    tier: scored.tier,
    score_breakdown: scored.breakdown,
    recommendation_reason: scored.recommendation_reason,
    product_url: productUrl(product.product_id),
    image_url: product.image_url ?? "/images/products/food_groceries.jpg",
    cod_available: product.cod_available,
    bnpl_available: product.bnpl_available,
    delivery_days: delivery
      ? `${delivery.min_days}-${delivery.max_days} days`
      : "2-3 days",
    city: product.city,
    country: product.country,
  };
}

export function getCapabilityManifest() {
  return {
    protocol: "shopee-acp",
    version: "1.0.0",
    title: "Shopee ACP: Agentic Commerce Protocol for Halal-Aware Marketplace Shopping",
    description:
      "Custom Shopee commerce protocol exposing structured capabilities for agentic marketplace shopping in Southeast Asia.",
    capabilities: [
      "product_search",
      "halal_verification",
      "product_scoring",
      "payment_options",
      "delivery_options",
      "order_creation",
      "order_tracking",
    ],
    endpoints: {
      capability_discovery: "GET /.well-known/shopee-acp.json",
      product_search: "POST /v1/products/search",
      halal_verification: "POST /v1/halal/verify",
      product_scoring: "POST /v1/products/score",
      payment_options: "GET /v1/payment/options",
      delivery_options: "GET /v1/delivery/options",
      order_creation: "POST /v1/orders",
      order_tracking: "GET /v1/orders/{orderId}/tracking",
    },
    supported_countries: ["Singapore", "Indonesia", "Malaysia", "Philippines", "Thailand", "Vietnam"],
    supported_currencies: ["SGD", "IDR", "MYR", "PHP", "THB", "VND"],
  };
}

export function runProductSearch(input: ProductSearchInput): ProductSearchOutput {
  const sessionId = input.session_id ?? "public";
  ensureTraceSession(sessionId);
  resetTrace(sessionId);
  appendTrace(sessionId, "ACP capability discovery completed");
  appendTrace(sessionId, "product_search called", JSON.stringify(input, null, 2));

  const found = searchCatalog(input);
  appendTrace(sessionId, `${found.length} products found`);

  const verifications = new Map<string, HalalVerificationResult>();
  for (const product of found) {
    verifications.set(
      product.product_id,
      verifyHalalProduct(product, Boolean(input.halal_required)),
    );
  }

  appendTrace(sessionId, `halal_verify called for ${found.length} products`);

  const rejections = buildRejections(found, verifications, input);
  const halalRejected = rejections.filter((r) =>
    /halal|certificate|non-halal|proof/i.test(r.reason),
  ).length;
  const priceRejected = rejections.filter((r) => /exceeds budget/i.test(r.reason)).length;
  const stockRejected = rejections.filter((r) => /out of stock/i.test(r.reason)).length;

  if (priceRejected) {
    appendTrace(sessionId, `${priceRejected} products rejected due to price > budget`);
  }
  if (stockRejected) {
    appendTrace(sessionId, `${stockRejected} products rejected due to out of stock`);
  }
  if (halalRejected) {
    appendTrace(sessionId, `${halalRejected} products rejected due to missing or unverified Halal proof`);
  }

  const scored = scoreProducts(found, verifications, {
    max_price: input.max_price ?? Number.POSITIVE_INFINITY,
    location: input.location ?? "Singapore",
    halal_required: Boolean(input.halal_required),
  });

  appendTrace(sessionId, `${scored.length} eligible products remaining`);
  appendTrace(sessionId, "product_score called");

  const top = scored.slice(0, 3);
  appendTrace(sessionId, "top_3_products returned");

  const cards = top.map((scoredRow, index) => {
    const product = catalogById.get(scoredRow.product_id)!;
    const verification = verifications.get(scoredRow.product_id)!;
    return toGatewayCard(product, scoredRow, verification, index + 1);
  });

  return {
    total_found: found.length,
    eligible_count: scored.length,
    rejections,
    halal_verifications: [...verifications.values()],
    products: cards,
    trace: getTrace(sessionId),
  };
}

export function verifyHalalByProductId(productId: string, halalRequired = true) {
  const product = catalogById.get(productId);
  if (!product) throw new Error(`Unknown product_id ${productId}`);
  return verifyHalalProduct(product, halalRequired);
}

export function scoreProductIds(
  productIds: string[],
  options: { max_price: number; location: string; halal_required: boolean },
) {
  const products = productIds.map((id) => catalogById.get(id)).filter(Boolean) as CatalogProduct[];
  const verifications = new Map(
    products.map((product) => [
      product.product_id,
      verifyHalalProduct(product, options.halal_required),
    ]),
  );
  return scoreProducts(products, verifications, options);
}

export function getPaymentOptions(productId: string, location = "Singapore") {
  const product = catalogById.get(productId);
  if (!product) throw new Error(`Unknown product_id ${productId}`);

  const cart = runtime.createMarketplaceCart(
    [{ sku_id: skuId(productId), quantity: 1 }],
    location as "Singapore",
  );
  const [checkout] = runtime.splitSellerCheckoutSessions(cart.marketplace_cart_id, singaporeBuyer);
  const resolution = runtime.resolvePaymentCapability(checkout.checkout_session_id, singaporeBuyer);

  return {
    product_id: productId,
    options: [
      {
        id: "tokenized_card",
        label: "Credit/Debit Card",
        available: resolution.tokenized_card_available,
        note: "Secure delegated card payment",
      },
      {
        id: "shopeepay_wallet",
        label: "ShopeePay-style Wallet",
        available: resolution.tokenized_card_available,
        note: "Wallet top-up and instant checkout",
      },
      {
        id: "cod",
        label: "Cash on Delivery",
        available: resolution.cod_available,
        note: resolution.cod_available
          ? "Pay the courier when it arrives"
          : resolution.rejection_reasons.join(", "),
        restrictions: resolution.rejection_reasons,
      },
      {
        id: "bnpl",
        label: "Buy Now Pay Later",
        available: product.bnpl_available || resolution.bnpl_available,
        note: "Split into 3 monthly installments",
      },
    ],
    voucher_eligible: product.discount_pct ? product.discount_pct > 0 : false,
    checkout_session_id: checkout.checkout_session_id,
    cart_id: cart.marketplace_cart_id,
  };
}

export function getDeliveryOptions(productId: string, location = "Singapore") {
  const product = catalogById.get(productId);
  if (!product) throw new Error(`Unknown product_id ${productId}`);

  const match = runtime
    .searchProducts({ keyword: product.title.split(" ")[0], city: location as "Singapore" })
    .find((row) => row.sku_id === skuId(productId));

  const min = match?.city_delivery_window.min_days ?? 2;
  const max = match?.city_delivery_window.max_days ?? 3;

  return {
    product_id: productId,
    location,
    options: [
      {
        id: "standard",
        label: "Standard Delivery",
        fee: 1.5,
        currency: product.currency,
        eta: `${min}-${max} days`,
        courier: "NinjaVan Stub",
        reliability_score: 94,
      },
      {
        id: "express",
        label: "Express Delivery",
        fee: 3.9,
        currency: product.currency,
        eta: "Tomorrow",
        courier: "SPX Express Stub",
        reliability_score: 91,
      },
      {
        id: "economy",
        label: "Economy Delivery",
        fee: 0,
        currency: product.currency,
        eta: `${max + 1}-${max + 2} days`,
        courier: "Economy Post Stub",
        reliability_score: 88,
      },
    ],
  };
}

export function createOrder(input: {
  product_id: string;
  payment_method: "cod" | "tokenized_card" | "bnpl" | "shopeepay_wallet";
  delivery_option_id: string;
  demo_session_id?: string;
  session_id?: string;
}) {
  const sessionId = input.session_id ?? "public";
  const product = catalogById.get(input.product_id);
  if (!product) throw new Error(`Unknown product_id ${input.product_id}`);

  const delivery = getDeliveryOptions(input.product_id).options.find(
    (option) => option.id === input.delivery_option_id,
  );
  if (!delivery) throw new Error(`Unknown delivery option ${input.delivery_option_id}`);

  const payment = getPaymentOptions(input.product_id);
  const runtimeMethod =
    input.payment_method === "shopeepay_wallet" ? "tokenized_card" : input.payment_method;

  const cart = runtime.createMarketplaceCart(
    [{ sku_id: skuId(input.product_id), quantity: 1 }],
    product.city as "Singapore",
  );
  const [checkout] = runtime.splitSellerCheckoutSessions(cart.marketplace_cart_id, singaporeBuyer);

  const commitments =
    runtimeMethod === "cod"
      ? [runtime.confirmCODCommitment(checkout.checkout_session_id, singaporeBuyer)]
      : [];

  if (runtimeMethod === "bnpl") {
    const terms = runtime.createBNPLTerms(checkout.checkout_session_id, singaporeBuyer);
    runtime.acceptBNPLTerms(terms, true);
  }

  const runtimeOrder = runtime.createMarketplaceOrder(
    cart.marketplace_cart_id,
    [checkout.checkout_session_id],
    commitments,
  );

  const orderId = `ACP-SHP-${String(orders.size + 10042).padStart(5, "0")}`;
  const gatewayOrder: GatewayOrder = {
    order_id: orderId,
    product_id: product.product_id,
    sku_id: skuId(product.product_id),
    title: product.title,
    price: product.price,
    currency: product.currency,
    payment_method: input.payment_method,
    delivery_option_id: input.delivery_option_id,
    delivery_fee: delivery.fee,
    total: Math.round((product.price + delivery.fee) * 100) / 100,
    halal_status: "Verified Halal Certified",
    lifecycle_state: runtimeOrder.lifecycle_state,
    tracking_step: 1,
    placed_at: new Date().toISOString(),
    demo_session_id: input.demo_session_id ?? "demo-default",
  };

  orders.set(orderId, gatewayOrder);
  appendTrace(sessionId, "order_create called", orderId);

  return {
    order_id: orderId,
    runtime_order_id: runtimeOrder.order_id,
    lifecycle_state: runtimeOrder.lifecycle_state,
    summary: {
      product: product.title,
      price: product.price,
      currency: product.currency,
      payment: input.payment_method,
      delivery: delivery.label,
      delivery_fee: delivery.fee,
      total: gatewayOrder.total,
      halal_status: gatewayOrder.halal_status,
    },
  };
}

export function getOrderTracking(orderId: string, sessionId = "public") {
  const order = orders.get(orderId);
  if (!order) throw new Error(`Unknown order_id ${orderId}`);

  order.tracking_step = Math.min(TRACKING_STEPS.length, order.tracking_step + 1);
  orders.set(orderId, order);

  const events = TRACKING_STEPS.slice(0, order.tracking_step).map((label, index) => ({
    step: index + 1,
    label,
    completed: true,
  }));

  const current = TRACKING_STEPS[order.tracking_step - 1] ?? "Delivered";
  appendTrace(sessionId, "tracking_status called", `${orderId}: ${current}`);

  return {
    order_id: orderId,
    current_status: current,
    expected_message:
      current === "Out for delivery"
        ? "Your order is out for delivery and expected to arrive today."
        : current === "Delivered"
          ? "Your order has been delivered."
          : `Your order is currently: ${current}.`,
    events,
    lifecycle_state: order.lifecycle_state,
  };
}

export function parseShoppingIntent(message: string) {
  const lower = message.toLowerCase();
  const halalRequired = /halal/i.test(lower);
  const budgetMatch = lower.match(/(?:under|below|less than|max|<=?)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  const maxPrice = budgetMatch ? Number(budgetMatch[1]) : 10;
  const currency = /sgd|singapore/i.test(lower) ? "SGD" : "SGD";
  const location = /jakarta/i.test(lower)
    ? "Jakarta"
    : /singapore/i.test(lower) || /sgd/i.test(lower)
      ? "Singapore"
      : "Singapore";

  const query = /noodle|mie|laksa|instant/i.test(lower)
    ? "noodles"
    : /serum|beauty|skincare/i.test(lower)
      ? "serum"
      : /phone|case|charger/i.test(lower)
        ? "phone"
        : "noodles";

  return {
    query,
    max_price: maxPrice,
    currency,
    category: "groceries",
    halal_required: halalRequired,
    location,
  };
}

export function getProductCard(productId: string) {
  const product = catalogById.get(productId);
  if (!product) return undefined;
  const verification = verifyHalalProduct(product, true);
  const [scored] = scoreProducts([product], new Map([[product.product_id, verification]]), {
    max_price: 10,
    location: product.city,
    halal_required: true,
  });
  if (!scored) return undefined;
  return toGatewayCard(product, scored, verification, 1);
}

export function getCatalogProduct(id: string) {
  if (id.startsWith("sku_")) return catalogBySku.get(id);
  return catalogById.get(id.startsWith("prod_") ? id : `prod_${id}`);
}

export function getGatewayOrder(orderId: string) {
  const order = orders.get(orderId);
  if (!order) throw new Error(`Unknown order_id ${orderId}`);
  return order;
}
