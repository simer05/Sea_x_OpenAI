import { buildProtocolValidationSuitePayloads } from "../fixtures/load-fixtures";

export function buildSamplePayloads() {
  const payloads = buildProtocolValidationSuitePayloads();
  const [complianceExtension, codExtension, bnplExtension, marketplaceExtension, postPurchaseExtension] =
    payloads.extensions;

  return {
    valid_base_product: payloads.baseProduct,
    valid_base_checkout_session: payloads.baseCheckoutSession,
    compliance_extension: complianceExtension,
    cod_extension_pending_cash: codExtension,
    bnpl_extension_required_terms: bnplExtension,
    marketplace_extension_multi_seller: marketplaceExtension,
    postpurchase_extension_escrow_returns: postPurchaseExtension,
    capability_declaration: payloads.capabilityDeclaration,
    payment_handler_declarations: payloads.paymentHandlers
  };
}
