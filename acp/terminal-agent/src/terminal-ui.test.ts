import assert from "node:assert/strict";
import { formatToolOutput } from "./terminal-ui.js";

function testSearchFormattingUsesTopThreeNotEligibleCount() {
  const raw = JSON.stringify({
    total_found: 12,
    eligible_count: 5,
    products: [
      { rank: 1, title: "Spicy Curry Noodles Pack", price: 6.9, currency: "SGD", halal_status: "Verified Halal Certified", product_id: "prod_006" },
      { rank: 2, title: "Budget Halal Instant Noodles 3-pack", price: 5.5, currency: "SGD", halal_status: "Verified Halal Certified", product_id: "prod_001" },
      { rank: 3, title: "Singapore Halal Laksa Noodles 2-pack", price: 5.8, currency: "SGD", halal_status: "Verified Halal Certified", product_id: "prod_002" },
    ],
  });

  const formatted = formatToolOutput(raw);
  assert.ok(formatted);
  assert.match(formatted!, /Top 3 picks:/);
  assert.match(formatted!, /Found 12 matches — 5 passed/);
  assert.doesNotMatch(formatted!, /^Found 5 matches/m);
}

testSearchFormattingUsesTopThreeNotEligibleCount();
console.log("terminal-ui tests passed");
