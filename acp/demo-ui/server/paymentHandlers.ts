export function acpPaymentHandlers() {
  return [
    {
      id: "card_tokenized",
      name: "dev.acp.tokenized.card",
      psp: "stripe",
      requires_delegate_payment: true,
      requires_pci_compliance: false,
      config: { merchant_id: "acct_shopee_acp_sea_demo" },
      display_order: 1,
    },
    {
      id: "cod",
      name: "dev.acpsea.cod",
      psp: "seller_managed",
      requires_delegate_payment: false,
      config: { settlement_mode: "deferred_cash_collection" },
      display_order: 2,
    },
    {
      id: "bnpl",
      name: "dev.acpsea.bnpl",
      psp: "seller_managed",
      requires_delegate_payment: false,
      config: { installments: 3 },
      display_order: 3,
    },
    {
      id: "shopeepay_wallet",
      name: "com.shopee.wallet",
      psp: "seller_managed",
      requires_delegate_payment: true,
      config: { wallet: "shopeepay_style" },
      display_order: 4,
    },
  ];
}

export function protocolKitPaymentHandlers() {
  return [
    {
      handler_id: "tokenized_card",
      handler_type: "tokenized_card",
      supported_countries: ["Singapore", "Indonesia", "Malaysia", "Philippines", "Thailand", "Vietnam"],
      supported_currencies: ["SGD", "IDR", "MYR", "PHP", "THB", "VND"],
      requires_delegate_payment: true,
    },
    {
      handler_id: "cod",
      handler_type: "cod",
      supported_countries: ["Singapore", "Indonesia", "Malaysia", "Philippines", "Thailand", "Vietnam"],
      supported_currencies: ["SGD", "IDR", "MYR", "PHP", "THB", "VND"],
      supported_cities: ["Singapore", "Jakarta", "Kuala Lumpur", "Manila", "Bangkok", "Ho Chi Minh City"],
      requires_delegate_payment: false,
      requires_buyer_confirmation: true,
      settlement_mode: "deferred_cash_collection",
      commitment_token_required: true,
      risk_score_supported: true,
    },
    {
      handler_id: "bnpl_stub",
      handler_type: "bnpl_stub",
      provider: "SPayLater-style",
      supported_countries: ["Singapore", "Indonesia", "Malaysia"],
      supported_currencies: ["SGD", "IDR", "MYR"],
      installment_options: [3],
      terms_acceptance_required: true,
      redirect_required: false,
      underwriting_mode: "stubbed_terms_acceptance_only",
    },
  ];
}
