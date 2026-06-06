import { describe, expect, it } from "vitest";
import {
  buyerProfiles,
  CODRiskEngine,
  MarketplaceRuntimeService,
  OrderLifecycleEngine,
  SettlementEngine,
  sellers,
  skus,
} from "../src/index.js";
import type { MarketplaceOrder, OrderSettlement } from "../src/index.js";

const lowRiskJakartaBuyer = buyerProfiles.find((buyer) => buyer.buyer_id === "buyer_low_risk_jakarta");
const blockedManilaBuyer = buyerProfiles.find((buyer) => buyer.buyer_id === "buyer_blocked_manila");

if (!lowRiskJakartaBuyer || !blockedManilaBuyer) {
  throw new Error("Expected buyer fixtures are missing");
}

describe("Member 2 marketplace runtime fixtures", () => {
  it("has independent fixtures with 5 sellers and 35 SKUs", () => {
    expect(sellers).toHaveLength(5);
    expect(skus).toHaveLength(35);
    expect(new Set(skus.map((sku) => sku.currency)).size).toBeGreaterThan(1);
  });

  it("covers the shared SEA country, city, and currency set used by protocol fixtures", () => {
    expect(new Set(skus.map((sku) => sku.country))).toEqual(
      new Set(["Indonesia", "Singapore", "Malaysia", "Philippines", "Thailand", "Vietnam"]),
    );
    expect(new Set(skus.flatMap((sku) => sku.delivery_promises.map((promise) => promise.city)))).toEqual(
      new Set(["Jakarta", "Singapore", "Kuala Lumpur", "Manila", "Bangkok", "Ho Chi Minh City"]),
    );
    expect(new Set(skus.map((sku) => sku.currency))).toEqual(new Set(["IDR", "SGD", "MYR", "PHP", "THB", "VND"]));
  });
});

