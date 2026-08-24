import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ElevenLabsTranscriptionProvider, groupWordsIntoSegments } from "@tracelens/providers";
import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { getTranscriptionModel, getTranscriptionProviderName } from "@tracelens/core";

function word(
  text: string,
  start: number,
  end: number,
  overrides: Partial<ElevenLabs.SpeechToTextWordResponseModel> = {},
): ElevenLabs.SpeechToTextWordResponseModel {
  return { text, start, end, type: "word", logprob: -0.1, ...overrides };
}

describe("ElevenLabsTranscriptionProvider", () => {
  const originalKey = process.env.ELEVENLABS_API_KEY;

  beforeEach(() => {
    delete process.env.ELEVENLABS_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = originalKey;
  });

  it("throws a clear, actionable error instead of hitting the network when ELEVENLABS_API_KEY is unset", () => {
    expect(() => new ElevenLabsTranscriptionProvider()).toThrow(/ELEVENLABS_API_KEY/);
  });

  it("mentions the mock fallback (TRACELENS_TRANSCRIPTION_PROVIDER), not the vision one", () => {
    expect(() => new ElevenLabsTranscriptionProvider()).toThrow(/TRACELENS_TRANSCRIPTION_PROVIDER=mock/);
  });
});

describe("transcription provider config resolution", () => {
  const originalKey = process.env.ELEVENLABS_API_KEY;
  const originalOverride = process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
  const originalModel = process.env.TRACELENS_TRANSCRIPTION_MODEL;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = originalKey;
    if (originalOverride === undefined) delete process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
    else process.env.TRACELENS_TRANSCRIPTION_PROVIDER = originalOverride;
    if (originalModel === undefined) delete process.env.TRACELENS_TRANSCRIPTION_MODEL;
    else process.env.TRACELENS_TRANSCRIPTION_MODEL = originalModel;
  });

  it("defaults to mock when ELEVENLABS_API_KEY is unset", () => {
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
    expect(getTranscriptionProviderName()).toBe("mock");
  });

  it("defaults to elevenlabs when ELEVENLABS_API_KEY is set", () => {
    delete process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
    process.env.ELEVENLABS_API_KEY = "el-test";
    expect(getTranscriptionProviderName()).toBe("elevenlabs");
  });

  it("an explicit TRACELENS_TRANSCRIPTION_PROVIDER always wins over the ELEVENLABS_API_KEY heuristic", () => {
    process.env.ELEVENLABS_API_KEY = "el-test";
    process.env.TRACELENS_TRANSCRIPTION_PROVIDER = "mock";
    expect(getTranscriptionProviderName()).toBe("mock");
  });

  it("defaults the model to scribe_v1", () => {
    delete process.env.TRACELENS_TRANSCRIPTION_MODEL;
    expect(getTranscriptionModel()).toBe("scribe_v1");
  });
});

describe("groupWordsIntoSegments", () => {
  it("breaks a segment at sentence-ending punctuation", () => {
    const segments = groupWordsIntoSegments([
      word("Hello", 0, 0.3),
      word("world.", 0.3, 0.6),
      word("Second", 0.7, 1.0),
      word("sentence.", 1.0, 1.3),
    ]);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ start: 0, end: 0.6, text: "Hello world." });
    expect(segments[1]).toMatchObject({ start: 0.7, end: 1.3, text: "Second sentence." });
  });

  it("breaks a segment on a long pause even without punctuation", () => {
    const segments = groupWordsIntoSegments([word("um", 0, 0.2), word("later", 5, 5.3)]);
    expect(segments).toHaveLength(2);
  });

  it("skips spacing tokens and keeps audio events", () => {
    const segments = groupWordsIntoSegments([
      word("Hello", 0, 0.3),
      word(" ", 0.3, 0.3, { type: "spacing" }),
      word("(laughter)", 0.3, 0.8, { type: "audio_event" }),
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.text).toBe("Hello (laughter)");
  });

  it("drops words with no timing instead of throwing", () => {
    const segments = groupWordsIntoSegments([word("untimed", undefined as unknown as number, undefined as unknown as number)]);
    expect(segments).toHaveLength(0);
  });

  it("converts logprob into a 0-1 confidence", () => {
    const segments = groupWordsIntoSegments([word("hi.", 0, 0.2, { logprob: -0.05 })]);
    expect(segments[0]?.confidence).toBeCloseTo(0.95, 5);
  });
});
