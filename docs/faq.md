# FAQ

Real questions this project actually answers, with real (not marketing) answers.

## What is temporal memory for a coding agent?

The ability to query what happened *earlier* in a debugging session, after the moment has passed and other things have happened since -- not just what's currently on screen. Sutriva's canonical test (`tests/integration/canonical-temporal-memory.test.ts`) demonstrates this directly: an action happens, a failure happens, *more* unrelated events happen after the failure, and a historical query (`get_evidence`) still correctly returns the pre-failure evidence while a separate "what's happening right now" query (`get_current_context`) correctly reflects the latest activity instead. Neither view overwrites the other. See `docs/product.md` for the full thesis.

## How can Claude Code understand a recorded debugging session?

Point it at a screen recording: `sutriva inspect bug.mp4` (or the MCP tool `inspect_video` directly). Sutriva extracts metadata, samples frames, runs vision analysis (real via `ANTHROPIC_API_KEY`, or a deterministic offline mock), extracts and transcribes the audio track if present (real via `ELEVENLABS_API_KEY`, or mock), and builds a timestamped timeline. Claude then queries it incrementally (`get_timeline`, `get_frame`, `get_evidence`) instead of receiving the raw video. The bundled `/debug-video` slash command automates the full inspect -> diagnose -> patch -> verify workflow. See the [Quickstart](../README.md#quickstart) and [Claude Code integration](../README.md#claude-code-integration) sections.

## How can a coding agent access historical debugging context?

Through 10 bounded MCP tools exposed by `@sutriva/mcp-server` -- `get_timeline` (the full event list, boundable by time range), `get_evidence` (a window around a specific timestamp -- the actual "temporal rewind" operation), `search_session` (full-text), and `compare_sessions` (a before/after diff). All of it is backed by SQLite, persisted the moment an event happens, so it survives past the observation itself and is queryable by a different Claude Code session, minutes or days later. See `docs/architecture.md`'s "temporal model" section.

## How can I replay a browser bug for Claude Code?

Record the repro as a screen recording and run `sutriva inspect your-bug.mp4`, or -- if you want Claude following along live instead of after the fact -- run `sutriva debug --live --url https://your-app.local`, reproduce the bug in the real browser window that opens, and ask Claude Code (with the MCP server connected) `"Look at this -- what just happened?"` (`get_current_context`). Both paths produce identical, queryable `TemporalEvent`/`Evidence` records; see [Live debugging](../README.md#live-debugging) and [Temporal rewind example](../README.md#temporal-rewind-example).

## How can an MCP server provide debugging-session context, specifically?

By treating a debugging session as data, not a single request/response. Every observation (a frame, a console error, a network response, a terminal command) gets a timestamp, a confidence score, and a link back to a stored artifact -- then the 10 tools above let an agent query that store progressively (metadata first, then a timeline, then a specific frame or evidence window) instead of receiving one large context dump. `docs/architecture.md`'s "progressive disclosure" section covers exactly why, and `docs/mcp-registry.md` documents the actual server metadata/tool list.

## Does Sutriva replace Claude Code's own browser capability?

No. Claude Code's native browser integration (`--chrome`, "Claude in Chrome") already lets Claude observe and act in a live tab directly, in the current turn -- Sutriva doesn't duplicate that. What it adds is persistence: a record of what happened that survives the moment, correlated with Git state, retrievable later by this session or a different one. See `docs/competitive-analysis.md`'s dedicated section on this distinction.

## Is any of this real, or is it a demo/prototype?

Real, and live-verified, not just built: the agentic evaluation harness (`pnpm eval:agentic`) actually drives Claude Code headlessly through 3 real bugs in a demo Next.js app -- no human in the loop -- and grades root-cause accuracy, code localization, and patch success. All three passed with correct patches and real before/after verification. See `docs/evaluation.md` and the README's "Flagship demo" section for the actual results, not a description of intended behavior.

## What does it cost to run?

Nothing, by default -- the mock vision/transcription providers are deterministic and fully offline. Real vision analysis (`ANTHROPIC_API_KEY`) and real transcription (`ELEVENLABS_API_KEY`) are both real, billed API calls, made only when a tool that needs them is actually invoked. See `docs/privacy.md` for the exact data-flow disclosure.
