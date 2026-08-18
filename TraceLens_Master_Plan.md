# TraceLens — Master Product & Engineering Plan

> **Temporal context for coding agents.**
>
> TraceLens is a local-first debugging companion for Claude Code that turns live developer sessions and recorded sessions into structured, timestamped evidence. It lets an agent reason about **what happened**, not only **what the current source code looks like**.

---

## 1. Executive Summary

### The problem

Coding agents are increasingly capable of reading repositories, running commands, inspecting browsers, and modifying code. But a major category of developer context remains difficult to represent:

- screen recordings
- live UI behavior
- transient browser state
- network failures
- console errors
- interaction sequences
- audio explanations
- "watch me reproduce this bug"
- "what just happened?"
- "what changed immediately before the failure?"

A raw video is not an efficient agent context format. Sending every frame to a model is expensive, noisy, and difficult to ground.

### The product thesis

TraceLens should not be positioned as:

> "Claude Code can read MP4 files."

Instead:

> **TraceLens gives coding agents temporal memory: a structured, queryable representation of what happened during a live or recorded developer session.**

The central abstraction is a **Temporal Session**.

A session can be:

1. **Live** — events are arriving while the developer works.
2. **Replay** — the source is an existing MP4/session recording.
3. **Recorded** — TraceLens stores a complete debugging session for later inspection.

The same event/evidence model powers all three.

### Flagship workflow

```text
Developer:
"Claude, follow me while I reproduce this bug."

                    ↓

                TraceLens

    screen ─┐
    browser ├──→ temporal event stream
    network ┤
    console ┤
    audio ──┘
                    ↓
             evidence timeline
                    ↓
               Claude Code
                    ↓
        source / Git / tests
                    ↓
               code change
                    ↓
              live verification
```

The user should eventually be able to say:

> "Follow me while I reproduce this."

and Claude should observe relevant changes, identify a failure, inspect the repository, propose a fix, apply it after approval, and verify the result.

---

# 2. Strategic Positioning

## 2.1 What not to build

Do not make the project primarily:

- an MP4 summarizer
- a generic video-to-LLM wrapper
- a video search engine
- a huge MCP server with dozens of redundant tools
- a cloud video SaaS
- a dashboard-heavy product
- a clone of an existing video-analysis provider

Those are already crowded areas.

## 2.2 What TraceLens should own

The differentiated layer is:

### Temporal grounding

Every observation has a timestamp and evidence reference.

### Progressive disclosure

The model starts with cheap summaries and requests detailed frames/segments only when needed.

### Developer grounding

Visual observations can be correlated with:

- browser events
- DOM changes
- console messages
- network requests
- terminal output
- Git history
- source files
- tests

### Agent actionability

The output should support:

```text
observation
→ hypothesis
→ source localization
→ code change
→ verification
```

not just:

```text
video
→ summary
```

### Live + replay symmetry

Live sessions and MP4 recordings should use the same temporal session/event model.

### Local-first privacy

Developer recordings and source code are sensitive. Keep the primary architecture local and make outbound model usage explicit.

---

# 3. Product Modes

## 3.1 Live Mode

Command:

```bash
tracelens debug --live
```

The developer works normally while TraceLens observes the session.

Example:

```text
Developer:
"Follow me while I reproduce this bug."

TraceLens:
Session started.

Developer:
[clicks Checkout]

TraceLens:
14:02:31.120 click Checkout
14:02:31.142 POST /api/checkout
14:02:31.411 HTTP 500
14:02:31.413 console.error
14:02:31.420 loading state active
```

Claude can then request relevant evidence.

## 3.2 Replay Mode

Command:

```bash
tracelens debug bug.mp4
```

Claude can query:

- timeline
- transcript
- frames
- segments
- visual events
- errors

Example:

> "What happened immediately before the failure?"

## 3.3 Session Mode

Command:

```bash
tracelens session
```

Capture a complete developer session.

At the end:

```bash
tracelens session report
```

Generate:

- issues encountered
- timestamps
- evidence
- fixes
- tests
- unresolved issues

---

# 4. Core User Experience

The primary demo should be a real debugging loop.

## Demo

Start a deliberately buggy web application.

Start TraceLens.

```text
tracelens debug --live
```

Connect Claude Code.

Tell Claude:

> "Follow me while I reproduce this bug."

Reproduce the issue.

Claude receives targeted temporal context.

Claude identifies:

```text
00:14.8 — Checkout clicked
00:14.9 — POST /api/checkout
00:15.2 — HTTP 500
00:15.3 — Error boundary rendered
```

