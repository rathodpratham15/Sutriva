import { DocSection } from '../types';

export const DOCS_SECTIONS: DocSection[] = [
  {
    id: 'overview',
    title: 'Overview & Core Thesis',
    category: 'Getting Started',
    path: '/docs',
    summary: 'Why temporal memory is the missing link for autonomous coding agents.',
    content: {
      title: 'Sutriva: Temporal Memory for Coding Agents',
      description: 'A persistent, queryable record of what happened across a debugging session — live or recorded — that can be retrieved and correlated after the fact.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Overview'],
      sections: [
        {
          title: 'The Core Problem: Current State vs. Historical Sequence',
          id: 'core-problem',
          body: [
            'Coding agents are remarkably capable at inspecting repositories, editing files, and running terminal tests. Claude Code can also observe a running browser directly and take action in it via its native browser integration (`--chrome`).',
            'However, real-world software failures rarely expose their root cause in the resting state. A bug is usually a sequence: a user action, a response that doesn’t match what the frontend expects, a console error, and then further, unrelated activity.',
            'By the time the developer asks the agent "What happened?", the application may already be several steps past the failure. Inspecting only the current DOM or console buffer misses the sequence that preceded it.'
          ],
          callout: {
            type: 'note',
            text: 'Sutriva does not replace Claude Code or claim it cannot observe browsers. Sutriva supplies persistent temporal memory so an agent can query the historical record of what happened, even after the moment has passed.'
          }
        },
        {
          title: 'The Core Thesis',
          id: 'core-thesis',
          body: [
            '"Sutriva gives coding agents temporal memory: a persistent, queryable record of what happened across a debugging session — live or recorded — that can be retrieved and correlated after the fact, instead of relying only on the current application state."',
            'Instead of dumping raw video or unbounded logs into the agent’s context window, Sutriva normalizes every observation into a `TemporalEvent`/`Evidence` record in SQLite, exposed incrementally through 10 MCP tools.'
          ]
        },
        {
          title: 'Key Tenets',
          id: 'key-tenets',
          body: [
            '1. Not Observation, Memory: Coding agents can observe the present; Sutriva remembers the past.',
            '2. Local-First: Sessions are stored in a local SQLite database (`.sutriva/sutriva.db`). Zero telemetry by default. No automatic uploads.',
            '3. Standard Protocol: Exposed over the Model Context Protocol (`@sutriva/mcp-server`, stdio transport) — usable by any MCP-compatible client, tested against Claude Code.',
            '4. Closed-Loop Verification: `compare_sessions` diffs console/network signals before and after an agent applies a patch.'
          ]
        }
      ],
      relatedLinks: [
        { title: 'Quickstart Guide', path: '/docs/quickstart', desc: 'Install the CLI and run your first live debugging session.' },
        { title: 'MCP Integration', path: '/docs/mcp', desc: 'Connect Sutriva to Claude Code and other agent tools.' }
      ]
    }
  },
  {
    id: 'quickstart',
    title: 'Quickstart Guide',
    category: 'Getting Started',
    path: '/docs/quickstart',
    summary: 'Install Sutriva, verify system dependencies with doctor, and start your first session.',
    content: {
      title: 'Quickstart Guide',
      description: 'Get up and running with Sutriva using npm.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Getting Started', 'Quickstart'],
      sections: [
        {
          title: '1. Global Installation',
          id: 'installation',
          body: [
            'Install the Sutriva CLI globally, plus the MCP server package for agent integration.'
          ],
          codeBlock: {
            language: 'bash',
            code: '# Install the CLI\nnpm install -g sutriva\n\n# Install the MCP server for agent integration\nnpm install -g @sutriva/mcp-server'
          }
        },
        {
          title: '2. Environment & Dependency Check',
          id: 'doctor',
          body: [
            'Run the built-in diagnostic tool to verify Node.js (>= 22, required for the SQLite native binding), FFmpeg (for replay ingestion), and Playwright’s Chromium (for live browser debugging) are available.'
          ],
          codeBlock: {
            language: 'bash',
            code: '$ sutriva doctor\n\n[✓] Node.js >= 22\n[✓] ffmpeg / ffprobe on PATH\n[✓] git repository detected\n[✓] Playwright Chromium installed\nActive vision provider: mock (set ANTHROPIC_API_KEY for real analysis)\nActive transcription provider: mock (set ELEVENLABS_API_KEY for real transcription)'
          },
          callout: {
            type: 'tip',
            text: 'Playwright’s Chromium is not installed automatically by npm/pnpm install — run `npx playwright install chromium` once. `sutriva doctor` checks for this and tells you if it’s missing rather than failing opaquely later.'
          }
        },
        {
          title: '3. Starting a Live Session',
          id: 'live-start',
          body: [
            'Launch a live, visible browser window and reproduce a bug while Sutriva captures navigation, clicks, input, console messages, network requests/responses/failures, and periodic screenshots — persisted to SQLite the moment they happen.'
          ],
          codeBlock: {
            language: 'bash',
            code: '$ sutriva debug --live --url http://localhost:3000/checkout\n\nLive session started: session_a1b2c3d4\nInteract with the browser window, then ask Claude Code: "What just happened?"'
          }
        },
        {
          title: '4. Replaying a Recorded MP4 Session',
          id: 'replay-start',
          body: [
            'If you already have a screen recording of a bug, ingest it directly: metadata, sampled frames, vision analysis, and a transcript (if the video has audio) all get built into the same queryable session.'
          ],
          codeBlock: {
            language: 'bash',
            code: '$ sutriva inspect bug.mp4\n\nSession session_e5f6a7b8 created (12 events, 8 sampled frames).\nRun `sutriva timeline bug.mp4` to see the full timeline.'
          }
        }
      ],
      relatedLinks: [
        { title: 'Live Debugging Guide', path: '/docs/live', desc: 'Learn how the real-time agent-in-the-loop workflow functions.' },
        { title: 'Claude Code Setup', path: '/docs/claude-code', desc: 'Configure Claude Code to query Sutriva via MCP.' }
      ]
    }
  },
  {
    id: 'claude-code',
    title: 'Claude Code Integration',
    category: 'Integration',
    path: '/docs/claude-code',
    summary: 'Configure Claude Code to query Sutriva temporal memory during interactive sessions.',
    content: {
      title: 'Claude Code Integration',
      description: 'Connect Sutriva to Claude Code via the Model Context Protocol for historical context retrieval.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Integration', 'Claude Code'],
      sections: [
        {
          title: 'Adding Sutriva to Claude Code',
          id: 'mcp-config',
          body: [
            'Point any project’s `.mcp.json` at the globally installed `sutriva-mcp` binary — no other configuration is required.'
          ],
          codeBlock: {
            language: 'json',
            code: '{\n  "mcpServers": {\n    "sutriva": {\n      "command": "sutriva-mcp"\n    }\n  }\n}',
            filename: '.mcp.json'
          }
        },
        {
          title: 'Interactive Debugging Prompt Flow',
          id: 'prompt-flow',
          body: [
            'Once configured, plain-language prompts trigger Sutriva’s MCP tools behind the scenes:',
            '1. "Follow me while I reproduce this." → you reproduce the bug in the live browser window Sutriva opened.',
            '2. "What happened?" → Claude calls `get_current_context` (or `get_timeline` / `get_evidence` for a historical session) to find the failure.',
            '3. "Fix it, then verify." → Claude reads the affected source via `inspect_environment`, patches it, reproduces the interaction again, and calls `compare_sessions`.'
          ],
          codeBlock: {
            language: 'text',
            code: '> What happened during the last checkout attempt?\n\nClaude calls get_current_context...\n\nClaude: The checkout request returned 200, but the frontend crashed reading\ndata.orderId, which the API response doesn’t include (it returns `id`, not\n`orderId`) — a response schema mismatch in app/checkout/page.tsx.'
          }
        },
        {
          title: 'Context Window Efficiency',
          id: 'efficiency',
          body: [
            'Raw video and unbounded logs quickly exhaust context limits. Sutriva’s tools return bounded, timestamped data — metadata, then a timeline, then a specific frame or evidence window — instead of the whole session at once.'
          ]
        }
      ],
      relatedLinks: [
        { title: 'MCP Reference', path: '/docs/mcp', desc: 'Exhaustive reference for all MCP tools exposed by Sutriva.' }
      ]
    }
  },
  {
    id: 'live',
    title: 'Live Debugging',
    category: 'Core Concepts',
    path: '/docs/live',
    summary: 'Real-time observation, event capture, and temporal indexing during active reproduction.',
    content: {
      title: 'Live Debugging Workflow',
      description: 'Stream live browser events — navigation, clicks, console, network — into a queryable timeline as they happen.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Core Concepts', 'Live Debugging'],
      sections: [
        {
          title: 'The Agentic Loop',
          id: 'agent-loop',
          body: [
            'Reproducing a bug live while an agent observes eliminates guesswork versus describing it after the fact.',
            'The full loop, as automated by the bundled `/debug-video` slash command:',
            '1. Observe: you interact with the browser while Sutriva captures events.',
            '2. Retrieve: Claude calls `get_current_context`/`get_evidence` to find the failure.',
            '3. Diagnose: Claude calls `inspect_environment` to correlate the failure with source and Git state, forming a labeled (observed/likely/possible/confirmed) hypothesis.',
            '4. Patch: Claude edits the offending code.',
            '5. Test: existing tests/typecheck run.',
            '6. Reproduce: the same interaction is repeated in a fresh session.',
            '7. Verify: Claude calls `compare_sessions` to confirm the failure is gone.'
          ]
        },
        {
          title: 'CLI Options for `sutriva debug --live`',
          id: 'cli-options',
          body: [
            'Configure the target URL and headless mode via flags.'
          ],
          codeBlock: {
            language: 'bash',
            code: '$ sutriva debug --live --url http://localhost:3000/checkout [--headless]'
          }
        }
      ],
      relatedLinks: [
        { title: 'Replay Debugging', path: '/docs/replay', desc: 'Turn recorded video files into queryable evidence.' },
        { title: 'Architecture', path: '/docs/architecture', desc: 'Understand the underlying storage engine and pipeline.' }
      ]
    }
  },
  {
    id: 'replay',
    title: 'Replay Debugging',
    category: 'Core Concepts',
    path: '/docs/replay',
    summary: 'Turn pre-recorded MP4 screen recordings into timestamped evidence.',
    content: {
      title: 'Replay Debugging',
      description: 'Index a recorded video, transcribe spoken narration if present, sample visual frames, and correlate with Git state.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Core Concepts', 'Replay'],
      sections: [
        {
          title: 'Run It Back',
          id: 'run-it-back',
          body: [
            'Developers and QA engineers often share screen recordings of bugs. Without Sutriva, an agent has no way to query the exact moment a failure occurred inside that recording.',
            'With `sutriva inspect bug.mp4`, Sutriva builds:',
            '• Metadata and a bounded set of sampled frames (not every frame at native fps)',
            '• Vision analysis of those frames (real, via Claude, or a deterministic offline mock)',
            '• Audio transcription if the video has an audio track (real, via ElevenLabs Scribe, or a deterministic mock)',
            '• A merged, timestamped timeline queryable via `get_timeline` / `get_evidence` / `search_session`.'
          ],
          codeBlock: {
            language: 'bash',
            code: '$ sutriva inspect fixtures/videos/checkout-bug.mp4'
          }
        },
        {
          title: 'Frame Retrieval & Source Correlation',
          id: 'source-correlation',
          body: [
            'When an agent asks for a specific moment, `get_frame` returns one targeted frame as an image — Claude never has to re-request the whole video for a follow-up visual question.'
          ]
        }
      ],
      relatedLinks: [
        { title: 'Architecture', path: '/docs/architecture', desc: 'Deep dive into the pipeline.' }
      ]
    }
  },
  {
    id: 'mcp',
    title: 'MCP Server Reference',
    category: 'Reference',
    path: '/docs/mcp',
    summary: 'Model Context Protocol tool schemas, parameters, and example responses.',
    content: {
      title: 'Model Context Protocol (MCP) Reference',
      description: 'Sutriva exposes 10 tools over the Model Context Protocol, via stdio transport.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Reference', 'MCP Server'],
      sections: [
        {
          title: 'Package Installation',
          id: 'mcp-install',
          body: [
            'The MCP server runs as a standalone Node process communicating over stdio.'
          ],
          codeBlock: {
            language: 'bash',
            code: 'npm install -g @sutriva/mcp-server'
          }
        },
        {
          title: 'Available MCP Tools (10 total)',
          id: 'tool-list',
          body: [
            '• `inspect_video`: Ingests a video into a session — metadata, sampled frames, vision analysis, transcript.',
            '• `get_timeline`: Returns the bounded, timestamped event list for a session.',
            '• `get_frame`: Returns one targeted replay frame as an image, near a timestamp.',
            '• `search_session`: Full-text search over a session’s event descriptions.',
            '• `get_evidence`: Temporal rewind — evidence within a time window around a timestamp.',
            '• `analyze_segment`: Dense, on-demand vision analysis over a narrow time range.',
            '• `get_transcript`: Raw audio transcript segments for a session.',
            '• `inspect_environment`: Current Git context, live-session status, and capability flags.',
            '• `get_current_context`: The "what just happened?" snapshot for a live session.',
            '• `compare_sessions`: Before/after verification — diffs two sessions’ console/network signals.'
          ]
        },
        {
          title: 'Tool Schema: `get_evidence`',
          id: 'schema-evidence',
          body: [
            'The primary temporal-rewind tool — returns evidence in a bounded window around a timestamp, so an agent can ask "what happened right before/after this?" without requesting the whole session.'
          ],
          codeBlock: {
            language: 'json',
            code: '{\n  "name": "get_evidence",\n  "inputSchema": {\n    "sessionId": "string",\n    "aroundSeconds": "number",\n    "windowSeconds": "number (default 5, max 120)"\n  }\n}'
          }
        }
      ],
      relatedLinks: [
        { title: 'Claude Code Integration', path: '/docs/claude-code', desc: 'See how Claude calls these tools.' }
      ]
    }
  },
  {
    id: 'architecture',
    title: 'Architecture & Pipeline',
    category: 'Reference',
    path: '/docs/architecture',
    summary: 'End-to-end pipeline: ingestion, storage, and the MCP tool surface.',
    content: {
      title: 'Sutriva Architecture',
      description: 'How Sutriva turns live browser events and recorded video into deterministic, queryable evidence.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Reference', 'Architecture'],
      sections: [
        {
          title: 'System Architecture Diagram',
          id: 'arch-diagram',
          body: [
            'A pnpm workspace: a shared core/domain layer, an ingestion layer for each input type, storage, and the MCP tool surface.'
          ],
          codeBlock: {
            language: 'text',
            code: 'MP4 --ffprobe/ffmpeg--> metadata + sampled frames --VisionProvider--> observations --,\n                                                                                      |\nPlaywright browser --instrumentPage--> EventBus (publish/subscribe) ---------------->+\n                                                                                      v\n                                                          TemporalEvent + Evidence (SQLite)\n                                                                                      |\n                                                                                      v\n                                                                    MCP tool surface\n                                                                                      |\n                                                                                      v\n                                                                     Claude Code'
          }
        },
        {
          title: 'Packages',
          id: 'packages',
          body: [
            '`packages/core` — domain types (Session, TemporalEvent, Evidence, Artifact), the EventBus, Zod schemas, config.',
            '`packages/video` — FFmpeg wrapper: metadata probing, content hashing, bounded frame/audio extraction.',
            '`packages/providers` — VisionProvider/TranscriptionProvider interfaces, plus mock, Anthropic (vision), and ElevenLabs (transcription) implementations.',
            '`packages/storage` — SQLite persistence via `better-sqlite3` (`.sutriva/sutriva.db`).',
            '`packages/timeline` — orchestrates ingest and every query operation behind the MCP tools.',
            '`packages/git` — minimal Git context (branch, commit, working-tree status, recent commits) — not a full diff/blame engine.',
            '`packages/browser` — Playwright instrumentation: navigation, click, input, console, pageerror, request/response/requestfailed, screenshots.',
            '`packages/live` — orchestrates a live session into the same event model a replayed video uses.'
          ]
        },
        {
          title: 'The Temporal Model',
          id: 'tem-model',
          body: [
            'Every observation becomes a `TemporalEvent` with a start/end timestamp (in seconds) and a confidence label, plus `Evidence` linking it to a stored artifact (a frame or transcript segment). Related events (e.g. a network request likely triggered by a recent click) are linked via a bounded time-proximity heuristic, recorded as `relatedEventIds` — this is evidence for an agent to reason over, not a causality claim Sutriva itself makes.'
          ]
        }
      ],
      relatedLinks: [
        { title: 'Privacy & Security', path: '/docs/privacy', desc: 'Review local-first data guarantees.' }
      ]
    }
  },
  {
    id: 'evaluation',
    title: 'Evaluation & Test Suite',
    category: 'Reference',
    path: '/docs/evaluation',
    summary: 'Real, live-verified evaluation results against three actual bugs — not synthetic benchmarks.',
    content: {
      title: 'Evaluation & Testing Methodology',
      description: 'Verified against three real bugs in a demo app, driving Claude Code headlessly with no human in the loop.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Reference', 'Evaluation'],
      sections: [
        {
          title: 'Two Test Suites',
          id: 'test-metrics',
          body: [
            '• 87 / 87 automated unit, integration, and MCP-protocol tests passing — fully offline, no paid API calls required.',
            '• A separate, opt-in agentic evaluation harness (`pnpm eval:agentic`) drives Claude Code headlessly through 3 real bugs in `demo/buggy-app`, grading root-cause accuracy, code localization, and patch success automatically.'
          ],
          callout: {
            type: 'note',
            text: 'The agentic harness costs a real Claude API call per scenario (roughly $0.50-$1 per run) and is not part of the 87/87 count or CI — it is a genuinely separate, explicitly opt-in verification path.'
          }
        },
        {
          title: 'The 3 Evaluated Scenarios (live-verified)',
          id: 'demo-scenarios',
          body: [
            '1. Checkout schema mismatch: the API returns `{ id, total }`, but the frontend reads `data.orderId` — a response schema mismatch, not a network failure. Claude correctly localized `app/checkout/page.tsx` on the first try and matched the root cause exactly. `compare_sessions`: 1 console error resolved, 0 new.',
            '2. Search race condition: a stale, slower "cat" response overwrites the faster, current "cats" response because there’s no request-sequencing guard. Claude’s hypothesis: "whichever fetch response resolves last overwrites state, regardless of which request was issued last." Verified: the results list flips from stale to correct.',
            '3. Responsive regression: the mobile header grows taller, but `.responsive-main`’s padding-top never increases to compensate, hiding the submit button. No console error, no failed request — a pure visual/screenshot difference, verified via a direct bounding-box assertion (not `compare_sessions`, which has no visual diffing).'
          ]
        }
      ],
      relatedLinks: [
        { title: 'Limitations', path: '/docs/limitations', desc: 'Read honest constraints.' }
      ]
    }
  },
  {
    id: 'privacy',
    title: 'Privacy & Data Sovereignty',
    category: 'Reference',
    path: '/docs/privacy',
    summary: 'Local-first architecture, zero telemetry, user-controlled API keys.',
    content: {
      title: 'Privacy & Data Sovereignty',
      description: 'Sutriva is local-first by default. Your source code and session captures stay on your machine.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Reference', 'Privacy'],
      sections: [
        {
          title: 'Local-First Architecture',
          id: 'local-first',
          body: [
            '• Session Data Stored Locally: sessions, events, evidence, and artifacts are written to a local SQLite database at `.sutriva/sutriva.db`.',
            '• Zero Telemetry: Sutriva contains no tracking pixels, telemetry pings, or usage analytics.',
            '• No Automatic Uploads: video recordings and captured data are never uploaded anywhere by default.',
            '• API Keys Under User Control: real vision analysis (`ANTHROPIC_API_KEY`) and real transcription (`ELEVENLABS_API_KEY`) are only invoked when a tool that needs them is explicitly called, using your own keys — no intermediary proxy.'
          ]
        }
      ],
      relatedLinks: [
        { title: 'Limitations', path: '/docs/limitations', desc: 'Read technical prerequisites.' }
      ]
    }
  },
  {
    id: 'limitations',
    title: 'Limitations & Known Boundaries',
    category: 'Reference',
    path: '/docs/limitations',
    summary: 'Honest constraints: no visual diffing, correlation vs. causality, native dependencies, platform scope.',
    content: {
      title: 'Limitations & Known Boundaries',
      description: 'A transparent inventory of what Sutriva does, what it requires, and what it does not do.',
      lastUpdated: 'sutriva@0.1.1',
      breadcrumbs: ['Documentation', 'Reference', 'Limitations'],
      sections: [
        {
          title: 'Verification Scope (`compare_sessions`)',
          id: 'verification-scope',
          body: [
            '• No Visual Diffing: `compare_sessions` compares console errors and network endpoint status codes only — a purely visual/layout regression with no console or network signal reports as "nothing changed". Endpoints are matched by exact METHOD+URL string, with no query-string normalization.'
          ]
        },
        {
          title: 'Correlation vs. Causal Inference',
          id: 'correlation-boundary',
          body: [
            '• Event correlation (`relatedEventIds`) is a bounded time-proximity heuristic, not causal analysis. It links plausible chains (e.g. a request following a recent click); it never asserts one event caused another.'
          ]
        },
        {
          title: 'Native System Dependencies',
          id: 'system-deps',
          body: [
            '• FFmpeg Required: replay ingestion (`sutriva inspect`) requires `ffmpeg`/`ffprobe` on `PATH`.',
            '• Playwright Chromium Required: live browser debugging needs `npx playwright install chromium` run once — it is not fetched automatically by `npm`/`pnpm install`. `sutriva doctor` checks for and reports this explicitly.',
            '• Platform: developed and tested on macOS (Apple Silicon) only. Linux/Windows should work in principle (all native dependencies support both) but are not independently verified.'
          ]
        },
        {
          title: 'Model & API Costs',
          id: 'api-costs',
          body: [
            '• Real vision analysis (`ANTHROPIC_API_KEY`) and real transcription via ElevenLabs Scribe (`ELEVENLABS_API_KEY`) are both real, billed API calls, made only when a tool that needs them is invoked. Nothing is required for the offline mock-provider default.'
          ]
        },
        {
          title: 'Other Known Boundaries',
          id: 'other-boundaries',
          body: [
            '• Live-session screenshots are best-effort — an occasional capture immediately after navigation can transiently fail in headless Chromium; it is logged and skipped, not treated as a crash.',
            '• Terminal capture requires explicitly running commands through `sutriva exec` — there is no automatic, shell-wide capture. Redaction is a best-effort heuristic, not a guarantee.',
            '• Not yet listed on the official MCP Registry — `mcpName` is live in the published npm package, ready for registration.',
            '• `sutriva session report` is stubbed with an explanatory message, not implemented.'
          ]
        }
      ],
      relatedLinks: [
        { title: 'Overview', path: '/docs', desc: 'Return to core thesis.' }
      ]
    }
  }
];

