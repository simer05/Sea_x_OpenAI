import type { GatewayProductCard } from "./acpGateway.js";

const EMPTY_BREAKDOWN = {
  halal_trust: 0,
  price_fit: 0,
  product_rating: 0,
  customer_reviews: 0,
  seller_trust: 0,
  sold_count: 0,
  delivery_fit: 0,
};

export function normalizeProductCard(raw: Partial<GatewayProductCard>): GatewayProductCard {
  const breakdown = raw.score_breakdown ?? EMPTY_BREAKDOWN;
  return {
    rank: raw.rank ?? 0,
    product_id: raw.product_id ?? "",
    sku_id: raw.sku_id ?? "",
    title: raw.title ?? "Unknown product",
    description: raw.description ?? "",
    price: raw.price ?? 0,
    currency: raw.currency ?? "SGD",
    seller_name: raw.seller_name ?? "",
    seller_id: raw.seller_id ?? "",
    rating: raw.rating ?? 0,
    review_count: raw.review_count ?? 0,
    sold_count: raw.sold_count ?? 0,
    stock_status: raw.stock_status ?? "unknown",
    halal_status: raw.halal_status ?? "unknown",
    halal_verification: raw.halal_verification ?? {
      product_id: raw.product_id ?? "",
      status: "Not Certified Halal",
      eligible_for_halal_request: false,
      certificate_authority: null,
      certificate_id: null,
      certificate_active: false,
      certificate_expired: false,
      risky_ingredients: [],
      decision: "Rejected",
      reason: "Verification unavailable",
    },
    certificate_authority: raw.certificate_authority ?? null,
    certificate_status: raw.certificate_status ?? "No active certificate",
    overall_score: raw.overall_score ?? 0,
    tier: raw.tier ?? "Not recommended",
    score_breakdown: {
      halal_trust: breakdown.halal_trust ?? 0,
      price_fit: breakdown.price_fit ?? 0,
      product_rating: breakdown.product_rating ?? 0,
      customer_reviews: breakdown.customer_reviews ?? 0,
      seller_trust: breakdown.seller_trust ?? 0,
      sold_count: breakdown.sold_count ?? 0,
      delivery_fit: breakdown.delivery_fit ?? 0,
    },
    recommendation_reason: raw.recommendation_reason ?? "",
    product_url: raw.product_url ?? "/",
    image_url: raw.image_url ?? "/images/products/food_groceries.jpg",
    cod_available: Boolean(raw.cod_available),
    bnpl_available: Boolean(raw.bnpl_available),
    delivery_days: raw.delivery_days ?? "2-3 days",
    city: raw.city ?? "Singapore",
    country: raw.country ?? "Singapore",
  };
}

export function normalizeProductCards(
  products: Array<Partial<GatewayProductCard>> | undefined,
): GatewayProductCard[] {
  return (products ?? []).map((product) => normalizeProductCard(product));
}
