import type {
  CartRequestItem,
  CartSellerGroup,
  City,
  MarketplaceCart,
  MarketplaceCartItem,
  Seller,
  SKU,
} from "../types.js";

export class CartEngine {
  private nextCartNumber = 1;
  private readonly sellersById: Map<string, Seller>;
  private readonly skusById: Map<string, SKU>;

  constructor(sellers: Seller[], skus: SKU[]) {
    this.sellersById = new Map(sellers.map((seller) => [seller.seller_id, seller]));
    this.skusById = new Map(skus.map((sku) => [sku.sku_id, sku]));
  }

  createMarketplaceCart(items: CartRequestItem[], city: City): MarketplaceCart {
    if (items.length === 0) {
      throw new Error("Cart must contain at least one item");
    }

    const cartItems = items.map((item) => this.toMarketplaceCartItem(item, city));
    const currency = cartItems[0]?.currency;

    if (!currency) {
      throw new Error("Cart currency could not be resolved");
    }

    const mixedCurrencyItem = cartItems.find((item) => item.currency !== currency);
    if (mixedCurrencyItem) {
      throw new Error("Marketplace cart currently requires a single currency");
    }

    const sellerGroups = this.groupBySeller(cartItems);
    const subtotal = cartItems.reduce((sum, item) => sum + item.line_total, 0);

    return {
      marketplace_cart_id: `cart_${String(this.nextCartNumber++).padStart(3, "0")}`,
      items: cartItems,
      currency,
      subtotal,
      seller_groups: sellerGroups,
      city,
      delivery_summary: {
        min_days: Math.min(...cartItems.map((item) => item.delivery_promise.min_days)),
        max_days: Math.max(...cartItems.map((item) => item.delivery_promise.max_days)),
        by_seller: sellerGroups.map((group) => ({
          seller_id: group.seller_id,
          min_days: Math.min(...group.items.map((item) => item.delivery_promise.min_days)),
          max_days: Math.max(...group.items.map((item) => item.delivery_promise.max_days)),
        })),
      },
      payment_capability_summary: {
        seller_group_count: sellerGroups.length,
        tokenized_card_possible: sellerGroups.every((group) => this.requireSeller(group.seller_id).payment_capability.tokenized_card),
        cod_possible: sellerGroups.every((group) => group.items.every((item) => item.cod_available)),
        bnpl_possible: sellerGroups.every((group) => group.items.every((item) => item.bnpl_available)),
      },
    };
  }

  private toMarketplaceCartItem(item: CartRequestItem, city: City): MarketplaceCartItem {
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Quantity for ${item.sku_id} must be a positive integer`);
    }

    const sku = this.skusById.get(item.sku_id);
    if (!sku) {
      throw new Error(`Unknown sku_id ${item.sku_id}`);
    }

    if (sku.stock_quantity < item.quantity) {
      throw new Error(`Insufficient stock for ${item.sku_id}`);
    }

    const deliveryPromise = sku.delivery_promises.find((promise) => promise.city === city);
    if (!deliveryPromise) {
      throw new Error(`SKU ${item.sku_id} cannot deliver to ${city}`);
    }

    return {
      sku_id: sku.sku_id,
      seller_id: sku.seller_id,
      title: sku.title,
      quantity: item.quantity,
      unit_price: sku.price,
      currency: sku.currency,
      line_total: sku.price * item.quantity,
      cod_available: sku.cod_available,
      bnpl_available: sku.bnpl_available,
      delivery_promise: deliveryPromise,
    };
  }

  private groupBySeller(items: MarketplaceCartItem[]): CartSellerGroup[] {
    const groups = new Map<string, MarketplaceCartItem[]>();

    for (const item of items) {
      groups.set(item.seller_id, [...(groups.get(item.seller_id) ?? []), item]);
    }

    return Array.from(groups.entries()).map(([sellerId, sellerItems], index) => ({
      seller_group_id: `seller_group_${String(index + 1).padStart(3, "0")}`,
      seller_id: sellerId,
      items: sellerItems,
      seller_subtotal: sellerItems.reduce((sum, item) => sum + item.line_total, 0),
    }));
  }

  private requireSeller(sellerId: string): Seller {
    const seller = this.sellersById.get(sellerId);

    if (!seller) {
      throw new Error(`Unknown seller_id ${sellerId}`);
    }

    return seller;
  }
}
