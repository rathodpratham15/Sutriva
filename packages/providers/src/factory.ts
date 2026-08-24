import { getTranscriptionModel, getTranscriptionProviderName, getVisionModel, getVisionProviderName } from "@tracelens/core";
import { MockVisionProvider } from "./mock.js";
import { MockTranscriptionProvider } from "./mock-transcription.js";
import { AnthropicVisionProvider } from "./anthropic.js";
import { ElevenLabsTranscriptionProvider } from "./elevenlabs.js";
import type { TranscriptionProvider, VisionProvider } from "./types.js";

export function createVisionProvider(): VisionProvider {
  const name = getVisionProviderName();
  switch (name) {
    case "anthropic":
      return new AnthropicVisionProvider({ model: getVisionModel() });
    case "mock":
      return new MockVisionProvider();
    default:
      throw new Error(`Unknown TRACELENS_VISION_PROVIDER "${name}". Expected "anthropic" or "mock".`);
  }
}

export function createTranscriptionProvider(): TranscriptionProvider {
  const name = getTranscriptionProviderName();
  switch (name) {
    case "elevenlabs":
      return new ElevenLabsTranscriptionProvider({ model: getTranscriptionModel() });
    case "mock":
      return new MockTranscriptionProvider();
    default:
      throw new Error(`Unknown TRACELENS_TRANSCRIPTION_PROVIDER "${name}". Expected "elevenlabs" or "mock".`);
  }
}
