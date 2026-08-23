import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { OpenAIWhisperTranscriptionProvider } from "@tracelens/providers";
import { getTranscriptionModel, getTranscriptionProviderName } from "@tracelens/core";

describe("OpenAIWhisperTranscriptionProvider", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  it("throws a clear, actionable error instead of hitting the network when OPENAI_API_KEY is unset", () => {
    expect(() => new OpenAIWhisperTranscriptionProvider()).toThrow(/OPENAI_API_KEY/);
  });

  it("mentions the mock fallback (TRACELENS_TRANSCRIPTION_PROVIDER), not the vision one", () => {
    expect(() => new OpenAIWhisperTranscriptionProvider()).toThrow(/TRACELENS_TRANSCRIPTION_PROVIDER=mock/);
  });
});

describe("transcription provider config resolution", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalOverride = process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
  const originalModel = process.env.TRACELENS_TRANSCRIPTION_MODEL;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalOverride === undefined) delete process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
    else process.env.TRACELENS_TRANSCRIPTION_PROVIDER = originalOverride;
    if (originalModel === undefined) delete process.env.TRACELENS_TRANSCRIPTION_MODEL;
    else process.env.TRACELENS_TRANSCRIPTION_MODEL = originalModel;
  });

  it("defaults to mock when OPENAI_API_KEY is unset", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
    expect(getTranscriptionProviderName()).toBe("mock");
  });

  it("defaults to openai when OPENAI_API_KEY is set", () => {
    delete process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
    process.env.OPENAI_API_KEY = "sk-test";
    expect(getTranscriptionProviderName()).toBe("openai");
  });

  it("an explicit TRACELENS_TRANSCRIPTION_PROVIDER always wins over the OPENAI_API_KEY heuristic", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.TRACELENS_TRANSCRIPTION_PROVIDER = "mock";
    expect(getTranscriptionProviderName()).toBe("mock");
  });

  it("defaults the model to whisper-1", () => {
    delete process.env.TRACELENS_TRANSCRIPTION_MODEL;
    expect(getTranscriptionModel()).toBe("whisper-1");
  });
});
