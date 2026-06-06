export type Country =
  | "Indonesia"
  | "Singapore"
  | "Malaysia"
  | "Philippines"
  | "Thailand"
  | "Vietnam";

export type City =
  | "Jakarta"
  | "Singapore"
  | "Kuala Lumpur"
  | "Manila"
  | "Bangkok"
  | "Ho Chi Minh City";

export type Currency = "SGD" | "IDR" | "MYR" | "PHP" | "THB" | "VND";

export type HalalStatus = "certified" | "not_certified" | "unknown";
export type BPOMStatus = "registered" | "not_registered" | "not_required" | "unknown";
export type SellerAction = "allow_cod" | "require_prepaid" | "manual_review" | "reject_cod";
export type RiskBand = "low" | "medium" | "high" | "blocked";

export type CheckoutSessionStatus =
  | "created"
  | "awaiting_buyer_confirmation"
  | "confirmed"
  | "cancelled"
  | "failed";

export type CODSettlementStatus =
  | "not_started"
  | "pending_cash"
  | "cash_collected"
  | "failed_delivery"
  | "cancelled"
  | "settled";

export type BNPLTermsStatus = "not_required" | "required" | "accepted" | "rejected" | "expired";

export type OrderLifecycleState =
  | "cart_created"
  | "seller_sessions_created"
  | "buyer_confirmed"
  | "cod_committed"
  | "order_confirmed"
  | "awaiting_delivery"
  | "pending_cash_collection"
  | "cash_collected"
  | "seller_settlement_pending"
  | "seller_settled"
  | "cancelled"
  | "failed_delivery"
  | "returned";

export type SettlementState =
  | "escrow_held"
  | "cash_pending"
  | "cash_collected"
  | "escrow_release_pending"
  | "escrow_released"
  | "seller_settlement_pending"
  | "seller_settled"
  | "refund_pending"
  | "refunded"
  | "disputed";

export interface DeliveryPromise {
  city: City;
  min_days: number;
  max_days: number;
}

export interface ComplianceProfile {
  halal_status: HalalStatus;
  halal_certifier?: string;
  halal_certificate_id?: string;
  bpom_status: BPOMStatus;
  bpom_registration_number?: string;
}

export interface PaymentCapability {
  tokenized_card: boolean;
  cod: {
    enabled: boolean;
    supported_cities: City[];
    amount_limit: number;
    currencies: Currency[];
  };
  bnpl: {
    enabled: boolean;
    min_amount: number;
    max_amount: number;
    installment_months: number[];
  };
}

export interface Seller {
  seller_id: string;
  name: string;
  country: Country;
  city: City;
  rating: number;
  seller_category: string;
  cod_return_rate: number;
  payment_capability: PaymentCapability;
}

export interface SKU {
  sku_id: string;
  variant_id: string;
  seller_id: string;
  title: string;
  category: string;
  price: number;
  currency: Currency;
  country: Country;
  stock_quantity: number;
  compliance: ComplianceProfile;
  cod_available: boolean;
  bnpl_available: boolean;
  delivery_promises: DeliveryPromise[];
}

export interface BuyerProfile {
  buyer_id: string;
  country: Country;
  city: City;
  buyer_failed_delivery_count: number;
  buyer_cod_order_count: number;
  bnpl_terms_accepted: boolean;
}

export interface SearchFilters {
  keyword?: string;
  category?: string;
  price_ceiling?: number;
  currency?: Currency;
  country?: Country;
  city?: City;
  delivery_deadline?: number;
  halal_status?: HalalStatus;
  bpom_status?: BPOMStatus;
  cod_available?: boolean;
  bnpl_available?: boolean;
  stock_available?: boolean;
  seller_rating_min?: number;
}

export interface SearchResult {
  sku_id: string;
  seller_id: string;
  title: string;
  price: number;
  currency: Currency;
  city_delivery_window: DeliveryPromise;
  halal_status: HalalStatus;
  bpom_status: BPOMStatus;
  cod_available: boolean;
  bnpl_available: boolean;
  stock_quantity: number;
  seller_rating: number;
}

export interface CartRequestItem {
  sku_id: string;
  quantity: number;
}

export interface MarketplaceCartItem {
  sku_id: string;
  seller_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency: Currency;
  line_total: number;
  cod_available: boolean;
  bnpl_available: boolean;
  delivery_promise: DeliveryPromise;
}

export interface CartSellerGroup {
  seller_group_id: string;
  seller_id: string;
  items: MarketplaceCartItem[];
  seller_subtotal: number;
}

export interface MarketplaceCart {
  marketplace_cart_id: string;
  items: MarketplaceCartItem[];
  currency: Currency;
  subtotal: number;
  seller_groups: CartSellerGroup[];
  city: City;
  delivery_summary: {
    min_days: number;
    max_days: number;
    by_seller: Array<{
      seller_id: string;
      min_days: number;
      max_days: number;
    }>;
  };
  payment_capability_summary: {
    seller_group_count: number;
    tokenized_card_possible: boolean;
    cod_possible: boolean;
    bnpl_possible: boolean;
  };
}

export interface SellerCheckoutSession {
  checkout_session_id: string;
  seller_id: string;
  items: MarketplaceCartItem[];
  seller_subtotal: number;
  delivery_promise: DeliveryPromise;
  eligible_payment_methods: string[];
  session_status: CheckoutSessionStatus;
}

export interface PaymentCapabilityResolution {
  seller_id: string;
  tokenized_card_available: boolean;
  cod_available: boolean;
  bnpl_available: boolean;
  rejection_reasons: string[];
}

export interface CODRiskInput {
  buyer_failed_delivery_count: number;
  buyer_cod_order_count: number;
  order_amount: number;
  city: City;
  seller_category: string;
  delivery_window_days: number;
  seller_cod_return_rate: number;
}

export interface CODRiskResult {
  risk_score: number;
  risk_band: RiskBand;
  seller_action: SellerAction;
  risk_reasons: string[];
}

export interface CODCommitment {
  checkout_session_id: string;
  seller_id: string;
  commitment_token?: string;
  settlement_status: CODSettlementStatus;
  seller_action: SellerAction;
  risk: CODRiskResult;
  rejection_reasons: string[];
}

export interface BNPLTerms {
  checkout_session_id: string;
  seller_id: string;
  bnpl_available: boolean;
  installment_options: Array<{
    months: number;
    estimated_monthly_amount: number;
  }>;
  terms_acceptance_required: boolean;
  terms_status: BNPLTermsStatus;
  rejection_reasons: string[];
}

export interface MarketplaceOrder {
  order_id: string;
  marketplace_cart_id: string;
  seller_sessions: SellerCheckoutSession[];
  cod_commitments: CODCommitment[];
  lifecycle_state: OrderLifecycleState;
}

export interface OrderSettlement {
  settlement_id: string;
  order_id: string;
  seller_id: string;
  amount: number;
  currency: Currency;
  state: SettlementState;
  history: SettlementState[];
}
