# Example sessions

Real, captured output from running TraceLens against the fixtures already in this repo -- not a
mockup. Every command below runs offline against the deterministic mock vision provider (no
`ANTHROPIC_API_KEY` needed); with a real key set, `[visual]` descriptions come from
`AnthropicVisionProvider`'s actual scene analysis instead of the mock's byte-delta heuristic. See
the [Quickstart](../README.md#quickstart) to reproduce this yourself.

## Replay debugging, via the CLI

```bash
$ tracelens inspect fixtures/videos/checkout-bug.mp4
Session:   session_76cff337-d2a3-426f-89c7-dffd961eb57a
Provider:  mock
Duration:  14.00s
FPS:       25.00
Size:      640x360
Audio:     no
Hash:      6919e265a2907baf...
Events:    8

Next: tracelens timeline "fixtures/videos/checkout-bug.mp4"
```

```bash
$ tracelens timeline fixtures/videos/checkout-bug.mp4
Session session_76cff337-d2a3-426f-89c7-dffd961eb57a -- 8 event(s)

    0.00s  [visual]  Frame 1 at t=0.00s.
    2.00s  [visual]  Frame 2 at t=2.00s.
    4.00s  [visual]  Frame 3 at t=4.00s.
    6.00s  [visual]  Frame 4 at t=6.00s.
    8.00s  [visual]  Frame 5 at t=8.00s. Possible visual change since previous frame.
   10.00s  [visual]  Frame 6 at t=10.00s.
   12.00s  [visual]  Frame 7 at t=12.00s.
   13.90s  [visual]  Frame 8 at t=13.90s.
```

The mock provider flagged a byte-delta change at `t=8.00s` -- that's the moment worth looking at
more closely, without anyone having watched the whole 14s video.

```bash
$ tracelens search fixtures/videos/checkout-bug.mp4 "change"
1 match(es) for "change":

    8.00s  [visual]  Frame 5 at t=8.00s. Possible visual change since previous frame.
```

```bash
$ tracelens analyze fixtures/videos/checkout-bug.mp4 --start 7 --end 9 \
    --question "what changed at this moment"
Segment 7s-9s (5 frame(s) sampled)

Segment 7.0s-9.0s spans 5 sampled frame(s). Question asked: "what changed at this moment". (mock
provider: no real visual analysis performed)

Confidence: 0.3
```

`analyze_segment` densely re-samples the narrow window instead of relying on the coarse 2s-interval
timeline -- this is the same tool `/debug-video` calls when the timeline alone isn't enough detail.
With a real vision provider, this is where an actual description of what's on screen at `t=8s`
would appear, in place of the mock's placeholder text.

## Temporal rewind (`get_evidence`), via MCP

The CLI commands above call the same underlying functions Claude reaches through MCP. This is the
`get_evidence` tool's actual response for "what happened right around `t=8s`?" on the session above
(`aroundSeconds: 8, windowSeconds: 3`):

```json
{
  "sessionId": "session_76cff337-d2a3-426f-89c7-dffd961eb57a",
  "aroundSeconds": 8,
  "windowSeconds": 3,
  "count": 3,
  "evidence": [
    { "start": 6, "end": 6, "type": "frame", "description": "Frame 4 at t=6.00s.", "confidence": 0.5 },
    { "start": 8, "end": 8, "type": "frame", "description": "Frame 5 at t=8.00s. Possible visual change since previous frame.", "confidence": 0.6 },
    { "start": 10, "end": 10, "type": "frame", "description": "Frame 6 at t=10.00s.", "confidence": 0.5 }
  ]
}
```

(Artifact/evidence IDs trimmed for readability -- the real response includes a `source` pointing at
the exact stored frame artifact backing each entry.)

## Environment correlation (`inspect_environment`)

A point-in-time capture of `inspect_environment({ includeDiff: false })` run from this repo (while
this very file was still an untracked change, which is why `dirty` is `true` below -- an honest,
if slightly recursive, demonstration that Git state is read live, not cached), showing the actual
shape Claude receives. Live-session and capability fields are always present so Claude never has to
guess whether silence means "nothing happening" versus "not currently observable":

```json
{
  "git": {
    "isRepo": true,
    "branch": "phase-7-polish",
    "commit": "6e0ba8b3d4aef5be9dcfd5c24cae81485025f506",
    "commitMessage": "Demo screenshots for the three buggy-app bugs (Phase 7 polish)",
    "dirty": true,
    "changedFiles": ["docs/example-sessions.md"],
    "recentCommits": ["... last 5 commits, hash/message/date ..."]
  },
  "liveSession": {
    "active": false,
    "note": "Start one with `tracelens debug --live` to get live browser/network/console context."
  },
  "browser": { "available": true, "note": "Populated only while a live session is running -- see get_current_context." },
  "network": { "available": true, "note": "Populated only while a live session is running -- see get_current_context." },
  "console": { "available": true, "note": "Populated only while a live session is running -- see get_current_context." },
  "terminal": { "available": true, "note": "Populated only for commands run via `tracelens exec -- <command>` during a live session." }
}
```

## `compare_sessions` -- reading the output shape

`compare_sessions` is the "reproduce → compare" verification step (see
[Verifying a fix](../README.md#verifying-a-fix) for the real workflow: reproduce a bug live, patch
the code, reproduce it again, then compare the two resulting session IDs). To show the actual
response shape without requiring a live browser session, here it's called on two *unrelated*
fixtures (`fixtures/videos/sample.mp4` as "before", `checkout-bug.mp4` as "after") -- deliberately
not a real before/after fix:

```json
{
  "before": { "sessionId": "session_18abc7a6-...", "eventCount": 9, "consoleErrorCount": 0, "networkFailureCount": 0 },
  "after": { "sessionId": "session_76cff337-...", "eventCount": 8, "consoleErrorCount": 0, "networkFailureCount": 0 },
  "resolvedEndpoints": [],
  "newOrChangedFailingEndpoints": [],
  "resolvedConsoleErrors": [],
  "newConsoleErrors": [],
  "summary": "0 endpoint(s) fixed, 0 new/changed failure(s), 0 console error(s) resolved, 0 new console error(s)"
}
```

Both fixtures are silent, visual-only recordings with no network/console events, so the honest
answer is "nothing changed" -- `compare_sessions` doesn't invent a network fix or a resolved error
just because two sessions differ. Run it against a real `demo/buggy-app` before/after pair (see
`docs/evaluation.md`) to see `resolvedEndpoints`/`resolvedConsoleErrors` actually populate, e.g.
`POST /api/checkout: 500 → 200` once Bug 1's fix (`demo/buggy-app/README.md`) is applied.

## The full agentic workflow

The steps above are what `/debug-video` and `tracelens debug --live` automate end to end --
inspect/instrument → timeline → evidence/frames → `inspect_environment` → a confidence-labeled
hypothesis (`observed`/`likely`/`possible`/`confirmed`, never asserted causality) → a patch → a
test → reproducing the bug again → `compare_sessions`. See `.claude/commands/debug-video.md` for the
exact 14-step prompt, and `demo/buggy-app/README.md` for three real bugs to run it against.
