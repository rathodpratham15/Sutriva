import React, { useState } from 'react';
import { 
  Play, 
  Terminal, 
  Search, 
  FileCode, 
  CheckCircle, 
  ArrowRight, 
  RotateCw, 
  Sparkles, 
  Check, 
  MessageSquare,
  Bot,
  User
} from 'lucide-react';

export const LiveDebuggingSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const loopSteps = [
    {
      name: 'Observe',
      actor: 'Developer & Sutriva',
      desc: 'Developer launches `sutriva debug --live` and interacts with the web application while Sutriva captures every event.',
      prompt: 'Follow me while I reproduce this.'
    },
    {
      name: 'Retrieve',
      actor: 'Sutriva Engine',
      desc: 'When the bug occurs, developer asks "What happened?". Claude calls get_current_context / get_evidence to retrieve the failure.',
      prompt: 'What happened?'
    },
    {
      name: 'Diagnose',
      actor: 'Coding Agent',
      desc: 'Agent calls inspect_environment to correlate the console error with source and Git state, locating the exact line.',
      prompt: 'Isolating root cause: app/checkout/page.tsx:15'
    },
    {
      name: 'Patch',
      actor: 'Coding Agent',
      desc: 'Agent drafts and writes the code patch directly to the target source file.',
      prompt: 'Patching data.orderId -> data.id.'
    },
    {
      name: 'Test',
      actor: 'Test Runner',
      desc: 'Automated test suite executes to verify that existing tests remain green.',
      prompt: 'pnpm typecheck && pnpm lint [PASS]'
    },
    {
      name: 'Reproduce',
      actor: 'Developer / Runner',
      desc: 'Developer or automated browser runner executes the exact checkout sequence a second time.',
      prompt: 'Rerunning checkout flow.'
    },
    {
      name: 'Verify',
      actor: 'Sutriva MCP',
      desc: 'Sutriva calls `compare_sessions` to verify the console error is gone.',
      prompt: 'compare_sessions: 1 console error resolved, 0 new'
    }
  ];

  return (
    <section id="live-debugging" className="py-24 bg-[#090a0f] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Interactive Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Debug with your agent in the loop.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Eliminate back-and-forth prompt guessing. Reproduce the bug naturally in your browser while Sutriva captures the evidence and your coding agent closes the loop.
          </p>
        </div>

        {/* Closed-Loop Stepper Bar */}
        <div className="mb-12 overflow-x-auto pb-4">
          <div className="flex items-center min-w-[750px] justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-zinc-800 -translate-y-1/2 -z-0" />
            
            {loopSteps.map((step, idx) => {
              const isActive = activeStep === idx;
              const isPast = activeStep > idx;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className="relative z-10 flex flex-col items-center group focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-emerald-400 text-zinc-950 ring-4 ring-emerald-500/20 scale-110' 
                      : isPast 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' 
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-700 group-hover:border-zinc-500'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`mt-2 font-mono text-xs font-medium ${
                    isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-300'
                  }`}>
                    {step.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Chat & Terminal Walkthrough */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Conversational Loop */}
          <div className="lg:col-span-6 rounded-2xl bg-[#0c0e14] border border-zinc-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="font-mono text-xs text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Live Agent Interaction
              </span>
              <span className="text-[11px] font-mono text-zinc-400">Step {activeStep + 1} of 7</span>
            </div>

            {/* Conversation Messages */}
            <div className="space-y-3 font-mono text-xs">
              
              {/* Message 1: Developer Follow Me */}
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                  <User className="w-3 h-3 text-zinc-300" />
                  <span className="text-zinc-300 font-semibold">Developer</span>
                </div>
                <p className="text-emerald-300 font-semibold text-xs">
                  "Follow me while I reproduce this."
                </p>
                <div className="text-[11px] text-zinc-400 font-sans">
                  Developer clicks "Place order" on the checkout page.
                </div>
              </div>

              {/* Message 2: Bug occurs */}
              <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-red-300 text-[11px]">
                <span className="font-bold">⚡ Bug occurs:</span> Button stays stuck on "Processing..." — no confirmation ever appears.
              </div>

              {/* Message 3: Developer asks What Happened */}
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                  <User className="w-3 h-3 text-zinc-300" />
                  <span className="text-zinc-300 font-semibold">Developer</span>
                </div>
                <p className="text-cyan-300 font-semibold text-xs">
                  "What happened?"
                </p>
              </div>

              {/* Message 4: Agent with Sutriva */}
              <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                  <Bot className="w-3 h-3 text-emerald-300" />
                  <span className="text-emerald-300 font-semibold">Coding Agent (via Sutriva MCP)</span>
                </div>
                <p className="text-zinc-200 text-xs font-sans leading-relaxed">
                  "The checkout request returned 200, but the frontend crashed reading <code className="text-amber-300 font-mono">data.orderId</code> — the API response doesn't include that field, it returns <code className="text-amber-300 font-mono">id</code> instead. A response schema mismatch in <code className="text-amber-300 font-mono">app/checkout/page.tsx:15</code>."
                </p>
              </div>

              {/* Message 5: Fix it command */}
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                  <User className="w-3 h-3 text-zinc-300" />
                  <span className="text-zinc-300 font-semibold">Developer</span>
                </div>
                <p className="text-emerald-300 font-semibold text-xs">
                  "Fix it."
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-40 font-mono text-xs"
              >
                ← Previous
              </button>
              <button
                onClick={() => setActiveStep((prev) => (prev + 1) % loopSteps.length)}
                className="px-3 py-1.5 rounded bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-mono text-xs font-semibold"
              >
                Next Step →
              </button>
            </div>
          </div>

          {/* Right Column: Step Telemetry Inspector */}
          <div className="lg:col-span-6 rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Phase Details</span>
                <h3 className="font-mono text-base font-bold text-white">
                  {loopSteps[activeStep].name} — <span className="text-emerald-400">{loopSteps[activeStep].actor}</span>
                </h3>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              {loopSteps[activeStep].desc}
            </p>

            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-xs space-y-2">
              <div className="text-zinc-500 text-[11px]">// Telemetry Action</div>
              <div className="text-emerald-300 font-medium">
                {loopSteps[activeStep].prompt}
              </div>
              <div className="pt-2 border-t border-zinc-800 text-zinc-400 text-[11px] space-y-1">
                <div>• Event timestamp: <span className="text-zinc-300">14.82s</span></div>
                <div>• Storage target: <span className="text-zinc-300">.sutriva/sutriva.db (SQLite)</span></div>
                <div>• Agent interface: <span className="text-zinc-300">MCP over stdio</span></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 font-mono">
              <span className="text-emerald-400 font-bold">Closed-Loop Flow:</span> observe → retrieve → diagnose → patch → test → reproduce → verify.
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
