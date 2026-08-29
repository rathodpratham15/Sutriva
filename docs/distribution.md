# Distribution channels

Where Sutriva can legitimately be discovered, what each channel actually requires, current status, and the exact next action for each. No channel here is spammed or submitted to automatically -- every "next action" is a deliberate, separate step someone has to take.

An honest framing worth stating up front: several of the community MCP directories below list tens of thousands of servers (Glama ~37,000, mcp.so ~20,000+, Smithery ~7,000+, as of the research behind this document). Being listed is a real, cheap distribution channel, but it's a long tail, not a spotlight -- it doesn't substitute for the official registry, a good README, or word of mouth.

| Channel | Purpose | Requirements | Current status | Exact next action |
|---|---|---|---|---|
| **npm registry** | The actual install mechanism -- everything else points here | An npm account, a published package | ✅ Live: `sutriva@0.1.0`, `@sutriva/mcp-server@0.1.0` | None -- done |
| **GitHub repository** | Source, issues, README as the canonical doc | A public repo | ✅ Live at `rathodpratham15/TraceLens`, topics added (`mcp`, `model-context-protocol`, `claude`, `claude-code`, `ai-agents`, `debugging`, `developer-tools`, `llm-tools`) | None for now -- see `docs/github-rename-checklist.md` if renaming later |
| **Official MCP Registry** (registry.modelcontextprotocol.io) | THE canonical metadata registry MCP clients/aggregators are expected to pull from | `mcpName` in the published npm package.json, a valid `server.json`, GitHub-based auth via `mcp-publisher` | 🟡 Prepared, not registered -- `mcpName` added to source but not yet in a *published* npm version; `server.json` drafted. See `docs/mcp-registry.md` for the exact blocker and commands. | Publish `@sutriva/mcp-server@0.1.1`+ with `mcpName` included, then run `mcp-publisher login github && mcp-publisher publish` |
| **Community MCP directories** (mcp.so, Smithery, Glama) | Secondary discovery surfaces developers/aggregators actually browse | Each has its own submission flow (self-registration form, or auto-pulls from the official registry once listed there) | ⬜ Not submitted | Register with the official MCP Registry first (several of these directories ingest from it automatically per their own docs) -- submitting manually to each is a fallback, not the first step |
| **`awesome-mcp-servers`-style GitHub lists** | A PR-reviewed, curated (lower-volume, higher-signal) list | A PR to the list repo, following its contribution guidelines and category conventions | ⬜ Not submitted | Open a PR to `punkpeye/awesome-mcp-servers` (or the current canonical list) adding an entry under an appropriate category (developer tools / debugging) |
| **LinkedIn / social** | Personal-network visibility, not algorithmic discovery | A post | ✅ Draft ready (see conversation) | Post when ready -- not something this repo tracks |
| **Anthropic-adjacent channels** (Claude Code Discord/community, forum) | Reaching people already using Claude Code specifically | Following each community's own posting norms | ⬜ Not done | Low-effort, high-relevance -- worth doing once the MCP Registry listing exists, so there's an authoritative link to share |

## Why the official registry comes first

Per the research behind this table, MCP Registry submission is the base layer several community directories and clients pull from -- registering there once is more leveraged than submitting to each community directory individually, and some directories explicitly ingest from it rather than accepting direct submissions. `docs/mcp-registry.md` has the exact remaining steps.
