import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  FulfillmentMode,
  SupportedCity,
  SupportedCountry,
  SupportedCurrency
} from "../base-models/common";
import {
  fulfillmentModes,
  marketplaceModes,
  supportedCountries,
  supportedCurrencies,
  supportedExtensionNamespaces,
  supportedPaymentHandlerTypes
} from "../base-models/common";
import type { BaseCheckoutSessionPayload } from "../base-models/checkout";
import type { BaseProductPayload, ProductAvailability } from "../base-models/product";
import type { CapabilityDeclaration } from "../capability-model/declaration";
import type {
  BnplAcceptanceStatus,
  BnplExtensionPayload,
  BnplInstallmentOption
} from "../extension-models/bnpl";
import { BNPL_EXTENSION_NAMESPACE } from "../extension-models/bnpl";
import type {
  CodExtensionPayload,
  CodSellerAction,
  CodSettlementStatus
} from "../extension-models/cod";
import { COD_EXTENSION_NAMESPACE } from "../extension-models/cod";
import type {
  BpomStatus,
  ComplianceExtensionPayload,
  HalalStatus
} from "../extension-models/compliance";
import { COMPLIANCE_EXTENSION_NAMESPACE } from "../extension-models/compliance";
import type { MarketplaceExtensionPayload } from "../extension-models/marketplace";
import { MARKETPLACE_EXTENSION_NAMESPACE } from "../extension-models/marketplace";
import type { PostPurchaseExtensionPayload } from "../extension-models/postpurchase";
import { POSTPURCHASE_EXTENSION_NAMESPACE } from "../extension-models/postpurchase";
import type { PaymentHandlerDeclaration } from "../payment-handler-models/handlers";

function readSharedJson<T>(relativePathFromAcp: string): T {
  const dataUrl = new URL(`../../../data/${relativePathFromAcp}`, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(dataUrl), "utf8")) as T;
}

export interface SellerFixture {
  seller_id: string;
  seller_name: string;
  country: SupportedCountry;
  city: SupportedCity;
  default_currency: SupportedCurrency;
}

export interface CatalogFixtureRow {
  product_id: string;
  variant_id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: SupportedCurrency;
  availability: ProductAvailability;
  country: SupportedCountry;
  city: SupportedCity;
  delivery_starts_at: string;
  delivery_ends_at: string;
  halal_status: HalalStatus;
  halal_certifier: string | null;
  halal_certificate_id: string | null;
  halal_expires_at: string | null;
  bpom_status: BpomStatus;
  bpom_registration_number: string | null;
  bpom_expires_at: string | null;
  cod_available: boolean;
  cod_max_amount: number;
  cod_supported_cities: SupportedCity[];
  cod_requires_buyer_confirmation: boolean;
  bnpl_available: boolean;
  bnpl_provider: string | null;
  return_window_days: number;
}

export interface ProductExtensionBundle {
  product_id: string;
  variant_id: string;
  compliance: ComplianceExtensionPayload;
  cod: CodExtensionPayload;
  bnpl: BnplExtensionPayload;
  postpurchase: PostPurchaseExtensionPayload;
}

export const sellers = readSharedJson<SellerFixture[]>("sellers.json");
export const catalogRows = readSharedJson<CatalogFixtureRow[]>("catalog.json");

function sellerFor(row: CatalogFixtureRow): SellerFixture {
  const seller = sellers.find((candidate) => candidate.seller_id === row.seller_id);

  if (!seller) {
    throw new Error(`Missing seller fixture for ${row.seller_id}`);
  }

  return seller;
}

