import assert from "node:assert/strict";
import { analyzePostLaunchProduct } from "@adaptlink/post-launch-seller";
import { getSamplePostLaunchInput } from "@adaptlink/shopee-connector";

async function main(): Promise<void> {
  const input = await getSamplePostLaunchInput();
  const report = analyzePostLaunchProduct(input);

  assert.equal(report.productId, "P-SG-101");
  assert.ok(report.health.overall >= 0 && report.health.overall <= 100);
  assert.ok(report.actions.length > 0);
  assert.ok(report.actions.every((action) => action.revenueLogic.length > 0));

  console.log("postLaunchAnalyzer.test.ts passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
