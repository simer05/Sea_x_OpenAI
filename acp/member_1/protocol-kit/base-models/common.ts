export const supportedCountries = [
  "Indonesia",
  "Singapore",
  "Malaysia",
  "Philippines",
  "Thailand",
  "Vietnam"
] as const;

export type SupportedCountry = (typeof supportedCountries)[number];

export const supportedCities = [
  "Jakarta",
  "Singapore",
  "Kuala Lumpur",
  "Manila",
  "Bangkok",
  "Ho Chi Minh City"
] as const;

export type SupportedCity = (typeof supportedCities)[number];

export const supportedCurrencies = ["SGD", "IDR", "MYR", "PHP", "THB", "VND"] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number];

export const fulfillmentModes = [
  "standard_delivery",
  "express_delivery",
  "same_day_delivery",
  "seller_pickup"
] as const;

export type FulfillmentMode = (typeof fulfillmentModes)[number];

export const supportedExtensionNamespaces = [
  "dev.acpsea.compliance",
  "dev.acpsea.cod",
  "dev.acpsea.bnpl",
  "dev.acpsea.marketplace",
  "dev.acpsea.postpurchase"
] as const;

export type SupportedExtensionNamespace = (typeof supportedExtensionNamespaces)[number];

export const supportedPaymentHandlerTypes = ["tokenized_card", "cod", "bnpl_stub"] as const;

export type SupportedPaymentHandlerType = (typeof supportedPaymentHandlerTypes)[number];

export const marketplaceModes = [
  "single_seller_checkout",
  "multi_seller_marketplace_cart",
  "seller_scoped_checkout_sessions"
] as const;

export type MarketplaceMode = (typeof marketplaceModes)[number];

export interface SellerReference {
  seller_id: string;
  seller_name: string;
}

export interface DeliveryWindow {
  starts_at: string;
  ends_at: string;
}

export interface CurrencyAmount {
  amount: number;
  currency: SupportedCurrency;
}
