import { z } from "zod";

/**
 * TraceLens domain model.
 *
 * Everything TraceLens observes -- a frame from an MP4, a browser click, a
 * console error, a terminal command -- is normalized into a TemporalEvent.
 * Evidence is a grounded, artifact-backed observation that supports one or
 * more events. Live sessions and replayed MP4s produce the same shapes so
 * Claude never has to know where an observation originated.
 */

export const SessionModeSchema = z.enum(["live", "replay", "recorded"]);
export type SessionMode = z.infer<typeof SessionModeSchema>;

export const EventTypeSchema = z.enum([
  "visual",
  "audio",
  "interaction",
  "network",
  "console",
  "dom",
  "terminal",
  "git",
  "system",
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const ConfidenceLevelSchema = z.enum([
  "observed",
  "likely",
  "possible",
  "confirmed",
]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const TimeRangeSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
});
export type TimeRange = z.infer<typeof TimeRangeSchema>;

export const EvidenceSourceSchema = z.object({
  kind: z.string(),
  reference: z.string(),
});
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;

export const RepositoryContextSchema = z.object({
  root: z.string(),
  branch: z.string().optional(),
  commit: z.string().optional(),
});
export type RepositoryContext = z.infer<typeof RepositoryContextSchema>;

export const SessionSourceSchema = z.object({
  kind: z.enum(["video", "browser", "terminal", "git", "audio"]),
  reference: z.string(),
});
export type SessionSource = z.infer<typeof SessionSourceSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  mode: SessionModeSchema,
  startedAt: z.string(),
  endedAt: z.string().optional(),
  repository: RepositoryContextSchema.optional(),
  sources: z.array(SessionSourceSchema).default([]),
});
export type Session = z.infer<typeof SessionSchema>;

export const TemporalEventSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  timestamp: TimeRangeSchema,
  type: EventTypeSchema,
  description: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  source: EvidenceSourceSchema,
  relatedEventIds: z.array(z.string()).default([]),
});
export type TemporalEvent = z.infer<typeof TemporalEventSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  eventId: z.string().optional(),
  type: z.string(),
  timestamp: TimeRangeSchema,
  description: z.string(),
  confidence: z.number().min(0).max(1),
  source: EvidenceSourceSchema,
  artifactId: z.string().optional(),
  relatedEvidenceIds: z.array(z.string()).default([]),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const ArtifactKindSchema = z.enum([
  "frame",
  "screenshot",
  "audio-segment",
  "transcript-segment",
  "video-segment",
]);
export type ArtifactKind = z.infer<typeof ArtifactKindSchema>;

export const ArtifactSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  kind: ArtifactKindSchema,
  path: z.string(),
  timestamp: TimeRangeSchema.optional(),
  contentHash: z.string().optional(),
  mimeType: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type Artifact = z.infer<typeof ArtifactSchema>;

export const VideoMetadataSchema = z.object({
  path: z.string(),
  contentHash: z.string(),
  durationSeconds: z.number().nonnegative(),
  fps: z.number().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  hasAudio: z.boolean(),
  codec: z.string().optional(),
  sizeBytes: z.number().nonnegative(),
});
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;

export const TranscriptSegmentSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  timestamp: TimeRangeSchema,
  text: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

/** Confirms an observation is a fact about the world, not an inferred cause. */
export function describeConfidence(level: ConfidenceLevel): string {
  switch (level) {
    case "observed":
      return "Directly observed in evidence.";
    case "confirmed":
      return "Confirmed by test or reproduction.";
    case "likely":
      return "Strongly suggested by correlated evidence.";
    case "possible":
      return "One plausible explanation among others.";
  }
}
