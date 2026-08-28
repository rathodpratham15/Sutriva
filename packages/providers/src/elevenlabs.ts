import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { malformedProviderResponseError, providerNotConfiguredError } from "@sutriva/core";
import type { AudioInput, Transcript, TranscriptSegmentResult, TranscriptionProvider } from "./types.js";

type TimedWord = ElevenLabs.SpeechToTextWordResponseModel & { start: number; end: number };

// Caption-style grouping heuristic, since ElevenLabs returns word-level
// timestamps only, not segments: break on sentence-ending punctuation, a
// pause between words, or a segment growing too long -- whichever comes
// first. Not linguistically perfect, but good enough for temporal rewind
// (which needs a start/end/text triple, not a perfectly punctuated caption).
const MAX_SEGMENT_SECONDS = 8;
const MAX_SEGMENT_WORDS = 20;
const PAUSE_BREAK_SECONDS = 1.5;

export function groupWordsIntoSegments(words: ElevenLabs.SpeechToTextWordResponseModel[]): TranscriptSegmentResult[] {
  const spoken = words.filter(
    (w): w is TimedWord => (w.type === "word" || w.type === "audio_event") && w.start !== undefined && w.end !== undefined,
  );

  const segments: TranscriptSegmentResult[] = [];
  let current: TimedWord[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const avgLogprob = current.reduce((sum, w) => sum + w.logprob, 0) / current.length;
    segments.push({
      start: current[0]!.start,
      end: current[current.length - 1]!.end,
      text: current
        .map((w) => w.text)
        .join(" ")
        .replace(/\s+([.,!?;:])/g, "$1"),
      // logprob is in (-Infinity, 0], not a 0-1 probability -- clamp a rough
      // conversion, same convention used everywhere else confidence is derived
      // from a non-probability provider signal.
      confidence: Math.max(0, Math.min(1, 1 + avgLogprob)),
    });
    current = [];
  };

  for (const word of spoken) {
    const prev = current[current.length - 1];
    const pauseBreak = prev !== undefined && word.start - prev.end > PAUSE_BREAK_SECONDS;
    const durationBreak = current.length > 0 && word.end - current[0]!.start > MAX_SEGMENT_SECONDS;
    const countBreak = current.length >= MAX_SEGMENT_WORDS;
    if (pauseBreak || durationBreak || countBreak) flush();
    current.push(word);
    if (/[.!?]$/.test(word.text)) flush();
  }
  flush();

  return segments;
}

/**
 * Transcription provider backed by ElevenLabs' Speech-to-Text (Scribe) API.
 * Isolated here so core/timeline never depend on the ElevenLabs SDK directly --
 * same pattern as AnthropicVisionProvider (packages/providers/src/anthropic.ts).
 */
export class ElevenLabsTranscriptionProvider implements TranscriptionProvider {
  readonly name = "elevenlabs";
  private client: ElevenLabsClient;
  private model: string;

  constructor(options: { model?: string } = {}) {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw providerNotConfiguredError("ElevenLabsTranscriptionProvider", "ELEVENLABS_API_KEY", "SUTRIVA_TRANSCRIPTION_PROVIDER");
    }
    this.client = new ElevenLabsClient();
    this.model = options.model ?? process.env.SUTRIVA_TRANSCRIPTION_MODEL ?? "scribe_v1";
  }

  async transcribe(input: AudioInput): Promise<Transcript> {
    const response = await this.client.speechToText.convert({
      modelId: this.model as ElevenLabs.SpeechToTextConvertRequestModelId,
      file: { path: input.path },
    });

    if (!("words" in response) || !Array.isArray(response.words)) {
      throw malformedProviderResponseError(
        this.name,
        'response had no "words" array -- multichannel and webhook response shapes are not supported',
      );
    }

    return { segments: groupWordsIntoSegments(response.words) };
  }
}
