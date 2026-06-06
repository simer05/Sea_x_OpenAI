import type { FulfillmentMode, SupportedCurrency } from "../base-models/common";

export const MARKETPLACE_EXTENSION_NAMESPACE = "dev.acpsea.marketplace" as const;

export const merchantOfRecordModeValues = [
  "marketplace_as_merchant_of_record",
  "seller_as_merchant_of_record",
  "hybrid"
] as const;

export type MerchantOfRecordMode = (typeof merchantOfRecordModeValues)[number];

export interface SellerCheckoutSessionSummary {
  checkout_session_id: string;
  seller_id: string;
  seller_group_id: string;
  status: "created" | "requires_confirmation" | "confirmed" | "cancelled" | "failed";
  currency: SupportedCurrency;
  subtotal: number;
}

export interface SellerFulfillmentGroup {
  seller_group_id: string;
  seller_id: string;
  fulfillment_mode: FulfillmentMode;
  city: string;
  delivery_window: {
    starts_at: string;
    ends_at: string;
  };
}

export interface SellerSettlementStatus {
  seller_id: string;
  settlement_id: string;
  status: "not_started" | "escrow_held" | "cash_pending" | "seller_settlement_pending" | "settled";
}

export interface MarketplaceExtensionPayload {
  extension_id: string;
  namespace: typeof MARKETPLACE_EXTENSION_NAMESPACE;
  marketplace_cart_id: string;
  merchant_of_record_mode: MerchantOfRecordMode;
  seller_checkout_sessions: SellerCheckoutSessionSummary[];
  seller_fulfillment_groups: SellerFulfillmentGroup[];
  seller_settlement_statuses: SellerSettlementStatus[];
}
