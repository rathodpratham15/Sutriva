# Product

## The user problem

Claude Code can already read a repository, run commands, and -- via its own native browser integration (`--chrome`) -- observe and act in a live browser directly. **Observation is not the gap.** What Claude Code doesn't have is memory of a session *across time*: a persistent, timestamped, queryable record of what happened, correlated with Git state, retrievable later -- by this session or a different one -- rather than just the current moment. A bug someone reproduced in a screen recording, or reproduced live five minutes ago, is gone from working context once the conversation moves on. Today that gap gets filled one of two ways, both bad:

- The developer narrates it in text ("I clicked checkout, it spun forever, then nothing"), which is lossy -- exact timestamps, the actual failed request, the exact console error text, all get flattened into a paraphrase.
- The whole video gets dumped into the model's context, which is expensive, unbounded, and ungrounded -- there's no way for Claude to say "at 4.2s the request failed" versus "somewhere in here something failed."

Neither gives Claude something it can query, cite, or verify against.

## Product thesis

Sutriva turns a developer session -- recorded or live -- into a **temporal evidence layer**: structured, timestamped observations Claude retrieves incrementally instead of receiving as raw media. The one-sentence version (`TraceLens_Master_Plan.md` §44):

> Sutriva gives coding agents temporal memory by turning live and recorded developer sessions into structured, timestamped evidence that can be correlated with browser behavior, network activity, console output, Git, and source code.

Two design commitments follow directly from that thesis:

- **Time is a first-class dimension.** Every observation -- a sampled frame, a console message, a network response, a terminal command -- carries a timestamp and a confidence, not just a description. "What happened at 4.2s" and "what happened right before this" (`get_evidence`) are answerable questions, not something Claude has to infer from prose.
- **Evidence, not narration.** Sutriva never tells Claude what a bug *is*. It surfaces what was observed (a frame, a status code, a stack trace) and leaves diagnosis to Claude, reading actual source code. The `/debug-video` workflow enforces this by requiring Claude to label every claim `observed` / `likely` / `possible` / `confirmed` (`TraceLens_Master_Plan.md` §23/§27) rather than asserting causality Sutriva itself never established.

## Workflows

Sutriva supports two entry points into the same evidence model (`docs/architecture.md`'s "temporal model" -- live and replay sessions produce identical `TemporalEvent`/`Evidence` shapes):

1. **Replay debugging.** Someone hands Claude a screen recording of a bug (`inspect_video`). Claude gets metadata and an event count, not the video -- it pulls a timeline, a specific frame, or a text search as needed (`docs/architecture.md`'s progressive disclosure model).
2. **Live debugging.** `sutriva debug --live` opens a real, instrumented browser. A developer reproduces a bug by hand while Claude watches through `get_current_context` ("look at this -- what just happened?") and `get_timeline`, without polling raw browser internals.

Both converge on the same close-the-loop step: reproduce the bug (before), patch the code, reproduce it again (after), then `compare_sessions(beforeId, afterId)` reports concretely what changed (`POST /api/checkout: 500 → 200`) instead of two timelines being eyeballed side by side.

## Differentiation

Sutriva is explicit about what it is *not* claiming (`TraceLens_Master_Plan.md` §40): it does not claim novelty in raw video understanding, and it builds on existing multimodal models (the `AnthropicVisionProvider`) rather than replacing them. Several categories of existing tool already do pieces of this:

- **Video understanding APIs / video search** -- describe or index video content, but have no concept of a debugging session, a Git repository, or a browser's live state.
- **Video-analysis MCP servers** -- expose a video to a model over MCP, but typically as a single blob or a set of frame descriptions, not a queryable, timestamped, confidence-scored event stream correlated with anything else.
- **Computer-use / browser agents** -- drive a browser, but for the agent to *act*, not to build a persistent, queryable evidence record of what a human did while reproducing a bug.
- **Claude Code's own native browser integration (`--chrome`)** -- lets Claude observe and act in a live tab directly, in the current turn. It does not persist a timestamped history across time, correlate it with Git state at the moment of failure, or let a later session (or a different one) query "what happened before this" once the tab has moved on. Sutriva does not compete with or duplicate this -- it's the memory layer underneath it.

Sutriva's actual position is the sum of several existing ideas applied specifically to debugging, not any one of them alone:

```text
raw video understanding
        +
temporal evidence (timestamped, confidence-scored, source-linked)
        +
developer telemetry (browser, network, console, terminal)
        +
Git/source correlation
        +
progressive context (metadata -> timeline -> frame, never the raw video)
        +
agentic debugging (observe -> diagnose -> patch -> test -> reproduce -> compare)
```

See `docs/competitive-analysis.md` for a category-by-category comparison, and `docs/architecture.md` for how the evidence model is actually implemented.
