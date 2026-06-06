import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CatalogProduct {
  product_id: string;
  variant_id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  availability: "in_stock" | "out_of_stock";
  country: string;
  city: string;
  delivery_starts_at: string;
  delivery_ends_at: string;
  halal_status: "certified" | "unknown" | "not_certified";
  halal_certifier: string | null;
  halal_certificate_id: string | null;
  halal_expires_at: string | null;
  bpom_status: string;
  cod_available: boolean;
  cod_max_amount: number;
  cod_supported_cities: string[];
  bnpl_available: boolean;
  bnpl_provider: string | null;
  return_window_days: number;
  image_url?: string;
  rating: number;
  sold_count: number;
  review_count?: number;
  discount_pct?: number;
}

export interface SellerRow {
  seller_id: string;
  seller_name: string;
  country: string;
  city: string;
  default_currency: string;
}

function findDataFile(filename: string): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = path.join(dir, "data", filename);
    if (existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error(`Unable to locate data/${filename}`);
}

const catalog = JSON.parse(readFileSync(findDataFile("catalog.json"), "utf8")) as CatalogProduct[];
const sellers = JSON.parse(readFileSync(findDataFile("sellers.json"), "utf8")) as SellerRow[];

export const catalogById = new Map(catalog.map((row) => [row.product_id, row]));
export const catalogBySku = new Map(
  catalog.map((row) => [row.product_id.replace("prod_", "sku_"), row]),
);
export const sellerById = new Map(sellers.map((row) => [row.seller_id, row]));

export function skuId(productId: string) {
  return productId.replace("prod_", "sku_");
}

export function productId(skuIdValue: string) {
  return skuIdValue.replace("sku_", "prod_");
}

export function reviewCount(row: CatalogProduct) {
  return row.review_count ?? Math.max(25, Math.round(row.sold_count / 12));
}

export function productUrl(productIdValue: string) {
  return `/?highlight=${productIdValue}`;
}
