import { createVisionProvider } from "@tracelens/providers";
import { inspectVideo, type InspectVideoResult } from "@tracelens/timeline";

/** Ensures a video has been inspected (cheap no-op if the content hash is already cached) and returns its session. */
export async function resolveVideoSession(video: string): Promise<InspectVideoResult> {
  const visionProvider = createVisionProvider();
  return inspectVideo(video, { visionProvider });
}
