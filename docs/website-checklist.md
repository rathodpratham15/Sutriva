# Website integration checklist

The canonical documentation site will be built separately (planned tool: Google AI Studio) at **https://sutriva.pratham.click**. This repo does not build or host it -- this is a content/accuracy checklist for whoever builds it, sourced directly from what's actually implemented and tested, not aspirational copy.

No domain has been purchased and no site exists yet. `apps/mcp-server/server.json`'s `websiteUrl` field already references this URL in preparation (see `docs/mcp-registry.md`) -- it must resolve to a real page before that server.json is ever actually submitted to the MCP Registry.

## Required content, and where the source of truth for each lives in this repo

| Section | Must accurately convey | Source of truth |
|---|---|---|
| **Product thesis** | The exact locked positioning -- temporal memory, not a browser-capability replacement | README's "Sutriva gives coding agents temporal memory..." line; `docs/product.md` |
| **Installation** | `npm install -g sutriva` / `npm install -g @sutriva/mcp-server`; Node >=22, FFmpeg, Playwright Chromium prerequisites | README "Quickstart" and "Installing outside this repo" |
| **CLI commands** | The real command list (`doctor`, `inspect`, `timeline`, `search`, `analyze`, `debug --live`, `exec`, `session list`, `eval`, `clean`) -- not a superset or an outdated one | README "CLI" section |
| **MCP installation** | Pointing another project's `.mcp.json` at the globally installed `sutriva-mcp` binary | README "Using the MCP server in another project" |
| **Claude Code integration** | The bundled `.mcp.json` auto-discovery and `/debug-video` slash command | README "Claude Code integration" |
| **Live debugging** | `sutriva debug --live`, what it captures, that it's a separate browser from Claude Code's own `--chrome` | README "Live debugging" |
| **MP4 replay** | `sutriva inspect <video>`, sampled frames (not every frame), vision/transcription providers | README "Quickstart", `docs/architecture.md` |
| **Temporal rewind** | The actual differentiator: querying a moment after later events happened, with the canonical test as proof | README "Temporal rewind example"; `tests/integration/canonical-temporal-memory.test.ts` |
| **Before/after verification** | `compare_sessions`, and its real limitation (console/network only, no visual diff) -- must not be overstated | README "Verifying a fix"; Limitations |
| **Architecture** | The real package list and data flow (video/live -> TemporalEvent/Evidence -> MCP tools -> Claude) | README "Architecture"; `docs/architecture.md` |
| **Evaluation** | Both harnesses, the actual live-verified agentic results table, and that it costs real API calls | README "Flagship demo" and "Evaluation"; `docs/evaluation.md` |
| **Privacy** | Local-first, no telemetry, exactly when data leaves the machine | `docs/privacy.md` |
| **Limitations** | The real, current list -- no visual diffing, heuristic correlation, platform (macOS-only verified), MCP Registry not yet listed, GitHub repo not yet renamed | README "Limitations & roadmap" |
| **GitHub link** | `github.com/rathodpratham15/TraceLens` today -- **must be updated if/when the rename in `docs/github-rename-checklist.md` happens**; do not hardcode without checking current state | `docs/github-rename-checklist.md` |
| **npm links** | `npmjs.com/package/sutriva`, `npmjs.com/package/@sutriva/mcp-server` | This doc; live npm registry |
| **MCP Registry** | Accurately state current status (not yet registered, as of this writing) -- do not claim registry presence before it's real | `docs/mcp-registry.md` |

## Explicit content rules for whoever builds the site

- Every claim above has a real, checkable source in this repo -- don't paraphrase into stronger claims than the source material makes (this is the same discipline the README and `docs/anthropic.md` already follow).
- Don't state the GitHub repository name, MCP Registry status, or published package versions as fixed facts baked into static copy without a note that these can change -- prefer linking to npm/GitHub directly for anything that updates over time (version numbers, star counts) rather than hardcoding a snapshot.
- Do not add marketing claims beyond what's in the README/docs (no unverified benchmarks, no comparisons to unnamed "other tools" beyond what `docs/competitive-analysis.md` already says).
