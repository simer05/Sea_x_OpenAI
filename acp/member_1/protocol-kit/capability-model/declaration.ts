import type {
  FulfillmentMode,
  MarketplaceMode,
  SupportedCountry,
  SupportedCurrency,
  SupportedExtensionNamespace,
  SupportedPaymentHandlerType
} from "../base-models/common";

export interface ExtensionDeclaration {
  extension_id: string;
  namespace: SupportedExtensionNamespace;
  required: boolean;
  purpose: string;
}

export interface CapabilityDeclaration {
  capability_id: string;
  supported_extensions: SupportedExtensionNamespace[];
  supported_payment_handlers: SupportedPaymentHandlerType[];
  supported_countries: SupportedCountry[];
  supported_currencies: SupportedCurrency[];
  supported_fulfillment_modes: FulfillmentMode[];
  supported_marketplace_modes: MarketplaceMode[];
}
