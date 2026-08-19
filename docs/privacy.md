# Privacy

TraceLens is local-first. This document states plainly what happens to your data.

## What stays on disk

Everything, by default. Sessions, timelines, evidence, extracted frames, and -- for live sessions -- screenshots are stored under `TRACELENS_DATA_DIR` (default `./.tracelens`, a SQLite database plus a directory of extracted images). Nothing in this directory is uploaded, synced, or transmitted anywhere by TraceLens itself.

## What can leave your machine, and when

The **only** thing that leaves your machine is data sent to a configured vision provider, and only when a tool that calls one is actually invoked:

- With the default (`TRACELENS_VISION_PROVIDER=mock`, used whenever `ANTHROPIC_API_KEY` is unset), **nothing ever leaves your machine**. The mock provider is a local heuristic.
- With `TRACELENS_VISION_PROVIDER=anthropic`, `inspect_video` and `analyze_segment` send the **sampled frame images** (not the whole video file) and a text prompt to the Anthropic Messages API over HTTPS, using your own `ANTHROPIC_API_KEY`. This happens only when you explicitly run `inspect_video`/`analyze_segment` with that provider configured -- not automatically, not in the background, not on a schedule.
- `TRACELENS_TRANSCRIPTION_PROVIDER` only has a `mock` implementation today, so audio transcription never leaves your machine either -- the extracted audio track (`audio.wav`) stays under `TRACELENS_DATA_DIR` and is only read locally to derive a placeholder segment count. There is no real speech-to-text provider wired in yet.
- `tracelens debug --live` (Phase 3) never calls a model provider itself -- it only captures browser events (navigation, clicks, input, console, network, screenshots) into the local SQLite database and artifact directory. Nothing about a live session is sent anywhere unless you separately ask Claude to reason about it (which happens through your own Claude Code session, not through TraceLens making an API call on your behalf).
- Input field values are captured (truncated to 80 characters) as interaction evidence, since what a user typed is often exactly the debugging signal needed -- **except** password fields (`input[type=password]`), which are always recorded as `[redacted]`. Other sensitive fields (API tokens typed into a non-password text input, for example) are not automatically detected -- be mindful of what you type into a page while a live session is recording.

TraceLens has no telemetry, analytics, or crash-reporting of its own.

## Secrets

- `ANTHROPIC_API_KEY` is read from the environment (`process.env`) only. It is never written to the SQLite database, logged, or included in any TraceLens error message.
- `.env` is gitignored; `.env.example` documents the variables without values.
- If you believe a key or token has ended up in a committed file, treat it as compromised and rotate it -- TraceLens does not scan for this automatically.

## Filesystem access

- `resolveExistingFile` (`packages/core/src/paths.ts`) rejects paths containing null bytes and requires the target to exist as a regular file before any tool touches it.
- `assertWithinRoot` bounds artifact/session-derived paths to their expected directory, so a crafted session/artifact ID can't be used to read arbitrary files outside `TRACELENS_DATA_DIR`.
- The MCP tool surface only accepts a video path (for `inspect_video`) or an already-issued session ID / timestamp (for `get_timeline`/`get_frame`) -- it does not expose a generic filesystem-read tool.

## Deletion

```bash
tracelens clean --yes
```

Deletes `TRACELENS_DATA_DIR` entirely: the SQLite database, every extracted frame, everything TraceLens has derived. It never touches your source video files or your repository.

## What is not yet implemented (and therefore not yet a privacy concern, but will be)

Terminal command capture (Phase 4) will follow the same rule: local storage by default, no automatic upload. It's expected to need redaction hooks before it should be trusted with real command output (see `TraceLens_Master_Plan.md` §22) -- this is called out here so it isn't quietly assumed to be safe once implemented.
