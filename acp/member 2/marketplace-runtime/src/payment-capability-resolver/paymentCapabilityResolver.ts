import type { BuyerProfile, PaymentCapabilityResolution, Seller, SellerCheckoutSession } from "../types.js";
import { CODRiskEngine } from "../risk-engine/codRiskEngine.js";

export class PaymentCapabilityResolver {
  private readonly sellersById: Map<string, Seller>;

  constructor(
    sellers: Seller[],
    private readonly riskEngine = new CODRiskEngine(),
  ) {
    this.sellersById = new Map(sellers.map((seller) => [seller.seller_id, seller]));
  }

  resolve(session: SellerCheckoutSession, buyerProfile: BuyerProfile): PaymentCapabilityResolution {
    const seller = this.requireSeller(session.seller_id);
    const reasons: string[] = [];

    const tokenizedCardAvailable = seller.payment_capability.tokenized_card;
    const codAvailable = this.resolveCOD(session, seller, buyerProfile, reasons);
    const bnplAvailable = this.resolveBNPL(session, seller, reasons);

    return {
      seller_id: session.seller_id,
      tokenized_card_available: tokenizedCardAvailable,
      cod_available: codAvailable,
      bnpl_available: bnplAvailable,
      rejection_reasons: reasons,
    };
  }

  private resolveCOD(
    session: SellerCheckoutSession,
    seller: Seller,
    buyerProfile: BuyerProfile,
    reasons: string[],
  ): boolean {
    const cod = seller.payment_capability.cod;
    let eligible = true;

    if (!cod.enabled) {
      eligible = false;
      reasons.push("seller_cod_disabled");
    }

    if (!cod.supported_cities.includes(session.delivery_promise.city)) {
      eligible = false;
      reasons.push("city_cod_not_supported");
    }

    const unsupportedCurrency = session.items.find((item) => !cod.currencies.includes(item.currency));
    if (unsupportedCurrency) {
      eligible = false;
      reasons.push(`cod_currency_not_supported:${unsupportedCurrency.currency}`);
    }

    const codBlockedItem = session.items.find((item) => !item.cod_available);
    if (codBlockedItem) {
      eligible = false;
      reasons.push(`sku_cod_not_available:${codBlockedItem.sku_id}`);
    }

    if (session.seller_subtotal > cod.amount_limit) {
      eligible = false;
      reasons.push("cod_amount_limit_exceeded");
    }

    if (!eligible) {
      return false;
    }

    const risk = this.riskEngine.score({
      buyer_failed_delivery_count: buyerProfile.buyer_failed_delivery_count,
      buyer_cod_order_count: buyerProfile.buyer_cod_order_count,
      order_amount: session.seller_subtotal,
      city: session.delivery_promise.city,
      seller_category: seller.seller_category,
      delivery_window_days: session.delivery_promise.max_days,
      seller_cod_return_rate: seller.cod_return_rate,
    });

    if (risk.seller_action === "reject_cod" || risk.seller_action === "require_prepaid") {
      reasons.push(`cod_risk_action:${risk.seller_action}`);
      return false;
    }

    if (risk.seller_action === "manual_review") {
      reasons.push("cod_requires_manual_review");
    }

    return true;
  }

  private resolveBNPL(session: SellerCheckoutSession, seller: Seller, reasons: string[]): boolean {
    const bnpl = seller.payment_capability.bnpl;
    let eligible = true;

    if (!bnpl.enabled) {
      eligible = false;
      reasons.push("seller_bnpl_disabled");
    }

    const blockedItem = session.items.find((item) => !item.bnpl_available);
    if (blockedItem) {
      eligible = false;
      reasons.push(`sku_bnpl_not_available:${blockedItem.sku_id}`);
    }

    if (session.seller_subtotal < bnpl.min_amount) {
      eligible = false;
      reasons.push("bnpl_min_amount_not_met");
    }

    if (session.seller_subtotal > bnpl.max_amount) {
      eligible = false;
      reasons.push("bnpl_amount_limit_exceeded");
    }

    return eligible;
  }

  private requireSeller(sellerId: string): Seller {
    const seller = this.sellersById.get(sellerId);

    if (!seller) {
      throw new Error(`Unknown seller_id ${sellerId}`);
    }

    return seller;
  }
}