export const TIMELINE_SAMPLE_DATA: {
  events: import('../types').TimelineEvent[];
} = {
  events: [
    {
      timestamp: '00:00.00',
      timeSec: 0.0,
      type: 'navigation',
      title: 'Page Navigation',
      details: 'Navigated to http://localhost:4173/checkout',
      status: '200 OK'
    },
    {
      timestamp: '00:04.12',
      timeSec: 4.12,
      type: 'dom',
      title: 'User Click: #checkout-btn',
      details: 'Clicked "Place order" button'
    },
    {
      timestamp: '00:14.82',
      timeSec: 14.82,
      type: 'network',
      title: 'POST /api/checkout',
      status: 200,
      details: 'Response 200 OK — body: { id: "ORD-1234", total: 49.99 } (no `orderId` field)'
    },
    {
      timestamp: '00:14.91',
      timeSec: 14.91,
      type: 'console',
      title: 'Uncaught TypeError',
      status: 'ERROR',
      isFailure: true,
      isHistoricalContext: true,
      details: 'TypeError: Cannot read properties of undefined (reading \'toString\') — data.orderId is undefined',
      sourceFile: 'app/checkout/page.tsx',
      sourceLine: 15,
      codeSnippet: 'setConfirmation(`Order ${data.orderId.toString()} confirmed!`); // API returns `id`, not `orderId`'
    },
    {
      timestamp: '00:15.32',
      timeSec: 15.32,
      type: 'dom',
      title: 'UI State Stuck',
      details: 'Button remains "Processing..." — the click handler threw before setStatus("done") ran.'
    },
    {
      timestamp: '00:19.41',
      timeSec: 19.41,
      type: 'query',
      title: 'Developer Prompt: "What happened?"',
      details: 'Current application resting state still shows "Processing...". Agent queries Sutriva temporal memory.',
      status: 'ACTIVE QUERY'
    }
  ]
};

