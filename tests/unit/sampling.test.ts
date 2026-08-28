import { describe, it, expect } from "vitest";
import { sampleTimestamps, denseSampleAround } from "@sutriva/video";

describe("sampleTimestamps", () => {
  it("bounds the number of samples for long videos", () => {
    const timestamps = sampleTimestamps(600, { intervalSeconds: 2, maxFrames: 24 });
    expect(timestamps.length).toBeLessThanOrEqual(24);
  });

  it("includes a final timestamp close to (but strictly before) the duration", () => {
    const timestamps = sampleTimestamps(12.5, { intervalSeconds: 2 });
    const lastTimestamp = timestamps[timestamps.length - 1]!;
    expect(lastTimestamp).toBeLessThan(12.5);
    expect(lastTimestamp).toBeGreaterThan(12.3);
  });

  it("returns a single sample for a zero-duration video", () => {
    expect(sampleTimestamps(0)).toEqual([0]);
  });

  it("never samples at or past the video's exact duration (ffmpeg yields no frame there)", () => {
    for (const duration of [1, 5, 12.5, 20.051667, 600]) {
      const timestamps = sampleTimestamps(duration);
      for (const t of timestamps) {
        expect(t).toBeLessThan(duration);
      }
    }
  });

  it("produces no duplicate timestamps even after end-of-video clamping", () => {
    const timestamps = sampleTimestamps(1.05, { intervalSeconds: 0.3 });
    expect(new Set(timestamps).size).toBe(timestamps.length);
  });
});

describe("denseSampleAround", () => {
  it("stays within the video duration", () => {
    const timestamps = denseSampleAround(1, 10, 5, 1);
    expect(Math.min(...timestamps)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...timestamps)).toBeLessThanOrEqual(10);
  });
});
