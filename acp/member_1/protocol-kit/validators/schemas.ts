import {
  fulfillmentModes,
  marketplaceModes,
  supportedCities,
  supportedCountries,
  supportedCurrencies,
  supportedExtensionNamespaces,
  supportedPaymentHandlerTypes
} from "../base-models/common";
import { checkoutMessageLevelValues, checkoutStatusValues } from "../base-models/checkout";
import { productAvailabilityValues } from "../base-models/product";
import { bnplAcceptanceStatusValues, BNPL_EXTENSION_NAMESPACE } from "../extension-models/bnpl";
import {
  codSellerActionValues,
  codSettlementStatusValues,
  COD_EXTENSION_NAMESPACE
} from "../extension-models/cod";
import {
  bpomStatusValues,
  COMPLIANCE_EXTENSION_NAMESPACE,
  halalStatusValues
} from "../extension-models/compliance";
import {
  MARKETPLACE_EXTENSION_NAMESPACE,
  merchantOfRecordModeValues
} from "../extension-models/marketplace";
import {
  escrowStatusValues,
  POSTPURCHASE_EXTENSION_NAMESPACE
} from "../extension-models/postpurchase";

type Schema = Record<string, unknown>;

const nonEmptyString = { type: "string", minLength: 1 };
const nullableString = { type: ["string", "null"] };
const nonNegativeNumber = { type: "number", minimum: 0 };
const positiveInteger = { type: "integer", minimum: 1 };
const currency = { enum: [...supportedCurrencies] };
const country = { enum: [...supportedCountries] };
const city = { enum: [...supportedCities] };

const enumArray = (values: readonly string[], minItems = 1): Schema => ({
  type: "array",
  minItems,
  uniqueItems: true,
  items: { enum: [...values] }
});

const sellerReferenceSchema: Schema = {
  type: "object",
  required: ["seller_id", "seller_name"],
  additionalProperties: false,
  properties: {
    seller_id: nonEmptyString,
    seller_name: nonEmptyString
  }
};

const deliveryWindowSchema: Schema = {
  type: "object",
  required: ["starts_at", "ends_at"],
  additionalProperties: false,
  properties: {
    starts_at: nonEmptyString,
    ends_at: nonEmptyString
  }
};

export const baseProductSchema: Schema = {
  $id: "dev.acpsea.schema.base-product",
  type: "object",
  required: [
    "product_id",
    "variant_id",
    "seller_reference",
    "title",
    "description",
    "category",
    "price",
    "currency",
    "availability",
    "image_url",
    "product_url"
  ],
  additionalProperties: false,
  properties: {
    product_id: nonEmptyString,
    variant_id: nonEmptyString,
    seller_reference: sellerReferenceSchema,
    title: nonEmptyString,
    description: nonEmptyString,
    category: nonEmptyString,
    price: nonNegativeNumber,
    currency,
    availability: { enum: [...productAvailabilityValues] },
    image_url: nonEmptyString,
    product_url: nonEmptyString
  }
};

const checkoutLineItemSchema: Schema = {
  type: "object",
  required: [
    "line_item_id",
    "product_id",
    "variant_id",
    "seller_reference",
    "title",
    "quantity",
    "unit_price",
    "currency"
  ],
  additionalProperties: false,
  properties: {
    line_item_id: nonEmptyString,
    product_id: nonEmptyString,
    variant_id: nonEmptyString,
    seller_reference: sellerReferenceSchema,
    title: nonEmptyString,
    quantity: positiveInteger,
    unit_price: nonNegativeNumber,
    currency
  }
};

const fulfillmentOptionSchema: Schema = {
  type: "object",
  required: [
    "fulfillment_option_id",
    "mode",
    "description",
    "estimated_delivery_window",
    "price",
    "currency"
  ],
  additionalProperties: false,
  properties: {
    fulfillment_option_id: nonEmptyString,
    mode: { enum: [...fulfillmentModes] },
    description: nonEmptyString,
    estimated_delivery_window: deliveryWindowSchema,
    price: nonNegativeNumber,
    currency
  }
};

