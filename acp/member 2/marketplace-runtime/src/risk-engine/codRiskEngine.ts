import type { CODRiskInput, CODRiskResult, RiskBand, SellerAction } from "../types.js";

export class CODRiskEngine {
  score(input: CODRiskInput): CODRiskResult {
    const riskReasons: string[] = [];
    let score = 0;

    if (input.buyer_failed_delivery_count > 0) {
      score += input.buyer_failed_delivery_count * 14;
      riskReasons.push("buyer_failed_delivery_history");
    }

    if (input.buyer_cod_order_count === 0) {
      score += 8;
      riskReasons.push("no_prior_cod_history");
    } else if (input.buyer_cod_order_count <= 2) {
      score += 5;
      riskReasons.push("limited_cod_history");
    } else if (input.buyer_cod_order_count >= 20) {
      score -= 5;
      riskReasons.push("strong_cod_history");
    }

    if (input.order_amount > 1500000) {
      score += 20;
      riskReasons.push("large_order_amount");
    } else if (input.order_amount > 800000) {
      score += 10;
      riskReasons.push("elevated_order_amount");
    } else if (input.order_amount > 300000) {
      score += 4;
      riskReasons.push("moderate_order_amount");
    }

    if (input.city === "Manila") {
      score += 6;
      riskReasons.push("city_cod_variance");
    } else if (input.city === "Bangkok" || input.city === "Ho Chi Minh City") {
      score += 4;
      riskReasons.push("city_cod_variance");
    } else if (input.city === "Jakarta") {
      score += 2;
      riskReasons.push("dense_city_delivery");
    }

    if (input.seller_category === "electronics") {
      score += 8;
      riskReasons.push("higher_value_category");
    } else if (input.seller_category === "beauty") {
      score += 4;
      riskReasons.push("cod_sensitive_category");
    }

    if (input.delivery_window_days > 7) {
      score += 8;
      riskReasons.push("long_delivery_window");
    } else if (input.delivery_window_days > 4) {
      score += 4;
      riskReasons.push("moderate_delivery_window");
    }

    if (input.seller_cod_return_rate > 0.25) {
      score += 25;
      riskReasons.push("seller_high_cod_return_rate");
    } else if (input.seller_cod_return_rate > 0.15) {
      score += 15;
      riskReasons.push("seller_elevated_cod_return_rate");
    } else if (input.seller_cod_return_rate > 0.08) {
      score += 7;
      riskReasons.push("seller_cod_return_watch");
    }

    const riskScore = Math.min(100, Math.max(0, score));
    const riskBand = this.bandForScore(riskScore);

    return {
      risk_score: riskScore,
      risk_band: riskBand,
      seller_action: this.actionForBand(riskBand, riskScore),
      risk_reasons: riskReasons,
    };
  }

  private bandForScore(score: number): RiskBand {
    if (score >= 75) {
      return "blocked";
    }

    if (score >= 50) {
      return "high";
    }

    if (score >= 25) {
      return "medium";
    }

    return "low";
  }

  private actionForBand(band: RiskBand, score: number): SellerAction {
    if (band === "blocked") {
      return "reject_cod";
    }

    if (band === "high") {
      return score >= 65 ? "require_prepaid" : "manual_review";
    }

    if (band === "medium") {
      return score >= 40 ? "manual_review" : "allow_cod";
    }

    return "allow_cod";
  }
}
