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
  type TranscriptSegment,
  type VideoMetadata,
} from "@sutriva/core";
import { extractAudio, extractFrame, readVideoMetadata, sampleTimestamps, type SamplingOptions } from "@sutriva/video";
import type { TranscriptionProvider, VisionProvider } from "@sutriva/providers";
import { getStore } from "@sutriva/storage";

export interface InspectVideoOptions extends SamplingOptions {
  visionProvider: VisionProvider;
  /** Optional hint passed to the vision provider, e.g. "look for errors". */
  focus?: string;
  /** When provided and the video has an audio track, transcribes it into the timeline. */
  transcriptionProvider?: TranscriptionProvider;
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

  // The content hash is only linked to this session once ingestion fully
  // succeeds. Otherwise a transient failure (e.g. a frame-extraction edge
  // case, or a provider timeout) would permanently cache an empty session
  // against this file's hash, and every future inspect_video call would
  // silently "succeed" by reusing that broken, eventless session forever.
  try {
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

    let audioEventCount = 0;
    if (metadata.hasAudio && options.transcriptionProvider) {
      audioEventCount = await transcribeSession(session.id, resolvedPath, sessionArtifactsDir, options.transcriptionProvider);
    }

    store.linkContentHashToSession(metadata.contentHash, session.id);
    return { session, metadata, eventCount: events.length + audioEventCount, reused: false };
  } catch (err) {
    // Best-effort cleanup: cascades to the session's events/evidence/artifacts
    // rows (see the ON DELETE CASCADE foreign keys in packages/storage/src/db.ts).
    // Already-extracted frame files on disk are left for `sutriva clean`.
    store.deleteSession(session.id);
    throw err;
  }
}

/** Extracts the audio track once and turns transcript segments into timeline events, alongside get_transcript's raw segments. */
async function transcribeSession(
  sessionId: string,
  videoPath: string,
  sessionArtifactsDir: string,
  transcriptionProvider: TranscriptionProvider,
): Promise<number> {
  const store = getStore();
  const audioPath = path.join(sessionArtifactsDir, "audio.wav");
  await extractAudio(videoPath, audioPath);

  const audioArtifact: Artifact = {
    id: generateId("artifact"),
    sessionId,
    kind: "audio-segment",
    path: audioPath,
    mimeType: "audio/wav",
  };
  store.insertArtifact(audioArtifact);

  const transcript = await transcriptionProvider.transcribe({ path: audioPath });
  if (transcript.segments.length === 0) return 0;

  const segments: TranscriptSegment[] = transcript.segments.map((seg) => ({
    id: generateId("transcript"),
    sessionId,
    timestamp: { start: seg.start, end: seg.end },
    text: seg.text,
    confidence: seg.confidence,
  }));
  store.insertTranscriptSegments(segments);

  const events: TemporalEvent[] = segments.map((seg) => ({
    id: generateId("event"),
    sessionId,
    timestamp: seg.timestamp,
    type: "audio",
    description: seg.text,
    confidence: seg.confidence,
    source: { kind: "audio", reference: audioArtifact.id },
    relatedEventIds: [],
  }));
  store.insertEvents(events);

  const evidence: (Evidence & { sessionId: string })[] = events.map((event) => ({
    id: generateId("evidence"),
    eventId: event.id,
    sessionId,
    type: "transcript",
    timestamp: event.timestamp,
    description: event.description,
    confidence: event.confidence ?? 0,
    source: event.source,
    artifactId: audioArtifact.id,
    relatedEvidenceIds: [],
  }));
  store.insertEvidenceBatch(evidence);

  return events.length;
}
