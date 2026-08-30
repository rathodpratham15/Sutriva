# Demo recording script

## Audit: is the flagship demo actually ready?

Yes, largely already satisfied by existing content, not a gap that needed new engineering. The README's "Flagship demo: the closed loop" section already has: three real bugs with symptom/root-cause/fix documented (`demo/buggy-app/README.md`), three recorded GIFs (`docs/assets/bug-{1,2,3}-*.gif`), a live-verified results table (code localization, root-cause hypothesis, before/after) from a real `pnpm eval:agentic` run -- not simulated -- and exact commands to reproduce it live. What was actually missing was a *recording script* (this file) to turn that narrative into a timed walkthrough someone could film -- that's the only real gap this audit found.

A concrete script for recording the flagship demo (see the README's "Flagship demo: the closed loop" section for the narrative this is based on, and `demo/buggy-app` for the actual bug used). Target length: **~2 minutes**. Prioritize the temporal-retrieval moment, the diagnosis, the fix, and the verification -- don't spend recording time explaining implementation details; that's what the written docs are for.

## Prerequisites (set up before recording, not on camera)

```bash
git clone https://github.com/rathodpratham15/Sutriva.git && cd Sutriva
pnpm install && pnpm build
pnpm --filter buggy-app build
pnpm --filter buggy-app start &   # http://localhost:4173, leave running
```

Have a second terminal ready for `sutriva debug --live`, and Claude Code open in a third pane/window with the MCP server connected (this repo's `.mcp.json` auto-discovers it).

## Recording

| Time | Action | Dialogue / on-screen text | Expected output |
|---|---|---|---|
| 0:00-0:10 | Title card | "Sutriva: temporal memory for coding agents" | -- |
| 0:10-0:20 | Terminal: start a live session | `sutriva debug --live --url http://localhost:4173/checkout` | Browser window opens; terminal prints `Live session started: session_...` |
| 0:20-0:35 | In the opened browser: click "Place order" | (say, on camera or as narration) *"Follow me while I reproduce this."* | Button changes to "Processing...", never resolves -- the bug |
| 0:35-0:50 | Switch to Claude Code | *"What happened?"* | Claude calls `get_current_context`/`get_timeline`, reports the failure with a real timestamp (e.g. *"the checkout request returned 200, but the frontend crashed reading `data.orderId`, which the API doesn't send"*) -- **this is the temporal-retrieval moment; don't rush past it** |
| 0:50-1:05 | Still in Claude Code | *(Claude continues autonomously)* | Claude calls `inspect_environment`, reads `demo/buggy-app/app/checkout/page.tsx` and `app/api/checkout/route.ts`, states a labeled hypothesis (*"likely: schema mismatch between `id` and `orderId`"*) |
| 1:05-1:15 | Prompt | *"Fix it."* | Claude patches `app/checkout/page.tsx` to read `data.id` instead of `data.orderId` |
| 1:15-1:30 | Claude runs tests | *(automatic, per `/debug-video`'s workflow)* | `pnpm typecheck`/`pnpm lint` (or the app's own checks) pass |
| 1:30-1:45 | Reproduce again | Restart `buggy-app`, click "Place order" again in a fresh `sutriva debug --live` session | Confirmation message now appears correctly (no more stuck "Processing...") |
| 1:45-2:00 | Claude verifies | *"Compare the session before my fix to the one after -- did it work?"* | Claude calls `compare_sessions(before, after)`, reports concretely: *"1 console error resolved, 0 new console errors"* -- close on this line |

## Recording notes

- Use the real demo app (`demo/buggy-app`'s `checkout-schema-mismatch` bug) -- this exact flow has been live-verified end to end via `pnpm eval:agentic` (see `docs/evaluation.md`), so there's no risk of the bug not reproducing or the fix not working on camera.
- Don't narrate the SQLite schema, the MCP tool list, or the provider abstraction during the recording -- that's what `docs/architecture.md` is for. The demo should sell the *loop*, not the internals.
- If recording a second cut, the `search-race-condition` or `responsive-regression` bugs work identically (see `demo/buggy-app/README.md`) and are useful for showing that `compare_sessions` correctly reports "nothing changed" on the console/network dimensions for the CSS-only bug -- an honest, not overclaimed, before/after story.
- Keep Claude's responses on screen long enough to read the confidence-labeled hypothesis (`observed`/`likely`/`possible`/`confirmed`) -- that labeling is part of the actual product behavior, not just this demo's narration.
