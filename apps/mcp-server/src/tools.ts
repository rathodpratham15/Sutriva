import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TraceLensError } from "@tracelens/core";
import { createTranscriptionProvider, createVisionProvider } from "@tracelens/providers";
import {
  inspectVideo,
  getTimeline,
  getFrame,
  getEvidenceAround,
  searchSession,
  analyzeSegment,
  getTranscript,
  getCurrentContext,
} from "@tracelens/timeline";
import { getGitContext } from "@tracelens/git";
import { getStore } from "@tracelens/storage";

/**
 * Capability flags for inspect_environment. `available` means the capability exists
 * at all (a session must still be live for browser/network/console to have data --
 * see get_current_context / the liveSession field). Terminal capture isn't built yet
 * (Phase 4). Kept explicit so Claude never assumes silence means "nothing happening".
 */
const ENVIRONMENT_SOURCE_CAPABILITIES = {
  browser: { available: true, note: "Populated only while a live session is running -- see get_current_context." },
  network: { available: true, note: "Populated only while a live session is running -- see get_current_context." },
  console: { available: true, note: "Populated only while a live session is running -- see get_current_context." },
  terminal: { available: false, reason: "Terminal command instrumentation lands in a later phase (Phase 4)." },
} as const;

function textResult(payload: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

function errorResult(err: unknown): CallToolResult {
  if (err instanceof TraceLensError) {
    return { content: [{ type: "text", text: `${err.code}: ${err.message}` }], isError: true };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text", text: `UNEXPECTED_ERROR: ${message}` }], isError: true };
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "inspect_video",
    {
      title: "Inspect video",
      description:
        "Ingests a local MP4 (or other ffmpeg-readable video) into a TraceLens session: extracts metadata, " +
        "samples frames, runs vision analysis, and builds a timeline. Returns session metadata and an event count " +
        "-- call get_timeline next to see what happened, rather than requesting raw video data. Re-inspecting an " +
        "unchanged file (by content hash) reuses the existing session instead of re-analyzing.",
      inputSchema: {
        path: z.string().describe("Absolute or relative path to the video file on disk."),
        focus: z
          .string()
          .optional()
          .describe('Optional hint for the vision provider, e.g. "look for error states or failed network calls".'),
        maxFrames: z.number().int().positive().max(60).optional().describe("Cap on sampled frames (default 24)."),
        intervalSeconds: z.number().positive().optional().describe("Target seconds between sampled frames (default 2)."),
      },
    },
    async ({ path, focus, maxFrames, intervalSeconds }) => {
      try {
        const visionProvider = createVisionProvider();
        const transcriptionProvider = createTranscriptionProvider();
        const result = await inspectVideo(path, {
          visionProvider,
          transcriptionProvider,
          focus,
          maxFrames,
          intervalSeconds,
        });
        return textResult({
          sessionId: result.session.id,
          mode: result.session.mode,
          reused: result.reused,
          eventCount: result.eventCount,
          visionProvider: visionProvider.name,
          metadata: {
            durationSeconds: result.metadata.durationSeconds,
            fps: result.metadata.fps,
            width: result.metadata.width,
            height: result.metadata.height,
            hasAudio: result.metadata.hasAudio,
            contentHash: result.metadata.contentHash,
          },
          nextStep: "Call get_timeline with this sessionId to see the temporal event timeline.",
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_timeline",
    {
      title: "Get timeline",
      description:
        "Returns the compact temporal event timeline for a session created by inspect_video. Each event has a " +
        "timestamp, type, description, and confidence. Use afterSeconds/beforeSeconds/limit to bound the result " +
        "instead of requesting the whole session at once.",
      inputSchema: {
        sessionId: z.string(),
        limit: z.number().int().positive().max(200).optional().describe("Max events to return (default 50)."),
        afterSeconds: z.number().nonnegative().optional(),
        beforeSeconds: z.number().nonnegative().optional(),
      },
    },
    async ({ sessionId, limit, afterSeconds, beforeSeconds }) => {
      try {
        const events = getTimeline(sessionId, { limit: limit ?? 50, afterSeconds, beforeSeconds });
        return textResult({
          sessionId,
          count: events.length,
          events: events.map((e) => ({
            id: e.id,
            start: e.timestamp.start,
            end: e.timestamp.end,
            type: e.type,
            description: e.description,
            confidence: e.confidence,
          })),
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_frame",
    {
      title: "Get frame",
      description:
        "Retrieves a single targeted video frame near a given timestamp as an image, so Claude can visually " +
        "inspect a moment identified in the timeline. Prefer this over inspect_video for follow-up visual " +
        "questions -- it does not re-analyze the whole video.",
      inputSchema: {
        sessionId: z.string(),
        timestamp: z.number().nonnegative().describe("Seconds into the video."),
      },
    },
    async ({ sessionId, timestamp }) => {
      try {
        const frame = await getFrame(sessionId, timestamp);
        return {
          content: [
            { type: "image", data: frame.base64, mimeType: frame.mimeType },
            { type: "text", text: `Frame near t=${timestamp.toFixed(2)}s (artifact ${frame.artifact.id}).` },
          ],
        };
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "search_session",
    {
      title: "Search session",
      description:
        "Full-text search over a session's timeline descriptions. Use this to jump straight to a moment " +
        '(e.g. "error", "checkout", "500") instead of scanning the whole get_timeline output.',
      inputSchema: {
        sessionId: z.string(),
        query: z.string().describe("Text to search for in event descriptions."),
      },
    },
    async ({ sessionId, query }) => {
      try {
        const events = searchSession(sessionId, query);
        return textResult({
          sessionId,
          query,
          count: events.length,
          events: events.map((e) => ({
            id: e.id,
            start: e.timestamp.start,
            end: e.timestamp.end,
            type: e.type,
            description: e.description,
            confidence: e.confidence,
          })),
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_evidence",
    {
      title: "Get evidence",
      description:
        "Temporal rewind: returns evidence within a time window around a timestamp, so Claude can answer " +
        '"what happened immediately before/after this?" Each evidence item has a confidence and a source ' +
        "reference (a frame artifact or a transcript segment) -- treat confidence as observed/likely/possible, " +
        "not as proof of causality.",
      inputSchema: {
        sessionId: z.string(),
        aroundSeconds: z.number().nonnegative().describe("Center of the time window, in seconds."),
        windowSeconds: z.number().positive().max(120).default(5).describe("Half-width of the window, in seconds."),
      },
    },
    async ({ sessionId, aroundSeconds, windowSeconds }) => {
      try {
        const evidence = getEvidenceAround(sessionId, aroundSeconds, windowSeconds);
        return textResult({
          sessionId,
          aroundSeconds,
          windowSeconds,
          count: evidence.length,
          evidence: evidence.map((e) => ({
            id: e.id,
            start: e.timestamp.start,
            end: e.timestamp.end,
            type: e.type,
            description: e.description,
            confidence: e.confidence,
            source: e.source,
          })),
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "analyze_segment",
    {
      title: "Analyze segment",
      description:
        "Dense, on-demand analysis over a narrow time range: densely re-samples frames in [startSeconds, " +
        "endSeconds] and asks the vision provider a specific question. Use this when get_timeline's coarse " +
        "sampling isn't enough detail for a specific moment -- it is more expensive than get_timeline/get_frame, " +
        "so scope the range as narrowly as possible.",
      inputSchema: {
        sessionId: z.string(),
        startSeconds: z.number().nonnegative(),
        endSeconds: z.number().nonnegative(),
        question: z.string().optional().describe('e.g. "what changed in the UI here?"'),
      },
    },
    async ({ sessionId, startSeconds, endSeconds, question }) => {
      try {
        const visionProvider = createVisionProvider();
        const result = await analyzeSegment(sessionId, startSeconds, endSeconds, visionProvider, question);
        return textResult({
          sessionId,
          startSeconds,
          endSeconds,
          visionProvider: visionProvider.name,
          sampledFrameCount: result.sampledTimestamps.length,
          summary: result.summary,
          confidence: result.confidence,
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_transcript",
    {
      title: "Get transcript",
      description:
        "Returns the audio transcript segments for a session, if the video had an audio track and a " +
        "transcription provider was configured. Empty if the video is silent or no provider was available.",
      inputSchema: {
        sessionId: z.string(),
      },
    },
    async ({ sessionId }) => {
      try {
        const segments = getTranscript(sessionId);
        return textResult({
          sessionId,
          count: segments.length,
          segments: segments.map((s) => ({
            start: s.timestamp.start,
            end: s.timestamp.end,
            text: s.text,
            confidence: s.confidence,
          })),
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "inspect_environment",
    {
      title: "Inspect environment",
      description:
        "Returns available developer context beyond the video itself: current Git branch/commit/working-tree " +
        "status/recent commits (for correlating a failure with recently-changed source), whether a live " +
        "debugging session is currently running, and capability flags for browser/network/console/terminal " +
        "context. Use this before forming a hypothesis about root cause, and never assume a source is present " +
        "if it isn't listed as available here.",
      inputSchema: {
        root: z.string().optional().describe("Repository root to inspect (defaults to the server's working directory)."),
      },
    },
    async ({ root }) => {
      try {
        const git = await getGitContext(root ?? process.cwd());
        const activeLiveSession = getStore().findActiveLiveSession();
        return textResult({
          git,
          liveSession: activeLiveSession
            ? { active: true, sessionId: activeLiveSession.id }
            : { active: false, note: "Start one with `tracelens debug --live` to get live browser/network/console context." },
          ...ENVIRONMENT_SOURCE_CAPABILITIES,
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_current_context",
    {
      title: "Get current context",
      description:
        "The 'look at this' / 'what just happened?' snapshot for a live debugging session: current screenshot, " +
        "current URL, recent events, recent console errors, recent network failures, and live Git state. Defaults " +
        "to whichever live session is currently running if sessionId is omitted. Small and bounded by design -- " +
        "for full history use get_timeline/get_evidence instead.",
      inputSchema: {
        sessionId: z.string().optional().describe("Defaults to the currently active live session, if any."),
      },
    },
    async ({ sessionId }) => {
      try {
        const context = await getCurrentContext(sessionId);
        const content: CallToolResult["content"] = [
          {
            type: "text",
            text: JSON.stringify(
              {
                sessionId: context.sessionId,
                mode: context.mode,
                currentUrl: context.currentUrl,
                recentEvents: context.recentEvents,
                recentConsoleErrors: context.recentConsoleErrors,
                recentNetworkFailures: context.recentNetworkFailures,
                git: context.git,
              },
              null,
              2,
            ),
          },
        ];
        if (context.screenshot) {
          content.push({ type: "image", data: context.screenshot.base64, mimeType: context.screenshot.mimeType });
        }
        return { content };
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
