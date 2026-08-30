import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { RoutePath } from '../types';

interface InstallSectionProps {
  onNavigate: (path: RoutePath) => void;
}

export const InstallSection: React.FC<InstallSectionProps> = ({ onNavigate }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pkgManager, setPkgManager] = useState<'npm' | 'pnpm' | 'bun'>('npm');

  const getInstallCmd = (pkg: string) => {
    switch (pkgManager) {
      case 'pnpm': return `pnpm add -g ${pkg}`;
      case 'bun': return `bun add -g ${pkg}`;
      default: return `npm install -g ${pkg}`;
    }
  };

  const commands = [
    {
      title: '1. Install Sutriva CLI',
      desc: 'Global installation of the capture and analysis engine',
      cmd: getInstallCmd('sutriva')
    },
    {
      title: '2. Verify Native Dependencies',
      desc: 'Verify FFmpeg, Playwright/Chromium, and SQLite availability',
      cmd: 'sutriva doctor'
    },
    {
      title: '3. Start a Live Debugging Session',
      desc: 'Capture browser events into a queryable session in real-time',
      cmd: 'sutriva debug --live --url http://localhost:3000'
    },
    {
      title: '4. Replay a Recorded MP4 Session',
      desc: 'Convert a pre-recorded video into searchable evidence',
      cmd: 'sutriva inspect bug.mp4'
    },
    {
      title: '5. Install MCP Server for Coding Agents',
      desc: 'Expose temporal memory tools to Claude Code (or any MCP-compatible agent)',
      cmd: getInstallCmd('@sutriva/mcp-server')
    }
  ];

  const handleCopy = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section id="install" className="py-24 bg-[#090a0f] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 mb-4">
            <Terminal className="w-3.5 h-3.5" />
            <span>Quick Setup</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Try Sutriva.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Install globally, run the environment doctor, and connect to your favorite coding agent in minutes.
          </p>
        </div>

        {/* Package Manager Selector */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xs font-mono text-zinc-400 mr-2">Package Manager:</span>
          {(['npm', 'pnpm', 'bun'] as const).map((pm) => (
            <button
              key={pm}
              onClick={() => setPkgManager(pm)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                pkgManager === pm 
                  ? 'bg-emerald-400 text-zinc-950 font-bold shadow-sm' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {pm}
            </button>
          ))}
        </div>

        {/* Command Cards Stack */}
        <div className="space-y-4 max-w-4xl">
          {commands.map((c, idx) => {
            const isCopied = copiedIndex === idx;

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all font-mono text-xs sm:text-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
              >
                <div>
                  <div className="font-bold text-white mb-1 flex items-center gap-2">
                    <span>{c.title}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-sans mb-3 md:mb-0">
                    {c.desc}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-300 overflow-x-auto select-all">
                    <code>{c.cmd}</code>
                  </div>
                  <button
                    id={`btn-copy-install-${idx}`}
                    onClick={() => handleCopy(c.cmd, idx)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs transition-colors flex-shrink-0"
                    title="Copy command"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next step link */}
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <button
            onClick={() => onNavigate('/docs/claude-code')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono transition-colors"
          >
            <span>Claude Code Setup Guide</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            onClick={() => onNavigate('/docs/mcp')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono transition-colors"
          >
            <span>View all MCP Tool Definitions</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

      </div>
    </section>
  );
};
