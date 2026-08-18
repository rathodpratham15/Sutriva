import { describe, it, expect } from "vitest";
import path from "node:path";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { readVideoMetadata, extractFrame } from "@tracelens/video";

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleVideo = path.resolve(here, "../../fixtures/videos/sample.mp4");

describe("video metadata + frame extraction", () => {
  it("reads deterministic metadata from the sample fixture", async () => {
    const metadata = await readVideoMetadata(sampleVideo);
    expect(metadata.durationSeconds).toBeCloseTo(12, 0);
    expect(metadata.width).toBe(640);
    expect(metadata.height).toBe(360);
    expect(metadata.hasAudio).toBe(true);
    expect(metadata.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces the same content hash for the same file", async () => {
    const a = await readVideoMetadata(sampleVideo);
    const b = await readVideoMetadata(sampleVideo);
    expect(a.contentHash).toBe(b.contentHash);
  });

  it("extracts a frame to disk at a given timestamp", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "tracelens-frame-test-"));
    try {
      const framePath = path.join(dir, "frame.png");
      await extractFrame(sampleVideo, 3, framePath);
      expect(existsSync(framePath)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
