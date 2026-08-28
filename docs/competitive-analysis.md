# Competitive analysis

This compares Sutriva conceptually against existing categories of tooling (`TraceLens_Master_Plan.md` §40). It intentionally avoids naming or benchmarking specific commercial products -- the comparison is by category and capability, not a claim about any one competitor's exact feature set, which changes faster than this document could stay accurate.

**Ground rule:** Sutriva does not claim novelty in raw multimodal video understanding. It uses an existing multimodal model (`AnthropicVisionProvider`, `packages/providers`) for frame analysis rather than building or claiming a competing perception model. The claim is about what's built *around* that perception: temporal evidence, developer telemetry, source correlation, and a debugging loop.

## Claude Code's own native browser integration

**What it does:** Claude Code has its own native live-browser capability (`--chrome`, "Claude in Chrome") -- Claude can already observe and act in a running browser tab directly: screenshots, DOM/console inspection, clicking, navigating, all in the current conversation turn. This is real, current, and Sutriva does not duplicate or compete with it.

**What it doesn't do:** persist anything across time. There is no timestamped event history to rewind through once a moment has scrolled past, no correlation with the Git state at the moment a failure occurred, and no way for a *different* Claude Code session -- or this same one, later -- to ask "what happened right before the failure" once the tab that showed it is gone. It's observation, not memory.

**Sutriva's relationship to this category:** this is the single most important distinction to get right, and the one most likely to be misunderstood. Sutriva is not "browser access for Claude" -- Claude already has that. Sutriva is the durability layer underneath: whatever produced an observation (a human driving a browser Sutriva instruments via `packages/live`, or a screen recording), every event is persisted the moment it happens into the same timestamped, queryable `TemporalEvent`/`Evidence` tables, retrievable by `get_timeline`/`get_evidence`/`search_session`/`compare_sessions` regardless of which session or how much later asks for it.

## Video understanding APIs

**What they do:** given a video, return a description, a transcript, or answers to natural-language questions about its content.

**What they don't do:** have any concept of a *debugging session* specifically. No notion of a browser, a network request, a console error, a Git repository, or a source file. A video understanding API can tell you "a form is submitted and an error message appears" -- it cannot tell you the request was a `POST /api/checkout` that returned `500`, or point at the line of code that produced that response.

**Sutriva's relationship to this category:** it sits on top of one (via `VisionProvider`) rather than competing with it. `packages/providers` is written so swapping in a different vision model requires one new file, not a rewrite (`docs/architecture.md`'s provider abstraction section).

## Video search

**What they do:** index video content (often via embeddings) so a user can find "the moment where X happens" across a large corpus of footage.

**What they don't do:** this is a retrieval problem across *many* videos; Sutriva's problem is structuring the events *within one* debugging session so an agent can reason over them causally and correlate them with code. `search_session`'s full-text search is a byproduct of already having a structured timeline, not the product's purpose.

## Video-analysis MCP servers

**What they do:** expose video content to an MCP client (e.g. Claude Code), typically as a single ingested blob, a transcript, or a fixed set of frame descriptions returned in one call.

**What they don't do (typically):** offer progressive disclosure (metadata → timeline → targeted frame → dense re-analysis, `docs/architecture.md`), a confidence-scored evidence model backed by stored artifacts, or any correlation with sources *other* than the video itself -- no Git context, no live browser/terminal capture, no before/after verification.

**Sutriva's relationship to this category:** it is one of these (an MCP server exposing video content), plus everything layered on top -- the same event/evidence model also covers a *live* browser session that never touches a video file at all (`packages/live`), and the tool surface is deliberately small (10 tools) rather than one big "analyze this video" call.

## Claude Code video plugins

**What they do:** typically wire a video understanding capability into Claude Code as a slash command or plugin, similar in spirit to a video-analysis MCP server but scoped specifically to the Claude Code product surface.

**What they don't do:** the same gaps as the MCP server category above, plus -- because they're scoped to "handle this video" -- they generally don't also instrument a live browser, correlate with the working tree's Git state, or close the loop with a before/after comparison. Sutriva's `/debug-video` command and `sutriva debug --live` are two entry points into one shared evidence model, not two separate features.

## Computer-use / browser agents

**What they do:** let a model *act* in a browser -- click, type, navigate -- typically to complete a task autonomously.

**What they don't do:** Sutriva inverts the relationship. `packages/browser`/`packages/live` instrument a browser a *human* is driving, to build a persistent, queryable record of what happened -- not to let the model drive it. A computer-use agent's browser state is usually ephemeral (relevant only for the current action); Sutriva's live session is deliberately durable (stored in SQLite, queryable mid-session or after the fact, comparable against a later "after" session).

## Where Sutriva actually differentiates

Not in any single layer above -- in combining them for one specific job (`TraceLens_Master_Plan.md` §40):

```text
raw video understanding          (existing category -- not reinvented)
        +
temporal evidence                (timestamped, confidence-scored, artifact-backed)
        +
developer telemetry              (browser, network, console, terminal -- live, not just recorded)
        +
Git/source correlation           (branch, commit, working-tree diff)
        +
progressive context              (bounded retrieval -- never the raw video)
        +
agentic debugging + verification (observe -> diagnose -> patch -> test -> reproduce -> compare)
```

A developer could assemble something similar from a video understanding API, a browser automation library, and hand-rolled Git shell-outs. Sutriva's contribution is having already done that integration, with one consistent event/evidence model shared between the recorded and live paths, and one small MCP tool surface Claude Code can use directly.
