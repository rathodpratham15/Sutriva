import { createTranscriptionProvider, createVisionProvider } from "@sutriva/providers";
import { inspectVideo, type InspectVideoResult } from "@sutriva/timeline";

/** Ensures a video has been inspected (cheap no-op if the content hash is already cached) and returns its session. */
export async function resolveVideoSession(video: string): Promise<InspectVideoResult> {
  const visionProvider = createVisionProvider();
  const transcriptionProvider = createTranscriptionProvider();
  return inspectVideo(video, { visionProvider, transcriptionProvider });
}
