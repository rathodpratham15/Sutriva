# Launch post (draft -- not published)

## I built Sutriva to explore temporal memory for coding agents

### The problem

Coding agents like Claude Code can already observe and act on the current state of an application -- read a repository, run commands, and (via native browser integration) watch a live tab. What they don't have is memory of a session *across time*: a persistent, timestamped record of what happened, correlated with the code, retrievable later -- by the same session or a different one -- instead of only the current moment.

Concretely: a bug someone reproduced in a screen recording, or reproduced live five minutes ago, is gone from working context once the conversation moves on. Today that gap gets filled by narrating it in text (lossy -- exact timestamps and error text flatten into paraphrase) or dumping a whole video into a prompt (expensive, unbounded, impossible to ground in timestamps).

### The thesis

Sutriva gives coding agents temporal memory: a persistent, queryable record of what happened across a debugging session -- live or recorded -- that can be retrieved and correlated after the fact, instead of relying only on the current application state.

Two commitments follow from that: **time is a first-class dimension** (every observation gets a timestamp and a confidence score, not just a description), and **evidence, not narration** (Sutriva surfaces what was observed -- a frame, a status code, a stack trace -- and leaves diagnosis to the agent reading actual source code, never asserting causality it hasn't verified).

### Architecture, briefly

A screen recording and a live, Playwright-instrumented browser session both normalize into the same two shapes -- `TemporalEvent` and `Evidence` -- in SQLite, persisted the moment they happen. A 10-tool MCP server exposes progressive disclosure over that store: metadata first, then a timeline, then a specific frame or a bounded evidence window, never the raw video or a live event firehose. Full design rationale in `docs/architecture.md`.

### The demo

`sutriva debug --live` on a real bug, a "what happened?" query that retrieves the exact failure with a timestamp, a patch, and `compare_sessions` reporting concretely what changed before vs. after -- not two timelines eyeballed side by side. See the README's "Flagship demo" section and `docs/demo-script.md` for the full walkthrough.

### Evaluation

An agentic harness (`pnpm eval:agentic`) drives Claude Code headlessly through 3 real, deterministic bugs in a demo app -- no human in the loop -- and grades root-cause accuracy, code localization, and patch success automatically. All three passed, live-verified with real API calls, not simulated. Separately, a deterministic harness measures context efficiency: 92-98% fewer frames/bytes than a naive "send everything" baseline. Full methodology and honest caveats in `docs/evaluation.md`.

### Limitations, honestly

No visual diffing in `compare_sessions` (console/network signals only -- a pure CSS bug shows "nothing changed" there, verified instead by a direct assertion in the eval harness). Event correlation is a time-proximity heuristic, not causal analysis. Real vision/transcription cost real API calls. Not yet listed on the official MCP Registry. Full list in the README's Limitations section.

### Try it

```bash
npm install -g sutriva
npm install -g @sutriva/mcp-server
sutriva doctor
```

- GitHub: https://github.com/rathodpratham15/Sutriva
- npm: https://www.npmjs.com/package/sutriva, https://www.npmjs.com/package/@sutriva/mcp-server
- MCP: 10 tools over stdio, see `docs/mcp-registry.md` for setup in another project

This started as an exploration of one specific gap -- persistent memory of a debugging session, not just observation of the current one -- and turned into a fully tested, published, working system. Feedback, issues, and different perspectives on the thesis are welcome.
