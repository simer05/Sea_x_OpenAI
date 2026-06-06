import { describe, expect, it } from "vitest";
import { checkoutStatusValues } from "../base-models/checkout";
import {
  catalogRows,
  buildBaseCheckoutSessionFixture,
  buildBaseProductFixtures,
  buildBnplExtension,
  buildCapabilityDeclarationFixture,
  buildCodExtension,
  buildComplianceExtension,
  buildMarketplaceExtensionFixture,
  buildPaymentHandlerDeclarations,
  buildPostPurchaseExtension,
  buildProductExtensionBundles,
  buildProtocolValidationSuitePayloads,
  sellers
} from "../fixtures/load-fixtures";
import {
  runProtocolValidationSuite,
  validateBaseCheckoutSession,
  validateBaseProduct,
  validateBnplExtension,
  validateCapabilityDeclaration,
  validateCodExtension,
  validateComplianceExtension,
  validateMarketplaceExtension,
  validatePaymentHandlerDeclaration,
  validatePostPurchaseExtension,
  validateSeaExtension
} from "../validators";

describe("ACP-SEA protocol kit fixtures", () => {
  it("contains independent SEA marketplace fixture coverage", () => {
    expect(sellers).toHaveLength(5);
    expect(catalogRows.length).toBeGreaterThanOrEqual(30);
    expect(catalogRows.length).toBeLessThanOrEqual(40);
    expect(new Set(catalogRows.map((row) => row.currency))).toEqual(
      new Set(["SGD", "IDR", "MYR", "PHP", "THB", "VND"])
    );

    expect(
      catalogRows.filter((row) => row.category === "beauty" && row.halal_status === "certified")
        .length
    ).toBeGreaterThanOrEqual(2);
    expect(
      catalogRows.filter((row) => row.category === "beauty" && row.bpom_status === "registered")
        .length
    ).toBeGreaterThanOrEqual(2);
    expect(
      catalogRows.filter((row) => row.city === "Jakarta" && row.cod_available).length
    ).toBeGreaterThanOrEqual(2);
    expect(catalogRows.filter((row) => row.bnpl_available).length).toBeGreaterThanOrEqual(2);
    expect(catalogRows.filter((row) => !row.cod_available).length).toBeGreaterThanOrEqual(2);
    expect(catalogRows.filter((row) => row.halal_status === "unknown").length).toBeGreaterThanOrEqual(
      2
    );
  });

  it("generates base products without SEA-only fields", () => {
    const baseProducts = buildBaseProductFixtures();

    expect(baseProducts).toHaveLength(36);
    for (const product of baseProducts) {
      const result = validateBaseProduct(product);
      expect(result.valid, result.errors.join("\n")).toBe(true);
      expect(result.messages).toContain("Base payload valid");
      expect(result.messages).toContain("No SEA-only fields leaked into base payload");
    }
  });
});

describe("base payload validation", () => {
  it("rejects SEA-only fields on base product payloads", () => {
    const [validProduct] = buildBaseProductFixtures();
    const forbiddenFields = [
      "halal",
      "bpom",
      "cod",
      "bnpl",
      "escrow",
      "returns",
      "marketplace_cart_id",
      "seller_checkout_sessions",
      "risk_score"
    ] as const;

    for (const field of forbiddenFields) {
      const pollutedProduct = {
        ...validProduct,
        [field]: field === "risk_score" ? 12 : { leaked: true }
      };

      const result = validateBaseProduct(pollutedProduct);
      expect(result.valid).toBe(false);
      expect(result.errors.join(" ")).toContain(field);
      expect(result.messages).not.toContain("No SEA-only fields leaked into base payload");
    }
  });

  it("rejects pending_cash as a base checkout status", () => {
    const checkout = buildBaseCheckoutSessionFixture();
    const result = validateBaseCheckoutSession({
      ...checkout,
      status: "pending_cash"
    });

    expect(checkoutStatusValues).not.toContain("pending_cash");
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("must be equal to one of the allowed values");
  });

  it("accepts pending_cash only inside the COD extension on checkout payloads", () => {
    const checkout = buildBaseCheckoutSessionFixture();
    const result = validateBaseCheckoutSession(checkout);

    expect(result.valid, result.errors.join("\n")).toBe(true);
    expect(result.messages).toContain("No SEA-only fields leaked into base payload");
    expect(JSON.stringify(checkout.extensions)).toContain('"settlement_status":"pending_cash"');
  });
});

