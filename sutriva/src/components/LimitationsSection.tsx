import React from 'react';
import { 
  AlertTriangle, 
  Cpu, 
  DollarSign, 
  GitCommit, 
  Layers, 
  HelpCircle,
  EyeOff
} from 'lucide-react';

export const LimitationsSection: React.FC = () => {
  const limitations = [
    {
      title: 'No Visual Diffing in compare_sessions',
      desc: 'compare_sessions compares console errors and network endpoint status codes only. A purely visual/layout regression with no console or network signal reports as "nothing changed" — verify visually instead.'
    },
    {
      title: 'Endpoint Matching Is Exact-String',
      desc: 'compare_sessions matches endpoints by exact METHOD + URL string and parses status from the event description — it does not normalize query strings or diff response bodies.'
    },
    {
      title: 'Correlation ≠ Causal Inference',
      desc: 'Event correlation (relatedEventIds) is a bounded time-proximity heuristic — it links plausible chains (e.g. a request following a recent click), but never asserts one event caused another.'
    },
    {
      title: 'FFmpeg Native Dependency',
      desc: 'Replay ingestion (`sutriva inspect`) requires `ffmpeg`/`ffprobe` on PATH.'
    },
    {
      title: 'Playwright Chromium Not Auto-Installed',
      desc: 'Live browser debugging needs `npx playwright install chromium` run once — npm/pnpm install does not fetch it automatically. `sutriva doctor` checks for and reports this explicitly.'
    },
    {
      title: 'API Costs for Real Providers',
      desc: 'Real vision analysis (ANTHROPIC_API_KEY) and real transcription via ElevenLabs Scribe (ELEVENLABS_API_KEY) are billed API calls, made only when a tool that needs them is invoked. Nothing is required for the offline mock-provider default.'
    },
    {
      title: 'Platform: macOS-Verified Only',
      desc: 'Developed and tested on macOS (Apple Silicon). Linux/Windows should work in principle — all native dependencies support both — but are not independently verified.'
    },
    {
      title: 'Terminal Capture Requires `sutriva exec`',
      desc: 'There is no automatic, shell-wide capture of commands you type directly. Output redaction is a best-effort heuristic, not a guarantee.'
    },
    {
      title: 'Not Yet on the Official MCP Registry',
      desc: '`mcpName` is live in the published npm package (@sutriva/mcp-server@0.1.1) — registration itself is still a pending, separate step.'
    }
  ];

  return (
    <section id="limitations" className="py-24 bg-[#090a0f] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-history-400 mb-4">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Honest Technical Scope</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Limitations & Known Boundaries
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            We believe transparent tooling makes better software. Here is an honest summary of what Sutriva requires and where its boundaries lie.
          </p>
        </div>

        {/* Limitations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
          {limitations.map((lim, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all font-mono"
            >
              <div className="flex items-center justify-between text-xs text-history-400 mb-2 font-bold">
                <span>0{idx + 1}.</span>
                <span className="text-[10px] text-zinc-500 font-normal">Constraint</span>
              </div>
              <h3 className="text-sm font-bold text-zinc-200 mb-2">
                {lim.title}
              </h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {lim.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
