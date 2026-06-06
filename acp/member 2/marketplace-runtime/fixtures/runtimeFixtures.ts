import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  BPOMStatus,
  BuyerProfile,
  City,
  Country,
  Currency,
  DeliveryPromise,
  HalalStatus,
  Seller,
  SKU,
} from "../src/types.js";

interface SharedSellerRow {
  seller_id: string;
  seller_name: string;
  country: Country;
  city: City;
  default_currency: Currency;
}

interface SharedCatalogRow {
  product_id: string;
  variant_id: string;
  seller_id: string;
  title: string;
  category: string;
  price: number;
  currency: Currency;
  country: Country;
  city: City;
  halal_status: HalalStatus;
  halal_certifier: string | null;
  halal_certificate_id: string | null;
  bpom_status: BPOMStatus;
  bpom_registration_number: string | null;
  cod_available: boolean;
  cod_max_amount: number;
  cod_supported_cities: City[];
  bnpl_available: boolean;
}

interface SellerRuntimeMetadata {
  rating: number;
  seller_category: string;
  cod_return_rate: number;
  tokenized_card: boolean;
  bnpl_min_amount: number;
  bnpl_max_amount: number;
  bnpl_installment_months: number[];
}

const sellerRuntimeMetadata: Record<string, SellerRuntimeMetadata> = {
  seller_001: {
    rating: 4.8,
    seller_category: "beauty",
    cod_return_rate: 0.06,
    tokenized_card: true,
    bnpl_min_amount: 100000,
    bnpl_max_amount: 2000000,
    bnpl_installment_months: [3, 6],
  },
  seller_002: {
    rating: 4.9,
    seller_category: "electronics",
    cod_return_rate: 0.02,
    tokenized_card: true,
    bnpl_min_amount: 25,
    bnpl_max_amount: 600,
    bnpl_installment_months: [3, 6, 12],
  },
  seller_003: {
    rating: 4.6,
    seller_category: "wellness",
    cod_return_rate: 0.11,
    tokenized_card: true,
    bnpl_min_amount: 80,
    bnpl_max_amount: 900,
    bnpl_installment_months: [3, 6],
  },
  seller_004: {
    rating: 4.1,
    seller_category: "family",
    cod_return_rate: 0.29,
    tokenized_card: true,
    bnpl_min_amount: 1000,
    bnpl_max_amount: 15000,
    bnpl_installment_months: [3, 6],
  },
  seller_005: {
    rating: 4.4,
    seller_category: "lifestyle",
    cod_return_rate: 0.18,
    tokenized_card: true,
    bnpl_min_amount: 300,
    bnpl_max_amount: 9000,
    bnpl_installment_months: [3],
  },
};

const stockByProductId: Record<string, number> = {
  prod_001: 42,
  prod_002: 55,
  prod_003: 30,
  prod_004: 120,
  prod_005: 0,
  prod_006: 65,
  prod_007: 18,
  prod_008: 33,
  prod_009: 22,
  prod_010: 80,
  prod_011: 44,
  prod_012: 95,
  prod_013: 12,
  prod_014: 0,
  prod_015: 24,
  prod_016: 16,
  prod_017: 40,
  prod_018: 60,
  prod_019: 100,
  prod_020: 18,
  prod_021: 9,
  prod_022: 26,
  prod_023: 31,
  prod_024: 75,
  prod_025: 14,
  prod_026: 50,
  prod_027: 90,
  prod_028: 0,
  prod_029: 20,
  prod_030: 48,
  prod_031: 100,
  prod_032: 34,
  prod_033: 27,
  prod_034: 15,
  prod_035: 0,
  prod_036: 39,
};

function readSharedJson<T>(relativePathFromAcp: string): T {
  let dir = path.dirname(fileURLToPath(import.meta.url));

  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = path.join(dir, "data", relativePathFromAcp);
    if (existsSync(candidate)) {
      return JSON.parse(readFileSync(candidate, "utf8")) as T;
    }
    dir = path.dirname(dir);
  }

  throw new Error(`Unable to locate shared data file: data/${relativePathFromAcp}`);
}

