import React from 'react';
import { RoutePath } from '../types';
import { Clock, Github, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: RoutePath) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#f8f9fb] border-t border-zinc-200 text-zinc-600 font-sans text-xs pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white">
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-bold text-zinc-950 text-base tracking-tight lowercase">sutriva</span>
            </div>
            <p className="text-zinc-600 text-xs max-w-sm leading-relaxed">
              Temporal memory for coding agents. Persistent, queryable historical context for live and recorded debugging sessions.
            </p>
            <div className="text-[11px] text-zinc-500 font-mono">
              Open source developer tooling under the MIT License &middot; Built by Pratham Rathod
            </div>
          </div>

          {/* Docs Links */}
          <div className="space-y-3">
            <div className="text-zinc-950 font-semibold text-xs uppercase tracking-wider font-mono">
              Documentation
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/docs')} className="text-zinc-600 hover:text-black transition-colors">
                  Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/docs/quickstart')} className="text-zinc-600 hover:text-black transition-colors">
                  Quickstart
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/docs/claude-code')} className="text-zinc-600 hover:text-black transition-colors">
                  Claude Code Setup
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/docs/mcp')} className="text-zinc-600 hover:text-black transition-colors">
                  MCP Tool Schemas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/docs/architecture')} className="text-zinc-600 hover:text-black transition-colors">
                  Architecture & Pipeline
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/docs/evaluation')} className="text-zinc-600 hover:text-black transition-colors">
                  Evaluation
                </button>
              </li>
            </ul>
          </div>

          {/* Project & Trust */}
          <div className="space-y-3">
            <div className="text-zinc-950 font-semibold text-xs uppercase tracking-wider font-mono">
              Project & Trust
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/rathodpratham15/Sutriva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://sutriva.pratham.click"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                </a>
              </li>
              <li>
                <button onClick={() => onNavigate('/docs/privacy')} className="text-zinc-600 hover:text-black transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                  <span>Privacy & Local-First</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/docs/limitations')} className="text-zinc-600 hover:text-black transition-colors flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-history-600" />
                  <span>Limitations</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Sutriva. Open source under the MIT License.
          </div>
          <div className="flex items-center gap-4 text-zinc-500 font-mono">
            <span>Local-first debugging</span>
            <span>&bull;</span>
            <span>Model Context Protocol</span>
            <span>&bull;</span>
            <span>10 MCP tools</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