Claude inspects source.

It discovers a likely schema mismatch.

Claude asks:

> "I found the likely cause. Can I patch it?"

User approves.

Claude edits the source.

Claude runs tests.

User reproduces the issue again.

The event timeline now shows:

```text
POST /api/checkout → 200
UI → checkout success
```

Claude reports:

> "The failure is no longer reproducible."

This is the flagship product demonstration.

---

# 5. Architecture

```text
                         ┌─────────────────────┐
                         │     Claude Code     │
                         └──────────┬──────────┘
                                    │
                                   MCP
                                    │
                         ┌──────────▼──────────┐
                         │     TraceLens       │
                         │      MCP Server     │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
             Live Input         Replay Input       Session Store
                 │                  │                  │
          ┌──────┼──────┐          MP4                │
          │      │      │           │                 │
       Screen Browser Audio         ▼                 │
          │      │      │      Video Pipeline         │
          │      │      │           │                 │
          └──────┼──────┘           │                 │
                 │                  │                 │
                 └──────────┬───────┘                 │
                            ▼                         │
                    Temporal Event Bus ◄──────────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          Timeline       Evidence       Artifacts
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                    Correlation Engine
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
           Browser        Git          Source
           Network        History       Code
           Console        Diffs         Tests
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                     Claude Code
                            │
                    ┌───────┴───────┐
                    ▼               ▼
                  Patch           Explain
                    │
                    ▼
                 Verify
```

---

# 6. Architectural Principle: One Temporal Model

The most important design decision is that live and recorded sessions share the same event model.

A live session:

```text
events arrive → timeline grows
```

A replay session:

```text
events already exist → timeline is queried
```

Claude should not care whether the evidence came from:

- an MP4
- a live browser
- a saved session

The interface should remain consistent.

---

# 7. Repository Structure

Preferred structure:

```text
tracelens/
├── apps/
│   ├── mcp-server/
│   └── cli/
│
├── packages/
│   ├── core/
│   ├── timeline/
│   ├── evidence/
│   ├── video/
│   ├── browser/
│   ├── providers/
│   ├── git/
│   └── storage/
│
├── plugin/
│   ├── .claude-plugin/
│   ├── commands/
│   └── skills/
│
├── demo/
│   └── buggy-app/
│
├── fixtures/
│   ├── videos/
│   └── sessions/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── eval/
│
├── docs/
│   ├── architecture.md
│   ├── product.md
│   ├── competitive-analysis.md
│   ├── evaluation.md
│   └── privacy.md
│
├── scripts/
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── package.json
```

Adapt if a simpler monorepo structure is better.

---

# 8. Technology Choices

## Runtime

- TypeScript
- Node.js

## Media

- FFmpeg

## Browser

- Playwright

## Persistence

- SQLite

## Validation

- Zod

## Testing

- Vitest

## MCP

- Current official MCP TypeScript SDK / documented MCP interface

## Git

- Git CLI or lightweight library

## Model providers

Use an interface-based provider abstraction.

Potential implementations:

- Claude
- Gemini
- OpenAI

Do not hard-code one provider into core logic.

---

# 9. Core Domain Model

## Session

```typescript
interface Session {
  id: string;
  mode: "live" | "replay" | "recorded";
  startedAt: string;
  endedAt?: string;
  repository?: RepositoryContext;
  sources: SessionSource[];
}
```

## Temporal Event

```typescript
interface TemporalEvent {
  id: string;
  sessionId: string;

  timestamp: {
    start: number;
    end: number;
  };

  type:
    | "visual"
    | "audio"
    | "interaction"
    | "network"
    | "console"
    | "dom"
    | "terminal"
    | "git"
    | "system";

  description: string;
  confidence?: number;

  source: {
    kind: string;
    reference: string;
  };

  relatedEventIds: string[];
}
```

## Evidence

```typescript
interface Evidence {
  id: string;
  eventId?: string;

  type: string;

  timestamp: {
    start: number;
    end: number;
  };

  description: string;
  confidence: number;

  source: {
    kind: string;
    reference: string;
  };

  artifactId?: string;
  relatedEvidenceIds: string[];
}
```

## Repository Context

```typescript
interface RepositoryContext {
  root: string;
  branch?: string;
  commit?: string;
}
```

Keep the domain model provider-agnostic.

---

# 10. Video Pipeline

Given:

```text
/path/to/video.mp4
```

TraceLens must:

