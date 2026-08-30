import React, { useState } from 'react';
import { 
  Clock, 
  HelpCircle, 
  Search, 
  AlertOctagon, 
  CheckCircle, 
  ArrowRight, 
  ArrowDown, 
  Cpu, 
  Eye, 
  Sparkles,
  Layers
} from 'lucide-react';

export const TemporalMemorySection: React.FC = () => {
  const [activeQueryMode, setActiveQueryMode] = useState<'historical' | 'current'>('historical');

  const eventSequence = [
    { id: 'A', name: 'Event A', time: '00:00.00', desc: 'Navigated to /checkout', type: 'normal' },
    { id: 'B', name: 'Event B', time: '00:04.12', desc: 'User clicks "Place order" (#checkout-btn)', type: 'normal', isRelevant: true },
    { id: 'Fail', name: 'Failure Event', time: '00:14.91', desc: 'Uncaught TypeError: data.orderId is undefined (API returned `id`, not `orderId`)', type: 'failure', isRelevant: true },
    { id: 'C', name: 'Event C', time: '00:15.32', desc: 'Button stays stuck on "Processing..." — setStatus("done") never runs', type: 'normal' },
    { id: 'D', name: 'Event D', time: '00:17.08', desc: 'No further user action — page remains on /checkout', type: 'normal' },
    { id: 'E', name: 'Event E', time: '00:19.41', desc: 'Current resting state ("Processing..." still shown, 0 new console errors)', type: 'current', isCurrent: true }
  ];

  return (
    <section id="temporal-memory" className="py-24 bg-[#090a0f] border-b border-zinc-800 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] glow-emerald opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 mb-4">
            <Clock className="w-3.5 h-3.5" />
            <span>Foundational Concept</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Temporal Memory
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Understanding failures requires inspecting the temporal chain of causality, not just the eventual resting state.
          </p>
        </div>

        {/* Central Visual: Event Chain A -> B -> Failure -> C -> D -> E */}
        <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-[#0c0e16] border border-zinc-800 shadow-2xl">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-6 flex items-center justify-between">
            <span>Timestamped Event Sequence</span>
            <span className="text-zinc-500">t = 0.00s → 19.41s</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {eventSequence.map((ev, idx) => {
              const isFail = ev.type === 'failure';
              const isCur = ev.type === 'current';
              const isHighlighted = 
                activeQueryMode === 'historical' 
                  ? (ev.isRelevant || isFail)
                  : isCur;

              return (
                <div
                  key={ev.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between font-mono ${
                    isHighlighted
                      ? isFail 
                        ? 'bg-red-950/40 border-red-500/80 shadow-lg shadow-red-950/30' 
                        : isCur 
                          ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-950/30'
                          : 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                      : 'bg-zinc-900/30 border-zinc-800/80 opacity-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${
                        isFail ? 'text-red-400' : isCur ? 'text-cyan-400' : 'text-emerald-400'
                      }`}>
                        {ev.name}
                      </span>
                      <span className="text-[10px] text-zinc-400">{ev.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-sans leading-snug">
                      {ev.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/60 text-[10px]">
                    {isFail && <span className="text-red-400 font-bold uppercase">Root Failure</span>}
                    {isCur && <span className="text-cyan-400 font-bold uppercase">Resting State</span>}
                    {!isFail && !isCur && <span className="text-zinc-400">Recorded</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Query Switcher: What happened before vs. What's happening now */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#0a0c12] border border-zinc-800 p-6 sm:p-8 shadow-xl">
          
          {/* Switcher Toggle Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button
              id="query-tab-historical"
              onClick={() => setActiveQueryMode('historical')}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeQueryMode === 'historical'
                  ? 'bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Query: "What happened before the failure?"</span>
            </button>

            <button
              id="query-tab-current"
              onClick={() => setActiveQueryMode('current')}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeQueryMode === 'current'
                  ? 'bg-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Query: "What's happening now?"</span>
            </button>
          </div>

          {/* Query Response Display */}
          {activeQueryMode === 'historical' ? (
            <div className="space-y-4 font-mono text-xs animate-fadeIn">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/50 space-y-3">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span>Sutriva Temporal Memory Result:</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Slices Retrieved: Event B + Failure Context
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                    <span className="text-emerald-400 font-semibold">[00:04.12 - Event B]:</span> User clicked "Place order". POST /api/checkout dispatched.
                  </div>
                  <div className="p-2.5 rounded bg-red-950/60 border border-red-800/80 text-red-200">
                    <span className="text-red-400 font-bold">[00:14.91 - Failure Event]:</span> Uncaught TypeError: Cannot read properties of undefined (reading 'toString') in app/checkout/page.tsx:15 — the API response has no `orderId` field.
                  </div>
                  <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                    <span className="text-amber-400 font-semibold">[00:15.32 - Event C]:</span> Click handler threw before setStatus("done") ran — button stuck on "Processing...".
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 font-sans pt-1">
                  ✓ Coding agent receives exact cause without relying on memoryless state inspection.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 font-mono text-xs animate-fadeIn">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/50 space-y-3">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span>Observation Alone Result:</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Single Snapshot: Event E
                  </span>
                </div>

                <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                  <span className="text-cyan-400 font-semibold">[00:19.41 - Event E]:</span> Browser resting state is still on /checkout. Button shows "Processing...". No errors in the current console buffer.
                </div>

                <div className="p-3 rounded bg-amber-950/40 border border-amber-900/60 text-amber-200 font-sans text-xs">
                  <strong>Outcome:</strong> Agent cannot determine why checkout is stuck because the console error (Event Fail) already scrolled off and the current console buffer shows nothing.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Big Distinction Callout */}
        <div className="mt-12 text-center">
          <div className="inline-block p-4 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl max-w-xl">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
              Core Axiom
            </span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              HISTORICAL CONTEXT ≠ CURRENT STATE
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
