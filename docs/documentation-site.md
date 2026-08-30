# Documentation site: recommendation

Assessment of whether Sutriva needs a dedicated documentation site, and if so, what shape. Recommendation only -- nothing here has been built.

## Current state

Documentation already lives in the repo as a set of focused markdown files, each linked from the README rather than duplicated into it:

- `README.md` -- entry point, quickstart, Claude Code integration, flagship demo, limitations
- `docs/architecture.md` -- system design, temporal model, progressive disclosure rationale
- `docs/product.md` -- product thesis and positioning
- `docs/competitive-analysis.md` -- the `--chrome` distinction
- `docs/evaluation.md` -- eval methodology and results
- `docs/privacy.md` -- data-flow disclosure
- `docs/faq.md`, `docs/demo-script.md`, `docs/distribution.md`, `docs/mcp-registry.md`, `docs/github-rename-checklist.md`, `docs/anthropic.md` (this pass)

This is a working, GitHub-rendered documentation set today -- every file is reachable by clicking through from the README on GitHub, with correct relative links.

## Recommendation: do not build a dedicated site yet

A generated docs site (Docusaurus, VitePress, Mintlify, etc.) adds real ongoing cost -- a build pipeline, a hosting target, a second place for content to go stale relative to the code -- for a project at this stage. The honest test: is anyone currently blocked by "I can't find X"? No evidence of that yet; the gap identified in this pass was stale/missing *content* (the install section, the limitations list), not a missing *site*.

The concrete trigger to revisit this: if the npm/GitHub install numbers justify it, or if the official MCP Registry listing drives enough traffic that GitHub's plain markdown rendering becomes a real friction point (no search, no versioning, no landing page distinct from the README).

## If/when it's revisited

Prefer the lightest option that solves the actual problem at the time:
1. **GitHub Pages from the same markdown**, zero new authoring format, if the only gap is "a nicer URL than a GitHub file view."
2. **A single `docs/` index page** (a markdown file that's just a table of contents with one-line descriptions) before reaching for a generator -- cheap, and already solves "I don't know which doc to read."
3. Only reach for a full generator (Docusaurus/Mintlify) if versioned docs or full-text search become a real, demonstrated need -- not preemptively.

Not recommended at any point: fragmenting the README itself into many small pages. The README's job is to be the single, complete entry point for someone evaluating the project in one read; splitting it thinner would work against that, not for it.
