import { readFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { malformedProviderResponseError, providerNotConfiguredError } from "@sutriva/core";
import type {
  FrameAnalysisInput,
  FrameAnalysisResult,
  SegmentAnalysisInput,
  SegmentAnalysisResult,
  VisionProvider,
} from "./types.js";

const FrameObservationsSchema = z.object({
  observations: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      description: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

const SegmentSummarySchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
});

function mediaTypeFor(filePath: string): "image/png" | "image/jpeg" {
  return path.extname(filePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  return JSON.parse(candidate.trim());
}

/**
 * Vision provider backed by the Anthropic Messages API. Isolated here so
 * core/timeline never depend on the Anthropic SDK directly -- swapping in a
 * different multimodal provider only means adding another file in this
 * package that implements VisionProvider.
 */
export class AnthropicVisionProvider implements VisionProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(options: { model?: string } = {}) {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      throw providerNotConfiguredError("AnthropicVisionProvider", "ANTHROPIC_API_KEY");
    }
    this.client = new Anthropic();
    this.model = options.model ?? process.env.SUTRIVA_VISION_MODEL ?? "claude-opus-5";
  }

  async analyzeFrames(input: FrameAnalysisInput): Promise<FrameAnalysisResult> {
    if (input.frames.length === 0) return { observations: [] };

    const content: Anthropic.MessageParam["content"] = [];
    input.frames.forEach((frame, index) => {
      content.push({
        type: "text",
        text: `Frame index ${index}, timestamp ${frame.timestamp.toFixed(2)}s:`,
      });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaTypeFor(frame.path),
          data: readFileSync(frame.path).toString("base64"),
        },
      });
    });
    content.push({
      type: "text",
      text:
        `You are analyzing frames from a developer screen recording to build a debugging timeline.${
          input.context ? ` Focus: ${input.context}` : ""
        }\n` +
        `For each frame above, describe what is visibly happening in one concise sentence (UI state, errors, ` +
        `visible text, loading states, navigation). Note confidence (0-1) reflecting how certain you are.\n` +
        `Respond with ONLY JSON matching exactly this shape, one entry per frame in order:\n` +
        `{"observations":[{"index":0,"description":"...","confidence":0.8}, ...]}`,
    });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      output_config: { effort: "low" },
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock) {
      throw malformedProviderResponseError(this.name, "no text block in response");
    }
    let parsed: unknown;
    try {
      parsed = extractJson(textBlock.text);
    } catch (err) {
      throw malformedProviderResponseError(this.name, `invalid JSON (${(err as Error).message})`);
    }
    const result = FrameObservationsSchema.safeParse(parsed);
    if (!result.success) {
      throw malformedProviderResponseError(this.name, result.error.message);
    }
    const byIndex = new Map(result.data.observations.map((o): [number, typeof o] => [o.index, o]));
    return {
      observations: input.frames.map((frame, index) => {
        const match = byIndex.get(index);
        return {
          timestamp: frame.timestamp,
          description: match?.description ?? "No description returned by provider.",
          confidence: match?.confidence ?? 0,
        };
      }),
    };
  }

  async analyzeSegment(input: SegmentAnalysisInput): Promise<SegmentAnalysisResult> {
    if (input.frames.length === 0) {
      return { summary: "No frames available for this segment.", confidence: 0 };
    }
    const content: Anthropic.MessageParam["content"] = input.frames.map((frame) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: mediaTypeFor(frame.path),
        data: readFileSync(frame.path).toString("base64"),
      },
    }));
    content.push({
      type: "text",
      text:
        `These are sampled frames from ${input.startSeconds.toFixed(1)}s to ${input.endSeconds.toFixed(1)}s of a ` +
        `developer screen recording.${input.question ? ` Question: ${input.question}` : " Describe what happens across this segment."}\n` +
        `Respond with ONLY JSON: {"summary":"...","confidence":0.8}`,
    });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      output_config: { effort: "medium" },
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock) {
      throw malformedProviderResponseError(this.name, "no text block in response");
    }
    let parsed: unknown;
    try {
      parsed = extractJson(textBlock.text);
    } catch (err) {
      throw malformedProviderResponseError(this.name, `invalid JSON (${(err as Error).message})`);
    }
    const result = SegmentSummarySchema.safeParse(parsed);
    if (!result.success) {
      throw malformedProviderResponseError(this.name, result.error.message);
    }
    return result.data;
  }
}
