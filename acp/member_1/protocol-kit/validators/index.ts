import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import type { BaseCheckoutSessionPayload } from "../base-models/checkout";
import type { BaseProductPayload } from "../base-models/product";
import { seaOnlyBaseProductFieldNames } from "../base-models/product";
import type { CapabilityDeclaration } from "../capability-model/declaration";
import type {
  BnplExtensionPayload,
  CodExtensionPayload,
  ComplianceExtensionPayload,
  MarketplaceExtensionPayload,
  PostPurchaseExtensionPayload
} from "../extension-models";
import {
  BNPL_EXTENSION_NAMESPACE,
  COD_EXTENSION_NAMESPACE,
  COMPLIANCE_EXTENSION_NAMESPACE,
  MARKETPLACE_EXTENSION_NAMESPACE,
  POSTPURCHASE_EXTENSION_NAMESPACE
} from "../extension-models";
import type { PaymentHandlerDeclaration } from "../payment-handler-models/handlers";
import {
  baseCheckoutSessionSchema,
  baseProductSchema,
  bnplExtensionSchema,
  capabilityDeclarationSchema,
  codExtensionSchema,
  complianceExtensionSchema,
  marketplaceExtensionSchema,
  paymentHandlerDeclarationSchema,
  postPurchaseExtensionSchema
} from "./schemas";

export type ProtocolValidationLabel =
  | "Base product payload"
  | "Base checkout session payload"
  | "Compliance extension payload"
  | "COD extension payload"
  | "BNPL extension payload"
  | "Marketplace extension payload"
  | "Post-purchase extension payload"
  | "Capability declaration payload"
  | "Payment handler declaration payload"
  | "SEA extension payload";

export interface ProtocolValidationResult {
  label: ProtocolValidationLabel;
  valid: boolean;
  messages: string[];
  errors: string[];
}

export interface ProtocolValidationSuiteResult {
  valid: boolean;
  messages: string[];
  results: ProtocolValidationResult[];
}

const ajv = new Ajv({ allErrors: true, strict: false });

const compiled = {
  baseProduct: ajv.compile(baseProductSchema),
  baseCheckoutSession: ajv.compile(baseCheckoutSessionSchema),
  complianceExtension: ajv.compile(complianceExtensionSchema),
  codExtension: ajv.compile(codExtensionSchema),
  bnplExtension: ajv.compile(bnplExtensionSchema),
  marketplaceExtension: ajv.compile(marketplaceExtensionSchema),
  postPurchaseExtension: ajv.compile(postPurchaseExtensionSchema),
  capabilityDeclaration: ajv.compile(capabilityDeclarationSchema),
  paymentHandlerDeclaration: ajv.compile(paymentHandlerDeclarationSchema)
};

const seaOnlyFields = new Set<string>(seaOnlyBaseProductFieldNames);

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((error) => {
    const path = error.instancePath || "$";
    if (error.keyword === "additionalProperties") {
      const extra = String(error.params.additionalProperty);
      return `${path} contains unsupported field "${extra}"`;
    }

    return `${path} ${error.message ?? "is invalid"}`;
  });
}

function findSeaOnlyFieldsOutsideExtensions(value: unknown, path = "$", insideExtensions = false): string[] {
  if (value === null || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findSeaOnlyFieldsOutsideExtensions(item, `${path}[${index}]`, insideExtensions)
    );
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const nextInsideExtensions = insideExtensions || key === "extensions";
    const ownLeak =
      !nextInsideExtensions && seaOnlyFields.has(key) ? [`${path}.${key}`] : [];
    return [
      ...ownLeak,
      ...findSeaOnlyFieldsOutsideExtensions(child, `${path}.${key}`, nextInsideExtensions)
    ];
  });
}

function validateWith(
  label: ProtocolValidationLabel,
  validator: ValidateFunction,
  payload: unknown,
  successMessages: string[],
  checkBaseLeak = false
): ProtocolValidationResult {
  const schemaValid = validator(payload);
  const errors = formatAjvErrors(validator.errors);
  const leakedFields = checkBaseLeak ? findSeaOnlyFieldsOutsideExtensions(payload) : [];

  const leakErrors = leakedFields.map(
    (fieldPath) => `${fieldPath} is SEA-only and must live in an extension payload`
  );
  const valid = Boolean(schemaValid) && leakErrors.length === 0;

  return {
    label,
    valid,
    messages: valid ? successMessages : [],
    errors: [...errors, ...leakErrors]
  };
}