const checkoutTotalsSchema: Schema = {
  type: "object",
  required: ["currency", "subtotal", "shipping", "tax", "discount", "grand_total"],
  additionalProperties: false,
  properties: {
    currency,
    subtotal: nonNegativeNumber,
    shipping: nonNegativeNumber,
    tax: nonNegativeNumber,
    discount: nonNegativeNumber,
    grand_total: nonNegativeNumber
  }
};

const checkoutMessageSchema: Schema = {
  type: "object",
  required: ["message_id", "level", "text"],
  additionalProperties: false,
  properties: {
    message_id: nonEmptyString,
    level: { enum: [...checkoutMessageLevelValues] },
    text: nonEmptyString
  }
};

export const capabilityDeclarationSchema: Schema = {
  type: "object",
  required: [
    "capability_id",
    "supported_extensions",
    "supported_payment_handlers",
    "supported_countries",
    "supported_currencies",
    "supported_fulfillment_modes",
    "supported_marketplace_modes"
  ],
  additionalProperties: false,
  properties: {
    capability_id: nonEmptyString,
    supported_extensions: enumArray(supportedExtensionNamespaces),
    supported_payment_handlers: enumArray(supportedPaymentHandlerTypes),
    supported_countries: enumArray(supportedCountries),
    supported_currencies: enumArray(supportedCurrencies),
    supported_fulfillment_modes: enumArray(fulfillmentModes),
    supported_marketplace_modes: enumArray(marketplaceModes)
  }
};

const tokenizedCardHandlerSchema: Schema = {
  type: "object",
  required: [
    "handler_id",
    "handler_type",
    "supported_countries",
    "supported_currencies",
    "requires_delegate_payment"
  ],
  additionalProperties: false,
  properties: {
    handler_id: nonEmptyString,
    handler_type: { const: "tokenized_card" },
    supported_countries: enumArray(supportedCountries),
    supported_currencies: enumArray(supportedCurrencies),
    requires_delegate_payment: { type: "boolean" }
  }
};

const codHandlerSchema: Schema = {
  type: "object",
  required: [
    "handler_id",
    "handler_type",
    "supported_countries",
    "supported_currencies",
    "supported_cities",
    "requires_delegate_payment",
    "requires_buyer_confirmation",
    "settlement_mode",
    "commitment_token_required",
    "risk_score_supported"
  ],
  additionalProperties: false,
  properties: {
    handler_id: nonEmptyString,
    handler_type: { const: "cod" },
    supported_countries: enumArray(supportedCountries),
    supported_currencies: enumArray(supportedCurrencies),
    supported_cities: enumArray(supportedCities),
    requires_delegate_payment: { type: "boolean" },
    requires_buyer_confirmation: { type: "boolean" },
    settlement_mode: { const: "deferred_cash_collection" },
    commitment_token_required: { type: "boolean" },
    risk_score_supported: { type: "boolean" }
  }
};

const bnplStubHandlerSchema: Schema = {
  type: "object",
  required: [
    "handler_id",
    "handler_type",
    "provider",
    "supported_countries",
    "supported_currencies",
    "installment_options",
    "terms_acceptance_required",
    "redirect_required",
    "underwriting_mode"
  ],
  additionalProperties: false,
  properties: {
    handler_id: nonEmptyString,
    handler_type: { const: "bnpl_stub" },
    provider: nonEmptyString,
    supported_countries: enumArray(supportedCountries),
    supported_currencies: enumArray(supportedCurrencies),
    installment_options: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: positiveInteger
    },
    terms_acceptance_required: { type: "boolean" },
    redirect_required: { type: "boolean" },
    underwriting_mode: { const: "stubbed_terms_acceptance_only" }
  }
};

