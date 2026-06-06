import type { BuyerProfile, CODCommitment, CODRiskResult, Seller, SellerCheckoutSession } from "../types.js";
import { CODRiskEngine } from "../risk-engine/codRiskEngine.js";

export class CODHandler {
  private readonly sellersById: Map<string, Seller>;

  constructor(
    sellers: Seller[],
    private readonly riskEngine = new CODRiskEngine(),
  ) {
    this.sellersById = new Map(sellers.map((seller) => [seller.seller_id, seller]));
  }

  confirm(session: SellerCheckoutSession, buyerProfile: BuyerProfile): CODCommitment {
    const seller = this.requireSeller(session.seller_id);
    const rejectionReasons: string[] = [];

    if (!seller.payment_capability.cod.enabled) {
      rejectionReasons.push("seller_cod_disabled");
    }

    if (!seller.payment_capability.cod.supported_cities.includes(session.delivery_promise.city)) {
      rejectionReasons.push("city_cod_not_supported");
    }

    const unsupportedCurrency = session.items.find(
      (item) => !seller.payment_capability.cod.currencies.includes(item.currency),
    );
    if (unsupportedCurrency) {
      rejectionReasons.push(`cod_currency_not_supported:${unsupportedCurrency.currency}`);
    }

    const blockedItem = session.items.find((item) => !item.cod_available);
    if (blockedItem) {
      rejectionReasons.push(`sku_cod_not_available:${blockedItem.sku_id}`);
    }

    if (session.seller_subtotal > seller.payment_capability.cod.amount_limit) {
      rejectionReasons.push("cod_amount_limit_exceeded");
    }

    const risk = this.scoreRisk(session, buyerProfile, seller);
    const sellerAction = this.resolveSellerAction(rejectionReasons, risk);
    const canCreateCommitment = sellerAction === "allow_cod" || sellerAction === "manual_review";

    return {
      checkout_session_id: session.checkout_session_id,
      seller_id: session.seller_id,
      commitment_token: canCreateCommitment ? this.commitmentToken(session, buyerProfile) : undefined,
      settlement_status: canCreateCommitment ? "pending_cash" : "not_started",
      seller_action: sellerAction,
      risk,
      rejection_reasons: rejectionReasons,
    };
  }

  private scoreRisk(
    session: SellerCheckoutSession,
    buyerProfile: BuyerProfile,
    seller: Seller,
  ): CODRiskResult {
    return this.riskEngine.score({
      buyer_failed_delivery_count: buyerProfile.buyer_failed_delivery_count,
      buyer_cod_order_count: buyerProfile.buyer_cod_order_count,
      order_amount: session.seller_subtotal,
      city: session.delivery_promise.city,
      seller_category: seller.seller_category,
      delivery_window_days: session.delivery_promise.max_days,
      seller_cod_return_rate: seller.cod_return_rate,
    });
  }

  private resolveSellerAction(rejectionReasons: string[], risk: CODRiskResult): CODCommitment["seller_action"] {
    if (rejectionReasons.some((reason) => reason.startsWith("seller_cod_disabled") || reason.startsWith("city_cod_not_supported") || reason.startsWith("sku_cod_not_available"))) {
      return "reject_cod";
    }

    if (rejectionReasons.includes("cod_amount_limit_exceeded") || rejectionReasons.some((reason) => reason.startsWith("cod_currency_not_supported"))) {
      return "require_prepaid";
    }

    return risk.seller_action;
  }

  private commitmentToken(session: SellerCheckoutSession, buyerProfile: BuyerProfile): string {
    const raw = `${session.checkout_session_id}:${buyerProfile.buyer_id}:${session.seller_subtotal}`;
    let hash = 0;

    for (let index = 0; index < raw.length; index += 1) {
      hash = (hash * 31 + raw.charCodeAt(index)) % 1000000007;
    }

    return `cod_commit_${hash.toString(36)}`;
  }

  private requireSeller(sellerId: string): Seller {
    const seller = this.sellersById.get(sellerId);

    if (!seller) {
      throw new Error(`Unknown seller_id ${sellerId}`);
    }

    return seller;
  }
}
