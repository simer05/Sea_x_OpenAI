import type { CatalogProduct } from "./catalogLoader.js";

export type HalalVerificationStatus =
  | "Verified Halal Certified"
  | "Halal Claim — Pending Verification"
  | "Not Certified Halal"
  | "Non-Halal"
  | "Not Applicable";

const RISKY_INGREDIENTS = [
  "pork",
  "lard",
  "gelatin",
  "collagen",
  "alcohol flavoring",
  "beer",
  "wine",
  "non-halal meat",
];

const FOOD_CATEGORIES = new Set(["groceries", "food", "food & beverages"]);

export interface HalalVerificationResult {
  product_id: string;
  status: HalalVerificationStatus;
  eligible_for_halal_request: boolean;
  certificate_authority: string | null;
  certificate_id: string | null;
  certificate_active: boolean;
  certificate_expired: boolean;
  risky_ingredients: string[];
  decision: "Eligible" | "Rejected";
  reason: string;
}

function isExpired(expiresAt: string | null, now = new Date()) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < now;
}

function detectRiskyIngredients(description: string) {
  const lower = description.toLowerCase();
  return RISKY_INGREDIENTS.filter((term) => lower.includes(term));
}

export function verifyHalalProduct(
  product: CatalogProduct,
  halalRequired: boolean,
): HalalVerificationResult {
  const risky = detectRiskyIngredients(product.description);
  const categoryRelevant = FOOD_CATEGORIES.has(product.category.toLowerCase());

  if (!categoryRelevant) {
    return {
      product_id: product.product_id,
      status: "Not Applicable",
      eligible_for_halal_request: !halalRequired,
      certificate_authority: product.halal_certifier,
      certificate_id: product.halal_certificate_id,
      certificate_active: false,
      certificate_expired: false,
      risky_ingredients: risky,
      decision: halalRequired ? "Rejected" : "Eligible",
      reason: "Category does not require Halal checking",
    };
  }

  if (risky.length > 0 || product.halal_status === "not_certified") {
    return {
      product_id: product.product_id,
      status: "Non-Halal",
      eligible_for_halal_request: false,
      certificate_authority: product.halal_certifier,
      certificate_id: product.halal_certificate_id,
      certificate_active: false,
      certificate_expired: isExpired(product.halal_expires_at),
      risky_ingredients: risky,
      decision: "Rejected",
      reason:
        risky.length > 0
          ? `Non-Halal risk: ${risky.join(", ")}`
          : "Product is explicitly not Halal certified",
    };
  }

  const expired = isExpired(product.halal_expires_at);
  const hasCertificate = Boolean(product.halal_certificate_id && product.halal_certifier);

  if (product.halal_status === "certified" && hasCertificate && !expired) {
    return {
      product_id: product.product_id,
      status: "Verified Halal Certified",
      eligible_for_halal_request: true,
      certificate_authority: product.halal_certifier,
      certificate_id: product.halal_certificate_id,
      certificate_active: true,
      certificate_expired: false,
      risky_ingredients: [],
      decision: "Eligible",
      reason: `${product.halal_certifier} certificate active`,
    };
  }

  if (product.halal_status === "certified" && hasCertificate && expired) {
    return {
      product_id: product.product_id,
      status: "Halal Claim — Pending Verification",
      eligible_for_halal_request: false,
      certificate_authority: product.halal_certifier,
      certificate_id: product.halal_certificate_id,
      certificate_active: false,
      certificate_expired: true,
      risky_ingredients: [],
      decision: "Rejected",
      reason: "Certificate expired",
    };
  }

  if (product.halal_status === "unknown") {
    return {
      product_id: product.product_id,
      status: "Halal Claim — Pending Verification",
      eligible_for_halal_request: false,
      certificate_authority: product.halal_certifier,
      certificate_id: product.halal_certificate_id,
      certificate_active: false,
      certificate_expired: false,
      risky_ingredients: [],
      decision: "Rejected",
      reason: "Seller claims Halal but proof is incomplete",
    };
  }

  return {
    product_id: product.product_id,
    status: "Not Certified Halal",
    eligible_for_halal_request: false,
    certificate_authority: product.halal_certifier,
    certificate_id: product.halal_certificate_id,
    certificate_active: false,
    certificate_expired: expired,
    risky_ingredients: risky,
    decision: "Rejected",
    reason: "No valid Halal certificate found",
  };
}