function delivery(city: City, min_days: number, max_days: number): DeliveryPromise {
  return {
    city,
    min_days,
    max_days,
  };
}

function deliveryWindowFor(row: SharedCatalogRow): DeliveryPromise {
  const productNumber = Number(row.product_id.replace("prod_", ""));
  const minDays = row.city === "Jakarta" || row.city === "Singapore" ? 1 : 2;
  const maxDays = Math.min(9, minDays + 1 + (productNumber % 5));
  return delivery(row.city, minDays, maxDays);
}

const sharedSellers = readSharedJson<SharedSellerRow[]>("sellers.json");
const sharedCatalog = readSharedJson<SharedCatalogRow[]>("catalog.json");

export const sellers: Seller[] = sharedSellers.map((seller) => {
  const metadata = sellerRuntimeMetadata[seller.seller_id];

  if (!metadata) {
    throw new Error(`Missing runtime metadata for ${seller.seller_id}`);
  }

  const sellerRows = sharedCatalog.filter((row) => row.seller_id === seller.seller_id);
  const codRows = sellerRows.filter((row) => row.cod_available);
  const bnplRows = sellerRows.filter((row) => row.bnpl_available);

  return {
    seller_id: seller.seller_id,
    name: seller.seller_name,
    country: seller.country,
    city: seller.city,
    rating: metadata.rating,
    seller_category: metadata.seller_category,
    cod_return_rate: metadata.cod_return_rate,
    payment_capability: {
      tokenized_card: metadata.tokenized_card,
      cod: {
        enabled: codRows.length > 0,
        supported_cities: [...new Set(codRows.flatMap((row) => row.cod_supported_cities))],
        amount_limit: Math.max(0, ...codRows.map((row) => row.cod_max_amount)),
        currencies: [...new Set(codRows.map((row) => row.currency))],
      },
      bnpl: {
        enabled: bnplRows.length > 0,
        min_amount: metadata.bnpl_min_amount,
        max_amount: metadata.bnpl_max_amount,
        installment_months: metadata.bnpl_installment_months,
      },
    },
  };
});

export const skus: SKU[] = sharedCatalog.map((row) => ({
  sku_id: row.product_id.replace("prod_", "sku_"),
  variant_id: row.variant_id,
  seller_id: row.seller_id,
  title: row.title,
  category: row.category,
  price: row.price,
  currency: row.currency,
  country: row.country,
  stock_quantity: stockByProductId[row.product_id] ?? 25,
  compliance: {
    halal_status: row.halal_status,
    halal_certifier: row.halal_certifier ?? undefined,
    halal_certificate_id: row.halal_certificate_id ?? undefined,
    bpom_status: row.bpom_status,
    bpom_registration_number: row.bpom_registration_number ?? undefined,
  },
  cod_available: row.cod_available,
  bnpl_available: row.bnpl_available,
  delivery_promises: [deliveryWindowFor(row)],
}));

export const buyerProfiles: BuyerProfile[] = [
  {
    buyer_id: "buyer_low_risk_jakarta",
    country: "Indonesia",
    city: "Jakarta",
    buyer_failed_delivery_count: 0,
    buyer_cod_order_count: 12,
    bnpl_terms_accepted: false,
  },
  {
    buyer_id: "buyer_medium_risk_jakarta",
    country: "Indonesia",
    city: "Jakarta",
    buyer_failed_delivery_count: 1,
    buyer_cod_order_count: 2,
    bnpl_terms_accepted: false,
  },
  {
    buyer_id: "buyer_blocked_manila",
    country: "Philippines",
    city: "Manila",
    buyer_failed_delivery_count: 4,
    buyer_cod_order_count: 1,
    bnpl_terms_accepted: false,
  },
  {
    buyer_id: "buyer_bnpl_ready_singapore",
    country: "Singapore",
    city: "Singapore",
    buyer_failed_delivery_count: 0,
    buyer_cod_order_count: 0,
    bnpl_terms_accepted: true,
  },
];
