export const POSTPURCHASE_EXTENSION_NAMESPACE = "dev.acpsea.postpurchase" as const;

export const escrowStatusValues = [
  "not_applicable",
  "held",
  "release_pending",
  "released",
  "refund_pending",
  "refunded",
  "disputed"
] as const;

export type EscrowStatus = (typeof escrowStatusValues)[number];

export interface EscrowMetadata {
  status: EscrowStatus;
  release_rule: string;
}

export interface ReturnMetadata {
  return_window_days: number;
  return_method: string;
}

export interface RefundMetadata {
  refund_method: string;
}

export interface DisputeMetadata {
  allowed: boolean;
}

export interface PostPurchaseExtensionPayload {
  extension_id: string;
  namespace: typeof POSTPURCHASE_EXTENSION_NAMESPACE;
  escrow: EscrowMetadata;
  returns: ReturnMetadata;
  refund: RefundMetadata;
  dispute: DisputeMetadata;
}
