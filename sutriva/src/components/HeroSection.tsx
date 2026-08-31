import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Github, 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  FileCode, 
  Database,
  ArrowUpRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { RoutePath } from '../types';

interface HeroSectionProps {
  onNavigate: (path: RoutePath) => void;
  onOpenDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate, onOpenDemo }) => {
  const [copied, setCopied] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [activeHeroTab, setActiveHeroTab] = useState<'terminal' | 'evidence' | 'mcp'>('terminal');

  const installCommand = 'npm install -g sutriva';

  const copyInstall = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cycling terminal animation steps:
  // Step 0: $ npm install -g sutriva
  // Step 1: $ sutriva debug --live
  // Step 2: > Follow me while I reproduce this. (Capturing events...)
  // Step 3: > What happened?
  // Step 4: Historical evidence appeared & correlated!
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 5);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden border-b border-zinc-800/60">
      {/* Thin technical grid strip, confined to the band directly under the
          navbar -- not a decorative grid spanning the whole section. */}
      <div className="absolute inset-x-0 top-0 h-40 md:h-48 bg-grid-strip pointer-events-none -z-10" />

      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] glow-emerald pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] glow-emerald pointer-events-none -z-10 opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-xs font-mono text-zinc-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-zinc-400">Open-Source Developer Tool</span>
            <span className="text-zinc-600">•</span>
            <span className="text-brand-400 font-semibold">sutriva@0.1.1</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-400">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>Works with Claude Code via MCP</span>
          </div>
        </div>

        {/* Hero Title & Tagline */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-mono font-extrabold tracking-tight text-white mb-4">
            SUTRIVA
          </h1>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 mb-6">
            Temporal memory for coding agents.
          </p>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-normal leading-relaxed max-w-3xl mx-auto">
            Debugging often depends on what happened <span className="text-zinc-200 font-medium underline decoration-brand-500/40 underline-offset-4">before</span> the current state. Sutriva turns live and recorded debugging sessions into persistent, timestamped evidence that coding agents can query later.
          </p>
        </div>

        {/* Past Events -> Failure -> Current State: the core visual grammar,
            introduced here so it reads before any paragraph explains it. */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10 font-mono text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-history-950/50 border border-history-800/60 text-history-300">
            <span className="w-1.5 h-1.5 rounded-full bg-history-400" />
            Past Events
          </span>
          <span className="text-zinc-700">→</span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-failure-950/50 border border-failure-800/60 text-failure-300">
            <span className="w-1.5 h-1.5 rounded-full bg-failure-400" />
            Failure
          </span>
          <span className="text-zinc-700">→</span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-950/50 border border-brand-800/60 text-brand-300">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            Current State
          </span>
        </div>

        {/* CTA Button Row */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
          <button
            id="hero-primary-get-started"
            onClick={() => onNavigate('/docs/quickstart')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-400 hover:bg-brand-300 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            id="hero-secondary-github"
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 font-medium text-sm transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>View on GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
          </a>

          <button
            id="hero-tertiary-watch-demo"
            onClick={onOpenDemo}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-300 hover:text-brand-300 border border-zinc-800 font-medium text-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current text-brand-400" />
            <span>Watch Demo</span>
          </button>
        </div>

        {/* Interactive Terminal & Evidence Demonstration Frame */}
        <div className="max-w-4xl mx-auto rounded-xl bg-[#0d0e15] border border-zinc-800 shadow-2xl overflow-hidden">
          {/* Terminal Window Chrome */}
          <div className="px-4 py-3 bg-[#0a0b10] border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-700/60" />
              <div className="w-3 h-3 rounded-full bg-zinc-700/60" />
              <div className="w-3 h-3 rounded-full bg-zinc-700/60" />
              <span className="ml-2 font-mono text-xs text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                sutriva-session — live capture
              </span>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
              <button
                id="hero-tab-terminal"
                onClick={() => setActiveHeroTab('terminal')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeHeroTab === 'terminal' 
                    ? 'bg-zinc-800 text-brand-300 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                CLI Feed
              </button>
              <button
                id="hero-tab-evidence"
                onClick={() => setActiveHeroTab('evidence')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  activeHeroTab === 'evidence' 
                    ? 'bg-zinc-800 text-brand-300 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Temporal Slice</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              </button>
              <button
                id="hero-tab-mcp"
                onClick={() => setActiveHeroTab('mcp')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeHeroTab === 'mcp' 
                    ? 'bg-zinc-800 text-brand-300 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                MCP JSON
              </button>
            </div>
          </div>

          {/* Terminal Content Body */}
          <div className="p-5 font-mono text-xs sm:text-sm min-h-[300px] flex flex-col justify-between">
            {activeHeroTab === 'terminal' && (
              <div className="space-y-3">
                {/* Step 0: Install */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="text-brand-400 select-none">$</span>
                    <span>npm install -g sutriva</span>
                  </div>
                  <button 
                    id="hero-copy-install-btn"
                    onClick={copyInstall}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-brand-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Step 1: sutriva debug --live */}
                <div className={`transition-opacity duration-300 ${animationStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="text-zinc-300 flex items-center gap-2">
                    <span className="text-brand-400 select-none">$</span>
                    <span>sutriva debug --live --url http://localhost:4173/checkout</span>
                  </div>
                  <div className="text-zinc-400 text-xs mt-1 pl-4 border-l-2 border-zinc-800">
                    Live session started: <span className="text-zinc-300">session_a1b2c3d4</span> (capturing network, console, frames)
                  </div>
                </div>

                {/* Step 2: Developer command */}
                <div className={`transition-opacity duration-300 ${animationStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className="text-brand-400 font-semibold flex items-center gap-2">
                    <span className="text-zinc-400">&gt;</span>
                    <span>Follow me while I reproduce this.</span>
                  </div>
                  <div className="text-zinc-400 text-xs pl-4 border-l-2 border-brand-900/60 mt-1">
                    [Recording] User clicked #checkout-btn at 4.12s → POST /api/checkout dispatched.
                  </div>
                </div>

                {/* Step 3: The Critical Pivot: What happened? */}
                <div className={`transition-opacity duration-300 ${animationStep >= 3 ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="text-history-400 font-semibold flex items-center gap-2">
                    <span className="text-zinc-400">&gt;</span>
                    <span>What happened?</span>
                  </div>
                </div>

                {/* Step 4: Evidence retrieved */}
                {animationStep >= 4 ? (
                  <div className="p-3 rounded-lg bg-zinc-900/90 border border-brand-500/30 text-xs space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-brand-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Evidence around 14.82s
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-failure-950/80 text-failure-400 border border-failure-800/60">
                        Uncaught TypeError (200 response)
                      </span>
                    </div>
                    <p className="text-zinc-300">
                      Root cause: <code className="text-history-300 bg-zinc-950 px-1 py-0.5 rounded">app/checkout/page.tsx:15</code> — <span className="text-zinc-400">the API returns `id`, not `orderId` — a response schema mismatch</span>
                    </p>
                    <div className="text-[11px] text-zinc-400">
                      Button never leaves "Processing..." — the click handler threw before setStatus("done") ran.
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                    <span>Recording timestamped events across network, console & Git...</span>
                  </div>
                )}
              </div>
            )}

            {activeHeroTab === 'evidence' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400 text-xs">get_evidence window: <strong className="text-zinc-200">aroundSeconds=14.82, windowSeconds=3</strong></span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-mono">04.12s</span>
                      <span className="text-zinc-300 font-semibold">User Click: #checkout-btn</span>
                    </div>
                    <span className="text-zinc-400 font-mono">DOM Event</span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-mono">14.82s</span>
                      <span className="text-zinc-300 font-mono">POST /api/checkout → 200</span>
                    </div>
                    <span className="text-zinc-400 font-mono">body: {"{id, total}"}</span>
                  </div>

                  <div className="p-2.5 rounded bg-failure-950/40 border border-failure-800/60 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-failure-400 font-mono font-bold">14.91s</span>
                      <span className="text-failure-300 font-mono font-bold">Uncaught TypeError</span>
                    </div>
                    <span className="text-failure-400 font-mono text-[10px] bg-failure-950 px-1.5 py-0.5 rounded border border-failure-800">
                      page.tsx:15
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-mono">15.32s</span>
                      <span className="text-zinc-400">UI stuck: "Processing..." never resolves</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeHeroTab === 'mcp' && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>MCP tool call: <code className="text-brand-400">get_evidence</code></span>
                  <span className="text-zinc-400">stdio transport</span>
                </div>
                <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 text-[11px] overflow-x-auto leading-relaxed">
{`{
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
                </pre>
              </div>
            )}

            {/* Bottom Status Bar */}
            <div className="pt-3 mt-3 border-t border-zinc-800/70 flex flex-wrap items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-400" />
                <span>SQLite Engine: <strong className="text-zinc-300 font-mono">.sutriva/sutriva.db</strong></span>
              </div>
              <div className="flex items-center gap-4 text-zinc-400">
                <span>Local-first</span>
                <span>Zero telemetry</span>
                <span className="text-brand-400 cursor-pointer hover:underline" onClick={onOpenDemo}>
                  Open interactive explorer →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Value Metrics Ribbon */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center">
            <div className="text-2xl font-mono font-bold text-white mb-1">87 / 87</div>
            <div className="text-xs text-zinc-400">Automated Tests Passing</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center">
            <div className="text-2xl font-mono font-bold text-brand-400 mb-1">Local-First</div>
            <div className="text-xs text-zinc-400">SQLite persistence</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center">
            <div className="text-2xl font-mono font-bold text-info-400 mb-1">MCP Ready</div>
            <div className="text-xs text-zinc-400">Open Model Context Protocol</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center">
            <div className="text-2xl font-mono font-bold text-info-400 mb-1">10 Tools</div>
            <div className="text-xs text-zinc-400">Bounded MCP tool surface</div>
          </div>
        </div>
      </div>
    </section>
  );
};
