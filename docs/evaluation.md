# Evaluation

TraceLens's central claim is that structured temporal evidence is more useful to a coding agent
than a raw video dump (`TraceLens_Master_Plan.md` §30). This document explains how that claim is
actually measured here, what's automated, what isn't, and why.

## Running it

```bash
pnpm fixtures:eval:generate   # builds demo/buggy-app, records a real repro of each bug via Playwright
pnpm eval                     # or: tracelens eval
```

`pnpm eval` fails fast with a clear message (and a nonzero exit code) if the fixtures haven't been
generated yet -- it does not silently skip scenarios.

## Scenarios

Each scenario (`tests/eval/scenarios.ts`) is one of `demo/buggy-app`'s three bugs, backed by a real
video recorded by actually driving the app with Playwright (`scripts/generate-eval-fixtures.ts`) --
not synthetic color bars, not a hand-recorded screen capture. The scenario format follows the
master plan's §29 shape:

```ts
{
  name: "checkout-schema-mismatch",
  video: "checkout-schema-mismatch.mp4",
  failureTimestamp: 1.1,       // estimated from the fixture script's known wait/action sequence
  toleranceSeconds: 1.0,       // not hand-annotated frame-by-frame -- see note below
  expectedFiles: ["demo/buggy-app/app/checkout/page.tsx"],
  rootCause: "Frontend reads data.orderId but the API returns { id, total } ...",
}
```

**On `failureTimestamp` precision:** these are estimated from the generation script's known
sequence of waits and actions (e.g. "goto, wait 300ms, click, wait 700ms"), not verified by
scrubbing through the video frame-by-frame. That's a reasonable, practical way to build a
benchmark like this without a lot of manual annotation effort -- it's transparently *not* a
hand-verified ground truth, and the tolerance windows are set generously enough to absorb the
resulting imprecision.

## What's measured, and how

### Automated (no model API call, deterministic)

| Metric | How it's computed |
|---|---|
| **Temporal localization** | `inspectVideo` (with the offline `MockVisionProvider`) samples frames and builds a timeline; the metric is the distance from the *nearest* sampled event to `failureTimestamp`. Passes if within `toleranceSeconds`. |
| **Evidence retrieval** | Calls `getEvidenceAround(sessionId, failureTimestamp, toleranceSeconds)` and checks it's non-empty. |
| **Context efficiency** | Two comparisons: (1) frames TraceLens actually samples vs. every frame at the video's native fps ("baseline" = what you'd get decoding the whole thing); (2) the byte size of one `get_frame` call vs. an *estimated* baseline of sending every native-fps frame as a separate image (`baselineFrameCount * singleFrameBytes`). See the note below on why this isn't compared to the raw video *file* size. |
| **Latency** | Wall-clock time for the `inspectVideo` ingest pipeline (mock provider, so this measures pipeline overhead, not model latency). |

**Why context efficiency isn't "single frame vs. video file size":** an earlier version of this
harness compared a single extracted PNG frame's size against the whole (compressed) video file's
size. For these short (1-3s), mostly-static demo clips, h264's temporal compression makes the
*entire video* smaller than one lossless PNG frame -- a real result, but a misleading one, since a
vision model consuming "the whole video" would need it decoded into frames anyway, not the
compressed container bytes. The metric now compares against an estimated *decoded*-frame baseline
instead, which is the actually-relevant comparison and reliably shows the intended 92-98% reduction
on these fixtures. Longer, more visually varied recordings would show an even larger gap on the raw
file-size comparison too; it just doesn't hold for these particular short clips.

### Manual (requires an actual agent)

