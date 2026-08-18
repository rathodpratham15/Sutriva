# Architecture

This describes the system as implemented (Phase 0 + Phase 1). For the full target architecture see `TraceLens_Master_Plan.md`.

## The temporal model

Everything TraceLens observes is normalized into two shapes, defined once in `packages/core/src/types.ts`:

- **`TemporalEvent`** -- a timestamped, typed observation (`visual`, `audio`, `interaction`, `network`, `console`, `dom`, `terminal`, `git`, `system`) with a description, an optional confidence, and a `source` pointing back to what produced it. Visual events (from sampled frames) and audio events (from transcript segments) are stored in the same table and interleaved by timestamp -- `get_timeline` doesn't distinguish them structurally.
- **`Evidence`** -- a grounded observation backed by a stored `Artifact` (a frame image or the session's extracted audio track). Evidence exists so a hypothesis can point at something concrete ("this frame, this confidence") rather than a free-text claim.

A `Session` owns a set of `sources` (currently just `{kind: "video", reference: <path>}`) and has a `mode`: `replay` for an ingested MP4 today; `live` and `recorded` are reserved for later phases. **The important design commitment is that live and replay sessions produce the same `TemporalEvent`/`Evidence` shapes** -- Claude's queries (`get_timeline`, `get_evidence`, `get_frame`) don't change based on where a session came from. Phase 0 only implements the replay path; the live event bus (Phase 3) will publish into the same tables.

## Progressive disclosure

Claude never receives a whole video. The path is:

1. `inspect_video` -- metadata + a bounded number of sampled frames (`packages/video/src/sampling.ts` caps this at 24 by default, widening the interval rather than the frame count as duration grows) get analyzed once and turned into a timeline. The response is metadata + an event count, not the events themselves.
2. `get_timeline` / `search_session` -- the compact, timestamped event list (visual + audio merged), boundable by time range/`limit`, or filtered by a text query.
3. `get_frame` -- one targeted frame near a timestamp Claude cares about, returned as an actual MCP image content block (this is the one place raw bytes are appropriate -- it's a single small image, not the source video). `get_evidence` is the same idea for text: a bounded window of evidence around a timestamp, for "what happened right before/after this?".
4. `analyze_segment` -- dense on-demand re-sampling in a narrow window plus a provider call, for when the coarse timeline isn't enough. More expensive than the above, so it's scoped to a caller-chosen range rather than run automatically.
5. `get_transcript` -- raw audio transcript segments, when the video has an audio track and a transcription provider is configured.

This mirrors the plan's Level 0-4 disclosure model (`TraceLens_Master_Plan.md` §12).

## Content-hash caching

`inspectVideo` (`packages/timeline/src/ingest.ts`) hashes the file (streaming SHA-256, `packages/video/src/hash.ts`) before doing any work. If that hash has a session already (`video_sessions` table), the existing session is returned immediately -- no re-extraction, no re-analysis, no repeat provider calls. `get_frame` similarly reuses a previously extracted frame artifact if one exists within 0.4s of the requested timestamp instead of re-invoking ffmpeg.

## Provider abstraction

`packages/providers/src/types.ts` defines `VisionProvider` (`analyzeFrames`, `analyzeSegment`) and `TranscriptionProvider` (`transcribe`). Implementations:

- `MockVisionProvider` -- deterministic, offline, no network calls. Uses a frame-size-delta heuristic as a stand-in scene-change signal. This is the default provider and what the test suite runs against, so the whole system is testable without a paid API key.
- `AnthropicVisionProvider` -- sends sampled frames as base64 images to the Anthropic Messages API (`@anthropic-ai/sdk`), asks for strict JSON, and validates the response with Zod before trusting it (`malformedProviderResponseError` if it doesn't parse/validate).
- `MockTranscriptionProvider` -- deterministic, offline. TraceLens has no first-party speech-to-text provider yet, so this is the only `TranscriptionProvider` implementation; it derives a segment count from the extracted audio file's size and returns placeholder text, not real transcription. `createTranscriptionProvider` (`packages/providers/src/factory.ts`) throws a clear error for any other `TRACELENS_TRANSCRIPTION_PROVIDER` value rather than silently doing nothing, so the seam for a real provider is visible.

`packages/timeline` and `packages/storage` never import `@anthropic-ai/sdk` -- only `packages/providers` does. Swapping in another multimodal or speech-to-text provider means adding one file there and one branch in the corresponding factory function.

## Storage

SQLite via `better-sqlite3` (`packages/storage`). Tables: `sessions`, `temporal_events`, `evidence`, `artifacts`, `transcript_segments`, and `video_sessions` (content-hash -> session index). No ORM -- `TraceLensStore` is a thin, fully-typed repository. This is intentionally not Postgres/Redis/Kafka: the plan is explicit that SQLite is sufficient until a real requirement emerges (§21, §36).

**Node version note:** `better-sqlite3` (current major) requires Node >= 22 for its N-API surface; older Node versions load the native binding but segfault on first use rather than raising a JS error. A `.nvmrc` pinning `22` is committed for this reason.

## MCP server

`apps/mcp-server` uses `@modelcontextprotocol/sdk`'s `McpServer` + `StdioServerTransport`. Each tool (`apps/mcp-server/src/tools.ts`) has a Zod input schema, a bounded/JSON-serializable text response (or an image content block for `get_frame`), and returns `isError: true` with an actionable message (via `TraceLensError`) rather than throwing an unstructured exception across the protocol boundary.

## Errors

`packages/core/src/errors.ts` centralizes actionable errors (`missingFfmpegError`, `invalidVideoError`, `pathNotAllowedError`, `providerNotConfiguredError`, `malformedProviderResponseError`, `sessionNotFoundError`) so both the CLI and the MCP tool layer surface the same, install-instruction-bearing messages instead of raw stack traces.

## What's deliberately not built yet

Browser/terminal/Git instrumentation, the live event bus, the evidence correlation graph, `/debug-video`, a real speech-to-text provider, and the evaluation harness are designed in the master plan but are later phases -- see the README's Limitations section.
