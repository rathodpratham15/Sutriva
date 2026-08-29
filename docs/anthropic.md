# Technical briefing: Sutriva

A concise technical summary of what this project is, why it exists, and what it demonstrates. This is a briefing, not a pitch -- it does not claim Claude Code is deficient, does not suggest Anthropic should adopt anything here, and makes no employment claims. It documents: I identified a potential capability gap and built a working prototype to explore it.

## 1. Problem

Coding agents can observe and act on the current state of an application. Debugging frequently depends on historical context instead: what happened three steps ago, what a request returned before it was retried, what the console showed right before a crash. That history is often gone from working context by the time it's needed.

## 2. Observation

Claude Code's own native browser integration (`--chrome`) already gives it real-time observation and action in a live tab. That's not the gap. The gap is memory *across time* -- a persistent record retrievable later, by the same session or a different one, rather than only the current moment.

## 3. Product thesis

> Sutriva gives coding agents temporal memory: a persistent, queryable record of what happened across a debugging session -- live or recorded -- that can be retrieved and correlated after the fact, instead of relying only on the current application state.

## 4. Sutriva

A local-first system: an MCP server plus a CLI, both published to npm (`sutriva`, `@sutriva/mcp-server`). Two entry points -- a screen recording, or a live Playwright-instrumented browser session -- normalize into the same event model before Claude ever sees them.

## 5. Architecture

Every observation (a sampled frame, a console message, a network response, a terminal command) becomes a `TemporalEvent` with a timestamp and confidence, plus `Evidence` linking it to a stored artifact. SQLite persistence; a 10-tool MCP server exposes progressive disclosure (metadata -> timeline -> targeted frame/evidence window), never the raw video or an unbounded event stream. Full detail: `docs/architecture.md`.

## 6. Why temporal memory matters

The distinguishing test: can an agent answer "what happened right before the failure" *after* more, unrelated events have occurred since? Observation alone has nothing to look back at once a moment has passed. `tests/integration/canonical-temporal-memory.test.ts` demonstrates this directly and is the project's canonical proof of the thesis, not just a unit test incidentally covering it.

## 7. Live debugging

`sutriva debug --live` launches a real, instrumented browser a human drives. Every console message, network request/response/failure, click, and navigation is persisted the instant it happens -- queryable via `get_current_context` ("what just happened?") or the full `get_timeline`/`get_evidence` history, from this session or a later one.

## 8. Replay

`sutriva inspect bug.mp4` extracts metadata, samples frames (bounded, not every frame), runs vision analysis (real via Claude, or an offline deterministic mock), and transcribes audio if present (real via ElevenLabs, or mock). Content-hash caching means re-inspecting an unchanged file is free.

## 9. MCP integration

10 tools, deliberately small: `inspect_video`, `get_timeline`, `get_frame`, `search_session`, `get_evidence`, `analyze_segment`, `get_transcript`, `inspect_environment`, `get_current_context`, `compare_sessions`. Bounded, timestamped output; no tool returns the raw video or an unbounded event stream.

## 10. Before/after verification

`compare_sessions(beforeId, afterId)` diffs two sessions -- typically "bug reproduced before a fix" and "the same interaction reproduced after" -- and reports concretely what changed (an endpoint's status code, a console error that appeared/disappeared), rather than an agent or human eyeballing two timelines. It does not claim causality; it surfaces the evidence.

## 11. Evaluation results

Two harnesses:
- **Deterministic** (`pnpm eval`, no paid API calls): temporal localization, evidence retrieval, and context efficiency (92-98% fewer sampled frames/bytes than a naive full-frame baseline) across 3 real bugs in a demo Next.js app.
- **Agentic** (`pnpm eval:agentic`, explicitly opt-in, real API cost): drives Claude Code headlessly through the same 3 bugs with no human in the loop, grading root-cause accuracy, code localization, and patch success. Live-verified: all 3 scenarios produced a correct patch, 100% code localization, a correct root-cause hypothesis, and a confirmed real fix.

Full methodology, including what's deliberately *not* automated and why, in `docs/evaluation.md`.

## 12. Limitations

- `compare_sessions` has no visual diffing -- console/network signals only.
- Event correlation (`relatedEventIds`) is a bounded time-proximity heuristic, not causal analysis.
- Real vision/transcription require paid API keys (`ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`); nothing is required for the offline mock-provider default.
- Not yet listed on the official MCP Registry (prepared, see `docs/mcp-registry.md`).
- Developed and tested on macOS only; Linux/Windows should work in principle (all native dependencies support both) but aren't independently verified.

## 13. What I would explore next

- Registering with the official MCP Registry (mechanically ready, see `docs/mcp-registry.md`).
- A causal (not just proximity-based) correlation model, if evidence from real usage justified the added complexity.
- Whether the "compare two sessions" model generalizes usefully beyond debugging -- e.g. onboarding ("what changed since I was last in this code"), or code review context.

This project is a working exploration of one specific idea, built and verified end to end, not a proposal for what any other system should do.
