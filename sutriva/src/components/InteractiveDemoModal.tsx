import React, { useState } from 'react';
import { 
  X, 
  Play, 
  RotateCcw, 
  Clock, 
  Terminal, 
  FileCode, 
  CheckCircle2, 
  AlertOctagon, 
  Bot, 
  Cpu, 
  Layers, 
  Network, 
  Search, 
  GitBranch, 
  ShieldCheck 
} from 'lucide-react';
import { TIMELINE_SAMPLE_DATA } from '../data/docsContent';

interface InteractiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveDemoModal: React.FC<InteractiveDemoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'mcp_query' | 'verification'>('timeline');
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(3); // 14.82s
  const [isPatched, setIsPatched] = useState<boolean>(false);
  const [selectedMcpTool, setSelectedMcpTool] = useState<'get_evidence' | 'compare_sessions' | 'get_transcript'>('get_evidence');

  if (!isOpen) return null;

  const events = TIMELINE_SAMPLE_DATA.events;
  const currentEvent = events[selectedEventIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0c0e15] border border-zinc-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#090a0f] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                <span>Sutriva Interactive Temporal Sandbox</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">
                  Live Simulation
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 py-2.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-zinc-800 text-emerald-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1. Event Timeline & Slicing
            </button>
            <button
              onClick={() => setActiveTab('mcp_query')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'mcp_query'
                  ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2. MCP Tool Execution
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'verification'
                  ? 'bg-zinc-800 text-amber-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              3. Closed-Loop Verification
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-zinc-400 text-[11px]">
            <span>Session: <strong className="text-zinc-200 font-mono">sess_94fa218b</strong></span>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between">
                <span>Click any timestamp event below to inspect the temporal slice extracted by Sutriva:</span>
                <span className="text-emerald-400 font-bold">Selected: {currentEvent.timestamp} ({currentEvent.timeSec.toFixed(2)}s)</span>
              </div>

              {/* Scrubbable Event Sequence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {events.map((ev, idx) => {
                  const isSelected = selectedEventIndex === idx;
                  const isErr = ev.isFailure;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedEventIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? isErr 
                            ? 'bg-red-950/50 border-red-500 shadow-md' 
                            : 'bg-zinc-800 border-emerald-500 shadow-md'
                          : isErr
                            ? 'bg-red-950/20 border-red-900/40 hover:border-red-700'
                            : 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`font-bold ${isErr ? 'text-red-400' : 'text-zinc-400'}`}>
                          {ev.timestamp}
                        </span>
                        <span className={`truncate ${isErr ? 'text-red-200 font-semibold' : 'text-zinc-300'}`}>
                          {ev.title}
                        </span>
                      </div>
                      {isErr && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900 text-red-200">500 CRASH</span>}
                    </button>
                  );
                })}
              </div>

              {/* Event Inspector Box */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-zinc-800 pb-2">
                  <span>Event Detail: {currentEvent.title}</span>
                  <span className="text-zinc-400 text-[11px] font-normal">Offset: {currentEvent.timeSec.toFixed(2)}s</span>
                </div>

                <p className="text-zinc-300 font-sans text-xs">
                  {currentEvent.details}
                </p>

                {currentEvent.sourceFile && (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-amber-300 text-[11px]">
                      <span>Source Correlation: {currentEvent.sourceFile}:{currentEvent.sourceLine}</span>
                      <span className="text-zinc-500 font-mono">Git Commit #7a8b92c</span>
                    </div>
                    {currentEvent.codeSnippet && (
                      <div className="p-2 rounded bg-black/80 text-amber-300/90 text-[11px]">
                        {currentEvent.codeSnippet}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'mcp_query' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Select MCP Tool Call:</span>
                {(['get_evidence', 'compare_sessions', 'get_transcript'] as const).map((tool) => (
                  <button
                    key={tool}
                    onClick={() => setSelectedMcpTool(tool)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      selectedMcpTool === tool
                        ? 'bg-emerald-400 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-800">
                  <span className="text-emerald-400 font-bold">Executed: {selectedMcpTool}</span>
                  <span className="text-[11px]">stdio response</span>
                </div>

                <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-300 text-[11px] overflow-x-auto leading-relaxed max-h-72">
                  {selectedMcpTool === 'get_evidence' && `{
  "sessionId": "session_a1b2c3d4",
  "aroundSeconds": 14.82,
  "windowSeconds": 3,
  "count": 2,
  "evidence": [
    {
      "type": "network",
      "description": "POST /api/checkout -> 200 (body: {id, total})",
      "confidence": "observed"
    },
    {
      "type": "console",
      "description": "TypeError: Cannot read properties of undefined (reading 'toString')",
      "confidence": "observed",
      "source": { "file": "app/checkout/page.tsx", "line": 15 }
    }
  ]
}`}
                  {selectedMcpTool === 'compare_sessions' && `{
  "before": { "sessionId": "session_before", "consoleErrorCount": 1, "networkFailureCount": 0 },
  "after": { "sessionId": "session_after", "consoleErrorCount": 0, "networkFailureCount": 0 },
  "resolvedEndpoints": [],
  "newOrChangedFailingEndpoints": [],
  "resolvedConsoleErrors": ["TypeError: ... reading 'toString'"],
  "newConsoleErrors": [],
  "summary": "0 endpoint(s) fixed, 0 new/changed failure(s), 1 console error(s) resolved, 0 new console error(s)"
}`}
                  {selectedMcpTool === 'get_transcript' && `{
  "sessionId": "session_a1b2c3d4",
  "segments": [
    { "start": 0.5, "end": 3.8, "text": "Follow me while I reproduce this checkout bug." },
    { "start": 13.9, "end": 16.2, "text": "See that? It just stays on Processing." }
  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white mb-1">Interactive Fix Simulator</h4>
                  <p className="text-xs text-zinc-400 font-sans">
                    Simulate applying the code patch to `app/checkout/page.tsx` and rerunning the verification session.
                  </p>
                </div>
                <button
                  onClick={() => setIsPatched(!isPatched)}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all ${
                    isPatched
                      ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                      : 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {isPatched ? 'Reset to Unpatched (Console Error)' : 'Apply Patch & Run compare_sessions'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 text-[11px] uppercase block font-semibold">Baseline Telemetry</span>
                  <div className="text-red-400 font-bold">POST /api/checkout → 200 (console error)</div>
                  <div className="text-zinc-400 text-[11px]">Uncaught TypeError: data.orderId is undefined</div>
                  <div className="text-zinc-500 text-[10px]">Session ID: session_before</div>
                </div>

                <div className={`p-4 rounded-xl border transition-all space-y-2 ${
                  isPatched
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}>
                  <span className="text-zinc-400 text-[11px] uppercase block font-semibold">Verification Telemetry</span>
                  {isPatched ? (
                    <>
                      <div className="text-emerald-400 font-bold">POST /api/checkout → 200 (no console error)</div>
                      <div className="text-zinc-300 text-[11px]">"Order ORD-1234 confirmed!" shown correctly.</div>
                      <div className="text-emerald-400 font-bold text-[11px] pt-1">compare_sessions: 1 resolved, 0 new ✓</div>
                    </>
                  ) : (
                    <div className="text-zinc-500 text-xs py-2">
                      Click "Apply Patch & Run compare_sessions" above to execute verification rerun.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#090a0f] border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>Engine: SQLite (.sutriva/sutriva.db) • Transport: stdio</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Close Sandbox
          </button>
        </div>

      </div>
    </div>
  );
};
