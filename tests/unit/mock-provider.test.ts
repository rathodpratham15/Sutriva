import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { MockVisionProvider } from "@tracelens/providers";

const thisFile = fileURLToPath(import.meta.url);

describe("MockVisionProvider", () => {
  it("is deterministic and offline (no API key required)", async () => {
    const provider = new MockVisionProvider();
    const input = { frames: [{ timestamp: 0, path: thisFile }] };
    const a = await provider.analyzeFrames(input);
    const b = await provider.analyzeFrames(input);
    expect(a).toEqual(b);
  });

  it("returns one observation per frame, in order", async () => {
    const provider = new MockVisionProvider();
    const result = await provider.analyzeFrames({
      frames: [
        { timestamp: 0, path: thisFile },
        { timestamp: 1, path: thisFile },
      ],
    });
    expect(result.observations).toHaveLength(2);
    expect(result.observations[0]?.timestamp).toBe(0);
    expect(result.observations[1]?.timestamp).toBe(1);
  });
});