export const MCP_TOOLS_LIST = [
  {
    name: 'get_evidence',
    description: 'Temporal rewind: returns evidence within a time window around a timestamp, so Claude can answer "what happened immediately before/after this?" without requesting the whole session.',
    parameters: [
      { name: 'sessionId', type: 'string', required: true, description: 'Target session ID' },
      { name: 'aroundSeconds', type: 'number', required: true, description: 'Center of the time window, in seconds' },
      { name: 'windowSeconds', type: 'number', required: false, description: 'Half-width of the window in seconds (default 5, max 120)' }
    ],
    exampleCall: 'get_evidence({ sessionId: "session_a1b2c3d4", aroundSeconds: 14.82, windowSeconds: 3 })',
    exampleResponse: '{\n  "sessionId": "session_a1b2c3d4",\n  "aroundSeconds": 14.82,\n  "windowSeconds": 3,\n  "count": 2,\n  "evidence": [\n    {\n      "type": "network",\n      "description": "POST /api/checkout → 200 (body: {id, total})",\n      "confidence": "observed"\n    },\n    {\n      "type": "console",\n      "description": "TypeError: Cannot read properties of undefined (reading \'toString\')",\n      "confidence": "observed"\n    }\n  ]\n}'
  },
  {
    name: 'get_timeline',
    description: 'Returns the bounded, timestamped event list for a session — visual, audio, browser, and terminal events merged in time order.',
    parameters: [
      { name: 'sessionId', type: 'string', required: true, description: 'Session identifier' },
      { name: 'limit', type: 'number', required: false, description: 'Max events to return (default 50, max 200)' },
      { name: 'afterSeconds', type: 'number', required: false, description: 'Only events at/after this time' },
      { name: 'beforeSeconds', type: 'number', required: false, description: 'Only events at/before this time' }
    ],
    exampleCall: 'get_timeline({ sessionId: "session_a1b2c3d4", limit: 50 })',
    exampleResponse: '{\n  "sessionId": "session_a1b2c3d4",\n  "count": 6,\n  "events": [\n    { "start": 14.82, "type": "network", "description": "POST /api/checkout → 200" },\n    { "start": 14.91, "type": "console", "description": "Uncaught TypeError" }\n  ]\n}'
  },
  {
    name: 'compare_sessions',
    description: 'Before/after verification: diffs two sessions and reports endpoints whose status changed and console errors that appeared/disappeared.',
    parameters: [
      { name: 'beforeSessionId', type: 'string', required: true, description: 'Session recorded before the fix' },
      { name: 'afterSessionId', type: 'string', required: true, description: 'Session recorded after the fix, same interaction' }
    ],
    exampleCall: 'compare_sessions({ beforeSessionId: "session_before", afterSessionId: "session_after" })',
    exampleResponse: '{\n  "resolvedEndpoints": [],\n  "newOrChangedFailingEndpoints": [],\n  "resolvedConsoleErrors": ["TypeError: ... reading \'toString\'"],\n  "newConsoleErrors": [],\n  "summary": "0 endpoint(s) fixed, 0 new/changed failure(s), 1 console error(s) resolved, 0 new console error(s)"\n}'
  },
  {
    name: 'search_session',
    description: 'Full-text search over a session’s event descriptions.',
    parameters: [
      { name: 'sessionId', type: 'string', required: true, description: 'Target session identifier' },
      { name: 'query', type: 'string', required: true, description: 'Text to search for in event descriptions' }
    ],
    exampleCall: 'search_session({ sessionId: "session_a1b2c3d4", query: "orderId" })',
    exampleResponse: '{\n  "count": 1,\n  "events": [\n    { "start": 14.91, "type": "console", "description": "TypeError ... data.orderId is undefined" }\n  ]\n}'
  },
  {
    name: 'inspect_video',
    description: 'Ingests a video into a session: metadata, sampled frames, vision analysis, transcript. Reuses the session if the file was already inspected (by content hash).',
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'Path to the video file' },
      { name: 'focus', type: 'string', required: false, description: 'Hint for the vision provider' },
      { name: 'maxFrames', type: 'number', required: false, description: 'Cap on sampled frames (default 24, max 60)' },
      { name: 'intervalSeconds', type: 'number', required: false, description: 'Target seconds between sampled frames (default 2)' }
    ],
    exampleCall: 'inspect_video({ path: "fixtures/videos/checkout-bug.mp4" })',
    exampleResponse: '{\n  "sessionId": "session_e5f6a7b8",\n  "eventCount": 12,\n  "metadata": { "durationSeconds": 24.5, "fps": 30, "hasAudio": true }\n}'
  },
  {
    name: 'get_frame',
    description: 'Returns one targeted replay frame as an image, near a timestamp — no need to re-request the whole video for a follow-up visual question.',
    parameters: [
      { name: 'sessionId', type: 'string', required: true, description: 'Session identifier' },
      { name: 'timestamp', type: 'number', required: true, description: 'Seconds into the video' }
    ],
    exampleCall: 'get_frame({ sessionId: "session_e5f6a7b8", timestamp: 14.82 })',
    exampleResponse: '(returns an image content block + "Frame near t=14.82s")'
  },
  {
    name: 'get_transcript',
    description: 'Returns audio transcript segments for a session, if the video had an audio track and a transcription provider was configured.',
    parameters: [
      { name: 'sessionId', type: 'string', required: true, description: 'Session identifier' }
    ],
    exampleCall: 'get_transcript({ sessionId: "session_e5f6a7b8" })',
    exampleResponse: '{\n  "count": 2,\n  "segments": [\n    { "start": 0.5, "end": 3.8, "text": "Follow me while I reproduce this checkout bug." }\n  ]\n}'
  },
  {
    name: 'analyze_segment',
    description: 'Dense, on-demand vision analysis over a narrow time range — for when get_timeline’s coarse sampling isn’t enough detail. More expensive; scope the range narrowly.',
    parameters: [
      { name: 'sessionId', type: 'string', required: true, description: 'Session identifier' },
      { name: 'startSeconds', type: 'number', required: true, description: 'Range start' },
      { name: 'endSeconds', type: 'number', required: true, description: 'Range end' },
      { name: 'question', type: 'string', required: false, description: 'e.g. "what changed in the UI here?"' }
    ],
    exampleCall: 'analyze_segment({ sessionId: "session_e5f6a7b8", startSeconds: 14, endSeconds: 16 })',
    exampleResponse: '{\n  "sampledFrameCount": 4,\n  "summary": "Button remains in \\"Processing...\\" state, no confirmation shown."\n}'
  },
  {
    name: 'inspect_environment',
    description: 'Current Git context (branch, commit, working-tree status, recent commits, diffstat), live-session status, and capability flags — used before forming a root-cause hypothesis.',
    parameters: [
      { name: 'root', type: 'string', required: false, description: 'Repository root (defaults to server’s working directory)' },
      { name: 'includeDiff', type: 'boolean', required: false, description: 'Include the full (bounded) working-tree diff' },
      { name: 'diffMaxLines', type: 'number', required: false, description: 'Max diff lines to return (default 200)' }
    ],
    exampleCall: 'inspect_environment({ includeDiff: true })',
    exampleResponse: '{\n  "git": { "branch": "main", "commit": "7a8b92c" },\n  "liveSession": { "active": true, "sessionId": "session_a1b2c3d4" }\n}'
  },
  {
    name: 'get_current_context',
    description: 'The "what just happened?" snapshot for a live session: current screenshot, current URL, recent events/errors/failures, live Git state. Defaults to the active live session.',
    parameters: [
      { name: 'sessionId', type: 'string', required: false, description: 'Defaults to the currently active live session' }
    ],
    exampleCall: 'get_current_context({})',
    exampleResponse: '{\n  "currentUrl": "http://localhost:4173/checkout",\n  "recentConsoleErrors": ["TypeError: Cannot read properties of undefined (reading \'toString\')"]\n}'
  }
];
