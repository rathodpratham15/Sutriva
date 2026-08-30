# MCP Registry preparation

This documents what's required to register `@sutriva/mcp-server` on the [official MCP Registry](https://registry.modelcontextprotocol.io) (registry.modelcontextprotocol.io), and exactly what's been prepared vs. what's still an action someone has to take. **Nothing has been registered externally** -- this is preparation only, per the source authoritative docs at [`modelcontextprotocol/registry`](https://github.com/modelcontextprotocol/registry) (the registry is explicitly in preview as of this writing).

## What the registry actually is

The MCP Registry only hosts **metadata** (a `server.json` describing the server, which package/version it maps to, and how to run it) -- not artifacts. The real package still has to be published to npm *before* registering. `@sutriva/mcp-server@0.1.1` -- the version with `mcpName` included -- is now the version live on npm (published after this doc was first written; confirmed via `npm view @sutriva/mcp-server mcpName` returning `io.github.rathodpratham15/sutriva`). The registration blocker described below is resolved.

## Prerequisites (per the official quickstart)

- An npm account with the package already published -- ✅ done.
- A GitHub account, for GitHub-based namespace authentication (the simplest of the [supported auth methods](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/authentication.mdx)) -- ✅ you have one (`rathodpratham15`).
- The `mcp-publisher` CLI tool (not installed as part of this repo -- it's a separate, one-time system tool, install via Homebrew or the prebuilt binary from the registry's GitHub releases).

## What's been prepared in this repo

1. **`apps/mcp-server/package.json`** now has an `mcpName` field:
   ```json
   "mcpName": "io.github.rathodpratham15/sutriva"
   ```
   This is how the registry verifies the published npm package actually belongs to the claimed registry entry. Because registration uses GitHub auth, this value **must** start with `io.github.rathodpratham15/`.

2. **`apps/mcp-server/server.json`** -- the registry manifest itself, matching the schema `mcp-publisher init` would generate, verified directly against the current official schema (`static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`) and the official quickstart guide (`modelcontextprotocol/registry` repo, `docs/modelcontextprotocol-io/quickstart.mdx`):
   ```json
   {
     "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
     "name": "io.github.rathodpratham15/sutriva",
     "description": "Sutriva gives coding agents temporal memory: ...",
     "title": "Sutriva",
     "websiteUrl": "https://sutriva.pratham.click",
     "repository": { "url": "https://github.com/rathodpratham15/Sutriva", "source": "github" },
     "version": "0.1.1",
     "packages": [{
       "registryType": "npm",
       "identifier": "@sutriva/mcp-server",
       "version": "0.1.1",
       "transport": { "type": "stdio" }
     }]
   }
   ```
   `title` and `websiteUrl` are both optional per the schema (`ServerDetail`) and included for display purposes once a client/subregistry chooses to show them. **`websiteUrl` points to a domain that does not exist yet** (`sutriva.pratham.click` -- planned for a future documentation site, see `docs/website-checklist.md`; the domain has not been purchased). This is safe while the entry is only prepared and not submitted, but **must resolve to a real page before `mcp-publisher publish` is actually run** -- either the real site, or this field should be removed/pointed at the GitHub README instead if the site isn't live yet at registration time.

## Status: the npm-side blocker is resolved

`@sutriva/mcp-server@0.1.1` -- published to npm with `mcpName` included -- is now live. The registry validates the *live npm package*, and `0.1.1` satisfies that check; registering would no longer fail on this ground. **Nothing has been registered yet** -- the remaining steps are still a deliberate, separate action (see the `websiteUrl` caveat below).

## Exact commands to actually register (once ready)

`npm publish` for `@sutriva/mcp-server@0.1.1` is **already done** -- what's left is entirely on the registry side:

```bash
# 1. One-time: install the publisher CLI
brew install mcp-publisher
# or: curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/

# 2. Authenticate with the MCP Registry (GitHub device-auth flow)
mcp-publisher login github
# visit github.com/login/device, enter the code shown

# 3. Publish the registry entry itself (run from apps/mcp-server, where server.json lives)
mcp-publisher validate   # sanity check server.json before publishing
mcp-publisher publish

# 4. Verify
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.rathodpratham15/sutriva"
```

If `websiteUrl` in `server.json` still points at a domain that isn't live at the time of step 3, remove that field (or point it at the GitHub README URL instead) before running `mcp-publisher publish` -- see the note in the previous section.

## What the registry entry will communicate

Per `server.json`'s `description` field above: **"Temporal memory for coding agents"** -- a persistent, queryable record of a debugging session, retrievable and correlated after the fact. Someone searching the registry for MCP servers related to debugging, session history, or agent memory should find this described accurately, not oversold.

## Documented for the registry entry (once live)

- **Package**: `@sutriva/mcp-server` (npm)
- **Repository**: https://github.com/rathodpratham15/Sutriva
- **Installation**: `npm install -g @sutriva/mcp-server`, binary `sutriva-mcp`
- **Runtime requirements**: Node.js >= 22 (checked at startup, fails with a clear error otherwise); FFmpeg/ffprobe on `PATH` for the replay path; Playwright's Chromium (`npx playwright install chromium`) for the live-debugging path.
- **Available tools**: `inspect_video`, `get_timeline`, `get_frame`, `search_session`, `get_evidence`, `analyze_segment`, `get_transcript`, `inspect_environment`, `get_current_context`, `compare_sessions` (10 total, unchanged).
- **Environment variables** (all optional): `ANTHROPIC_API_KEY` (real vision analysis), `ELEVENLABS_API_KEY` (real transcription), `SUTRIVA_DATA_DIR` (storage location, default `./.sutriva`). None required for the offline/mock-provider default.
- **Privacy behavior**: local-first by default, no telemetry; see `docs/privacy.md` for exactly what leaves your machine and when.
