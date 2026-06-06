import type { PostLaunchInput } from "@adaptlink/shared-types";
import sampleData from "../../shared-data/data/post-launch/halal-vitamin-c-serum.sample.json";

export async function getMockPostLaunchInput(): Promise<PostLaunchInput> {
  return sampleData as PostLaunchInput;
}