1. Validate the file.
2. Calculate a content hash.
3. Extract metadata.
4. Determine duration.
5. Determine FPS.
6. Determine resolution.
7. Determine audio availability.
8. Extract representative frames.
9. Extract audio if present.
10. Generate transcript when configured.
11. Identify visual/scene changes where practical.
12. Build a temporal timeline.
13. Persist artifacts.
14. Allow targeted frame extraction by timestamp.

Use FFmpeg.

Never load an entire large video into memory.

---

# 11. Intelligent Sampling

Do not extract every frame by default.

Use progressive sampling:

```text
Coarse sampling
      ↓
Potentially interesting intervals
      ↓
Dense sampling around those intervals
      ↓
Model analysis
```

Support:

- fixed interval sampling
- scene-change sampling
- event-driven sampling
- targeted frame retrieval

Document tradeoffs.

---

# 12. Progressive Disclosure

This is a core differentiator.

Model access should progress through:

```text
Level 0
Metadata

↓
Level 1
Timeline

↓
Level 2
Relevant event summaries

↓
Level 3
Targeted frames

↓
Level 4
Detailed segment analysis
```

Claude should not receive raw video data unless necessary.

Every MCP output should be bounded and concise.

---

# 13. MCP Tool Surface

Keep the tool set small.

## inspect_session

Returns session metadata and available sources.

## inspect_video

Returns video metadata and creates/retrieves a session.

## get_timeline

Returns a concise timeline.

## search_session

Searches temporal evidence.

## get_evidence

Retrieves evidence around an event or time range.

## get_frame

Returns a frame around a timestamp.

## analyze_segment

Runs targeted multimodal analysis over a time range.

## get_transcript

Returns transcript segments.

## inspect_environment

Returns available browser/console/network/terminal/Git context.

## inspect_session

Eventually becomes the high-level context entry point.

Do not create dozens of overlapping tools.

---

# 14. MCP Tool Design

Every tool must have:

- strict input schema
- strict output schema
- useful descriptions
- bounded output
- clear errors
- timestamps
- stable IDs

Tool descriptions should tell Claude when and why to use them.

Avoid returning raw binary blobs if an artifact reference can be used.

---

# 15. Live Debugging

Live mode is the major expansion beyond MP4.

## Live sources

Capture where possible:

### Screen

- screenshots
- screen changes
- active application/window metadata where available

### Browser

- URL
- navigation
- clicks
- inputs
- DOM changes
- console
- exceptions
- requests
- responses
- status codes
- timing

### Terminal

- command start
- command completion
- stdout/stderr
- exit code

### Git

- branch
- commit
- diff
- changed files

### Audio

Optional transcription.

Do not make microphone/audio mandatory.

---

# 16. Live Event Bus

Build an internal event bus.

Example:

```typescript
interface EventBus {
  publish(event: TemporalEvent): void;
  subscribe(listener: EventListener): Unsubscribe;
}
```

Events should be timestamped as close to their source as practical.

The event bus should allow:

- persistence
- correlation
- live subscribers
- MCP queries
- replay

---

# 17. "Follow Me" Mode

Implement a conceptual workflow:

```text
tracelens debug --live
```

Claude is told:

> "You can observe the active TraceLens session. Use the session tools when the user asks you to watch, inspect, or understand what is happening."

The system must NOT stream every event into the model.

Instead:

```text
continuous local observation
          ↓
event detection
          ↓
compact timeline
          ↓
Claude requests details
```

This is pull-based context retrieval.

---

# 18. "Look at This" Context Snapshot

Implement a high-value operation for live debugging:

```text
get_current_context()
```

It should provide, where available:

- current screenshot
- current URL
- recent events
- recent console errors
- recent network failures
- active Git state
- recent terminal output
- a short recent timeline

The result should be small enough to use interactively.

---

# 19. Temporal Rewind

Support:

```text
get_evidence(
  sessionId,
  aroundTimestamp,
  windowSeconds
)
```

This allows Claude to answer:

> "What happened immediately before this?"

The user should be able to reason backward and forward through a session.

---

# 20. Session Recording

A session should be persistable.

Example:

```text
sessions/
  session-2026-08-18/
    session.json
    timeline.json
    screenshots/
    video/
    transcript.json
    network.json
    console.json
```

Prefer SQLite for indexing and local artifact storage for large files.

---

# 21. Browser Instrumentation

Use Playwright.

Capture:

```text
page navigation
click
input
console
pageerror
request
response
requestfailed
DOM state where practical
```

Normalize timestamps into the common session timeline.

