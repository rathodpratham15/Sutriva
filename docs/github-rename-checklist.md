# GitHub repository rename checklist

**Done.** The repository was renamed from `rathodpratham15/TraceLens` to `rathodpratham15/Sutriva`. This document is kept as a record of what the rename involved and what's still a downstream consequence (npm package metadata, the MCP Registry entry) -- not as a forward-looking plan anymore.

## What was done

1. `gh repo rename Sutriva --repo rathodpratham15/TraceLens` -- ran directly, confirmed via `gh repo view rathodpratham15/Sutriva`.
2. Local `origin` remote updated to the new URL (`git remote set-url origin https://github.com/rathodpratham15/Sutriva.git`).
3. Every file below with a hardcoded old URL was updated in the same pass (see the table).

## The rename command (for reference, already run)

```bash
gh repo rename Sutriva --repo rathodpratham15/TraceLens
# or via the GitHub UI: Settings -> repository name
```

## What GitHub does and doesn't handle automatically

- **Handles automatically**: `git clone`/`git pull`/`git push` against the *old* remote URL, and visiting the old web URL in a browser -- both redirect to the new location indefinitely (per GitHub's documented behavior), as long as a *new* repository isn't later created at the old name.
- **Does NOT handle automatically**: anything embedded as a literal string in committed files (the redirect works at the HTTP/git-protocol level, not by rewriting your source), npm package metadata already published to the registry, or anyone's local `git remote -v` (which will keep working via the redirect, but `git remote get-url origin` will still show the old URL until manually updated).

## Files updated as part of the rename (11 files, all URL references only)

| File | Line(s) | What changed |
|---|---|---|
| `README.md` | 7, 70, 347 | Badge URL, `git clone .../Sutriva.git && cd Sutriva`, and the MCP-Registry Limitations bullet's rename mention removed (rename is done) |
| `apps/cli/src/commands/eval.ts` | 56-57 | Same clone URL + `cd Sutriva`, in the graceful "monorepo not present" error message |
| `apps/cli/package.json` | 12, 15, 17 | `repository.url`, `homepage`, `bugs.url` |
| `apps/mcp-server/package.json` | 13, 16, 18 | Same three fields |
| `apps/mcp-server/server.json` | 8 | `repository.url` (MCP Registry manifest -- also see note below) |
| `docs/mcp-registry.md` | 31, 77 | Two more mentions of the repository URL (one inside an example `server.json` snippet, one in prose) |
| `docs/demo-script.md` | 12 | Prerequisites' `git clone` command |
| `docs/distribution.md` | 10 | The GitHub-repository row, rewritten to reflect the rename is done |
| `docs/launch-post.md` | 41 | The "Try it" GitHub link |
| `docs/website-checklist.md` | 24 | The GitHub-link row -- this file was created after the original (pre-rename) 10-file version of this checklist and was missed on the first pass; caught by the confirmation grep below |
| `docs/github-rename-checklist.md` | this file | Rewritten from a forward-looking plan into a record of what was done |

A `grep -rln "rathodpratham15/TraceLens" . --include='*.md' --include='*.json' --include='*.ts'` (excluding `node_modules`, `.git`) immediately after this pass confirmed no genuine repository-URL occurrences remained (only expected `TraceLens_Master_Plan.md` filename citations, and this file's own intentional historical/reference mentions of the old name).

## Explicitly NOT part of this checklist

- **`TraceLens_Master_Plan.md`** -- this is intentionally-preserved historical documentation (see `docs/product.md`'s and others' citations of it). It doesn't contain the repository URL, and its filename should not change even after a GitHub rename -- it's a snapshot of the original planning document, not current branding.
- **Git history** -- old commits/PR descriptions will continue to say TraceLens. Expected, not a bug.

## Post-rename verification (run, results confirmed)

```bash
# 1. Confirm the rename took effect and the redirect works
curl -sI https://github.com/rathodpratham15/TraceLens | head -1   # -> HTTP/2 301, confirmed
gh repo view rathodpratham15/Sutriva --json name,url               # -> resolves, confirmed

# 2. Confirm the new remote works
git fetch origin   # confirmed, no errors

# 3. Confirm every file in the table above was actually updated (should return nothing)
grep -rln "rathodpratham15/TraceLens" . --include='*.md' --include='*.json' --include='*.ts' | grep -v node_modules

# 4. Existing local clones: update the remote (works via redirect either way, but avoids relying on it)
git remote set-url origin https://github.com/rathodpratham15/Sutriva.git   # done
git remote get-url origin   # -> https://github.com/rathodpratham15/Sutriva.git, confirmed
```

Step 3 still shows `TraceLens_Master_Plan.md` citations and any code comments citing that filename -- expected (see "Explicitly NOT part of this checklist" above); only genuine repository-URL occurrences were checked for and removed. Anyone else with an existing local clone should run step 4 themselves (or rely on the redirect indefinitely, per GitHub's documented behavior).

## Downstream consequences beyond this repo

- **If `@sutriva/mcp-server`/`sutriva` have already been published to npm with the old repository URL in their metadata** (they have, as of `0.1.1` -- the current live version on both packages): npm package metadata is immutable per-version. The URL only updates for whichever version is published *after* this file change -- e.g., bump to `0.1.2`/`0.2.0` and republish. Existing installs of `0.1.0`/`0.1.1` will keep showing the old URL in `npm view`/npmjs.com until someone installs a newer version.
- **The MCP Registry entry** (once registered, see `docs/mcp-registry.md`) references the repository URL in `server.json` too -- same consideration: a new registry version publish is needed to update it.
- **Anything external you've already posted** (a LinkedIn post, a forum reply, etc.) with the old URL will keep working via GitHub's redirect, but won't visually show the new name -- purely cosmetic, not broken.