export function validateBaseProduct(payload: unknown): ProtocolValidationResult {
  return validateWith(
    "Base product payload",
    compiled.baseProduct,
    payload,
    ["Base payload valid", "No SEA-only fields leaked into base payload"],
    true
  );
}

export function validateBaseCheckoutSession(payload: unknown): ProtocolValidationResult {
  return validateWith(
    "Base checkout session payload",
    compiled.baseCheckoutSession,
    payload,
    ["Base payload valid", "No SEA-only fields leaked into base payload"],
    true
  );
}

export function validateComplianceExtension(payload: unknown): ProtocolValidationResult {
  return validateWith("Compliance extension payload", compiled.complianceExtension, payload, [
    "SEA extension payload valid"
  ]);
}

export function validateCodExtension(payload: unknown): ProtocolValidationResult {
  return validateWith("COD extension payload", compiled.codExtension, payload, [
    "SEA extension payload valid"
  ]);
}

export function validateBnplExtension(payload: unknown): ProtocolValidationResult {
  return validateWith("BNPL extension payload", compiled.bnplExtension, payload, [
    "SEA extension payload valid"
  ]);
}

export function validateMarketplaceExtension(payload: unknown): ProtocolValidationResult {
  return validateWith("Marketplace extension payload", compiled.marketplaceExtension, payload, [
    "SEA extension payload valid"
  ]);
}

export function validatePostPurchaseExtension(payload: unknown): ProtocolValidationResult {
  return validateWith("Post-purchase extension payload", compiled.postPurchaseExtension, payload, [
    "SEA extension payload valid"
  ]);
}

export function validateCapabilityDeclaration(payload: unknown): ProtocolValidationResult {
  return validateWith("Capability declaration payload", compiled.capabilityDeclaration, payload, [
    "Capability declaration valid"
  ]);
}

export function validatePaymentHandlerDeclaration(payload: unknown): ProtocolValidationResult {
  return validateWith(
    "Payment handler declaration payload",
    compiled.paymentHandlerDeclaration,
    payload,
    ["Payment handler declaration valid"]
  );
}

export function validateSeaExtension(payload: unknown): ProtocolValidationResult {
  const namespace = (payload as { namespace?: unknown } | null)?.namespace;

  switch (namespace) {
    case COMPLIANCE_EXTENSION_NAMESPACE:
      return validateComplianceExtension(payload);
    case COD_EXTENSION_NAMESPACE:
      return validateCodExtension(payload);
    case BNPL_EXTENSION_NAMESPACE:
      return validateBnplExtension(payload);
    case MARKETPLACE_EXTENSION_NAMESPACE:
      return validateMarketplaceExtension(payload);
    case POSTPURCHASE_EXTENSION_NAMESPACE:
      return validatePostPurchaseExtension(payload);
    default:
      return {
        label: "SEA extension payload",
        valid: false,
        messages: [],
        errors: [`Unsupported extension namespace "${String(namespace)}"`]
      };
  }
}

export function runProtocolValidationSuite(payloads: {
  baseProduct: BaseProductPayload;
  baseCheckoutSession: BaseCheckoutSessionPayload;
  extensions: readonly [
    ComplianceExtensionPayload,
    CodExtensionPayload,
    BnplExtensionPayload,
    MarketplaceExtensionPayload,
    PostPurchaseExtensionPayload
  ];
  capabilityDeclaration: CapabilityDeclaration;
  paymentHandlers: PaymentHandlerDeclaration[];
}): ProtocolValidationSuiteResult {
  const results = [
    validateBaseProduct(payloads.baseProduct),
    validateBaseCheckoutSession(payloads.baseCheckoutSession),
    ...payloads.extensions.map((extension) => validateSeaExtension(extension)),
    validateCapabilityDeclaration(payloads.capabilityDeclaration),
    ...payloads.paymentHandlers.map((handler) => validatePaymentHandlerDeclaration(handler))
  ];

  const messages = new Set(results.flatMap((result) => result.messages));

  return {
    valid: results.every((result) => result.valid),
    messages: [...messages],
    results
  };
}
