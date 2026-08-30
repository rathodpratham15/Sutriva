# MCP Registry preparation

This documents what's required to register `@sutriva/mcp-server` on the [official MCP Registry](https://registry.modelcontextprotocol.io) (registry.modelcontextprotocol.io), and exactly what's been prepared vs. what's still an action someone has to take. **Nothing has been registered externally** -- this is preparation only, per the source authoritative docs at [`modelcontextprotocol/registry`](https://github.com/modelcontextprotocol/registry) (the registry is explicitly in preview as of this writing).

## What the registry actually is

The MCP Registry only hosts **metadata** (a `server.json` describing the server, which package/version it maps to, and how to run it) -- not artifacts. The real package still has to be published to npm (already done: `@sutriva/mcp-server@0.1.0`) *before* registering.

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

2. **`apps/mcp-server/server.json`** -- the registry manifest itself, matching the schema `mcp-publisher init` would generate:
   ```json
   {
     "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
     "name": "io.github.rathodpratham15/sutriva",
     "description": "Sutriva gives coding agents temporal memory: ...",
     "repository": { "url": "https://github.com/rathodpratham15/TraceLens", "source": "github" },
     "version": "0.1.0",
     "packages": [{
       "registryType": "npm",
       "identifier": "@sutriva/mcp-server",
       "version": "0.1.0",
       "transport": { "type": "stdio" }
     }]
   }
   ```

## The one thing blocking actual registration right now

**`mcpName` is not in the *published* `0.1.0` package on npm** -- it was added to this repo's `package.json` after `0.1.0` was already published (see PR history). The registry validates the *live npm package*, not this repo's source, so registering right now would fail validation.

**Before registering, publish a new version** (e.g. `0.1.1`) of `@sutriva/mcp-server` that includes the `mcpName` field, then update `server.json`'s `version` to match. This is a real, separate `npm publish` action -- not done as part of this documentation pass, per instruction not to publish anything further right now.

## Exact commands to actually register (once ready)

```bash
# 1. One-time: install the publisher CLI
brew install mcp-publisher
# or: curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/

# 2. Bump the version, add mcpName if not already present, and re-publish to npm first
cd apps/mcp-server
npm version patch   # -> 0.1.1
npm publish --access public

# 3. Update server.json's "version" to match (0.1.1), then authenticate
mcp-publisher login github
# opens a GitHub device-auth flow: visit github.com/login/device, enter the code shown

# 4. Publish the registry entry itself
mcp-publisher validate   # sanity check server.json before publishing
mcp-publisher publish

# 5. Verify
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.rathodpratham15/sutriva"
```

## What the registry entry will communicate

Per `server.json`'s `description` field above: **"Temporal memory for coding agents"** -- a persistent, queryable record of a debugging session, retrievable and correlated after the fact. Someone searching the registry for MCP servers related to debugging, session history, or agent memory should find this described accurately, not oversold.

## Documented for the registry entry (once live)

- **Package**: `@sutriva/mcp-server` (npm)
- **Repository**: https://github.com/rathodpratham15/TraceLens
- **Installation**: `npm install -g @sutriva/mcp-server`, binary `sutriva-mcp`
- **Runtime requirements**: Node.js >= 22 (checked at startup, fails with a clear error otherwise); FFmpeg/ffprobe on `PATH` for the replay path; Playwright's Chromium (`npx playwright install chromium`) for the live-debugging path.
- **Available tools**: `inspect_video`, `get_timeline`, `get_frame`, `search_session`, `get_evidence`, `analyze_segment`, `get_transcript`, `inspect_environment`, `get_current_context`, `compare_sessions` (10 total, unchanged).
- **Environment variables** (all optional): `ANTHROPIC_API_KEY` (real vision analysis), `ELEVENLABS_API_KEY` (real transcription), `SUTRIVA_DATA_DIR` (storage location, default `./.sutriva`). None required for the offline/mock-provider default.
- **Privacy behavior**: local-first by default, no telemetry; see `docs/privacy.md` for exactly what leaves your machine and when.
