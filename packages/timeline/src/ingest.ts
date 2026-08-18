import path from "node:path";
import { mkdirSync } from "node:fs";
import {
  generateId,
  getArtifactsDir,
  resolveExistingFile,
  type Artifact,
  type Evidence,
  type Session,
  type TemporalEvent,
  type VideoMetadata,
} from "@tracelens/core";
import { extractFrame, readVideoMetadata, sampleTimestamps, type SamplingOptions } from "@tracelens/video";
import type { VisionProvider } from "@tracelens/providers";
import { getStore } from "@tracelens/storage";

export interface InspectVideoOptions extends SamplingOptions {
  visionProvider: VisionProvider;
  /** Optional hint passed to the vision provider, e.g. "look for errors". */
  focus?: string;
}

export interface InspectVideoResult {
  session: Session;
  metadata: VideoMetadata;
  eventCount: number;
  /** True when this video was already inspected (session/timeline reused from cache). */
  reused: boolean;
}

/**
 * MP4 -> metadata -> sampled frames -> vision provider -> timeline.
 * Sessions are keyed by content hash: re-inspecting an unchanged file reuses
 * the persisted session and events instead of re-running the vision provider.
 */
export async function inspectVideo(filePath: string, options: InspectVideoOptions): Promise<InspectVideoResult> {
  const resolvedPath = resolveExistingFile(filePath);
  const metadata = await readVideoMetadata(resolvedPath);
  const store = getStore();

  const existingSessionId = store.findSessionIdByContentHash(metadata.contentHash);
  if (existingSessionId) {
    const session = store.getSession(existingSessionId);
    const eventCount = store.listEvents(existingSessionId).length;
    return { session, metadata, eventCount, reused: true };
  }

  const session: Session = {
    id: generateId("session"),
    mode: "replay",
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    sources: [{ kind: "video", reference: resolvedPath }],
  };
  store.createSession(session);
  store.linkContentHashToSession(metadata.contentHash, session.id);

  const sessionArtifactsDir = path.join(getArtifactsDir(), session.id);
  mkdirSync(sessionArtifactsDir, { recursive: true });

  const timestamps = sampleTimestamps(metadata.durationSeconds, options);
  const framePaths = await Promise.all(
    timestamps.map(async (ts) => {
      const framePath = path.join(sessionArtifactsDir, `frame-${ts.toFixed(3)}.png`);
      await extractFrame(resolvedPath, ts, framePath);
      return { timestamp: ts, path: framePath };
    }),
  );

  const analysis = await options.visionProvider.analyzeFrames({ frames: framePaths, context: options.focus });

  const artifacts: Artifact[] = framePaths.map(({ timestamp, path: framePath }) => ({
    id: generateId("artifact"),
    sessionId: session.id,
    kind: "frame",
    path: framePath,
    timestamp: { start: timestamp, end: timestamp },
    mimeType: "image/png",
  }));
  artifacts.forEach((artifact) => store.insertArtifact(artifact));

  const events: TemporalEvent[] = analysis.observations.map((obs, index) => ({
    id: generateId("event"),
    sessionId: session.id,
    timestamp: { start: obs.timestamp, end: obs.timestamp },
    type: "visual",
    description: obs.description,
    confidence: obs.confidence,
    source: { kind: "frame", reference: artifacts[index]?.id ?? "" },
    relatedEventIds: [],
  }));
  store.insertEvents(events);

  const evidence: (Evidence & { sessionId: string })[] = events.map((event, index) => ({
    id: generateId("evidence"),
    eventId: event.id,
    sessionId: session.id,
    type: "frame",
    timestamp: event.timestamp,
    description: event.description,
    confidence: event.confidence ?? 0,
    source: event.source,
    artifactId: artifacts[index]?.id,
    relatedEvidenceIds: [],
  }));
  store.insertEvidenceBatch(evidence);

  return { session, metadata, eventCount: events.length, reused: false };
}
