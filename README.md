# TraceLens

**TraceLens gives coding agents temporal memory: it turns developer sessions (recorded video today, live browser/terminal/Git sessions in later phases) into structured, timestamped evidence that Claude Code can query instead of guessing from source code alone.**

> **Status: Phase 0 + Phase 1 + Phase 2 (replay debugging).** MP4 → metadata → sampled frames + audio transcript → vision/transcription providers → timeline+evidence → SQLite → MCP (8 tools) → Claude Code, plus `/debug-video` and Git-context correlation, is implemented, tested, and working end to end. Live debugging and the full developer-correlation/evaluation phases described in `TraceLens_Master_Plan.md` are next -- see [Limitations](#limitations--roadmap).

## Why TraceLens exists

Claude Code can already read a repository, run commands, and inspect a browser. What it can't do well is reason about **what happened** during a session -- a screen recording of a bug, a sequence of clicks and failed requests, "watch me reproduce this." Dumping a whole video into a prompt is expensive, unbounded, and impossible to ground in timestamps.

TraceLens is not a video summarizer. It's a **temporal evidence layer**: every observation (a frame, eventually a click or a console error) gets a timestamp, a confidence, and a link back to its source artifact. Claude queries this incrementally -- metadata, then a timeline, then a specific frame -- instead of receiving raw video.

## Quickstart

Requirements: Node.js **>= 22** (better-sqlite3's native binding requires it -- see [Configuration](#configuration)), [FFmpeg](https://ffmpeg.org/) (`ffmpeg`/`ffprobe` on `PATH`), `pnpm`.

```bash
git clone <this repo> && cd TraceLens
nvm use            # picks up Node 22 via .nvmrc, if you use nvm
pnpm install
pnpm cli doctor     # checks ffmpeg/git/Node and prints the active vision provider
```

Generate the bundled synthetic fixtures (no binary assets are committed -- they're generated from `ffmpeg` test sources):

```bash
pnpm fixtures:generate
```

Try the pipeline directly, with no API key required:

```bash
pnpm cli inspect fixtures/videos/sample.mp4
pnpm cli timeline fixtures/videos/sample.mp4
pnpm cli search fixtures/videos/sample.mp4 "change"
pnpm cli analyze fixtures/videos/sample.mp4 --start 5 --end 7 --question "what changed"
```

Without `ANTHROPIC_API_KEY` set, TraceLens uses a deterministic **mock vision provider** (a byte-delta heuristic between sampled frames) so the whole pipeline -- and the test suite -- works offline. Set `ANTHROPIC_API_KEY` to get real scene descriptions from Claude; see [Provider configuration](#provider-configuration).

## Claude Code integration

This repo ships a project-level `.mcp.json`, so opening Claude Code here auto-discovers the TraceLens MCP server:

```bash
export ANTHROPIC_API_KEY=sk-...   # optional -- omit to use the mock provider
claude
```

```
> Use the TraceLens tools to inspect fixtures/videos/checkout-bug.mp4 and tell me
> what happens in it, with timestamps.
```

Claude will call `inspect_video`, then `get_timeline`, then `get_frame` for any moment it wants to see directly -- it does not receive the raw video file.

For the full debugging workflow (evidence → repo inspection → hypothesis → fix → verification) in one step, use the bundled slash command instead:

```
> /debug-video fixtures/videos/checkout-bug.mp4
```

## Architecture

```
MP4 --ffprobe/ffmpeg--> metadata + sampled frames --VisionProvider--> observations
                                                                          |
                                                                          v
                                                          TemporalEvent + Evidence (SQLite)
                                                                          |
                                                                          v
                                                                    MCP tool surface
                                                                          |
                                                                          v
                                                                     Claude Code
```

**Packages** (`pnpm` workspace, no build step -- everything runs via `tsx`):

| Package | Responsibility |
|---|---|
| `packages/core` | Domain types (`Session`, `TemporalEvent`, `Evidence`, `Artifact`), Zod schemas, actionable errors, path validation, config. |
| `packages/video` | FFmpeg wrapper: metadata probing, content hashing, frame/audio extraction, bounded sampling. |
| `packages/providers` | `VisionProvider` interface + `MockVisionProvider` (offline/deterministic) + `AnthropicVisionProvider`. Provider SDKs never leak outside this package. |
| `packages/storage` | SQLite (`better-sqlite3`) persistence for sessions, events, evidence, artifacts, transcripts. |
| `packages/timeline` | Orchestrates ingest (`inspectVideo`) and query (`getTimeline`, `getFrame`, `searchSession`, `analyzeSegment`, `getEvidenceAround`). |
| `packages/git` | Minimal Git context (branch, commit, working-tree status, recent commits) for correlating evidence with source -- not a full diff/blame engine (that's Phase 4). |
| `apps/mcp-server` | MCP server exposing the tool surface below over stdio. |
| `apps/cli` | `tracelens` CLI -- useful standalone, without Claude Code. |

See `docs/architecture.md` for the full design rationale (progressive disclosure, content-hash caching, why live and replay share one event model).

## MCP tools

| Tool | Purpose |
|---|---|
| `inspect_video` | Ingests a video into a session: metadata, sampled frames, vision analysis, transcript (if the video has audio), timeline. Reuses the existing session if the file's content hash was already seen. |
| `get_timeline` | Returns the bounded, timestamped event list for a session (supports `limit`/`afterSeconds`/`beforeSeconds`). Visual and audio events are merged in time order. |
| `get_frame` | Returns one targeted frame (as an image Claude can see) near a timestamp -- the model never has to re-request the whole video for a follow-up visual question. |
| `search_session` | Full-text search over a session's event descriptions. |
| `get_evidence` | Temporal rewind: evidence within a time window around a timestamp ("what happened immediately before/after this?"). |
| `analyze_segment` | Dense, on-demand analysis over a narrow time range -- for when the coarse timeline isn't enough detail. |
| `get_transcript` | Raw audio transcript segments for a session. |
| `inspect_environment` | Current Git context (branch/commit/working-tree status/recent commits), plus explicit `available: false` flags for browser/network/console/terminal context -- those land in Phase 3/4. |

Live-session tools (Phase 3) aren't built yet -- see Limitations.

## Claude Code plugin command

`.claude/commands/debug-video.md` adds `/debug-video <path>` as a project-level slash command. It packages the full agent workflow from `TraceLens_Master_Plan.md` §25 (inspect → timeline → evidence → frames → repo → hypothesis → evidence-labeled confidence → patch → test → reproduce → report) so you don't have to spell it out by hand each time:

```
claude
> /debug-video fixtures/videos/checkout-bug.mp4
```

## CLI

```bash
tracelens doctor                                    # environment check
tracelens inspect <video>                           # ingest + build timeline
tracelens timeline <video> [--limit N] [--json]
tracelens search <video> "<query>"
tracelens analyze <video> --start S --end E [--question "..."]
tracelens session list
tracelens clean [--yes]                             # delete .tracelens/ (derived data only)
```

`tracelens debug <video>`, `tracelens debug --live`, `tracelens session report`, and `tracelens eval` are stubbed with an explanatory message -- they land in later phases (replay/live debugging, evaluation harness).

## Provider configuration

TraceLens never calls a model provider unless a tool that needs one is invoked, and never uploads anything automatically.

| Variable | Default | Purpose |
|---|---|---|
| `TRACELENS_VISION_PROVIDER` | `anthropic` if `ANTHROPIC_API_KEY` is set, else `mock` | `mock` or `anthropic`. |
| `ANTHROPIC_API_KEY` | unset | Required for the `anthropic` provider. |
| `TRACELENS_VISION_MODEL` | `claude-opus-5` | Any current vision-capable Claude model. |
| `TRACELENS_TRANSCRIPTION_PROVIDER` | `mock` | Only `mock` exists today -- no real speech-to-text provider is wired in yet (see Limitations). |
| `TRACELENS_DATA_DIR` | `./.tracelens` | Where sessions, timelines, and extracted frames are stored. |

`VisionProvider`/`TranscriptionProvider` are plain interfaces (`packages/providers/src/types.ts`); adding another provider means adding one file that implements one -- core/timeline code never imports a provider SDK directly.

## Privacy

Local-first by default: no telemetry, no automatic uploads. A frame only leaves your machine when a tool call explicitly invokes the `anthropic` vision provider. See `docs/privacy.md`.

## Testing

```bash
pnpm typecheck   # tsc --noEmit across every package/app
pnpm lint        # eslint
pnpm test        # vitest -- unit tests + a real MCP-server-over-stdio integration test
```

All 34 current tests run offline against the mock providers and generated fixtures -- no paid API calls are required to validate the system.

## Limitations & roadmap

Phase 0 (vertical slice), Phase 1 (temporal core), and Phase 2 (replay debugging) are done. Not yet built (see `TraceLens_Master_Plan.md` for the full plan):

- Live debugging (`tracelens debug --live`), browser/terminal instrumentation, the event bus for live sources, `get_current_context()` (Phase 3).
- Full Git correlation (diffs, blame, the evidence-correlation graph) and terminal command capture (Phase 4) -- `inspect_environment` today only returns branch/commit/working-tree status/recent commits, not diffs.
- The formal observe→diagnose→patch→test→reproduce→compare loop and `compare_sessions(before, after)` (Phase 5).
- A real speech-to-text provider -- `TranscriptionProvider` exists and audio is extracted/segmented, but only the deterministic `MockTranscriptionProvider` is implemented; transcript text is a placeholder, not real speech recognition.
- The demo buggy app, evaluation harness (`tracelens eval`), before/after session comparison (Phase 6).

These are being implemented in subsequent phases.
