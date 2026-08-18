import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TraceLensError } from "@tracelens/core";
import { createVisionProvider } from "@tracelens/providers";
import { inspectVideo, getTimeline, getFrame } from "@tracelens/timeline";

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
        const result = await inspectVideo(path, {
          visionProvider,
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
}
