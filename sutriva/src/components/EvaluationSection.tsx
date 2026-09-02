import React from 'react';
import { 
  CheckCircle2, 
  FlaskConical, 
  Layers, 
  Eye, 
  Mic, 
  GitBranch, 
  ShieldCheck, 
  Info,
  ExternalLink
} from 'lucide-react';

export const EvaluationSection: React.FC = () => {
  const evaluatedScenarios = [
    {
      id: 'demo-01',
      title: '1. Checkout Response Schema Mismatch',
      observed: 'Clicking "Place order" throws "Cannot read properties of undefined (reading \'toString\')" in the console; the button stays stuck on "Processing..." and no confirmation ever shows.',
      rootCause: 'app/api/checkout/route.ts returns { id, total }, but app/checkout/page.tsx reads data.orderId, which does not exist — a response schema mismatch, not a network failure.',
      outcome: 'Claude localized app/checkout/page.tsx on the first try, matched the root cause exactly, patched data.orderId to data.id, and verified via compare_sessions: 1 console error resolved, 0 new.',
      status: 'VERIFIED'
    },
    {
      id: 'demo-02',
      title: '2. Search Async Race Condition',
      observed: 'Typing "cat" then quickly "cats" shows stale results for "cat" even though "cats" is what\'s currently in the input.',
      rootCause: 'The API has a query-dependent delay ("cat" takes longer than "cats"), so the "cats" response arrives first but the later, stale "cat" response overwrites it — no request-sequencing guard in app/search/page.tsx.',
      outcome: 'Claude\'s hypothesis: "whichever fetch response resolves last overwrites state, regardless of which request was issued last" — matched exactly. Verified: #results flips from stale to correct.',
      status: 'VERIFIED'
    },
    {
      id: 'demo-03',
      title: '3. Responsive Visual Regression',
      observed: 'At viewport widths <= 480px, the "Submit order" button is hidden underneath the header — no console error, no failed request, purely visual.',
      rootCause: 'The mobile media query grows .app-header from 64px to 220px tall, but .responsive-main\'s padding-top is never increased to compensate.',
      outcome: 'Claude localized responsive.css, added the matching padding-top increase, and verified via a direct bounding-box assertion (compare_sessions has no visual diffing) that the button no longer overlaps the header.',
      status: 'VERIFIED'
    }
  ];

  return (
    <section id="evaluation" className="py-24 bg-[#08090d] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-brand-400 mb-4">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Verification & Testing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Built and tested against real debugging workflows.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Sutriva is built to solve actual asynchronous, ephemeral bugs encountered in real development environments — not synthetic benchmark puzzles.
          </p>
        </div>

        {/* Credible Metrics Bar (Grounded, no hype) */}
        <div className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-950/80 border border-brand-700/60 flex items-center justify-center text-brand-400 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-white mb-1">87 / 87</div>
              <h3 className="font-mono text-sm font-semibold text-zinc-300 mb-2">Automated CI Tests Passing</h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Unit, integration, and a real MCP-server-over-stdio test — covering Playwright browser instrumentation, FFmpeg frame extraction, SQLite storage, and the canonical temporal-memory proof — fully offline, no paid API calls required.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-950/80 border border-brand-700/60 flex items-center justify-center text-brand-400 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-white mb-1">3 / 3</div>
              <h3 className="font-mono text-sm font-semibold text-zinc-300 mb-2">Real Demo Bugs Evaluated</h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                An opt-in agentic harness drives Claude Code headlessly through 3 real bugs in a demo Next.js app — no human in the loop — grading root-cause accuracy, code localization, and patch success.
              </p>
            </div>
          </div>

        </div>

        {/* Real Systems Tested Badges */}
        <div className="mb-12">
          <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider block mb-3">
            Real Subsystems Tested
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
            {[
              { name: 'Claude Vision Analysis', icon: Eye },
              { name: 'ElevenLabs Transcription', icon: Mic },
              { name: 'Playwright Live Sessions', icon: Layers },
              { name: 'Git Context', icon: GitBranch },
              { name: 'Before/After Verification', icon: ShieldCheck }
            ].map((sub, i) => {
              const Icon = sub.icon;
              return (
                <div key={i} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-2 text-zinc-300">
                  <Icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <span className="truncate">{sub.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* The 3 Real Demo Bugs Evaluated Breakdown */}
        <div className="space-y-4 mb-10">
          <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider block">
            The 3 Evaluated Scenarios
          </span>

          <div className="space-y-4">
            {evaluatedScenarios.map((demo) => (
              <div
                key={demo.id}
                className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition-all font-mono text-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <h4 className="font-bold text-sm text-white">
                    {demo.title}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800 font-mono text-[11px] self-start sm:self-auto">
                    <CheckCircle2 className="w-3 h-3 text-brand-400" />
                    {demo.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans text-xs">
                  <div>
                    <span className="font-mono text-[11px] text-zinc-400 uppercase block mb-1">Observed Symptom</span>
                    <p className="text-zinc-300 leading-relaxed">{demo.observed}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] text-zinc-400 uppercase block mb-1">Historical Root Cause</span>
                    <p className="text-zinc-300 leading-relaxed">{demo.rootCause}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] text-brand-400 uppercase block mb-1">Agent Outcome</span>
                    <p className="text-zinc-300 leading-relaxed">{demo.outcome}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grounding Explanation / Honesty Callout */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-3 max-w-3xl mx-auto text-xs text-zinc-400 font-sans leading-relaxed">
          <Info className="w-4 h-4 text-info-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-300 font-mono">Evaluation Context:</strong> The "3/3 real demo bugs" metric is a live-verified engineering test suite against three deterministic bugs in one small Next.js demo app (`demo/buggy-app`) — a response schema mismatch, an async race condition, and a pure-CSS visual regression, exercising different evidence types (console, network, and screenshot). It is a qualitative validation of the pipeline, not a claim of statistical significance or benchmark superiority over other tools.
          </div>
        </div>

      </div>
    </section>
  );
};
