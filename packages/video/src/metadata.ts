import { statSync } from "node:fs";
import type { VideoMetadata } from "@sutriva/core";
import { probeRaw, toVideoInfo } from "./ffmpeg.js";
import { contentHash } from "./hash.js";

export async function readVideoMetadata(filePath: string): Promise<VideoMetadata> {
  const [probe, hash] = await Promise.all([probeRaw(filePath), contentHash(filePath)]);
  const info = toVideoInfo(probe, filePath);
  const size = statSync(filePath).size;
  return {
    path: filePath,
    contentHash: hash,
    durationSeconds: info.durationSeconds,
    fps: info.fps,
    width: info.width,
    height: info.height,
    hasAudio: info.hasAudio,
    codec: info.codec,
    sizeBytes: size,
  };
}
