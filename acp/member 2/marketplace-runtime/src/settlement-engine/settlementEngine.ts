import type { CODCommitment, OrderSettlement, SellerCheckoutSession, SettlementState } from "../types.js";

const allowedTransitions: Record<SettlementState, SettlementState[]> = {
  escrow_held: ["escrow_release_pending", "refund_pending", "disputed"],
  cash_pending: ["cash_collected", "refund_pending", "disputed"],
  cash_collected: ["seller_settlement_pending"],
  escrow_release_pending: ["escrow_released"],
  escrow_released: ["seller_settlement_pending"],
  seller_settlement_pending: ["seller_settled", "refund_pending", "disputed"],
  seller_settled: [],
  refund_pending: ["refunded"],
  refunded: [],
  disputed: ["refund_pending", "seller_settlement_pending"],
};

export class SettlementEngine {
  createSettlement(
    settlement_id: string,
    order_id: string,
    session: SellerCheckoutSession,
    codCommitment?: CODCommitment,
  ): OrderSettlement {
    const initialState: SettlementState =
      codCommitment?.settlement_status === "pending_cash" ? "cash_pending" : "escrow_held";

    return {
      settlement_id,
      order_id,
      seller_id: session.seller_id,
      amount: session.seller_subtotal,
      currency: session.items[0]?.currency ?? "IDR",
      state: initialState,
      history: [initialState],
    };
  }

  transition(settlement: OrderSettlement, nextState: SettlementState): OrderSettlement {
    const allowedNextStates = allowedTransitions[settlement.state];

    if (!allowedNextStates.includes(nextState)) {
      throw new Error(`Illegal settlement transition from ${settlement.state} to ${nextState}`);
    }

    return {
      ...settlement,
      state: nextState,
      history: [...settlement.history, nextState],
    };
  }

  canTransition(currentState: SettlementState, nextState: SettlementState): boolean {
    return allowedTransitions[currentState].includes(nextState);
  }
}
