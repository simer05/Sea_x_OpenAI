import { buyerProfiles, sellers, skus } from "../../fixtures/runtimeFixtures.js";
import { BNPLHandlerStub } from "../bnpl-handler-stub/bnplHandlerStub.js";
import { CartEngine } from "../cart-engine/cartEngine.js";
import { CODHandler } from "../cod-handler/codHandler.js";
import { OrderLifecycleEngine } from "../order-lifecycle/orderLifecycleEngine.js";
import { PaymentCapabilityResolver } from "../payment-capability-resolver/paymentCapabilityResolver.js";
import { SearchEngine } from "../search-engine/searchEngine.js";
import { SellerSessionSplitter } from "../seller-session-splitter/sellerSessionSplitter.js";
import { SettlementEngine } from "../settlement-engine/settlementEngine.js";
import type {
  BNPLTerms,
  BuyerProfile,
  CartRequestItem,
  City,
  CODCommitment,
  MarketplaceCart,
  MarketplaceOrder,
  OrderLifecycleState,
  OrderSettlement,
  PaymentCapabilityResolution,
  SearchFilters,
  SearchResult,
  Seller,
  SellerCheckoutSession,
  SettlementState,
  SKU,
} from "../types.js";

export interface MarketplaceRuntimeFixtures {
  sellers: Seller[];
  skus: SKU[];
  buyerProfiles: BuyerProfile[];
}

export class MarketplaceRuntimeService {
  readonly searchEngine: SearchEngine;
  readonly cartEngine: CartEngine;
  readonly sessionSplitter: SellerSessionSplitter;
  readonly paymentCapabilityResolver: PaymentCapabilityResolver;
  readonly codHandler: CODHandler;
  readonly bnplHandler: BNPLHandlerStub;
  readonly orderLifecycleEngine: OrderLifecycleEngine;
  readonly settlementEngine: SettlementEngine;

  private readonly carts = new Map<string, MarketplaceCart>();
  private readonly sessions = new Map<string, SellerCheckoutSession>();
  private readonly orders = new Map<string, MarketplaceOrder>();
  private readonly settlements = new Map<string, OrderSettlement>();
  private nextOrderNumber = 1;
  private nextSettlementNumber = 1;

  constructor(
    private readonly fixtures: MarketplaceRuntimeFixtures = {
      sellers,
      skus,
      buyerProfiles,
    },
  ) {
    this.searchEngine = new SearchEngine(fixtures.skus, fixtures.sellers);
    this.cartEngine = new CartEngine(fixtures.sellers, fixtures.skus);
    this.sessionSplitter = new SellerSessionSplitter();
    this.paymentCapabilityResolver = new PaymentCapabilityResolver(fixtures.sellers);
    this.codHandler = new CODHandler(fixtures.sellers);
    this.bnplHandler = new BNPLHandlerStub(fixtures.sellers);
    this.orderLifecycleEngine = new OrderLifecycleEngine();
    this.settlementEngine = new SettlementEngine();
  }

  listFixtures(): MarketplaceRuntimeFixtures {
    return this.fixtures;
  }

  searchProducts(filters: SearchFilters = {}): SearchResult[] {
    return this.searchEngine.search(filters);
  }

  createMarketplaceCart(items: CartRequestItem[], city: City): MarketplaceCart {
    const cart = this.cartEngine.createMarketplaceCart(items, city);
    this.carts.set(cart.marketplace_cart_id, cart);
    return cart;
  }

  getMarketplaceCart(marketplaceCartId: string): MarketplaceCart {
    const cart = this.carts.get(marketplaceCartId);

    if (!cart) {
      throw new Error(`Unknown marketplace_cart_id ${marketplaceCartId}`);
    }

    return cart;
  }

  splitSellerCheckoutSessions(
    marketplaceCartId: string,
    buyerProfile?: BuyerProfile,
  ): SellerCheckoutSession[] {
    const cart = this.getMarketplaceCart(marketplaceCartId);
    const sessions = this.sessionSplitter.split(cart).map((session) => {
      const enrichedSession = buyerProfile
        ? {
            ...session,
            eligible_payment_methods: this.paymentMethodsFor(
              this.paymentCapabilityResolver.resolve(session, buyerProfile),
            ),
          }
        : session;

      this.sessions.set(enrichedSession.checkout_session_id, enrichedSession);
      return enrichedSession;
    });

    return sessions;
  }

