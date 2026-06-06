import type { PostLaunchInput } from "@adaptlink/shared-types";
import { postLaunchSample } from "@adaptlink/shared-data";

export async function getMockPostLaunchInput(): Promise<PostLaunchInput> {
  return postLaunchSample as PostLaunchInput;
}
