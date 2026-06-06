import type { MarketplaceOrder, OrderLifecycleState } from "../types.js";

const allowedTransitions: Record<OrderLifecycleState, OrderLifecycleState[]> = {
  cart_created: ["seller_sessions_created", "cancelled"],
  seller_sessions_created: ["buyer_confirmed", "cancelled"],
  buyer_confirmed: ["cod_committed", "order_confirmed", "cancelled"],
  cod_committed: ["order_confirmed", "cancelled"],
  order_confirmed: ["awaiting_delivery", "cancelled"],
  awaiting_delivery: ["pending_cash_collection", "failed_delivery", "returned"],
  pending_cash_collection: ["cash_collected", "failed_delivery", "returned"],
  cash_collected: ["seller_settlement_pending"],
  seller_settlement_pending: ["seller_settled"],
  seller_settled: [],
  cancelled: [],
  failed_delivery: ["returned"],
  returned: ["cancelled"],
};

export class OrderLifecycleEngine {
  transition(order: MarketplaceOrder, nextState: OrderLifecycleState): MarketplaceOrder {
    const allowedNextStates = allowedTransitions[order.lifecycle_state];

    if (!allowedNextStates.includes(nextState)) {
      throw new Error(`Illegal order lifecycle transition from ${order.lifecycle_state} to ${nextState}`);
    }

    return {
      ...order,
      lifecycle_state: nextState,
    };
  }

  canTransition(currentState: OrderLifecycleState, nextState: OrderLifecycleState): boolean {
    return allowedTransitions[currentState].includes(nextState);
  }
}
