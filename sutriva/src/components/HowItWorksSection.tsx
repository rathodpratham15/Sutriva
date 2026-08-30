import React, { useState } from 'react';
import { 
  Video, 
  Terminal, 
  Cpu, 
  Database, 
  Layers, 
  Bot, 
  FileText, 
  Eye, 
  Mic, 
  GitBranch, 
  Network, 
  Sparkles,
  ArrowDown,
  CheckCircle2
} from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(2); // Default to Temporal Evidence Model

  const pipelineSteps = [
    {
      id: 'input',
      title: '1. Ingestion',
      subtitle: 'Live Browser / MP4',
      icon: Video,
      description: 'Ingests a live, Playwright-instrumented browser session or a pre-recorded MP4 file.',
      details: [
        'Playwright instrumentation: navigation, click, input, console, network',
        'FFmpeg metadata probing + bounded frame sampling (not every frame)',
        'Audio track extraction, if present'
      ]
    },
    {
      id: 'analysis',
      title: '2. Capture & Analysis',
      subtitle: 'Event Normalization',
      icon: Layers,
      description: 'Extracts discrete events: network requests/responses/failures, console messages, clicks/input, sampled frames, and audio transcripts.',
      details: [
        'Request/response status logging via page.on(\'request\'/\'response\'/\'requestfailed\')',
        'Console message & pageerror capture',
        'ElevenLabs Scribe speech-to-text (or a deterministic offline mock)',
        'Vision analysis of sampled frames via Claude (or a deterministic mock)'
      ]
    },
    {
      id: 'tem',
      title: '3. Temporal Model',
      subtitle: 'TemporalEvent + Evidence',
      icon: Cpu,
      description: 'Every observation becomes a timestamped, confidence-scored TemporalEvent, linked to Evidence and (optionally) Git state.',
      details: [
        'Timestamped (seconds) + confidence label per event',
        'Event linking (e.g. a request likely triggered by a recent click) via bounded time-proximity — not a causality claim',
        'Git context via inspect_environment (branch/commit/status/diffstat) — not blame-based line correlation',
        'Configurable evidence windows via get_evidence(aroundSeconds, windowSeconds)'
      ]
    },
    {
      id: 'storage',
      title: '4. Local Storage',
      subtitle: 'SQLite Engine',
      icon: Database,
      description: 'Stores all structured evidence locally in SQLite. Zero cloud uploads.',
      details: [
        'Local SQLite database (.sutriva/sutriva.db) via better-sqlite3',
        'Substring search over event descriptions (search_session)',
        'Zero telemetry, local file sovereignty',
        'Content-hash caching — re-inspecting an unchanged file is free'
      ]
    },
    {
      id: 'mcp',
      title: '5. MCP Protocol',
      subtitle: '@sutriva/mcp-server',
      icon: Network,
      description: 'Exposes 10 Model Context Protocol tools over stdio, usable by any MCP-compatible coding agent.',
      details: [
        'get_evidence & get_timeline tools',
        'Bounded, timestamped output to minimize token usage',
        'stdio transport (no SSE)',
        'compare_sessions tool for before/after verification'
      ]
    },
    {
      id: 'agent',
      title: '6. Coding Agent',
      subtitle: 'Autonomous Reasoning',
      icon: Bot,
      description: 'The coding agent queries temporal memory, isolates the bug, writes a patch, and verifies before/after state.',
      details: [
        'Receives a bounded evidence window, not the whole session',
        'Identifies root cause file and line number by reading actual source',
        'Generates a code patch with a labeled (observed/likely/possible/confirmed) hypothesis',
        'Verifies via compare_sessions on rerun'
      ]
    }
  ];

  const inputsList = [
    { name: 'Live browser sessions', icon: Eye },
    { name: 'Recorded MP4 sessions', icon: Video },
    { name: 'Terminal activity', icon: Terminal },
    { name: 'Browser DOM events', icon: Layers },
    { name: 'Console / Network HAR', icon: Network },
    { name: 'Git repository state', icon: GitBranch },
    { name: 'Keyframe vision', icon: Eye },
    { name: 'Audio transcription', icon: Mic }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#08090d] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Architecture & Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            How Sutriva works.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            From raw video captures and live browser telemetry to normalized, queryable evidence delivered directly into your coding agent’s context window.
          </p>
        </div>

        {/* Inputs & Outputs Top Bar */}
        <div className="mb-14 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Inputs Box */}
            <div className="lg:col-span-8">
              <span className="font-mono text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-3">
                Supported Inputs & Telemetry Streams
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {inputsList.map((inp, idx) => {
                  const Icon = inp.icon;
                  return (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-2 text-xs font-mono text-zinc-300"
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{inp.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Output Box */}
            <div className="lg:col-span-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 font-mono text-xs">
              <span className="text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                Deterministic Output
              </span>
              <p className="text-zinc-300 font-sans text-xs mb-3">
                Timestamped, queryable evidence structured for minimal token consumption.
              </p>
              <div className="p-2 rounded bg-zinc-950 border border-emerald-900/60 text-emerald-300 text-[11px]">
                <code>&gt; evidence_model.query(slice_window)</code>
              </div>
            </div>

          </div>
        </div>

        {/* The 6-Step Visual Architecture Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;

            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive 
                    ? 'bg-zinc-900 border-emerald-500/80 shadow-lg shadow-emerald-500/5' 
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                      isActive 
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700' 
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-zinc-400">
                      Step 0{index + 1}
                    </span>
                  </div>

                  <h3 className="font-mono text-base font-bold text-white mb-1">
                    {step.title}
                  </h3>
                  <div className="font-mono text-xs text-emerald-400 mb-3">
                    {step.subtitle}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 space-y-1.5 font-mono text-[11px] text-zinc-400">
                  {step.details.slice(0, 2).map((d, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-1.5">
                      <span className="text-emerald-400">›</span>
                      <span className="truncate">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Step Deep Dive Inspector */}
        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800 mb-4">
            <div>
              <span className="text-xs font-mono text-zinc-400">Deep Dive Inspector:</span>
              <h4 className="text-lg font-mono font-bold text-white">
                {pipelineSteps[activeStep].title} — <span className="text-emerald-400">{pipelineSteps[activeStep].subtitle}</span>
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Select another node above to inspect</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div>
              <span className="text-zinc-400 text-[11px] uppercase tracking-wider block mb-2">Technical Implementation</span>
              <ul className="space-y-2">
                {pipelineSteps[activeStep].details.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 font-mono text-[11px] leading-relaxed">
              <div className="text-zinc-500 mb-2">// In-memory schema representation</div>
              {activeStep === 2 ? (
                <pre className="text-emerald-300">
{`interface TemporalEvent {
  id: string;
  sessionId: string;
  timestamp: { start: number; end: number }; // seconds
  type: 'network' | 'console' | 'dom' | 'terminal' | 'visual';
  description: string;
  confidence: 'observed' | 'likely' | 'possible' | 'confirmed';
  relatedEventIds: string[]; // bounded time-proximity, not causal
}`}
                </pre>
              ) : activeStep === 3 ? (
                <pre className="text-cyan-300">
{`-- packages/storage (better-sqlite3)
SELECT * FROM temporal_events
WHERE session_id = ? AND description LIKE ?
ORDER BY ts_start ASC;`}
                </pre>
              ) : (
                <pre className="text-zinc-300">
{`// Transport: stdio
// Telemetry destination: none by default
// Real vision/transcription calls: only on explicit tool invocation`}
                </pre>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