function extensionSuffix(row: CatalogFixtureRow): string {
  return row.variant_id.replace("variant_", "");
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

export function buildBaseProductFixtures(): BaseProductPayload[] {
  return catalogRows.map((row) => {
    const seller = sellerFor(row);

    return {
      product_id: row.product_id,
      variant_id: row.variant_id,
      seller_reference: {
        seller_id: seller.seller_id,
        seller_name: seller.seller_name
      },
      title: row.title,
      description: row.description,
      category: row.category,
      price: row.price,
      currency: row.currency,
      availability: row.availability,
      image_url: `https://assets.acpsea.dev/${row.product_id}.jpg`,
      product_url: `https://marketplace.acpsea.dev/products/${row.product_id}`
    };
  });
}

export function buildComplianceExtension(row: CatalogFixtureRow): ComplianceExtensionPayload {
  return {
    extension_id: `extension_compliance_${extensionSuffix(row)}`,
    namespace: COMPLIANCE_EXTENSION_NAMESPACE,
    halal: {
      status: row.halal_status,
      certifier: row.halal_certifier,
      certificate_id: row.halal_certificate_id,
      expires_at: row.halal_expires_at
    },
    bpom: {
      status: row.bpom_status,
      registration_number: row.bpom_registration_number,
      expires_at: row.bpom_expires_at
    },
    country_rules: [
      {
        country: row.country,
        applies_to: row.category,
        notes:
          row.bpom_status === "registered"
            ? "Registration metadata is surfaced as a SEA compliance extension."
            : "No SEA compliance data is placed on the base product payload."
      }
    ]
  };
}

export function buildCodExtension(
  row: CatalogFixtureRow,
  settlement_status: CodSettlementStatus = "not_started"
): CodExtensionPayload {
  const seller_action: CodSellerAction = row.cod_available ? "allow_cod" : "require_prepaid";

  return {
    extension_id: `extension_cod_${extensionSuffix(row)}`,
    namespace: COD_EXTENSION_NAMESPACE,
    cod: {
      available: row.cod_available,
      max_amount: row.cod_max_amount,
      currency: row.currency,
      supported_cities: row.cod_supported_cities,
      requires_buyer_confirmation: row.cod_requires_buyer_confirmation,
      commitment_required: row.cod_available,
      commitment_token: settlement_status === "pending_cash" ? `cod_commit_${extensionSuffix(row)}` : null,
      settlement_status,
      risk_score: row.cod_available ? 18 : 0,
      seller_action
    }
  };
}

export function buildBnplExtension(
  row: CatalogFixtureRow,
  acceptance_status?: BnplAcceptanceStatus
): BnplExtensionPayload {
  const installments: BnplInstallmentOption[] = row.bnpl_available
    ? [3, 6].map((installment_count) => ({
        installment_count,
        installment_amount: roundCurrency(row.price / installment_count),
        due_interval: "monthly"
      }))
    : [];

  return {
    extension_id: `extension_bnpl_${extensionSuffix(row)}`,
    namespace: BNPL_EXTENSION_NAMESPACE,
    bnpl: {
      available: row.bnpl_available,
      provider: row.bnpl_provider,
      installments,
      total_payable: row.price,
      currency: row.currency,
      terms_url: row.bnpl_available
        ? `https://payments.acpsea.dev/bnpl/terms/${row.variant_id}`
        : null,
      acceptance_required: row.bnpl_available,
      acceptance_status:
        acceptance_status ?? (row.bnpl_available ? "required" : "not_required")
    }
  };
}

export function buildPostPurchaseExtension(row: CatalogFixtureRow): PostPurchaseExtensionPayload {
  return {
    extension_id: `extension_postpurchase_${extensionSuffix(row)}`,
    namespace: POSTPURCHASE_EXTENSION_NAMESPACE,
    escrow: {
      status: row.cod_available || row.bnpl_available ? "held" : "not_applicable",
      release_rule: row.cod_available
        ? "Release after cash collection is confirmed."
        : "Release after delivery confirmation."
    },
    returns: {
      return_window_days: row.return_window_days,
      return_method: row.return_window_days > 0 ? "marketplace_return_request" : "not_returnable"
    },
    refund: {
      refund_method: row.cod_available ? "cash_refund_or_wallet_credit" : "original_payment_method"
    },
    dispute: {
      allowed: true
    }
  };
}

export function buildProductExtensionBundles(): ProductExtensionBundle[] {
  return catalogRows.map((row) => ({
    product_id: row.product_id,
    variant_id: row.variant_id,
    compliance: buildComplianceExtension(row),
    cod: buildCodExtension(row),
    bnpl: buildBnplExtension(row),
    postpurchase: buildPostPurchaseExtension(row)
  }));
}

export function buildCapabilityDeclarationFixture(): CapabilityDeclaration {
  return {
    capability_id: "capability_acpsea_protocol_001",
    supported_extensions: [...supportedExtensionNamespaces],
    supported_payment_handlers: [...supportedPaymentHandlerTypes],
    supported_countries: [...supportedCountries],
    supported_currencies: [...supportedCurrencies],
    supported_fulfillment_modes: [...fulfillmentModes],
    supported_marketplace_modes: [...marketplaceModes]
  };
}

export function buildPaymentHandlerDeclarations(): PaymentHandlerDeclaration[] {
  return [
    {
      handler_id: "payment_handler_tokenized_card_001",
      handler_type: "tokenized_card",
      supported_countries: [...supportedCountries],
      supported_currencies: [...supportedCurrencies],
      requires_delegate_payment: true
    },
    {
      handler_id: "payment_handler_cod_001",
      handler_type: "cod",
      supported_countries: ["Indonesia", "Malaysia", "Philippines", "Thailand", "Vietnam"],
      supported_currencies: ["IDR", "MYR", "PHP", "THB", "VND"],
      supported_cities: ["Jakarta", "Kuala Lumpur", "Manila", "Bangkok", "Ho Chi Minh City"],
      requires_delegate_payment: false,
      requires_buyer_confirmation: true,
      settlement_mode: "deferred_cash_collection",
      commitment_token_required: true,
      risk_score_supported: true
    },
    {
      handler_id: "payment_handler_bnpl_stub_001",
      handler_type: "bnpl_stub",
      provider: "SEA PayLater Stub",
      supported_countries: [...supportedCountries],
      supported_currencies: [...supportedCurrencies],
      installment_options: [3, 6],
      terms_acceptance_required: true,
      redirect_required: false,
      underwriting_mode: "stubbed_terms_acceptance_only"
    }
  ];
}

export function buildMarketplaceExtensionFixture(): MarketplaceExtensionPayload {
  return {
    extension_id: "extension_marketplace_001",
    namespace: MARKETPLACE_EXTENSION_NAMESPACE,
    marketplace_cart_id: "cart_001",
    merchant_of_record_mode: "hybrid",
    seller_checkout_sessions: [
      {
        checkout_session_id: "checkout_seller_001",
        seller_id: "seller_001",
        seller_group_id: "seller_group_001",
        status: "created",
        currency: "IDR",
        subtotal: 224000
      },
      {
        checkout_session_id: "checkout_seller_002",
        seller_id: "seller_002",
        seller_group_id: "seller_group_002",
        status: "created",
        currency: "SGD",
        subtotal: 58.8
      }
    ],
    seller_fulfillment_groups: [
      {
        seller_group_id: "seller_group_001",
        seller_id: "seller_001",
        fulfillment_mode: "standard_delivery" satisfies FulfillmentMode,
        city: "Jakarta",
        delivery_window: {
          starts_at: "2026-06-07T09:00:00+07:00",
          ends_at: "2026-06-10T18:00:00+07:00"
        }
      },
      {
        seller_group_id: "seller_group_002",
        seller_id: "seller_002",
        fulfillment_mode: "express_delivery" satisfies FulfillmentMode,
        city: "Singapore",
        delivery_window: {
          starts_at: "2026-06-07T10:00:00+08:00",
          ends_at: "2026-06-10T20:00:00+08:00"
        }
      }
    ],
    seller_settlement_statuses: [
      {
        seller_id: "seller_001",
        settlement_id: "settlement_001",
        status: "cash_pending"
      },
      {
        seller_id: "seller_002",
        settlement_id: "settlement_002",
        status: "escrow_held"
      }
    ]
  };
}

export function buildBaseCheckoutSessionFixture(): BaseCheckoutSessionPayload {
  const products = buildBaseProductFixtures();
  const firstProduct = products[0];
  const thirdProduct = products[2];
  const row = catalogRows[0];
  const capability = buildCapabilityDeclarationFixture();
  const paymentHandlers = buildPaymentHandlerDeclarations();
  const compliance = buildComplianceExtension(row);
  const cod = buildCodExtension(row, "pending_cash");
  const bnpl = buildBnplExtension(row, "required");
  const postpurchase = buildPostPurchaseExtension(row);
  const marketplace = buildMarketplaceExtensionFixture();
  const subtotal = firstProduct.price + thirdProduct.price;
  const shipping = 15000;

  return {
    checkout_session_id: "checkout_seller_001",
    status: "requires_confirmation",
    line_items: [
      {
        line_item_id: "line_item_001",
        product_id: firstProduct.product_id,
        variant_id: firstProduct.variant_id,
        seller_reference: firstProduct.seller_reference,
        title: firstProduct.title,
        quantity: 1,
        unit_price: firstProduct.price,
        currency: firstProduct.currency
      },
      {
        line_item_id: "line_item_002",
        product_id: thirdProduct.product_id,
        variant_id: thirdProduct.variant_id,
        seller_reference: thirdProduct.seller_reference,
        title: thirdProduct.title,
        quantity: 1,
        unit_price: thirdProduct.price,
        currency: thirdProduct.currency
      }
    ],
    fulfillment_options: [
      {
        fulfillment_option_id: "fulfillment_001",
        mode: "standard_delivery",
        description: "Seller-scoped Jakarta delivery window.",
        estimated_delivery_window: {
          starts_at: row.delivery_starts_at,
          ends_at: row.delivery_ends_at
        },
        price: shipping,
        currency: "IDR"
      }
    ],
    totals: {
      currency: "IDR",
      subtotal,
      shipping,
      tax: 0,
      discount: 0,
      grand_total: subtotal + shipping
    },
    messages: [
      {
        message_id: "message_001",
        level: "info",
        text: "COD commitment state is represented only inside the COD extension."
      }
    ],
    capabilities: capability,
    payment_handlers: paymentHandlers,
    extensions: {
      [COMPLIANCE_EXTENSION_NAMESPACE]: compliance,
      [COD_EXTENSION_NAMESPACE]: cod,
      [BNPL_EXTENSION_NAMESPACE]: bnpl,
      [MARKETPLACE_EXTENSION_NAMESPACE]: marketplace,
      [POSTPURCHASE_EXTENSION_NAMESPACE]: postpurchase
    }
  };
}

export function buildProtocolValidationSuitePayloads() {
  const [baseProduct] = buildBaseProductFixtures();
  const [bundle] = buildProductExtensionBundles();

  return {
    baseProduct,
    baseCheckoutSession: buildBaseCheckoutSessionFixture(),
    extensions: [
      bundle.compliance,
      buildCodExtension(catalogRows[0], "pending_cash"),
      bundle.bnpl,
      buildMarketplaceExtensionFixture(),
      bundle.postpurchase
    ] as const,
    capabilityDeclaration: buildCapabilityDeclarationFixture(),
    paymentHandlers: buildPaymentHandlerDeclarations()
  };
}
