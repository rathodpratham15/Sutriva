import { describe, it, expect } from "vitest";
import { sampleTimestamps, denseSampleAround } from "@tracelens/video";

describe("sampleTimestamps", () => {
  it("bounds the number of samples for long videos", () => {
    const timestamps = sampleTimestamps(600, { intervalSeconds: 2, maxFrames: 24 });
    expect(timestamps.length).toBeLessThanOrEqual(24);
  });

  it("always includes the final timestamp", () => {
    const timestamps = sampleTimestamps(12.5, { intervalSeconds: 2 });
    expect(timestamps[timestamps.length - 1]).toBeCloseTo(12.5, 3);
  });

  it("returns a single sample for a zero-duration video", () => {
    expect(sampleTimestamps(0)).toEqual([0]);
  });
});

describe("denseSampleAround", () => {
  it("stays within the video duration", () => {
    const timestamps = denseSampleAround(1, 10, 5, 1);
    expect(Math.min(...timestamps)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...timestamps)).toBeLessThanOrEqual(10);
  });
});