Do not attempt perfect DOM diffing in the first version.

Prioritize high-value events.

---

# 22. Terminal Instrumentation

Where safe and practical, record:

```text
command
start time
end time
exit code
stdout
stderr
```

Do not capture secrets intentionally.

Provide redaction hooks.

---

# 23. Git Correlation

At minimum support:

```text
current branch
current commit
recent commits
working-tree diff
changed files
```

A debugging hypothesis should be able to reference:

```text
file
line
commit
diff
```

Do not automatically claim causality merely because a commit changed a file.

Use language such as:

- "Observed"
- "Likely"
- "Possible"
- "Confirmed by test"

---

# 24. Evidence Graph

Represent relationships such as:

```text
User click
   ↓
Network request
   ↓
HTTP 500
   ↓
Console error
   ↓
UI failure
   ↓
Source function
   ↓
Git commit
```

The graph does not need to be a sophisticated graph database.

SQLite relations are sufficient for the MVP.

---

# 25. Agent Debugging Workflow

Create:

```text
/debug-video <path>
```

and live debugging instructions.

The agent workflow should be:

```text
1. Inspect session.
2. Get timeline.
3. Identify suspicious events.
4. Retrieve targeted evidence.
5. Inspect browser/network/console context.
6. Inspect repository.
7. Form hypotheses.
8. State evidence supporting each hypothesis.
9. Identify likely root cause.
10. Ask before risky changes.
11. Patch code.
12. Run tests.
13. Reproduce/verify.
14. Report before/after evidence.
```

---

# 26. Verification Loop

The system becomes significantly more useful if it can close the loop.

Before fix:

```text
failure reproduced
```

After fix:

```text
same interaction
→ expected behavior
```

The agent should explicitly compare:

```text
before timeline
vs
after timeline
```

This is an important future feature.

---

# 27. Before/After Comparison

Support two sessions:

```text
compare_sessions(before, after)
```

Return meaningful differences such as:

```text
Before:
POST /checkout → 500

After:
POST /checkout → 200
```

or:

```text
Before:
UI remained in loading state

After:
UI transitioned to success state
```

This can become a powerful debugging primitive.

---

# 28. Demo Application

Build a deterministic Next.js application with at least three bugs.

## Bug 1 — API schema mismatch

Frontend expects one response shape, backend provides another.

## Bug 2 — async race

Two asynchronous operations produce an inconsistent UI state.

## Bug 3 — responsive visual regression

A UI element behaves incorrectly at a specific viewport.

The bugs must be reproducible.

Create test fixtures and instructions for recording/replaying them.

---

# 29. Evaluation Benchmark

Create a controlled benchmark.

Each case:

```json
{
  "name": "checkout-api-regression",
  "video": "checkout.mp4",
  "failureTimestamp": 14.8,
  "expectedFiles": [
    "src/api/checkout.ts"
  ],
  "rootCause": "response schema mismatch"
}
```

Measure:

## Temporal localization

Distance between predicted and ground-truth failure timestamp.

## Evidence retrieval

Whether the relevant evidence was retrieved.

## Code localization

Whether the correct source file was found.

## Root-cause accuracy

Whether the correct issue was identified.

## Patch success

Whether tests pass after the fix.

## Context efficiency

Tokens/model calls required.

## Latency

Time from user request to useful diagnosis.

---

# 30. Evaluation Philosophy

The project should demonstrate that structured temporal context is more useful than blindly sending a whole video.

Compare:

### Baseline

Full/large video context.

### TraceLens

Progressive timeline + targeted evidence.

Compare:

- token usage
- latency
- accuracy
- relevant evidence retrieval
- successful fixes

This experiment is potentially more valuable to the Anthropic audience than raw feature count.

---

# 31. Privacy

Local-first by default.

Requirements:

- no telemetry by default
- no automatic upload
- explicit model provider configuration
- document which artifacts leave the machine
- never log API keys
- avoid logging raw recordings
- support redaction hooks
- clear storage location
- clear deletion command

Add:

```bash
tracelens clean
```

for removing derived artifacts.

---

# 32. CLI

Provide:

```bash
tracelens doctor
tracelens inspect video.mp4
tracelens timeline video.mp4
tracelens search video.mp4 "error"
tracelens analyze video.mp4 --start 10 --end 20
tracelens debug video.mp4
tracelens debug --live
tracelens session list
tracelens session report
tracelens eval
tracelens clean
```

Keep the CLI simple.

---

# 33. Claude Code Integration