**Root-cause accuracy, code localization, and patch success genuinely require reading the
repository and reasoning about it.** There is no deterministic, offline way to compute these, and
this harness will not fake it by embedding a real model API call inside what's supposed to be a
repeatable, offline benchmark (`TraceLens_Master_Plan.md`: "do not make normal tests depend on paid
model APIs"). Instead, each scenario's report includes the exact command to grade it by hand:

```
claude
> /debug-video fixtures/videos/eval/checkout-schema-mismatch.mp4
```

Compare Claude's stated root cause against `rootCause` and the files it identifies/edits against
`expectedFiles`. This is honest rather than automated, but it's exactly the same workflow a real
user gets -- the "eval" is really "did the flagship demo workflow work," graded by a human once per
scenario, not simulated.

### Agentic (optional, real API calls, not run by `pnpm test`/CI)

`pnpm eval:agentic` (or `tracelens eval --agentic`) automates the manual grading above instead of
requiring a human to run `/debug-video` and eyeball the result. This is a genuinely separate,
explicitly opt-in path from the deterministic harness above -- it costs a real Claude API call per
scenario (roughly $0.50-$1, a few minutes each) and is never invoked by `pnpm test`, `pnpm eval`, or
CI, honoring the same "don't make normal tests/benchmarks depend on paid model APIs" rule; it's the
thing a human would otherwise do by hand, scripted, not a change to what counts as a normal test.

**How it works** (`tests/eval/agentic-harness.ts`), per scenario:

1. Create a disposable `git worktree` at `HEAD` (a full checkout sharing this repo's object store)
   so Claude's patch can never touch your actual working tree; `git worktree remove --force` always
   cleans it up, success or failure.
2. Record a **BEFORE** session: build and start `demo/buggy-app` in the worktree, then drive the
   exact same scripted repro used to generate the video fixture (`tests/eval/repros.ts`, shared with
   `scripts/generate-eval-fixtures.ts` so "before" and "after" are guaranteed the same interaction)
   through a real **live**, instrumented browser session (`startLiveSession` from `@tracelens/live`)
   -- not another video recording, because real network/console events (what `compare_sessions`
   reads) only exist on the live path, never from video-replay ingestion.
3. Run `claude -p "<the expanded /debug-video prompt>" --output-format json --permission-mode
   bypassPermissions` with `cwd` set to the worktree -- the same MCP server auto-discovery, tools,
   and workflow as an interactive session, just non-interactive and unattended. (Needs Node >= 22 in
   the invoking shell: the MCP server subprocess Claude spawns inherits that environment, and its
   own `assertSupportedNodeVersion` guard silently refuses to start otherwise -- Claude then reports
   "no MCP servers connected" with no further explanation, which cost real debugging time to track
   down the first time.)
4. Grade **code localization**: `git diff --name-only` in the worktree vs. `expectedFiles`.
5. Grade **root-cause accuracy**: deterministic keyword-overlap between Claude's response text and
   the scenario's `rootCause` (`keywordOverlapRatio`, `tests/eval/agentic-harness.ts`) -- not a
   second model call. This is a heuristic, not semantic understanding, same honesty standard as
   `redactSecrets`/`findRelatedEventIds` elsewhere in this codebase.
6. Rebuild the worktree's (now patched) `demo/buggy-app` and record an **AFTER** session with the
   same repro.
7. Grade **patch success**: `compareSessions(beforeId, afterId)` -- but only for
   `checkout-schema-mismatch`, whose bug produces a real console error `compare_sessions` can
   actually see. `search-race-condition` (a stale render, no error, no failing request) and
   `responsive-regression` (a pure CSS layout bug) produce **no** console/network signal at all --
   `compare_sessions` genuinely cannot detect either, so those two scenarios use a direct,
   scenario-specific Playwright assertion instead (`EVAL_FIX_VERIFICATIONS`, `tests/eval/repros.ts`:
   the rendered search results match the un-stale query, or the button's bounding box no longer
   overlaps the header's). Being explicit that only 1 of 3 scenarios gets a `compare_sessions`
   signal -- rather than implying it covers all three -- matches this project's existing posture on
   heuristic boundaries (see `compare.ts`'s own doc comment, or the context-efficiency note above).

**Live-verified, not just built**: running this against the real demo bugs produced a correct patch,
a 100% code-localization match, a root-cause hypothesis a human would call correct, and (for all
three scenarios, via their respective methods above) a confirmed real fix -- for
`checkout-schema-mismatch` specifically, `compare_sessions` reported "1 console error(s) resolved,
0 new console error(s)" after Claude's actual patch.

## Baseline vs. TraceLens (the actual thesis)

`TraceLens_Master_Plan.md` §30 frames the interesting comparison as: a naive approach that sends a
whole video (or every frame) to a model, vs. TraceLens's progressive disclosure (metadata →
timeline → targeted evidence → targeted frame). The context-efficiency metric above *is* that
comparison, made concrete and measured: on the three demo bugs, TraceLens samples 92-96% fewer
frames than native fps would require, and a single targeted frame retrieval is 96-98.6% smaller
than an estimated "send every frame" baseline. That's the number worth citing, not a raw feature
count.

## Interpreting a report

`pnpm eval` prints a per-scenario breakdown and writes `.tracelens-eval-report.json` (gitignored --
regenerate it, don't commit it) with the same data in machine-readable form. "Automated checks: N/M
scenarios pass" at the end summarizes temporal localization + evidence retrieval across all
scenarios; root-cause/code-localization/patch-success require the manual `/debug-video` pass
described above.
