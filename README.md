# TraceLens

**TraceLens gives coding agents temporal memory: it turns developer sessions -- recorded video or a live browser session -- into structured, timestamped evidence that Claude Code can query instead of guessing from source code alone.**

> **Status: Phase 0 through Phase 6 (evaluation) -- the core system described in the master plan is complete.** Replay (MP4 → metadata/frames/transcript → timeline) and live (Playwright browser + terminal instrumentation → the same timeline/evidence tables) both work end to end through a 10-tool MCP surface, `/debug-video`, `tracelens debug --live`, and `tracelens exec`. Related events are linked automatically by proximity, `compare_sessions` verifies a fix, and a real evaluation harness (`tracelens eval`) measures the system against three deterministic, real bugs in a demo Next.js app -- see [Evaluation](#evaluation) and [Limitations](#limitations--roadmap) for what's left (mostly documentation/polish now, not core capability).

## Why TraceLens exists

Claude Code can already read a repository, run commands, and inspect a browser. What it can't do well is reason about **what happened** during a session -- a screen recording of a bug, a sequence of clicks and failed requests, "watch me reproduce this." Dumping a whole video into a prompt is expensive, unbounded, and impossible to ground in timestamps.

TraceLens is not a video summarizer. It's a **temporal evidence layer**: every observation (a frame, eventually a click or a console error) gets a timestamp, a confidence, and a link back to its source artifact. Claude queries this incrementally -- metadata, then a timeline, then a specific frame -- instead of receiving raw video.

See `docs/product.md` for the full product thesis and workflows, and `docs/competitive-analysis.md` for how this compares to video understanding APIs, video-analysis MCP servers, and browser agents.

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

See `docs/example-sessions.md` for real, captured tool output (CLI and MCP) against this exact fixture -- not a mockup -- if you want to see what Claude actually receives before running it yourself.

## Architecture

```
MP4 --ffprobe/ffmpeg--> metadata + sampled frames --VisionProvider--> observations --,
                                                                                      |
Playwright browser --instrumentPage--> EventBus (publish/subscribe) ---------------->+
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
| `packages/core` | Domain types (`Session`, `TemporalEvent`, `Evidence`, `Artifact`), the `EventBus`, Zod schemas, actionable errors, path validation, config. |
| `packages/video` | FFmpeg wrapper: metadata probing, content hashing, frame/audio extraction, bounded sampling. |
| `packages/providers` | `VisionProvider` interface + `MockVisionProvider` (offline/deterministic) + `AnthropicVisionProvider`. Provider SDKs never leak outside this package. |
| `packages/storage` | SQLite (`better-sqlite3`) persistence for sessions, events, evidence, artifacts, transcripts. |
| `packages/timeline` | Orchestrates ingest (`inspectVideo`) and query (`getTimeline`, `getFrame`, `searchSession`, `analyzeSegment`, `getEvidenceAround`, `getCurrentContext`). |
| `packages/git` | Minimal Git context (branch, commit, working-tree status, recent commits) for correlating evidence with source -- not a full diff/blame engine (that's Phase 4). |
| `packages/browser` | Playwright instrumentation: navigation, click, input, console, pageerror, request/response/requestfailed, screenshots. |
| `packages/live` | Orchestrates a live session -- launches a browser, instruments it, and persists every observation into the *same* sessions/events/evidence tables a replayed MP4 uses. |
| `apps/mcp-server` | MCP server exposing the tool surface below over stdio. |
| `apps/cli` | `tracelens` CLI -- useful standalone, without Claude Code. |

See `docs/architecture.md` for the full design rationale (progressive disclosure, content-hash caching, why live and replay share one event model).

## Live debugging

```bash
tracelens debug --live --url https://your-app.local
```

This opens a real, visible browser window. Interact with it normally -- click around, reproduce a bug -- and TraceLens captures navigation, clicks, input, console messages, network requests/responses/failures, and periodic screenshots into a live session, live, as they happen. Ask Claude Code (in another terminal, once the MCP server is connected) to follow along:

```
> Look at this -- what just happened? Use get_current_context.
```

`get_current_context` returns a compact, bounded snapshot (current screenshot, current URL, recent events, recent console errors, recent network failures, live Git state) without Claude having to poll the whole timeline. Press Ctrl+C in the `tracelens debug --live` terminal to end the session.

Run a command and record it into that same timeline (e.g. to capture the test run that reproduces a bug):

```bash
tracelens exec -- npm test
```

Output streams to your terminal exactly as if you'd run the command directly; a bounded, redacted copy (command, exit code, stdout/stderr) is recorded as a `terminal` event if a live session is active. Related events get linked automatically: a network request/error is linked back to the click that likely triggered it, purely by time proximity -- this is evidence for Claude to reason over, not a causality claim TraceLens itself makes.

## Verifying a fix

Reproduce the bug once (live or as a recording) to get a `sessionId`, patch the code, then reproduce the *same* interaction again to get a second `sessionId`, and ask Claude to close the loop:

```
> Compare the session before my fix to the one after -- did it work?
```

Claude calls `compare_sessions(beforeSessionId, afterSessionId)`, which reports concretely what changed -- e.g. `POST /api/checkout: 500 → 200`, or a console error that no longer appears -- rather than you or Claude eyeballing two timelines side by side. This is the "reproduce → compare" half of the observe→diagnose→patch→test→reproduce→compare agentic loop; `/debug-video`'s workflow (below) drives the whole thing.

## Demo app

`demo/buggy-app` is a small, deterministic Next.js app with three intentional bugs (an API schema
mismatch, an async race condition, a responsive visual regression -- see `demo/buggy-app/README.md`
for each bug's symptom, root cause, fix, and a screenshot). It exists to give the flagship workflow
something real to debug:

<p>
  <img src="docs/assets/bug-1-checkout.gif" alt="Checkout bug: click Checkout, stuck on Processing..." width="260">
  <img src="docs/assets/bug-2-search.gif" alt="Search bug: stale results for a superseded query" width="260">
  <img src="docs/assets/bug-3-responsive.gif" alt="Responsive bug: submit button hidden under the header" width="260">
</p>

```bash
pnpm --filter buggy-app dev   # http://localhost:4173
```

```
> Follow me while I reproduce a bug in http://localhost:4173.
```

(Start `tracelens debug --live --url http://localhost:4173/checkout` first, then ask Claude to
follow along -- see [Live debugging](#live-debugging).)

## Evaluation

```bash
pnpm fixtures:eval:generate   # records a real Playwright repro of each demo bug as an MP4
pnpm eval                     # or: tracelens eval
```

Measures TraceLens against the three demo bugs: temporal localization, evidence retrieval, and
context efficiency (sampled frames vs. every frame at native fps; a single targeted frame's size
vs. an estimated "send every frame" baseline) are fully automated and deterministic -- no paid API
calls. Root-cause accuracy, code localization, and patch success require an actual agent reading
the repository, so those are reported with the exact `/debug-video` command to grade them by hand
rather than faked. See `docs/evaluation.md` for the full methodology and honest discussion of what
this can and can't measure automatically.

## MCP tools

| Tool | Purpose |
|---|---|
| `inspect_video` | Ingests a video into a session: metadata, sampled frames, vision analysis, transcript (if the video has audio), timeline. Reuses the existing session if the file's content hash was already seen. |
| `get_timeline` | Returns the bounded, timestamped event list for a session (supports `limit`/`afterSeconds`/`beforeSeconds`). Visual, audio, browser, and terminal events are all merged in time order, with `relatedEventIds` on events that were automatically correlated to a plausible preceding cause. |
| `get_frame` | Returns one targeted replay frame (as an image Claude can see) near a timestamp -- the model never has to re-request the whole video for a follow-up visual question. |
| `search_session` | Full-text search over a session's event descriptions. |
| `get_evidence` | Temporal rewind: evidence within a time window around a timestamp ("what happened immediately before/after this?"). |
| `analyze_segment` | Dense, on-demand analysis over a narrow time range -- for when the coarse timeline isn't enough detail. |
| `get_transcript` | Raw audio transcript segments for a session. |
| `inspect_environment` | Current Git context (branch/commit/status/recent commits/diffstat, plus the full working-tree diff if `includeDiff` is set), whether a live session is running, and capability flags for browser/network/console/terminal (each populated only while/if actually captured). |
| `get_current_context` | The "look at this" / "what just happened?" snapshot for a live session: screenshot, current URL, recent events/errors/failures, live Git state. Defaults to the active live session if `sessionId` is omitted. |
| `compare_sessions` | Before/after verification: diffs two sessions and reports endpoints whose status changed (e.g. 500 → 200) and console errors that appeared/disappeared -- the "reproduce and compare" step of the agentic loop. |

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
tracelens debug --live [--url <url>] [--headless]   # live browser session (Ctrl+C to stop)
tracelens exec -- <command>                         # run + record a command into the active live session
tracelens session list
tracelens eval                                       # run the evaluation harness against demo/buggy-app
tracelens clean [--yes]                             # delete .tracelens/ (derived data only)
```

`tracelens debug <video>` explains how to drive replay debugging via Claude Code/MCP rather than duplicating that logic in the CLI. `tracelens session report` is stubbed with an explanatory message -- it lands in a later phase (session recording/reporting wasn't part of the master plan's core phases).

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

All 70 current tests run offline against the mock providers, generated fixtures, and a local HTTP test server for browser instrumentation -- no paid API calls or external network access are required to validate the system. The live-session tests run a real headless Chromium against a page deliberately designed to trigger a console error, a failed request, and a click, and assert the resulting events/evidence/screenshot/correlation; `compare_sessions` is tested against two real inspected videos through the actual MCP tool call. The eval harness itself is tested too (`tests/eval/harness.test.ts`), skipped automatically if the eval video fixtures haven't been generated.

## Limitations & roadmap

Phase 0 (vertical slice) through Phase 6 (evaluation) are done -- the core system from `TraceLens_Master_Plan.md` is complete. Not yet built:

- Root-cause accuracy / code localization / patch success in the eval harness are graded manually (run `/debug-video` and compare against `expectedFiles`/`rootCause`), not automated -- see `docs/evaluation.md` for why.
- A real speech-to-text provider -- `TranscriptionProvider` exists and audio is extracted/segmented, but only the deterministic `MockTranscriptionProvider` is implemented; transcript text is a placeholder, not real speech recognition.
- Live-session screenshots are best-effort: an occasional screenshot capture immediately after a navigation can transiently fail in headless Chromium (a known Playwright quirk); it's logged and skipped rather than crashing the session, and the next trigger/periodic capture fills in.
- Event correlation (`relatedEventIds`) is a bounded, time-proximity heuristic (network follows a recent interaction; a console error follows a recent network event) -- it links plausible chains, it does not establish causality. `git diff`-based blame/full history correlation beyond "recent commits + working-tree diff" isn't built.
- Terminal capture requires explicitly running commands through `tracelens exec`; there's no shell-wide/automatic capture of arbitrary commands you type directly. Redaction (`redactSecrets`) is a best-effort heuristic (common `KEY=value`/Bearer-token/AWS-key/PEM patterns), not a guarantee -- treat captured terminal output as potentially sensitive regardless.
- Click/input capture describes the target element (tag/id/class/text), not a full DOM diff -- deliberately, per the plan's "don't over-engineer DOM diffing" guidance.
- `compare_sessions` matches endpoints by exact `METHOD URL` string and parses status from the stored event description -- it doesn't normalize URLs (query strings, path params) or diff response bodies, so two calls to what's logically "the same" endpoint with different query strings are treated as different endpoints.

These are being implemented in subsequent phases.
