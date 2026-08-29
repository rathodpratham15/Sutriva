# GitHub repository rename checklist

The repository is currently `rathodpratham15/TraceLens`. This document is preparation only -- **the repository has not been renamed**. It exists so that if/when the rename happens, every consequence is known in advance rather than discovered one broken link at a time.

## Before renaming

1. Confirm you're ready to lose the ability to easily search-replace old links -- GitHub does auto-redirect the old URL to the new one for regular web/git traffic, but not forever and not for everything (see "What GitHub does and doesn't handle automatically" below).
2. Make sure `main` is clean and everything you want in the rename is already merged.

## The rename itself (not run -- for reference)

```bash
gh repo rename Sutriva --repo rathodpratham15/TraceLens
# or via the GitHub UI: Settings -> repository name
```

## What GitHub does and doesn't handle automatically

- **Handles automatically**: `git clone`/`git pull`/`git push` against the *old* remote URL, and visiting the old web URL in a browser -- both redirect to the new location indefinitely (per GitHub's documented behavior), as long as a *new* repository isn't later created at the old name.
- **Does NOT handle automatically**: anything embedded as a literal string in committed files (the redirect works at the HTTP/git-protocol level, not by rewriting your source), npm package metadata already published to the registry, or anyone's local `git remote -v` (which will keep working via the redirect, but `git remote get-url origin` will still show the old URL until manually updated).

## Exact files to update after renaming (6 files, all URL references only)

| File | Line(s) | What to change |
|---|---|---|
| `README.md` | 65 | `git clone https://github.com/rathodpratham15/TraceLens.git && cd TraceLens` -> `.../Sutriva.git && cd Sutriva` |
| `apps/cli/src/commands/eval.ts` | 56-57 | Same clone URL + `cd TraceLens` -> `cd Sutriva`, in the graceful "monorepo not present" error message |
| `apps/cli/package.json` | 12, 15, 17 | `repository.url`, `homepage`, `bugs.url` |
| `apps/mcp-server/package.json` | 13, 16, 18 | Same three fields |
| `apps/mcp-server/server.json` | 6 | `repository.url` (MCP Registry manifest -- also see note below) |
| `docs/mcp-registry.md` | 29, 77 | Two more mentions of the repository URL (one inside an example `server.json` snippet, one in prose) |

A simple `grep -rn "rathodpratham15/TraceLens" .` (excluding `node_modules`, `.git`) at the time of the rename will catch any new occurrences introduced since this checklist was written -- treat this table as a starting point, not a guarantee it's still exhaustive.

## Explicitly NOT part of this checklist

- **`TraceLens_Master_Plan.md`** -- this is intentionally-preserved historical documentation (see `docs/product.md`'s and others' citations of it). It doesn't contain the repository URL, and its filename should not change even after a GitHub rename -- it's a snapshot of the original planning document, not current branding.
- **Git history** -- old commits/PR descriptions will continue to say TraceLens. Expected, not a bug.

## Downstream consequences beyond this repo

- **If `@sutriva/mcp-server`/`sutriva` have already been published to npm with the old repository URL in their metadata** (they have, as of `0.1.0`): npm package metadata is immutable per-version. The URL only updates for whichever version is published *after* this file change -- e.g., bump to `0.1.1`/`0.2.0` and republish. Existing installs of `0.1.0` will keep showing the old URL in `npm view`/npmjs.com until someone installs a newer version.
- **The MCP Registry entry** (once registered, see `docs/mcp-registry.md`) references the repository URL in `server.json` too -- same consideration: a new registry version publish is needed to update it.
- **Anything external you've already posted** (a LinkedIn post, a forum reply, etc.) with the old URL will keep working via GitHub's redirect, but won't visually show the new name -- purely cosmetic, not broken.
