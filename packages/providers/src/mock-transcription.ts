import { statSync } from "node:fs";
import type { AudioInput, Transcript, TranscriptionProvider } from "./types.js";

/**
 * Deterministic, offline transcription provider. Sutriva has no first-party
 * speech-to-text provider yet (see docs/architecture.md) -- this exists so
 * the transcript pipeline (audio extraction -> segments -> timeline events)
 * is exercisable and testable without a paid API, the same way
 * MockVisionProvider stands in for real frame analysis.
 */
export class MockTranscriptionProvider implements TranscriptionProvider {
  readonly name = "mock";

  async transcribe(input: AudioInput): Promise<Transcript> {
    let sizeBytes = 0;
    try {
      sizeBytes = statSync(input.path).size;
    } catch {
      return { segments: [] };
    }
    // No real speech-to-text is performed; segment count is derived from
    // audio file size only as a deterministic stand-in for duration.
    const approxSegments = Math.max(1, Math.min(6, Math.round(sizeBytes / 200_000)));
    const segmentLength = 5;
    return {
      segments: Array.from({ length: approxSegments }, (_, i) => ({
        start: i * segmentLength,
        end: (i + 1) * segmentLength,
        text: "[mock provider: no real transcription performed]",
        confidence: 0,
      })),
    };
  }
}
