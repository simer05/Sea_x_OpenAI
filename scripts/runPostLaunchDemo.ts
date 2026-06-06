import { analyzePostLaunchProduct } from "@adaptlink/post-launch-seller";
import { postLaunchSamples } from "@adaptlink/shared-data";
import type { PostLaunchInput } from "@adaptlink/shared-types";

async function main(): Promise<void> {
  const input = postLaunchSamples[0] as PostLaunchInput;
  const report = analyzePostLaunchProduct(input);

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