  resolvePaymentCapability(
    checkoutSessionId: string,
    buyerProfile: BuyerProfile,
  ): PaymentCapabilityResolution {
    const session = this.getSellerCheckoutSession(checkoutSessionId);
    const resolution = this.paymentCapabilityResolver.resolve(session, buyerProfile);

    this.sessions.set(checkoutSessionId, {
      ...session,
      eligible_payment_methods: this.paymentMethodsFor(resolution),
    });

    return resolution;
  }

  confirmCODCommitment(checkoutSessionId: string, buyerProfile: BuyerProfile): CODCommitment {
    const session = this.getSellerCheckoutSession(checkoutSessionId);
    return this.codHandler.confirm(session, buyerProfile);
  }

  createBNPLTerms(checkoutSessionId: string, buyerProfile: BuyerProfile): BNPLTerms {
    return this.bnplHandler.createTerms(this.getSellerCheckoutSession(checkoutSessionId), buyerProfile);
  }

  acceptBNPLTerms(terms: BNPLTerms, accepted: boolean): BNPLTerms {
    return this.bnplHandler.acceptTerms(terms, accepted);
  }

  createMarketplaceOrder(
    marketplaceCartId: string,
    checkoutSessionIds: string[],
    codCommitments: CODCommitment[] = [],
  ): MarketplaceOrder {
    this.getMarketplaceCart(marketplaceCartId);
    const sellerSessions = checkoutSessionIds.map((id) => this.getSellerCheckoutSession(id));
    let order: MarketplaceOrder = {
      order_id: `order_${String(this.nextOrderNumber++).padStart(3, "0")}`,
      marketplace_cart_id: marketplaceCartId,
      seller_sessions: sellerSessions,
      cod_commitments: codCommitments,
      lifecycle_state: "cart_created",
    };

    order = this.orderLifecycleEngine.transition(order, "seller_sessions_created");
    if (codCommitments.length > 0) {
      order = this.orderLifecycleEngine.transition(order, "buyer_confirmed");
      order = this.orderLifecycleEngine.transition(order, "cod_committed");
    }

    this.orders.set(order.order_id, order);

    for (const session of sellerSessions) {
      const codCommitment = codCommitments.find((commitment) => commitment.checkout_session_id === session.checkout_session_id);
      const settlement = this.settlementEngine.createSettlement(
        `settlement_${String(this.nextSettlementNumber++).padStart(3, "0")}`,
        order.order_id,
        session,
        codCommitment,
      );
      this.settlements.set(settlement.settlement_id, settlement);
    }

    return order;
  }

  getOrderLifecycleState(orderId: string): OrderLifecycleState {
    return this.getOrder(orderId).lifecycle_state;
  }

  transitionOrder(orderId: string, nextState: OrderLifecycleState): MarketplaceOrder {
    const nextOrder = this.orderLifecycleEngine.transition(this.getOrder(orderId), nextState);
    this.orders.set(orderId, nextOrder);
    return nextOrder;
  }

  listSettlementsForOrder(orderId: string): OrderSettlement[] {
    return Array.from(this.settlements.values()).filter((settlement) => settlement.order_id === orderId);
  }

  getSettlementState(settlementId: string): SettlementState {
    return this.getSettlement(settlementId).state;
  }

  transitionSettlement(settlementId: string, nextState: SettlementState): OrderSettlement {
    const nextSettlement = this.settlementEngine.transition(this.getSettlement(settlementId), nextState);
    this.settlements.set(settlementId, nextSettlement);
    return nextSettlement;
  }

  private getSellerCheckoutSession(checkoutSessionId: string): SellerCheckoutSession {
    const session = this.sessions.get(checkoutSessionId);

    if (!session) {
      throw new Error(`Unknown checkout_session_id ${checkoutSessionId}`);
    }

    return session;
  }

  private getOrder(orderId: string): MarketplaceOrder {
    const order = this.orders.get(orderId);

    if (!order) {
      throw new Error(`Unknown order_id ${orderId}`);
    }

    return order;
  }

  private getSettlement(settlementId: string): OrderSettlement {
    const settlement = this.settlements.get(settlementId);

    if (!settlement) {
      throw new Error(`Unknown settlement_id ${settlementId}`);
    }

    return settlement;
  }

  private paymentMethodsFor(resolution: PaymentCapabilityResolution): string[] {
    return [
      resolution.tokenized_card_available ? "tokenized_card" : undefined,
      resolution.cod_available ? "cod" : undefined,
      resolution.bnpl_available ? "bnpl" : undefined,
    ].filter((method): method is string => Boolean(method));
  }
}
