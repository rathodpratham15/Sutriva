import { statSync } from "node:fs";
import type {
  FrameAnalysisInput,
  FrameAnalysisResult,
  SegmentAnalysisInput,
  SegmentAnalysisResult,
  VisionProvider,
} from "./types.js";

/**
 * Deterministic, offline vision provider. Used as the default so the entire
 * pipeline (metadata -> frames -> timeline -> MCP) is testable without a paid
 * API key. Uses a crude byte-size-delta heuristic as a stand-in for a real
 * scene-change detector -- good enough to prove the pipeline shape, not a
 * claim of real visual understanding.
 */
export class MockVisionProvider implements VisionProvider {
  readonly name = "mock";

  async analyzeFrames(input: FrameAnalysisInput): Promise<FrameAnalysisResult> {
    let previousSize: number | null = null;
    const observations = input.frames.map((frame, index) => {
      const size = safeSize(frame.path);
      let description = `Frame ${index + 1} at t=${frame.timestamp.toFixed(2)}s.`;
      let confidence = 0.5;
      if (previousSize !== null && size !== null) {
        const delta = Math.abs(size - previousSize) / Math.max(previousSize, 1);
        if (delta > 0.15) {
          description += " Possible visual change since previous frame.";
          confidence = 0.6;
        }
      }
      previousSize = size ?? previousSize;
      return { timestamp: frame.timestamp, description, confidence };
    });
    return { observations };
  }

  async analyzeSegment(input: SegmentAnalysisInput): Promise<SegmentAnalysisResult> {
    return {
      summary: `Segment ${input.startSeconds.toFixed(1)}s-${input.endSeconds.toFixed(1)}s spans ${input.frames.length} sampled frame(s).${
        input.question ? ` Question asked: "${input.question}".` : ""
      } (mock provider: no real visual analysis performed)`,
      confidence: 0.3,
    };
  }
}

function safeSize(filePath: string): number | null {
  try {
    return statSync(filePath).size;
  } catch {
    return null;
  }
}
