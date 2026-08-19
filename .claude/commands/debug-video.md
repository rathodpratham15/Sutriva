---
description: Debug a reproduced bug from a screen recording using TraceLens's temporal evidence, then propose and verify a fix.
argument-hint: <path-to-video>
---

You are debugging the issue reproduced in the video at: $ARGUMENTS

Use TraceLens's MCP tools (`inspect_video`, `get_timeline`, `get_frame`, `search_session`,
`get_evidence`, `analyze_segment`, `get_transcript`, `inspect_environment`) as your primary
source of temporal evidence about what happened in the recording. Do not ask the user to
describe the video to you -- inspect it yourself. Do not guess at timestamps; only report
timestamps and observations that a tool actually returned.

Follow this workflow (`TraceLens_Master_Plan.md` §25):

1. **Inspect the session.** Call `inspect_video` on the given path.
2. **Get the timeline.** Call `get_timeline` to see the full, timestamped sequence of events.
3. **Identify suspicious events.** Look for errors, failed states, unexpected UI, or anything
   that looks like the moment things went wrong. Use `search_session` if you're looking for
   something specific (e.g. "error", "fail").
4. **Retrieve targeted evidence.** For the suspicious timestamp(s), call `get_evidence` with a
   window around it to see what happened immediately before and after -- and `get_frame` to
   look directly at the moment yourself, rather than relying only on the stored description.
   If the coarse timeline isn't detailed enough, call `analyze_segment` on the narrow range
   that matters. If the video has audio, check `get_transcript` too.
5. **Inspect the environment.** Call `inspect_environment` for the current Git context
   (branch, commit, working-tree status, recent commits). Note explicitly that live
   browser/network/console/terminal context is not available yet in this build of
   TraceLens -- don't claim to have information you don't.
6. **Inspect the repository.** Use your normal tools (Read, Grep, Glob) to find the source
   code that plausibly produced what you observed. Prefer files that changed recently
   (`inspect_environment`'s changed files / recent commits) as a starting point, but verify
   against the actual code -- a recent change to a file is a lead, not proof.
7. **Form hypotheses.** State one or more concrete hypotheses for the root cause.
8. **State the evidence for each hypothesis explicitly**, and label your confidence honestly:
   - **Observed** -- directly seen in a frame, transcript, or timeline event.
   - **Confirmed** -- verified by running a test or reproducing the issue.
   - **Likely** -- strongly suggested by correlated evidence (e.g. an error frame lines up
     with a recently-changed file).
   - **Possible** -- a plausible explanation you have not confirmed.
   Never claim a code change *caused* the observed failure merely because it touched a
   related file -- that's "likely" or "possible" evidence, not proof.
9. **Identify the most likely root cause** from your hypotheses.
10. **Ask before making risky or broad changes.** For a small, well-evidenced fix you may
    propose the patch directly; for anything invasive, ask for approval first.
11. **Patch the code.**
12. **Run the test suite** (and typecheck/lint) to confirm the change doesn't break anything.
13. **Reproduce/verify.** If a new recording of the same interaction is available, inspect it
    with `inspect_video` and compare its timeline to the original. If not, say so explicitly
    rather than claiming the fix is verified.
14. **Report your findings** in this shape, clearly separating evidence from inference:

    ```
    Failure:
    <timestamp> -- <what happened, from the timeline>

    Evidence:
    - <observed/likely/possible fact, with its source (frame, evidence id, git context, etc.)>

    Hypothesis:
    <your best explanation, and its confidence level>

    Fix:
    <what you changed and why>

    Verification:
    <tests/typecheck/lint results, and reproduction status -- be honest if unverified>
    ```
