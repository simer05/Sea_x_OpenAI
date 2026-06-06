import type { SellerReference, SupportedCurrency } from "./common";

export const productAvailabilityValues = [
  "in_stock",
  "out_of_stock",
  "preorder",
  "discontinued"
] as const;

export type ProductAvailability = (typeof productAvailabilityValues)[number];

export const seaOnlyBaseProductFieldNames = [
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

export type SeaOnlyBaseProductFieldName = (typeof seaOnlyBaseProductFieldNames)[number];

export interface BaseProductPayload {
  product_id: string;
  variant_id: string;
  seller_reference: SellerReference;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: SupportedCurrency;
  availability: ProductAvailability;
  image_url: string;
  product_url: string;
}
