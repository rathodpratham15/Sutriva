import { createReadStream } from "node:fs";
import OpenAI from "openai";
import { malformedProviderResponseError, providerNotConfiguredError } from "@tracelens/core";
import type { AudioInput, Transcript, TranscriptionProvider } from "./types.js";

interface WhisperVerboseSegment {
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
}

interface WhisperVerboseResponse {
  segments?: WhisperVerboseSegment[];
}

/**
 * Transcription provider backed by OpenAI's Whisper API. Isolated here so
 * core/timeline never depend on the OpenAI SDK directly -- same pattern as
 * AnthropicVisionProvider (packages/providers/src/anthropic.ts).
 *
 * `whisper-1` (not a newer gpt-4o-transcribe model) is used deliberately:
 * it's the model that reliably supports `response_format: "verbose_json"`
 * with per-segment start/end timestamps, which is what the timeline needs --
 * a plain transcript string with no timing would be useless for temporal
 * rewind.
 */
export class OpenAIWhisperTranscriptionProvider implements TranscriptionProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(options: { model?: string } = {}) {
    if (!process.env.OPENAI_API_KEY) {
      throw providerNotConfiguredError("OpenAIWhisperTranscriptionProvider", "OPENAI_API_KEY", "TRACELENS_TRANSCRIPTION_PROVIDER");
    }
    this.client = new OpenAI();
    this.model = options.model ?? process.env.TRACELENS_TRANSCRIPTION_MODEL ?? "whisper-1";
  }

  async transcribe(input: AudioInput): Promise<Transcript> {
    const response = (await this.client.audio.transcriptions.create({
      file: createReadStream(input.path),
      model: this.model,
      response_format: "verbose_json",
    })) as WhisperVerboseResponse;

    if (!Array.isArray(response.segments)) {
      throw malformedProviderResponseError(this.name, "response had no \"segments\" array (response_format must be verbose_json)");
    }

    return {
      segments: response.segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
        // avg_logprob is a per-token log-probability (negative, closer to 0 is
        // more confident) -- not a 0-1 probability. Clamp a rough conversion
        // rather than pass through a raw log value where a 0-1 confidence is
        // expected everywhere else in TraceLens.
        confidence: seg.avg_logprob === undefined ? undefined : Math.max(0, Math.min(1, 1 + seg.avg_logprob)),
      })),
    };
  }
}
