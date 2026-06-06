import type {
  DeliveryWindow,
  FulfillmentMode,
  SellerReference,
  SupportedCurrency,
  SupportedExtensionNamespace
} from "./common";
import type { CapabilityDeclaration } from "../capability-model/declaration";
import type { PaymentHandlerDeclaration } from "../payment-handler-models/handlers";

export const checkoutStatusValues = [
  "created",
  "requires_confirmation",
  "confirmed",
  "cancelled",
  "failed"
] as const;

export type CheckoutStatus = (typeof checkoutStatusValues)[number];

export const checkoutMessageLevelValues = ["info", "warning", "error"] as const;

export type CheckoutMessageLevel = (typeof checkoutMessageLevelValues)[number];

export interface CheckoutLineItem {
  line_item_id: string;
  product_id: string;
  variant_id: string;
  seller_reference: SellerReference;
  title: string;
  quantity: number;
  unit_price: number;
  currency: SupportedCurrency;
}

export interface FulfillmentOption {
  fulfillment_option_id: string;
  mode: FulfillmentMode;
  description: string;
  estimated_delivery_window: DeliveryWindow;
  price: number;
  currency: SupportedCurrency;
}

export interface CheckoutTotals {
  currency: SupportedCurrency;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  grand_total: number;
}

export interface CheckoutMessage {
  message_id: string;
  level: CheckoutMessageLevel;
  text: string;
}

export type CheckoutExtensions = Partial<Record<SupportedExtensionNamespace, unknown>>;

export interface BaseCheckoutSessionPayload {
  checkout_session_id: string;
  status: CheckoutStatus;
  line_items: CheckoutLineItem[];
  fulfillment_options: FulfillmentOption[];
  totals: CheckoutTotals;
  messages: CheckoutMessage[];
  capabilities: CapabilityDeclaration;
  payment_handlers: PaymentHandlerDeclaration[];
  extensions: CheckoutExtensions;
}