export const paymentHandlerDeclarationSchema: Schema = {
  oneOf: [tokenizedCardHandlerSchema, codHandlerSchema, bnplStubHandlerSchema]
};

export const baseCheckoutSessionSchema: Schema = {
  $id: "dev.acpsea.schema.base-checkout-session",
  type: "object",
  required: [
    "checkout_session_id",
    "status",
    "line_items",
    "fulfillment_options",
    "totals",
    "messages",
    "capabilities",
    "payment_handlers",
    "extensions"
  ],
  additionalProperties: false,
  properties: {
    checkout_session_id: nonEmptyString,
    status: { enum: [...checkoutStatusValues] },
    line_items: {
      type: "array",
      minItems: 1,
      items: checkoutLineItemSchema
    },
    fulfillment_options: {
      type: "array",
      minItems: 1,
      items: fulfillmentOptionSchema
    },
    totals: checkoutTotalsSchema,
    messages: {
      type: "array",
      items: checkoutMessageSchema
    },
    capabilities: capabilityDeclarationSchema,
    payment_handlers: {
      type: "array",
      minItems: 1,
      items: paymentHandlerDeclarationSchema
    },
    extensions: {
      type: "object",
      additionalProperties: true
    }
  }
};

export const complianceExtensionSchema: Schema = {
  $id: "dev.acpsea.schema.extension.compliance",
  type: "object",
  required: ["extension_id", "namespace", "halal", "bpom", "country_rules"],
  additionalProperties: false,
  properties: {
    extension_id: nonEmptyString,
    namespace: { const: COMPLIANCE_EXTENSION_NAMESPACE },
    halal: {
      type: "object",
      required: ["status", "certifier", "certificate_id", "expires_at"],
      additionalProperties: false,
      properties: {
        status: { enum: [...halalStatusValues] },
        certifier: nullableString,
        certificate_id: nullableString,
        expires_at: nullableString
      }
    },
    bpom: {
      type: "object",
      required: ["status", "registration_number", "expires_at"],
      additionalProperties: false,
      properties: {
        status: { enum: [...bpomStatusValues] },
        registration_number: nullableString,
        expires_at: nullableString
      }
    },
    country_rules: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["country", "applies_to", "notes"],
        additionalProperties: false,
        properties: {
          country,
          applies_to: nonEmptyString,
          notes: nonEmptyString
        }
      }
    }
  }
};

export const codExtensionSchema: Schema = {
  $id: "dev.acpsea.schema.extension.cod",
  type: "object",
  required: ["extension_id", "namespace", "cod"],
  additionalProperties: false,
  properties: {
    extension_id: nonEmptyString,
    namespace: { const: COD_EXTENSION_NAMESPACE },
    cod: {
      type: "object",
      required: [
        "available",
        "max_amount",
        "currency",
        "supported_cities",
        "requires_buyer_confirmation",
        "commitment_required",
        "commitment_token",
        "settlement_status",
        "risk_score",
        "seller_action"
      ],
      additionalProperties: false,
      properties: {
        available: { type: "boolean" },
        max_amount: nonNegativeNumber,
        currency,
        supported_cities: enumArray(supportedCities, 0),
        requires_buyer_confirmation: { type: "boolean" },
        commitment_required: { type: "boolean" },
        commitment_token: nullableString,
        settlement_status: { enum: [...codSettlementStatusValues] },
        risk_score: { type: "number", minimum: 0, maximum: 100 },
        seller_action: { enum: [...codSellerActionValues] }
      }
    }
  }
};

