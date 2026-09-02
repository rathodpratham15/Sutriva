import React from 'react';
import { 
  AlertOctagon, 
  Clock, 
  Terminal, 
  Layers, 
  Network, 
  RotateCcw, 
  MousePointer, 
  FileX, 
  Cpu 
} from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const bugDimensions = [
    {
      icon: Network,
      title: 'A request that failed',
      desc: 'A transient 500 error or timed-out network payload that completed 5 seconds ago is no longer in the active network buffer.'
    },
    {
      icon: AlertOctagon,
      title: 'A console error',
      desc: 'An unhandled promise rejection or runtime exception that fired, cleared the screen, and got garbage collected.'
    },
    {
      icon: MousePointer,
      title: 'A browser action',
      desc: 'The exact click, drag, or form input sequence that shifted internal component state into an invalid configuration.'
    },
    {
      icon: Terminal,
      title: 'A terminal command',
      desc: 'A background worker crash or database migration command executed earlier in the development lifecycle.'
    },
    {
      icon: Layers,
      title: 'A state transition',
      desc: 'Redux/Zustand or React state mutations where intermediate race conditions caused a silent desynchronization.'
    },
    {
      icon: Clock,
      title: 'The exact timestamp sequence',
      desc: 'Event A occurred at 14.82s, followed 90ms later by Event B. Without temporal ordering, root cause analysis is guesswork.'
    }
  ];

  return (
    <section id="problem" className="py-24 bg-[#08090d] border-b border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-brand-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            <span>Root Cause Analysis</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Debugging has a memory problem.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            A coding agent can inspect the repository and current application state. But many bugs depend on events that <strong className="text-zinc-200">already happened</strong>. By the time the agent is asked to diagnose, the fatal event has already passed.
          </p>
        </div>

        {/* The Current State Trap Diagram */}
        <div className="mb-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Box: Current State Alone (Incomplete) */}
          <div className="lg:col-span-5 rounded-xl bg-zinc-900/40 border border-zinc-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Observation Alone
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  Current State (t = 19.41s)
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                The Incomplete Snapshot
              </h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Inspecting DOM at resting state shows an empty cart or a generic fallback. The coding agent sees no active exception in the current render tree, prompting blind trial-and-error code edits.
              </p>
            </div>

            <div className="rounded-lg bg-zinc-950 p-4 border border-zinc-800/80 font-mono text-xs space-y-2 text-zinc-400">
              <div className="text-zinc-500">// Current App Snapshot at t = 19.41s</div>
              <div className="text-zinc-300">URL: <span className="text-zinc-400">http://localhost:4173/checkout</span></div>
              <div className="text-zinc-300">Button: <span className="text-brand-400">"Processing..." (stuck)</span></div>
              <div className="text-zinc-300">Active Console Errors: <span className="text-brand-400">0 (cleared)</span></div>
              <div className="text-history-400 pt-2 border-t border-zinc-800 text-[11px]">
                ⚠ Missing: The uncaught TypeError that fired at 14.91s and already scrolled off
              </div>
            </div>
          </div>

          {/* Right Box: Historical Sequence Preserved by Sutriva */}
          <div className="lg:col-span-7 rounded-xl bg-zinc-900/70 border border-brand-500/30 p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 glow-emerald opacity-20 pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-brand-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Sutriva Temporal Memory
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-brand-950/80 text-brand-300 border border-brand-800/60">
                  Full Sequence Preserved
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Persistent, Timestamped Historical Evidence
              </h3>
              <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
                Sutriva correlates user actions, network transactions, console exceptions, and Git state into a persistent, queryable timeline that coding agents can interrogate anytime — long after the moment has passed.
              </p>
            </div>

            <div className="rounded-lg bg-zinc-950 p-4 border border-zinc-800/80 font-mono text-xs space-y-2.5">
              <div className="flex items-center justify-between text-zinc-500 text-[11px] border-b border-zinc-800 pb-1.5">
                <span>TIMESTAMP</span>
                <span>EVENT TYPE</span>
                <span>SIGNAL RECOVERED</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500">04.12s</span>
                <span className="text-zinc-300">DOM CLICK</span>
                <span className="text-zinc-400">#checkout-btn</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 bg-zinc-900/40 px-2 py-1 rounded border border-zinc-800">
                <span className="font-bold">14.82s</span>
                <span className="font-bold">NETWORK</span>
                <span>POST /api/checkout → 200 (body: {"{id, total}"})</span>
              </div>
              <div className="flex items-center justify-between text-failure-400 bg-failure-950/30 px-2 py-1 rounded border border-failure-900/40">
                <span className="font-bold">14.91s</span>
                <span className="font-bold">CONSOLE</span>
                <span>Uncaught TypeError in app/checkout/page.tsx:15</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500">15.32s</span>
                <span className="text-zinc-300">UI STATE</span>
                <span>Stuck on "Processing..."</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Core Dimensions of Ephemeral Bugs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bugDimensions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-brand-400 group-hover:text-brand-300 mb-4 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-sm font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Section Footer Callout */}
        <div className="mt-12 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center max-w-2xl mx-auto">
          <p className="text-sm font-mono text-zinc-300">
            "Your coding agent can see what's happening. <br className="hidden sm:inline" />
            <span className="text-brand-400 font-semibold">Sutriva helps it remember what happened.</span>"
          </p>
        </div>

      </div>
    </section>
  );
};