describe("product search", () => {
  it("returns products across multiple sellers", () => {
    const service = new MarketplaceRuntimeService();
    const results = service.searchProducts({
      keyword: "serum",
      stock_available: true,
    });

    expect(new Set(results.map((result) => result.seller_id)).size).toBeGreaterThanOrEqual(3);
  });

  it("filters halal-certified products correctly", () => {
    const service = new MarketplaceRuntimeService();
    const results = service.searchProducts({
      category: "beauty",
      halal_status: "certified",
      stock_available: true,
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.every((result) => result.halal_status === "certified")).toBe(true);
  });

  it("filters BPOM-registered products correctly", () => {
    const service = new MarketplaceRuntimeService();
    const results = service.searchProducts({
      country: "Indonesia",
      bpom_status: "registered",
      stock_available: true,
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.every((result) => result.bpom_status === "registered")).toBe(true);
  });

  it("filters COD-eligible Jakarta products correctly", () => {
    const service = new MarketplaceRuntimeService();
    const results = service.searchProducts({
      city: "Jakarta",
      cod_available: true,
      stock_available: true,
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.every((result) => result.cod_available)).toBe(true);
    expect(results.every((result) => result.city_delivery_window.city === "Jakarta")).toBe(true);
  });

  it("filters delivery-this-week products correctly", () => {
    const service = new MarketplaceRuntimeService();
    const results = service.searchProducts({
      city: "Jakarta",
      delivery_deadline: 7,
      stock_available: true,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.city_delivery_window.max_days <= 7)).toBe(true);
  });
});

describe("cart and seller checkout sessions", () => {
  it("creates a marketplace cart with items from two or more sellers", () => {
    const service = new MarketplaceRuntimeService();
    const cart = service.createMarketplaceCart(
      [
        { sku_id: "sku_001", quantity: 1 },
        { sku_id: "sku_009", quantity: 2 },
      ],
      "Jakarta",
    );

    expect(cart.items).toHaveLength(2);
    expect(new Set(cart.seller_groups.map((group) => group.seller_id)).size).toBe(2);
    expect(cart.subtotal).toBe(361000);
  });

  it("splits one cart into one checkout session per seller", () => {
    const service = new MarketplaceRuntimeService();
    const cart = service.createMarketplaceCart(
      [
        { sku_id: "sku_001", quantity: 1 },
        { sku_id: "sku_009", quantity: 1 },
      ],
      "Jakarta",
    );
    const sessions = service.splitSellerCheckoutSessions(cart.marketplace_cart_id, lowRiskJakartaBuyer);

    expect(sessions).toHaveLength(2);
    expect(new Set(sessions.map((session) => session.seller_id))).toEqual(new Set(["seller_001", "seller_002"]));
    expect(sessions.every((session) => session.session_status === "created")).toBe(true);
  });
});

describe("payment capability and COD handling", () => {
  it("rejects COD when seller or SKU disallows COD", () => {
    const service = new MarketplaceRuntimeService();
    const cart = service.createMarketplaceCart([{ sku_id: "sku_009", quantity: 1 }], "Jakarta");
    const [session] = service.splitSellerCheckoutSessions(cart.marketplace_cart_id, lowRiskJakartaBuyer);

    const resolution = service.resolvePaymentCapability(session.checkout_session_id, lowRiskJakartaBuyer);

    expect(resolution.cod_available).toBe(false);
    expect(resolution.rejection_reasons).toContain("seller_cod_disabled");
    expect(resolution.rejection_reasons).toContain("sku_cod_not_available:sku_009");
  });

  it("generates a COD commitment token and sets settlement_status to pending_cash", () => {
    const service = new MarketplaceRuntimeService();
    const cart = service.createMarketplaceCart([{ sku_id: "sku_001", quantity: 1 }], "Jakarta");
    const [session] = service.splitSellerCheckoutSessions(cart.marketplace_cart_id, lowRiskJakartaBuyer);

    const commitment = service.confirmCODCommitment(session.checkout_session_id, lowRiskJakartaBuyer);

    expect(commitment.commitment_token).toMatch(/^cod_commit_/);
    expect(commitment.settlement_status).toBe("pending_cash");
    expect(commitment.seller_action).toBe("allow_cod");
  });

  it("returns deterministic COD risk bands", () => {
    const riskEngine = new CODRiskEngine();
    const lowRiskInput = {
      buyer_failed_delivery_count: lowRiskJakartaBuyer.buyer_failed_delivery_count,
      buyer_cod_order_count: lowRiskJakartaBuyer.buyer_cod_order_count,
      order_amount: 145000,
      city: "Jakarta" as const,
      seller_category: "beauty",
      delivery_window_days: 3,
      seller_cod_return_rate: 0.06,
    };
    const blockedRiskInput = {
      buyer_failed_delivery_count: blockedManilaBuyer.buyer_failed_delivery_count,
      buyer_cod_order_count: blockedManilaBuyer.buyer_cod_order_count,
      order_amount: 2450,
      city: "Manila" as const,
      seller_category: "electronics",
      delivery_window_days: 5,
      seller_cod_return_rate: 0.29,
    };

    expect(riskEngine.score(lowRiskInput)).toEqual(riskEngine.score(lowRiskInput));
    expect(riskEngine.score(lowRiskInput).risk_band).toBe("low");
    expect(riskEngine.score(blockedRiskInput).risk_band).toBe("blocked");
    expect(riskEngine.score(blockedRiskInput).seller_action).toBe("reject_cod");
  });
});

describe("BNPL stub", () => {
  it("requires terms acceptance and accepts or rejects mock terms", () => {
    const service = new MarketplaceRuntimeService();
    const cart = service.createMarketplaceCart([{ sku_id: "sku_001", quantity: 1 }], "Jakarta");
    const [session] = service.splitSellerCheckoutSessions(cart.marketplace_cart_id, lowRiskJakartaBuyer);

    const terms = service.createBNPLTerms(session.checkout_session_id, lowRiskJakartaBuyer);
    const accepted = service.acceptBNPLTerms(terms, true);

    expect(terms.bnpl_available).toBe(true);
    expect(terms.terms_acceptance_required).toBe(true);
    expect(terms.terms_status).toBe("required");
    expect(accepted.terms_acceptance_required).toBe(false);
    expect(accepted.terms_status).toBe("accepted");
  });
});

describe("order lifecycle and settlement", () => {
  it("rejects illegal order lifecycle transitions", () => {
    const engine = new OrderLifecycleEngine();
    const order: MarketplaceOrder = {
      order_id: "order_test",
      marketplace_cart_id: "cart_test",
      seller_sessions: [],
      cod_commitments: [],
      lifecycle_state: "cart_created",
    };

    expect(() => engine.transition(order, "cash_collected")).toThrow(/Illegal order lifecycle transition/);
  });

  it("tracks COD cash settlement and seller settlement states", () => {
    const service = new MarketplaceRuntimeService();
    const cart = service.createMarketplaceCart([{ sku_id: "sku_001", quantity: 1 }], "Jakarta");
    const [session] = service.splitSellerCheckoutSessions(cart.marketplace_cart_id, lowRiskJakartaBuyer);
    const commitment = service.confirmCODCommitment(session.checkout_session_id, lowRiskJakartaBuyer);
    const order = service.createMarketplaceOrder(cart.marketplace_cart_id, [session.checkout_session_id], [commitment]);
    const [settlement] = service.listSettlementsForOrder(order.order_id);

    expect(service.getOrderLifecycleState(order.order_id)).toBe("cod_committed");
    expect(service.getSettlementState(settlement.settlement_id)).toBe("cash_pending");

    service.transitionSettlement(settlement.settlement_id, "cash_collected");
    service.transitionSettlement(settlement.settlement_id, "seller_settlement_pending");
    const settled = service.transitionSettlement(settlement.settlement_id, "seller_settled");

    expect(settled.history).toEqual(["cash_pending", "cash_collected", "seller_settlement_pending", "seller_settled"]);
  });

  it("tracks escrow release and seller settlement states", () => {
    const engine = new SettlementEngine();
    const settlement: OrderSettlement = {
      settlement_id: "settlement_test",
      order_id: "order_test",
      seller_id: "seller_001",
      amount: 100,
      currency: "IDR",
      state: "escrow_held",
      history: ["escrow_held"],
    };

    const releasePending = engine.transition(settlement, "escrow_release_pending");
    const released = engine.transition(releasePending, "escrow_released");
    const settlementPending = engine.transition(released, "seller_settlement_pending");
    const settled = engine.transition(settlementPending, "seller_settled");

    expect(settled.history).toEqual([
      "escrow_held",
      "escrow_release_pending",
      "escrow_released",
      "seller_settlement_pending",
      "seller_settled",
    ]);
  });
});
