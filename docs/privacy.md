# Privacy

TraceLens is local-first. This document states plainly what happens to your data.

## What stays on disk

Everything, by default. Sessions, timelines, evidence, extracted frames, and -- for live sessions -- screenshots are stored under `TRACELENS_DATA_DIR` (default `./.tracelens`, a SQLite database plus a directory of extracted images). Nothing in this directory is uploaded, synced, or transmitted anywhere by TraceLens itself.

## What can leave your machine, and when

The **only** thing that leaves your machine is data sent to a configured vision provider, and only when a tool that calls one is actually invoked:

- With the default (`TRACELENS_VISION_PROVIDER=mock`, used whenever `ANTHROPIC_API_KEY` is unset), **nothing ever leaves your machine**. The mock provider is a local heuristic.
- With `TRACELENS_VISION_PROVIDER=anthropic`, `inspect_video` and `analyze_segment` send the **sampled frame images** (not the whole video file) and a text prompt to the Anthropic Messages API over HTTPS, using your own `ANTHROPIC_API_KEY`. This happens only when you explicitly run `inspect_video`/`analyze_segment` with that provider configured -- not automatically, not in the background, not on a schedule.
- With the default (`TRACELENS_TRANSCRIPTION_PROVIDER=mock`, used whenever `ELEVENLABS_API_KEY` is unset), audio transcription never leaves your machine -- the extracted audio track (`audio.wav`) stays under `TRACELENS_DATA_DIR` and is only read locally to derive a placeholder segment count.
- With `TRACELENS_TRANSCRIPTION_PROVIDER=elevenlabs`, the extracted audio track is sent to ElevenLabs' Speech-to-Text API over HTTPS using your own `ELEVENLABS_API_KEY`, only when `inspect_video` (or `tracelens inspect`) actually runs against a video with an audio track -- not automatically, not in the background.
- `tracelens debug --live` never calls a model provider itself -- it only captures browser events (navigation, clicks, input, console, network, screenshots) into the local SQLite database and artifact directory. Nothing about a live session is sent anywhere unless you separately ask Claude to reason about it (which happens through your own Claude Code session, not through TraceLens making an API call on your behalf).
- Input field values are captured (truncated to 80 characters) as interaction evidence, since what a user typed is often exactly the debugging signal needed -- **except** password fields (`input[type=password]`), which are always recorded as `[redacted]`. Other sensitive fields (API tokens typed into a non-password text input, for example) are not automatically detected -- be mindful of what you type into a page while a live session is recording.
- `tracelens exec -- <command>` also never calls a model provider -- it runs the command as a normal child process and, if a live session is active, records a redacted copy of the command line and its output locally. Same rule as everything else here: local storage only, nothing sent anywhere automatically.

## Terminal capture and secret redaction

`tracelens exec` captures the command line and a bounded copy of stdout/stderr, then passes both through a best-effort redaction pass (`redactSecrets`, `packages/core/src/redact.ts`) before storing -- **not** before streaming to your real terminal, which is unaffected. It catches common shapes: `KEY=value`/`KEY: value` assignments where the name looks secret-ish (contains `API`, `SECRET`, `TOKEN`, `PASSWORD`, `KEY`, `CREDENTIAL`, etc.), `Authorization: Bearer <token>` headers, AWS access key IDs (`AKIA...`), and PEM private key blocks.

**This is a heuristic, not a guarantee.** It will not catch every secret shape (a bare token with no recognizable prefix or surrounding label, for example, passes through untouched). Treat anything captured via `tracelens exec` as potentially containing sensitive data regardless of redaction, the same way you'd treat your own shell history. If you need to run something you know outputs secrets, don't run it through `tracelens exec` (or run it without an active live session, in which case nothing is persisted at all).

TraceLens has no telemetry, analytics, or crash-reporting of its own.

## Secrets

- `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` are read from the environment (`process.env`) only. Neither is ever written to the SQLite database, logged, or included in any TraceLens error message.
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

## Working-tree diffs

`inspect_environment`'s `includeDiff` option returns your actual uncommitted code changes (bounded/truncated, but still real source). This stays entirely local unless you're using it inside a Claude Code session that itself sends context to a model -- the same consideration as any other code Claude reads from your repository. TraceLens itself never uploads a diff anywhere.
