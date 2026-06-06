"use strict";

const DEFAULT_FEE_ASSUMPTIONS = {
  shopeeFeeRate: 0.08,
  transactionFeeRate: 0.022,
  shippingSubsidy: 0,
  voucherCost: 0,
  packagingCost: 0.5,
  adCostPerOrder: 0
};

function calculateMargin(input = {}) {
  const sellingPrice = toNumber(input.sellingPrice);
  const productCost = toNumber(input.productCost);
  const assumptions = {
    ...DEFAULT_FEE_ASSUMPTIONS,
    ...(input.feeAssumptions || {})
  };

  const marketplaceFees =
    sellingPrice * toNumber(assumptions.shopeeFeeRate) +
    sellingPrice * toNumber(assumptions.transactionFeeRate);

  const totalVariableCost =
    productCost +
    marketplaceFees +
    toNumber(assumptions.shippingSubsidy) +
    toNumber(assumptions.voucherCost) +
    toNumber(assumptions.packagingCost) +
    toNumber(assumptions.adCostPerOrder);

  const netProfit = sellingPrice - totalVariableCost;
  const netMarginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const breakEvenPrice = totalVariableCost - toNumber(assumptions.adCostPerOrder);
  const safeAdSpendCap = Math.max(0, netProfit * 0.45);

  return {
    sellingPrice: roundMoney(sellingPrice),
    productCost: roundMoney(productCost),
    marketplaceFees: roundMoney(marketplaceFees),
    totalVariableCost: roundMoney(totalVariableCost),
    netProfit: roundMoney(netProfit),
    netMarginPercent: round(netMarginPercent),
    breakEvenPrice: roundMoney(breakEvenPrice),
    safeAdSpendCap: roundMoney(safeAdSpendCap),
    assumptions
  };
}

function scoreMargin(margin) {
  if (margin.netMarginPercent >= 35) return 92;
  if (margin.netMarginPercent >= 25) return 78;
  if (margin.netMarginPercent >= 18) return 64;
  if (margin.netMarginPercent >= 10) return 48;
  if (margin.netMarginPercent > 0) return 32;
  return 10;
}

function toNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

module.exports = {
  DEFAULT_FEE_ASSUMPTIONS,
  calculateMargin,
  scoreMargin
};
