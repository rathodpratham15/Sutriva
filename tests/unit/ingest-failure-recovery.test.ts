import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { inspectVideo } from "@tracelens/timeline";
import { getStore } from "@tracelens/storage";
import { MockVisionProvider } from "@tracelens/providers";
import type { FrameAnalysisInput, FrameAnalysisResult, VisionProvider } from "@tracelens/providers";

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleVideo = path.resolve(here, "../../fixtures/videos/sample.mp4");

class ThrowingVisionProvider implements VisionProvider {
  readonly name = "throwing";
  async analyzeFrames(_input: FrameAnalysisInput): Promise<FrameAnalysisResult> {
    throw new Error("simulated provider failure");
  }
  async analyzeSegment(): Promise<never> {
    throw new Error("simulated provider failure");
  }
}

describe("inspectVideo failure recovery", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), "tracelens-ingest-failure-"));
    process.env.TRACELENS_DATA_DIR = dataDir;
  });

  afterEach(() => {
    delete process.env.TRACELENS_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("does not permanently cache an empty session when ingestion fails mid-way", async () => {
    await expect(inspectVideo(sampleVideo, { visionProvider: new ThrowingVisionProvider() })).rejects.toThrow(
      "simulated provider failure",
    );

    const store = getStore();
    // The file's content hash must not be linked to a (broken, eventless) session --
    // otherwise every future inspect_video call on this file would silently reuse it.
    const metadata = await import("@tracelens/video").then((m) => m.readVideoMetadata(sampleVideo));
    expect(store.findSessionIdByContentHash(metadata.contentHash)).toBeUndefined();

    // A subsequent call with a working provider should ingest fresh, not reuse anything broken.
    const result = await inspectVideo(sampleVideo, { visionProvider: new MockVisionProvider() });
    expect(result.reused).toBe(false);
    expect(result.eventCount).toBeGreaterThan(0);
  }, 20_000);
});
