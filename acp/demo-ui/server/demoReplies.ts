import type { GatewayProductCard } from "./acpGateway.js";

export function picksReply(
  totalFound: number,
  eligibleCount: number,
  products: GatewayProductCard[],
): string {
  if (!products.length) {
    return "No products matched your request after Halal and budget checks. Try a different budget, city, or product.";
  }
  return (
    `Found ${totalFound} matches — ${eligibleCount} passed Halal verification and your filters. ` +
    `Here are the top ${products.length} scored picks. Select one or view it on the shop.`
  );
}

export function selectReply(product: GatewayProductCard): string {
  return (
    `Great choice — ${product.title} at SGD ${product.price.toFixed(2)} ` +
    `(score ${product.overall_score}/100). It's in your Shopee cart. ` +
    `Choose a delivery option next.`
  );
}

export function deliveryReply(productTitle: string): string {
  return `Pick how you'd like ${productTitle} delivered — standard, express, or economy.`;
}

export function paymentReply(productTitle: string): string {
  return `Almost done! Choose how to pay for ${productTitle} — card, ShopeePay, COD, or PayLater.`;
}

export function orderReply(orderId: string, total: number): string {
  return `Order placed! Your order ID is ${orderId}. Total SGD ${total.toFixed(2)}. Ask me "Where is my order?" anytime.`;
}

export function trackingReply(message: string): string {
  return message;
}

export function voiceSummary(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const first = clean.split(/[.!?]/)[0]?.trim() ?? clean;
  return first.slice(0, 140);
}