export const bnplExtensionSchema: Schema = {
  $id: "dev.acpsea.schema.extension.bnpl",
  type: "object",
  required: ["extension_id", "namespace", "bnpl"],
  additionalProperties: false,
  properties: {
    extension_id: nonEmptyString,
    namespace: { const: BNPL_EXTENSION_NAMESPACE },
    bnpl: {
      type: "object",
      required: [
        "available",
        "provider",
        "installments",
        "total_payable",
        "currency",
        "terms_url",
        "acceptance_required",
        "acceptance_status"
      ],
      additionalProperties: false,
      properties: {
        available: { type: "boolean" },
        provider: nullableString,
        installments: {
          type: "array",
          items: {
            type: "object",
            required: ["installment_count", "installment_amount", "due_interval"],
            additionalProperties: false,
            properties: {
              installment_count: positiveInteger,
              installment_amount: nonNegativeNumber,
              due_interval: { enum: ["monthly", "biweekly"] }
            }
          }
        },
        total_payable: nonNegativeNumber,
        currency,
        terms_url: nullableString,
        acceptance_required: { type: "boolean" },
        acceptance_status: { enum: [...bnplAcceptanceStatusValues] }
      }
    }
  }
};

export const marketplaceExtensionSchema: Schema = {
  $id: "dev.acpsea.schema.extension.marketplace",
  type: "object",
  required: [
    "extension_id",
    "namespace",
    "marketplace_cart_id",
    "merchant_of_record_mode",
    "seller_checkout_sessions",
    "seller_fulfillment_groups",
    "seller_settlement_statuses"
  ],
  additionalProperties: false,
  properties: {
    extension_id: nonEmptyString,
    namespace: { const: MARKETPLACE_EXTENSION_NAMESPACE },
    marketplace_cart_id: nonEmptyString,
    merchant_of_record_mode: { enum: [...merchantOfRecordModeValues] },
    seller_checkout_sessions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: [
          "checkout_session_id",
          "seller_id",
          "seller_group_id",
          "status",
          "currency",
          "subtotal"
        ],
        additionalProperties: false,
        properties: {
          checkout_session_id: nonEmptyString,
          seller_id: nonEmptyString,
          seller_group_id: nonEmptyString,
          status: { enum: [...checkoutStatusValues] },
          currency,
          subtotal: nonNegativeNumber
        }
      }
    },
    seller_fulfillment_groups: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["seller_group_id", "seller_id", "fulfillment_mode", "city", "delivery_window"],
        additionalProperties: false,
        properties: {
          seller_group_id: nonEmptyString,
          seller_id: nonEmptyString,
          fulfillment_mode: { enum: [...fulfillmentModes] },
          city,
          delivery_window: deliveryWindowSchema
        }
      }
    },
    seller_settlement_statuses: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["seller_id", "settlement_id", "status"],
        additionalProperties: false,
        properties: {
          seller_id: nonEmptyString,
          settlement_id: nonEmptyString,
          status: {
            enum: [
              "not_started",
              "escrow_held",
              "cash_pending",
              "seller_settlement_pending",
              "settled"
            ]
          }
        }
      }
    }
  }
};

export const postPurchaseExtensionSchema: Schema = {
  $id: "dev.acpsea.schema.extension.postpurchase",
  type: "object",
  required: ["extension_id", "namespace", "escrow", "returns", "refund", "dispute"],
  additionalProperties: false,
  properties: {
    extension_id: nonEmptyString,
    namespace: { const: POSTPURCHASE_EXTENSION_NAMESPACE },
    escrow: {
      type: "object",
      required: ["status", "release_rule"],
      additionalProperties: false,
      properties: {
        status: { enum: [...escrowStatusValues] },
        release_rule: nonEmptyString
      }
    },
    returns: {
      type: "object",
      required: ["return_window_days", "return_method"],
      additionalProperties: false,
      properties: {
        return_window_days: { type: "integer", minimum: 0 },
        return_method: nonEmptyString
      }
    },
    refund: {
      type: "object",
      required: ["refund_method"],
      additionalProperties: false,
      properties: {
        refund_method: nonEmptyString
      }
    },
    dispute: {
      type: "object",
      required: ["allowed"],
      additionalProperties: false,
      properties: {
        allowed: { type: "boolean" }
      }
    }
  }
};
