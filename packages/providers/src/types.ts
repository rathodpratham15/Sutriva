/**
 * Provider abstraction. Model-specific code (Anthropic, or any future
 * provider) lives entirely behind these interfaces -- core/timeline/storage
 * never import a provider SDK directly.
 */

export interface FrameInput {
  timestamp: number;
  path: string;
}

export interface FrameObservation {
  timestamp: number;
  description: string;
  confidence: number;
}

export interface FrameAnalysisInput {
  frames: FrameInput[];
  /** Optional hint, e.g. "look for error states or failed network calls". */
  context?: string;
}

export interface FrameAnalysisResult {
  observations: FrameObservation[];
}

export interface SegmentAnalysisInput {
  frames: FrameInput[];
  startSeconds: number;
  endSeconds: number;
  question?: string;
}

export interface SegmentAnalysisResult {
  summary: string;
  confidence: number;
}

export interface VisionProvider {
  readonly name: string;
  analyzeFrames(input: FrameAnalysisInput): Promise<FrameAnalysisResult>;
  analyzeSegment(input: SegmentAnalysisInput): Promise<SegmentAnalysisResult>;
}

export interface AudioInput {
  path: string;
}

export interface TranscriptSegmentResult {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface Transcript {
  segments: TranscriptSegmentResult[];
}

export interface TranscriptionProvider {
  readonly name: string;
  transcribe(input: AudioInput): Promise<Transcript>;
}
