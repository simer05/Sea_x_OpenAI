import type { SupportedCity, SupportedCountry, SupportedCurrency } from "../base-models/common";

export interface TokenizedCardPaymentHandler {
  handler_id: string;
  handler_type: "tokenized_card";
  supported_countries: SupportedCountry[];
  supported_currencies: SupportedCurrency[];
  requires_delegate_payment: boolean;
}

export interface CodPaymentHandler {
  handler_id: string;
  handler_type: "cod";
  supported_countries: SupportedCountry[];
  supported_currencies: SupportedCurrency[];
  supported_cities: SupportedCity[];
  requires_delegate_payment: boolean;
  requires_buyer_confirmation: boolean;
  settlement_mode: "deferred_cash_collection";
  commitment_token_required: boolean;
  risk_score_supported: boolean;
}

export interface BnplStubPaymentHandler {
  handler_id: string;
  handler_type: "bnpl_stub";
  provider: string;
  supported_countries: SupportedCountry[];
  supported_currencies: SupportedCurrency[];
  installment_options: number[];
  terms_acceptance_required: boolean;
  redirect_required: boolean;
  underwriting_mode: "stubbed_terms_acceptance_only";
}

export type PaymentHandlerDeclaration =
  | TokenizedCardPaymentHandler
  | CodPaymentHandler
  | BnplStubPaymentHandler;
