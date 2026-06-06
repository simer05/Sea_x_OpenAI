import type { DeliveryPromise, SearchFilters, SearchResult, Seller, SKU } from "../types.js";

export class SearchEngine {
  private readonly sellersById: Map<string, Seller>;

  constructor(
    private readonly skus: SKU[],
    sellers: Seller[],
  ) {
    this.sellersById = new Map(sellers.map((seller) => [seller.seller_id, seller]));
  }

  search(filters: SearchFilters = {}): SearchResult[] {
    const keyword = filters.keyword?.trim().toLowerCase();

    return this.skus
      .filter((sku) => {
        const seller = this.requireSeller(sku.seller_id);
        const deliveryWindow = this.findDeliveryWindow(sku, filters.city);

        if (keyword && !`${sku.title} ${sku.category}`.toLowerCase().includes(keyword)) {
          return false;
        }

        if (filters.category && sku.category !== filters.category) {
          return false;
        }

        if (filters.price_ceiling !== undefined && sku.price > filters.price_ceiling) {
          return false;
        }

        if (filters.currency && sku.currency !== filters.currency) {
          return false;
        }

        if (filters.country && sku.country !== filters.country) {
          return false;
        }

        if (filters.city && !deliveryWindow) {
          return false;
        }

        if (filters.delivery_deadline !== undefined) {
          const window = deliveryWindow ?? sku.delivery_promises[0];
          if (!window || window.max_days > filters.delivery_deadline) {
            return false;
          }
        }

        if (filters.halal_status && sku.compliance.halal_status !== filters.halal_status) {
          return false;
        }

        if (filters.bpom_status && sku.compliance.bpom_status !== filters.bpom_status) {
          return false;
        }

        if (filters.cod_available !== undefined && sku.cod_available !== filters.cod_available) {
          return false;
        }

        if (filters.bnpl_available !== undefined && sku.bnpl_available !== filters.bnpl_available) {
          return false;
        }

        if (filters.stock_available === true && sku.stock_quantity <= 0) {
          return false;
        }

        if (filters.stock_available === false && sku.stock_quantity > 0) {
          return false;
        }

        if (filters.seller_rating_min !== undefined && seller.rating < filters.seller_rating_min) {
          return false;
        }

        return true;
      })
      .map((sku) => {
        const seller = this.requireSeller(sku.seller_id);
        const cityDeliveryWindow = this.findDeliveryWindow(sku, filters.city) ?? sku.delivery_promises[0];

        if (!cityDeliveryWindow) {
          throw new Error(`SKU ${sku.sku_id} has no delivery promises`);
        }

        return {
          sku_id: sku.sku_id,
          seller_id: sku.seller_id,
          title: sku.title,
          price: sku.price,
          currency: sku.currency,
          city_delivery_window: cityDeliveryWindow,
          halal_status: sku.compliance.halal_status,
          bpom_status: sku.compliance.bpom_status,
          cod_available: sku.cod_available,
          bnpl_available: sku.bnpl_available,
          stock_quantity: sku.stock_quantity,
          seller_rating: seller.rating,
        };
      })
      .sort((left, right) => right.seller_rating - left.seller_rating || left.price - right.price);
  }

  private findDeliveryWindow(sku: SKU, city?: DeliveryPromise["city"]): DeliveryPromise | undefined {
    if (!city) {
      return sku.delivery_promises[0];
    }

    return sku.delivery_promises.find((promise) => promise.city === city);
  }

  private requireSeller(sellerId: string): Seller {
    const seller = this.sellersById.get(sellerId);

    if (!seller) {
      throw new Error(`Unknown seller_id ${sellerId}`);
    }

    return seller;
  }
}
