import path from "node:path";
import { readFileSync } from "node:fs";
import { generateId, getArtifactsDir, TraceLensError, type Artifact, type Evidence, type TemporalEvent } from "@tracelens/core";
import { extractFrame, denseSampleAround } from "@tracelens/video";
import type { VisionProvider } from "@tracelens/providers";
import { getStore } from "@tracelens/storage";

const FRAME_REUSE_TOLERANCE_SECONDS = 0.4;

export interface TimelineOptions {
  limit?: number;
  afterSeconds?: number;
  beforeSeconds?: number;
}

export function getTimeline(sessionId: string, options: TimelineOptions = {}): TemporalEvent[] {
  const store = getStore();
  store.getSession(sessionId); // throws SESSION_NOT_FOUND if missing
  return store.listEvents(sessionId, options);
}

export function searchSession(sessionId: string, query: string): TemporalEvent[] {
  const store = getStore();
  store.getSession(sessionId);
  return store.searchEvents(sessionId, query);
}

export function getEvidenceAround(sessionId: string, aroundSeconds: number, windowSeconds: number): Evidence[] {
  const store = getStore();
  store.getSession(sessionId);
  return store.getEvidenceAround(sessionId, aroundSeconds, windowSeconds);
}

function findSessionVideoPath(sessionId: string): string {
  const store = getStore();
  const session = store.getSession(sessionId);
  const videoSource = session.sources.find((s) => s.kind === "video");
  if (!videoSource) {
    throw new TraceLensError(
      "NO_VIDEO_SOURCE",
      `Session "${sessionId}" has no video source.`,
      "get_frame and analyze_segment require a replay session created via inspect_video.",
    );
  }
  return videoSource.reference;
}

export interface FrameResult {
  artifact: Artifact;
  base64: string;
  mimeType: string;
}

/** Returns the frame nearest `timestamp`, reusing a previously extracted artifact when close enough. */
export async function getFrame(sessionId: string, timestamp: number): Promise<FrameResult> {
  const store = getStore();
  store.getSession(sessionId);

  const existing = store.findArtifactNearTimestamp(sessionId, "frame", timestamp);
  if (existing?.timestamp && Math.abs(existing.timestamp.start - timestamp) <= FRAME_REUSE_TOLERANCE_SECONDS) {
    return {
      artifact: existing,
      base64: readFileSync(existing.path).toString("base64"),
      mimeType: existing.mimeType ?? "image/png",
    };
  }

  const videoPath = findSessionVideoPath(sessionId);
  const framePath = path.join(getArtifactsDir(), sessionId, `frame-${timestamp.toFixed(3)}.png`);
  await extractFrame(videoPath, timestamp, framePath);

  const artifact: Artifact = {
    id: generateId("artifact"),
    sessionId,
    kind: "frame",
    path: framePath,
    timestamp: { start: timestamp, end: timestamp },
    mimeType: "image/png",
  };
  store.insertArtifact(artifact);

  return { artifact, base64: readFileSync(framePath).toString("base64"), mimeType: "image/png" };
}

export interface AnalyzeSegmentResult {
  summary: string;
  confidence: number;
  sampledTimestamps: number[];
}

/** Dense, on-demand analysis over a narrow time range -- Level 4 of progressive disclosure. */
export async function analyzeSegment(
  sessionId: string,
  startSeconds: number,
  endSeconds: number,
  visionProvider: VisionProvider,
  question?: string,
): Promise<AnalyzeSegmentResult> {
  const store = getStore();
  store.getSession(sessionId);
  const videoPath = findSessionVideoPath(sessionId);

  const center = (startSeconds + endSeconds) / 2;
  const halfWindow = Math.max(1, (endSeconds - startSeconds) / 2);
  const timestamps = denseSampleAround(center, endSeconds + halfWindow, halfWindow, Math.max(0.5, halfWindow / 6)).filter(
    (t) => t >= startSeconds && t <= endSeconds,
  );

  const sessionArtifactsDir = path.join(getArtifactsDir(), sessionId);
  const frames = await Promise.all(
    timestamps.map(async (ts) => {
      const framePath = path.join(sessionArtifactsDir, `segment-${ts.toFixed(3)}.png`);
      await extractFrame(videoPath, ts, framePath);
      return { timestamp: ts, path: framePath };
    }),
  );

  const result = await visionProvider.analyzeSegment({ frames, startSeconds, endSeconds, question });
  return { ...result, sampledTimestamps: timestamps };
}