describe("SEA extension validation", () => {
  it("accepts halal and BPOM metadata in the compliance extension", () => {
    const row = catalogRows[0];
    const extension = buildComplianceExtension(row);
    const result = validateComplianceExtension(extension);

    expect(extension.namespace).toBe("dev.acpsea.compliance");
    expect(extension.halal.status).toBe("certified");
    expect(extension.bpom.status).toBe("registered");
    expect(result.valid, result.errors.join("\n")).toBe(true);
    expect(result.messages).toContain("SEA extension payload valid");
  });

  it("accepts pending_cash as COD settlement_status", () => {
    const extension = buildCodExtension(catalogRows[0], "pending_cash");
    const result = validateCodExtension(extension);

    expect(extension.namespace).toBe("dev.acpsea.cod");
    expect(extension.cod.settlement_status).toBe("pending_cash");
    expect(extension.cod.commitment_token).toBe("cod_commit_001");
    expect(result.valid, result.errors.join("\n")).toBe(true);
  });

  it("accepts BNPL terms metadata as a stub", () => {
    const bnplRow = catalogRows.find((row) => row.bnpl_available);

    expect(bnplRow).toBeDefined();
    const extension = buildBnplExtension(bnplRow!, "required");
    const result = validateBnplExtension(extension);

    expect(extension.namespace).toBe("dev.acpsea.bnpl");
    expect(extension.bnpl.acceptance_required).toBe(true);
    expect(extension.bnpl.acceptance_status).toBe("required");
    expect(extension.bnpl.installments.length).toBeGreaterThan(0);
    expect(result.valid, result.errors.join("\n")).toBe(true);
  });

  it("accepts multiple seller checkout sessions in the marketplace extension", () => {
    const extension = buildMarketplaceExtensionFixture();
    const result = validateMarketplaceExtension(extension);

    expect(extension.namespace).toBe("dev.acpsea.marketplace");
    expect(extension.seller_checkout_sessions).toHaveLength(2);
    expect(new Set(extension.seller_checkout_sessions.map((session) => session.seller_id)).size).toBe(
      2
    );
    expect(result.valid, result.errors.join("\n")).toBe(true);
  });

  it("accepts escrow and return metadata in the post-purchase extension", () => {
    const extension = buildPostPurchaseExtension(catalogRows[0]);
    const result = validatePostPurchaseExtension(extension);

    expect(extension.namespace).toBe("dev.acpsea.postpurchase");
    expect(extension.escrow.status).toBe("held");
    expect(extension.returns.return_window_days).toBeGreaterThan(0);
    expect(result.valid, result.errors.join("\n")).toBe(true);
  });

  it("rejects an invalid extension namespace", () => {
    const [bundle] = buildProductExtensionBundles();
    const invalidExtension = {
      ...bundle.compliance,
      namespace: "dev.acpsea.invalid"
    };

    const result = validateSeaExtension(invalidExtension);

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Unsupported extension namespace");
  });
});

describe("capability and payment handler declarations", () => {
  it("declares COD and BNPL payment support in capabilities", () => {
    const declaration = buildCapabilityDeclarationFixture();
    const result = validateCapabilityDeclaration(declaration);

    expect(declaration.supported_extensions).toContain("dev.acpsea.cod");
    expect(declaration.supported_extensions).toContain("dev.acpsea.bnpl");
    expect(declaration.supported_payment_handlers).toContain("cod");
    expect(declaration.supported_payment_handlers).toContain("bnpl_stub");
    expect(result.valid, result.errors.join("\n")).toBe(true);
    expect(result.messages).toContain("Capability declaration valid");
  });

  it("validates tokenized card, COD, and BNPL stub handler declarations", () => {
    const declarations = buildPaymentHandlerDeclarations();

    expect(declarations.map((handler) => handler.handler_type)).toEqual([
      "tokenized_card",
      "cod",
      "bnpl_stub"
    ]);

    for (const declaration of declarations) {
      const result = validatePaymentHandlerDeclaration(declaration);

      expect(result.valid, result.errors.join("\n")).toBe(true);
      expect(result.messages).toContain("Payment handler declaration valid");
    }
  });
});

describe("protocol validation suite output", () => {
  it("reports required success messages for valid sample payloads", () => {
    const result = runProtocolValidationSuite(buildProtocolValidationSuitePayloads());

    expect(result.valid, JSON.stringify(result.results, null, 2)).toBe(true);
    expect(result.messages).toContain("Base payload valid");
    expect(result.messages).toContain("SEA extension payload valid");
    expect(result.messages).toContain("Payment handler declaration valid");
    expect(result.messages).toContain("Capability declaration valid");
    expect(result.messages).toContain("No SEA-only fields leaked into base payload");
  });
});
