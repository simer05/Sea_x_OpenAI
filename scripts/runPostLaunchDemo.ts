import { analyzePostLaunchProduct } from "@adaptlink/post-launch-seller";
import { getMockPostLaunchInput } from "@adaptlink/shopee-connector";

async function main(): Promise<void> {
  const input = await getMockPostLaunchInput();
  const report = analyzePostLaunchProduct(input);

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
