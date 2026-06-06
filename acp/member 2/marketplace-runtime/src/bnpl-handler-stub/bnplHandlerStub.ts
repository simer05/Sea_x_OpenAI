import type { BNPLTerms, BuyerProfile, Seller, SellerCheckoutSession } from "../types.js";

export class BNPLHandlerStub {
  private readonly sellersById: Map<string, Seller>;

  constructor(sellers: Seller[]) {
    this.sellersById = new Map(sellers.map((seller) => [seller.seller_id, seller]));
  }

  createTerms(session: SellerCheckoutSession, buyerProfile: BuyerProfile): BNPLTerms {
    const seller = this.requireSeller(session.seller_id);
    const rejectionReasons: string[] = [];

    if (!seller.payment_capability.bnpl.enabled) {
      rejectionReasons.push("seller_bnpl_disabled");
    }

    const blockedItem = session.items.find((item) => !item.bnpl_available);
    if (blockedItem) {
      rejectionReasons.push(`sku_bnpl_not_available:${blockedItem.sku_id}`);
    }

    if (session.seller_subtotal < seller.payment_capability.bnpl.min_amount) {
      rejectionReasons.push("bnpl_min_amount_not_met");
    }

    if (session.seller_subtotal > seller.payment_capability.bnpl.max_amount) {
      rejectionReasons.push("bnpl_amount_limit_exceeded");
    }

    const bnplAvailable = rejectionReasons.length === 0;

    return {
      checkout_session_id: session.checkout_session_id,
      seller_id: session.seller_id,
      bnpl_available: bnplAvailable,
      installment_options: bnplAvailable
        ? seller.payment_capability.bnpl.installment_months.map((months) => ({
            months,
            estimated_monthly_amount: Number((session.seller_subtotal / months).toFixed(2)),
          }))
        : [],
      terms_acceptance_required: bnplAvailable && !buyerProfile.bnpl_terms_accepted,
      terms_status: bnplAvailable
        ? buyerProfile.bnpl_terms_accepted
          ? "accepted"
          : "required"
        : "not_required",
      rejection_reasons: rejectionReasons,
    };
  }

  acceptTerms(terms: BNPLTerms, accepted: boolean): BNPLTerms {
    if (!terms.bnpl_available) {
      return terms;
    }

    return {
      ...terms,
      terms_acceptance_required: false,
      terms_status: accepted ? "accepted" : "rejected",
    };
  }

  private requireSeller(sellerId: string): Seller {
    const seller = this.sellersById.get(sellerId);

    if (!seller) {
      throw new Error(`Unknown seller_id ${sellerId}`);
    }

    return seller;
  }
}
