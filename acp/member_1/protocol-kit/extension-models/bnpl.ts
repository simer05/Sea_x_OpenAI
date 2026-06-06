import type { SupportedCurrency } from "../base-models/common";

export const BNPL_EXTENSION_NAMESPACE = "dev.acpsea.bnpl" as const;

export const bnplAcceptanceStatusValues = [
  "not_required",
  "required",
  "accepted",
  "rejected",
  "expired"
] as const;

export type BnplAcceptanceStatus = (typeof bnplAcceptanceStatusValues)[number];

export interface BnplInstallmentOption {
  installment_count: number;
  installment_amount: number;
  due_interval: "monthly" | "biweekly";
}

export interface BnplState {
  available: boolean;
  provider: string | null;
  installments: BnplInstallmentOption[];
  total_payable: number;
  currency: SupportedCurrency;
  terms_url: string | null;
  acceptance_required: boolean;
  acceptance_status: BnplAcceptanceStatus;
}

export interface BnplExtensionPayload {
  extension_id: string;
  namespace: typeof BNPL_EXTENSION_NAMESPACE;
  bnpl: BnplState;
}
