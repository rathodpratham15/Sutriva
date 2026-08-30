import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowDown, 
  FileCode, 
  GitCommit, 
  ShieldCheck, 
  RotateCw, 
  Terminal, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const ClosedLoopVerificationSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual' | 'mcp_output'>('visual');

  return (
    <section id="verification" className="py-24 bg-[#08090d] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Closed-Loop Verification</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Don't just patch it. Verify it.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Writing code is only half the job. Sutriva’s <code className="text-emerald-400 font-mono">compare_sessions</code> capability inspects runtime network status codes, console error rates, and state transitions to verify that the bug was eradicated in the post-patch run.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex p-1 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'visual' ? 'bg-zinc-800 text-emerald-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Visual Flow
            </button>
            <button
              onClick={() => setActiveTab('mcp_output')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'mcp_output' ? 'bg-zinc-800 text-emerald-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              MCP Raw Signal Diff
            </button>
          </div>
        </div>

        {activeTab === 'visual' ? (
          /* BEFORE -> PATCH -> AFTER Flow */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* 1. BEFORE Box */}
            <div className="p-6 rounded-2xl bg-[#0e0f17] border border-red-900/50 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                  <span className="font-mono text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    1. BEFORE (Baseline Session)
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">sess_bug_01</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300">
                    <div className="font-bold flex justify-between">
                      <span>POST /api/checkout</span>
                      <span className="bg-zinc-900 text-white px-1.5 py-0.5 rounded text-[10px]">200 OK</span>
                    </div>
                    <div className="text-[11px] text-red-400/90 mt-1 font-sans">
                      Console: TypeError: Cannot read properties of undefined (reading 'toString')
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Console Errors:</span>
                      <span className="text-red-400 font-bold">1 logged</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Button State:</span>
                      <span className="text-zinc-500">"Processing..." (stuck)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
                Outcome: Reproduction Confirmed
              </div>
            </div>

            {/* 2. CLAUDE PATCHES Box */}
            <div className="p-6 rounded-2xl bg-[#0c0e14] border border-zinc-700 flex flex-col justify-between shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] uppercase font-bold tracking-wider">
                Autonomous Patch
              </div>

              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                  <span className="font-mono text-xs text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    2. Coding Agent Patches
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">page.tsx:15</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] space-y-2 text-zinc-300">
                  <div className="text-zinc-500">// app/checkout/page.tsx</div>
                  <div className="text-red-400 line-through">
                    - {"`Order ${data.orderId.toString()} confirmed!`"}
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    + {"`Order ${data.id} confirmed!`"}
                  </div>
                  <div className="text-zinc-400 pt-2 border-t border-zinc-800 text-[10px]">
                    Agent runs tests: <code className="text-emerald-300">pnpm typecheck && pnpm lint</code>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-800/80 text-[11px] text-emerald-400 font-mono flex items-center justify-between">
                <span>Git Patch Applied</span>
                <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* 3. AFTER Box */}
            <div className="p-6 rounded-2xl bg-[#0c120f] border border-emerald-500/50 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                  <span className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    3. AFTER (Verification Run)
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">sess_verify_01</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                    <div className="font-bold flex justify-between">
                      <span>POST /api/checkout</span>
                      <span className="bg-emerald-800 text-white px-1.5 py-0.5 rounded text-[10px]">200 OK</span>
                    </div>
                    <div className="text-[11px] text-emerald-300/90 mt-1 font-sans">
                      "Order ORD-1234 confirmed!" shown correctly.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Console Errors:</span>
                      <span className="text-emerald-400 font-bold">0 logged</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Button State:</span>
                      <span className="text-emerald-400 font-bold">Confirmation shown</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-800/80 text-[11px] text-emerald-400 font-mono font-semibold">
                Status: VERIFIED_FIX ✓
              </div>
            </div>

          </div>
        ) : (
          /* MCP Raw JSON Diff Output */
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <span className="text-emerald-400 font-bold">
                MCP Tool Result: <code className="text-zinc-200">compare_sessions</code>
              </span>
              <span className="text-zinc-500 text-[11px]">stdio response</span>
            </div>

            <pre className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 overflow-x-auto text-[11px] leading-relaxed">
{`{
  "before": { "sessionId": "session_before", "consoleErrorCount": 1, "networkFailureCount": 0 },
  "after": { "sessionId": "session_after", "consoleErrorCount": 0, "networkFailureCount": 0 },
  "resolvedEndpoints": [],
  "newOrChangedFailingEndpoints": [],
  "resolvedConsoleErrors": [
    "TypeError: Cannot read properties of undefined (reading 'toString')"
  ],
  "newConsoleErrors": [],
  "summary": "0 endpoint(s) fixed, 0 new/changed failure(s), 1 console error(s) resolved, 0 new console error(s)"
}`}
            </pre>
          </div>
        )}

        {/* Honest Technical Scope Disclaimer */}
        <div className="mt-10 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3 max-w-3xl mx-auto">
          <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-zinc-300">Technical Scope Note:</strong> Sutriva’s <code className="text-zinc-300 font-mono">compare_sessions</code> capability focuses strictly on deterministic telemetry signals (network status codes, console error rates, and state transition payloads). It does <span className="text-zinc-300 font-semibold">not</span> perform computer vision pixel diffing.
          </p>
        </div>

      </div>
    </section>
  );
};
