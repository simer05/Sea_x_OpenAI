import type { MarketplaceCart, SellerCheckoutSession } from "../types.js";

export class SellerSessionSplitter {
  split(cart: MarketplaceCart): SellerCheckoutSession[] {
    return cart.seller_groups.map((group, index) => ({
      checkout_session_id: `checkout_${cart.marketplace_cart_id}_${group.seller_id}_${String(index + 1).padStart(3, "0")}`,
      seller_id: group.seller_id,
      items: group.items,
      seller_subtotal: group.seller_subtotal,
      delivery_promise: {
        city: cart.city,
        min_days: Math.min(...group.items.map((item) => item.delivery_promise.min_days)),
        max_days: Math.max(...group.items.map((item) => item.delivery_promise.max_days)),
      },
      eligible_payment_methods: [],
      session_status: "created",
    }));
  }
}
