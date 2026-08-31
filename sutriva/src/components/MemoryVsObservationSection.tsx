import React, { useState } from 'react';
import { 
  Clock, 
  ArrowLeft, 
  Search, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  BrainCircuit, 
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';
import { TIMELINE_SAMPLE_DATA } from '../data/docsContent';

export const MemoryVsObservationSection: React.FC = () => {
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(3); // 14.82s failure
  const [sliceExtracted, setSliceExtracted] = useState<boolean>(true);

  const events = TIMELINE_SAMPLE_DATA.events;
  const currentEvent = events[selectedEventIndex];

  return (
    <section id="memory-vs-observation" className="py-24 bg-[#090a0f] border-b border-zinc-800 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 glow-emerald opacity-10 pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 glow-emerald opacity-15 pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-brand-400 mb-4">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Paradigm Shift</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-4">
            Not Observation. Memory.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Coding agents can observe and interact with live browsers. Sutriva supplies the persistent historical timeline so they understand how the system reached that state.
          </p>
        </div>

        {/* Dual Pane Comparison: Agent (Observation) vs. Sutriva (Memory) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Pane: Coding Agent (What's happening now?) */}
          <div className="lg:col-span-5 rounded-xl bg-[#0d0f17] border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-white">Coding Agent</h3>
                    <p className="text-[11px] text-zinc-400">Live Observation Viewport</p>
                  </div>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                  t = 19.41s
                </span>
              </div>

              {/* Prompt query */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-xs mb-5">
                <div className="text-zinc-500 mb-1">// Agent inspection query</div>
                <div className="text-brand-300 font-semibold flex items-center gap-2">
                  <span>&gt;</span>
                  <span>"What's happening now?"</span>
                </div>
              </div>

              {/* Observation output */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                  <div className="text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">Active Snapshot</div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Current URL:</span>
                    <span>http://localhost:3000/cart</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">DOM Status:</span>
                    <span className="text-brand-400">Rendered (Idle)</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Network Queue:</span>
                    <span>0 active requests</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Console Errors:</span>
                    <span>0 in active buffer</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-history-950/20 border border-history-800/40 text-history-300/90 text-xs">
                  <p className="font-sans leading-relaxed">
                    <strong>Blind spot:</strong> The agent sees a resting UI, but not the console error that fired moments ago and already scrolled out of the current buffer.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Scope: Present State</span>
              <span className="text-zinc-400">Context: Incomplete</span>
            </div>
          </div>

          {/* Right Pane: Sutriva (What happened before?) */}
          <div className="lg:col-span-7 rounded-xl bg-[#0c0f18] border border-brand-500/40 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 glow-emerald opacity-20 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-950/80 border border-brand-700/60 flex items-center justify-center text-brand-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                      <span>Sutriva</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        TEMPORAL RECORD
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">Queryable Temporal Event Record</p>
                  </div>
                </div>

                <button
                  id="btn-retrieve-slice"
                  onClick={() => setSliceExtracted(true)}
                  className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-brand-400 text-zinc-950 hover:bg-brand-300 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Retrieve Slice @ 14.82s</span>
                </button>
              </div>

              {/* Prompt query */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-xs mb-5">
                <div className="text-zinc-500 mb-1">// Agent querying Sutriva via MCP</div>
                <div className="text-history-300 font-semibold flex items-center gap-2">
                  <span>&gt;</span>
                  <span>"What happened before the failure?"</span>
                </div>
              </div>

              {/* Timeline Extending Backward */}
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px] px-2">
                  <span className="flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3 text-brand-400" />
                    Timeline extending backward from t=19.41s
                  </span>
                  <span>Click event to inspect</span>
                </div>

                <div className="space-y-1.5">
                  {events.slice(3).map((ev, index) => {
                    const realIndex = index + 3;
                    const isSelected = selectedEventIndex === realIndex;
                    const isError = ev.isFailure;

                    return (
                      <button
                        key={realIndex}
                        onClick={() => setSelectedEventIndex(realIndex)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? isError 
                              ? 'bg-failure-950/40 border-failure-500/80 shadow-md shadow-failure-950/30' 
                              : 'bg-zinc-800/90 border-brand-500/80 shadow-md'
                            : isError 
                              ? 'bg-failure-950/20 border-failure-900/50 hover:border-failure-700' 
                              : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-xs font-bold ${
                            isError ? 'text-failure-400' : 'text-zinc-400'
                          }`}>
                            {ev.timeSec.toFixed(2)}s
                          </span>
                          <span className={`text-xs ${
                            isError ? 'text-failure-200 font-semibold' : 'text-zinc-300'
                          }`}>
                            {ev.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {ev.status && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              ev.status === 500 
                                ? 'bg-failure-900/80 text-failure-300 border border-failure-700'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {ev.status}
                            </span>
                          )}
                          {isError && (
                            <span className="w-2 h-2 rounded-full bg-failure-500 animate-ping" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inspected Event Detail / Historical Slice Box */}
              {sliceExtracted && currentEvent && (
                <div className="mt-5 p-4 rounded-xl bg-zinc-950 border border-brand-500/50 space-y-2.5 font-mono text-xs animate-fadeIn">
                  <div className="flex items-center justify-between text-brand-400 font-semibold border-b border-zinc-800 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      Retrieved Slice @ {currentEvent.timeSec.toFixed(2)}s
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      source: SQLite (.sutriva/sutriva.db)
                    </span>
                  </div>

                  <p className="text-zinc-300 font-sans text-xs">
                    {currentEvent.details}
                  </p>

                  {currentEvent.sourceFile && (
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="flex items-center gap-1 text-history-300">
                          <FileCode className="w-3.5 h-3.5" />
                          {currentEvent.sourceFile}:{currentEvent.sourceLine}
                        </span>
                        <span className="text-zinc-500 font-mono">via inspect_environment</span>
                      </div>
                      {currentEvent.codeSnippet && (
                        <div className="p-1.5 rounded bg-black/80 font-mono text-history-300/90 text-[11px]">
                          {currentEvent.codeSnippet}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Scope: Full Historical Record</span>
              <span className="text-brand-400 font-semibold">Evidence Correlated</span>
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs sm:text-sm text-zinc-300">
            <span className="text-zinc-400">Key takeaway:</span>
            <span className="text-brand-400 font-bold">HISTORICAL CONTEXT ≠ CURRENT STATE</span>
          </div>
        </div>

      </div>
    </section>
  );
};