Use the current documented Claude Code extension mechanisms.

Do not rely on undocumented private APIs.

Provide:

- MCP configuration
- plugin manifest if appropriate
- `/debug-video`
- live debugging instructions
- installation instructions
- example tool calls

Claude Code should be able to discover the TraceLens MCP server cleanly.

---

# 34. Model Provider Abstraction

Use interfaces such as:

```typescript
interface VisionProvider {
  analyzeFrames(input: FrameAnalysisInput): Promise<FrameAnalysisResult>;
  analyzeSegment(input: SegmentAnalysisInput): Promise<SegmentAnalysisResult>;
}
```

and:

```typescript
interface TranscriptionProvider {
  transcribe(input: AudioInput): Promise<Transcript>;
}
```

Keep provider-specific code isolated.

---

# 35. Error Handling

Handle:

- missing FFmpeg
- invalid MP4
- corrupted media
- unsupported codec
- missing API key
- provider timeout
- provider rate limit
- malformed model response
- browser unavailable
- Git repository unavailable
- SQLite errors
- oversized media
- insufficient disk space

Errors should be actionable.

Example:

```text
FFmpeg was not found.

Install FFmpeg:
macOS: brew install ffmpeg
Ubuntu: sudo apt install ffmpeg
```

---

# 36. Performance

Optimize for:

- large recordings
- repeated queries
- repeated frame requests
- long sessions

Use:

- caching
- content hashing
- artifact reuse
- indexed timestamps
- bounded model context
- asynchronous processing

Do not add infrastructure such as Redis, Kafka, Kubernetes, or cloud queues unless actual requirements justify it.

---

# 37. Security

Never:

- commit secrets
- expose arbitrary filesystem access through MCP without safeguards
- execute arbitrary commands based solely on model-generated video observations
- silently upload recordings
- trust unvalidated model output

Where a tool accepts a path, validate it.

Document security assumptions.

---

# 38. Deployment

Primary deployment:

## Local CLI + MCP

Prefer:

```bash
npx tracelens
```

or a globally installable CLI.

The core system should run locally.

Optional future cloud architecture can be documented but is not required for MVP.

---

# 39. Documentation

Create:

## README.md

Include:

- one-line pitch
- demo GIF/video placeholder
- why TraceLens exists
- quickstart
- Claude Code setup
- live debugging example
- MP4 replay example
- architecture
- MCP tools
- provider configuration
- privacy
- evaluation
- limitations
- roadmap

## docs/architecture.md

Explain:

- temporal model
- event bus
- evidence model
- progressive disclosure
- provider abstraction
- MCP architecture

## docs/product.md

Explain:

- user problem
- product thesis
- workflows
- differentiation

## docs/evaluation.md

Explain benchmark design and metrics.

## docs/competitive-analysis.md

Compare conceptually with existing video understanding / MCP projects without making unsupported claims.

---

# 40. Competitive Positioning

Existing categories include:

- video understanding APIs
- video search
- video-analysis MCP servers
- Claude Code video plugins
- computer-use/browser agents

Do not claim novelty in raw MP4 understanding.

The differentiation should be:

```text
raw video understanding
        +
temporal evidence
        +
developer telemetry
        +
Git/source correlation
        +
progressive context
        +
agentic debugging
        +
verification
```

The project should explicitly state that it builds on existing multimodal models rather than pretending to replace them.

---

# 41. Development Phases

## Phase 0 — Proof of Concept

Goal:

```text
MP4
→ frames
→ vision model
→ timeline
→ MCP
→ Claude Code
```

Duration target:

2–4 focused hours.

Definition of done:

Claude can answer a timestamped question about a local MP4.

---

## Phase 1 — Temporal Core

Implement:

- SQLite
- timeline
- evidence
- frame artifacts
- transcript
- search
- MCP tools
- CLI

Target:

1 day.

---

## Phase 2 — Replay Debugging

Implement:

```text
/debug-video bug.mp4
```

with:

- timeline
- targeted evidence
- repository inspection
- evidence-backed reasoning

Target:

1 day.

---

## Phase 3 — Live Browser Debugging

Implement:

- Playwright
- browser events
- console
- network
- screenshot capture
- live event bus

Target:

1–2 days.

---

## Phase 4 — Developer Correlation

Implement:

- terminal events
- Git
- source references
- event correlation
- evidence graph

Target:

1–2 days.

---

## Phase 5 — Agentic Loop

Implement:

```text
observe
→ diagnose
→ patch
→ test
→ reproduce
→ compare
```

