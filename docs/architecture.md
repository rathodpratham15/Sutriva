# Architecture

This describes the system as implemented (Phase 0 + Phase 1 + Phase 2 + Phase 3). For the full target architecture see `TraceLens_Master_Plan.md`.

## The temporal model

Everything TraceLens observes is normalized into two shapes, defined once in `packages/core/src/types.ts`:

- **`TemporalEvent`** -- a timestamped, typed observation (`visual`, `audio`, `interaction`, `network`, `console`, `dom`, `terminal`, `git`, `system`) with a description, an optional confidence, and a `source` pointing back to what produced it. Visual events (from sampled frames) and audio events (from transcript segments) are stored in the same table and interleaved by timestamp -- `get_timeline` doesn't distinguish them structurally.
- **`Evidence`** -- a grounded observation backed by a stored `Artifact` (a frame image or the session's extracted audio track). Evidence exists so a hypothesis can point at something concrete ("this frame, this confidence") rather than a free-text claim.

A `Session` owns a set of `sources` (`{kind: "video", reference: <path>}` for replay, `{kind: "browser", reference: <url>}` for live) and has a `mode`: `replay` for an ingested MP4, `live` for a running browser session; `recorded` is reserved for a future persisted-live-session view (§20). **The important design commitment is that live and replay sessions produce the same `TemporalEvent`/`Evidence` shapes** -- Claude's queries (`get_timeline`, `get_evidence`, `get_frame`, `search_session`) don't change based on where a session came from. `packages/live` is the only thing that knows the difference; everything downstream of the SQLite tables doesn't.

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

## Repository correlation (Git)

`packages/git` shells out to the `git` CLI (no library dependency) for the minimum context a debugging hypothesis needs: current branch, commit, working-tree dirty status, changed file paths, and recent commits. `getGitContext` returns `{ isRepo: false }` rather than throwing when `cwd` isn't inside a Git working tree -- environment inspection should degrade gracefully, not fail the whole tool call. This is deliberately *not* the full evidence-correlation graph or diff/blame support the plan describes for Phase 4 (§24, §27) -- it's just enough for `inspect_environment` to tell Claude "here's what changed recently" so a hypothesis can point at a real file instead of guessing.

`inspect_environment` (the MCP tool) wraps this Git context together with whether a live session is currently running, and capability flags for browser/network/console (`available: true`, but only populated while a live session is running -- see below) and terminal (`available: false`, Phase 4). The intent (`TraceLens_Master_Plan.md` §37: "never trust unvalidated model output", and the broader "don't fake the workflow" instruction) is that Claude is never left to assume silence means "nothing happening" for a source that isn't currently populated.

## Live sessions (browser)

`packages/browser` wraps Playwright: `instrumentPage` attaches listeners for the plan's prioritized event set (§21) -- `console`, `pageerror`, `request`, `response`, `requestfailed`, `framenavigated` -- plus a small injected script (`page.addInitScript` + `page.exposeFunction`) that reports real `click`/`input` DOM events back to Node. Deliberately no DOM diffing: an interaction is described by its target element (tag/id/class/truncated text), not a structural diff. Input values are captured truncated to 80 chars, redacted entirely for password fields (`el.type === "password"`).

`packages/live`'s `startLiveSession` is the orchestrator: it creates a `mode: "live"` `Session`, launches a browser, and wires an `EventBus` (`packages/core/src/event-bus.ts`, the literal `publish`/`subscribe` interface from §16) with three subscribers -- persist to SQLite as an `Evidence`-backed `TemporalEvent` (confidence `1`, since a console message or network response is a directly observed fact, not an inference), print a compact line for the live CLI feed, and trigger a screenshot capture on navigation/interaction events (plus a periodic fallback timer). Every event is stored the moment it happens -- there's no batching -- so a separate process (the MCP server, queried by Claude) can read a live session's state concurrently via SQLite's WAL mode while the CLI process is still writing to it.

`get_current_context` (`packages/timeline/src/live-context.ts`, the plan's §10/§18 "look at this" operation) auto-discovers "whichever live session is currently running" via `store.findActiveLiveSession()` if no `sessionId` is given, then returns a bounded snapshot: the most recent screenshot artifact, the last navigation's URL, the last 15 events, and the last 5 console-errors/network-failures found by scanning a 100-event lookback window. Git context is re-fetched live (not just the session-start snapshot) so commits made *during* a live debugging session show up.

**A real reliability bug found while testing this end-to-end:** Playwright's `chromium.launch()` defaults to `handleSIGINT: true` (and SIGTERM/SIGHUP), meaning Playwright installs its own process-level signal handler that closes the browser and lets the process die immediately on Ctrl+C -- racing against, and beating, `packages/live`'s own graceful shutdown (which needs to persist the final session state and print a summary first). `startLiveSession` now launches with `handleSIGINT/SIGTERM/SIGHUP: false` so the CLI's own shutdown handler has exclusive control. A related fix: the CLI's shutdown path avoids `process.exit()` on the normal path (it can truncate pending stdout writes) and races `stop()` against a 5s timeout with a forced exit only as a last resort, in case the browser process died in some other way mid-close.

## Claude Code plugin command

`.claude/commands/debug-video.md` is a project-level slash command (not a distributed plugin -- `.claude/commands/*.md` is the idiomatic choice for a single-repo command; a full `.claude-plugin/` manifest is for sharing across repos/teams, which isn't a current requirement). Its body encodes the 14-step agent workflow from `TraceLens_Master_Plan.md` §25 as a prompt template, including the observed/likely/possible/confirmed confidence language from §23/§27 -- so evidence and inference stay explicitly separated in the final report rather than relying on whoever's typing the request that day to spell out the whole workflow.

## Errors

`packages/core/src/errors.ts` centralizes actionable errors (`missingFfmpegError`, `invalidVideoError`, `pathNotAllowedError`, `providerNotConfiguredError`, `malformedProviderResponseError`, `sessionNotFoundError`) so both the CLI and the MCP tool layer surface the same, install-instruction-bearing messages instead of raw stack traces.

## What's deliberately not built yet

Terminal instrumentation, full Git diffs/the evidence-correlation graph, the formal agentic patch/verify loop, `compare_sessions`, a real speech-to-text provider, and the evaluation harness are designed in the master plan but are later phases -- see the README's Limitations section.
