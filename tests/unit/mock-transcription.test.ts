import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { MockTranscriptionProvider } from "@tracelens/providers";

const thisFile = fileURLToPath(import.meta.url);

describe("MockTranscriptionProvider", () => {
  it("is deterministic and offline (no API key required)", async () => {
    const provider = new MockTranscriptionProvider();
    const a = await provider.transcribe({ path: thisFile });
    const b = await provider.transcribe({ path: thisFile });
    expect(a).toEqual(b);
    expect(a.segments.length).toBeGreaterThan(0);
  });

  it("returns no segments for a missing file rather than throwing", async () => {
    const provider = new MockTranscriptionProvider();
    const result = await provider.transcribe({ path: "/definitely/not/a/real/audio.wav" });
    expect(result.segments).toEqual([]);
  });
});