Target:

1 day.

---

## Phase 6 — Evaluation

Implement:

- benchmark
- baseline
- TraceLens evaluation
- metrics
- reports

Target:

1 day.

---

## Phase 7 — Polish

Implement:

- packaging
- clean install
- docs
- demo
- screenshots/GIFs
- architecture diagram
- example sessions
- security/privacy docs

Target:

1 day.

---

# 42. Definition of Done

The project is complete when:

- [ ] Local MP4 inspection works.
- [ ] Metadata extraction works.
- [ ] Targeted frame extraction works.
- [ ] Timeline exists.
- [ ] Evidence exists.
- [ ] Transcript integration works when configured.
- [ ] MCP server works.
- [ ] Claude Code can use the MCP tools.
- [ ] `/debug-video` works.
- [ ] Live debugging session can be started.
- [ ] Browser events are captured.
- [ ] Console errors are captured.
- [ ] Network failures are captured.
- [ ] Current context snapshot works.
- [ ] Temporal rewind works.
- [ ] Git context works.
- [ ] Source correlation works in the demo.
- [ ] Demo app has at least three reproducible bugs.
- [ ] At least one bug can be diagnosed from a recording.
- [ ] At least one bug can be diagnosed live.
- [ ] At least one fix can be generated and verified.
- [ ] Before/after comparison works or has a clearly documented MVP implementation.
- [ ] Evaluation benchmark exists.
- [ ] Tests pass.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] No secrets are committed.
- [ ] Privacy behavior is documented.
- [ ] Clean installation works.
- [ ] README explains the complete workflow.

---

# 43. What Makes This Anthropic-Worthy

The project should demonstrate:

## Product judgment

You identified a deeper problem than "support MP4."

## Agent architecture

You designed a context interface instead of a giant prompt.

## Multimodal engineering

You combine:

- vision
- audio
- browser
- terminal
- Git

## Temporal reasoning

You make time a first-class dimension.

## Context efficiency

You retrieve only relevant evidence.

## Tool design

You expose a small MCP interface.

## Systems thinking

You connect perception to source code and verification.

## Evaluation

You measure whether the system actually improves debugging.

## Practicality

A developer can install it and use it.

---

# 44. The One-Sentence Thesis

If someone asks what TraceLens is:

> **TraceLens gives coding agents temporal memory by turning live and recorded developer sessions into structured, timestamped evidence that can be correlated with browser behavior, network activity, console output, Git, and source code.**

---

# 45. The Ideal Anthropic Demo

The final demo should be approximately 2–3 minutes.

### Scene 1

Show buggy application.

### Scene 2

Start:

```bash
tracelens debug --live
```

### Scene 3

Tell Claude:

> "Follow me while I reproduce this."

### Scene 4

Reproduce bug.

### Scene 5

Claude observes:

```text
click
→ request
→ 500
→ console error
→ UI failure
```

### Scene 6

Claude inspects code.

### Scene 7

Claude explains evidence and proposes patch.

### Scene 8

User approves.

### Scene 9

Claude modifies code and tests.

### Scene 10

Bug is reproduced again.

### Scene 11

Timeline shows:

```text
Before:
500 → loading forever

After:
200 → success
```

### Scene 12

Final message:

> "TraceLens turns what happened into context Claude can reason over."

That is the product story.

---

# 46. Engineering Execution Rules for Claude Code

When implementing this plan:

1. Inspect the repository before changing anything.
2. Do not stop at planning.
3. Build incrementally.
4. Run typecheck after major changes.
5. Run tests after major changes.
6. Fix failures before proceeding.
7. Prefer working software over abstractions.
8. Keep interfaces small.
9. Do not introduce unnecessary infrastructure.
10. Do not ask for permission for routine engineering choices.
11. Ask only when credentials, destructive actions, or truly blocking decisions are involved.
12. Keep documentation synchronized with implementation.
13. Never claim a feature works without testing it.
14. Record limitations honestly.
15. Optimize for the flagship debugging workflow rather than feature count.

---

# 47. Final Deliverables

The final repository should contain:

- working TraceLens CLI
- working MCP server
- Claude Code integration
- replay/MP4 debugging
- live debugging foundation
- temporal event model
- evidence model
- browser telemetry
- network/console capture
- Git correlation
- demo application
- benchmark/evaluation suite
- tests
- documentation
- privacy/security documentation
- clean installation instructions
- polished demo workflow

The project should feel like a coherent product, not a collection of unrelated experiments.
