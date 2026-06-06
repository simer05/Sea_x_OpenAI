import type { SupportedCity, SupportedCurrency } from "../base-models/common";

export const COD_EXTENSION_NAMESPACE = "dev.acpsea.cod" as const;

export const codSettlementStatusValues = [
  "not_started",
  "pending_cash",
  "cash_collected",
  "failed_delivery",
  "cancelled",
  "settled"
] as const;

export type CodSettlementStatus = (typeof codSettlementStatusValues)[number];

export const codSellerActionValues = [
  "allow_cod",
  "require_prepaid",
  "manual_review",
  "reject_cod"
] as const;

export type CodSellerAction = (typeof codSellerActionValues)[number];

export interface CodState {
  available: boolean;
  max_amount: number;
  currency: SupportedCurrency;
  supported_cities: SupportedCity[];
  requires_buyer_confirmation: boolean;
  commitment_required: boolean;
  commitment_token: string | null;
  settlement_status: CodSettlementStatus;
  risk_score: number;
  seller_action: CodSellerAction;
}

export interface CodExtensionPayload {
  extension_id: string;
  namespace: typeof COD_EXTENSION_NAMESPACE;
  cod: CodState;
}
