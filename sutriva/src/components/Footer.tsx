import React from 'react';
import { RoutePath } from '../types';
import { Clock, Github, ExternalLink, BookOpen, Terminal, ShieldCheck, AlertTriangle } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: RoutePath) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#06070a] border-t border-zinc-800 text-zinc-400 font-mono text-xs py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">SUTRIVA</span>
            </div>
            <p className="text-zinc-400 text-xs font-sans max-w-sm leading-relaxed">
              Temporal memory for coding agents. Persistent, queryable historical context for live and recorded debugging sessions.
            </p>
            <div className="text-[11px] text-zinc-400">
              Open source developer tooling under MIT License.
            </div>
          </div>

          {/* Docs Links */}
          <div className="space-y-3">
            <div className="text-zinc-200 font-semibold text-xs uppercase tracking-wider">
              Documentation
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => onNavigate('/docs')} 
                  className="text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  Overview
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/docs/quickstart')} 
                  className="text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  Quickstart
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/docs/claude-code')} 
                  className="text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  Claude Code Setup
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/docs/mcp')} 
                  className="text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  MCP Tool Schemas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/docs/architecture')} 
                  className="text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  Architecture & Pipeline
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/docs/evaluation')} 
                  className="text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  Evaluation & 3/3 Tests
                </button>
              </li>
            </ul>
          </div>

          {/* Project & Community */}
          <div className="space-y-3">
            <div className="text-zinc-200 font-semibold text-xs uppercase tracking-wider">
              Community & Trust
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://github.com/rathodpratham15/Sutriva" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
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
                  className="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                </a>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/docs/privacy')} 
                  className="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Privacy & Local-First</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/docs/limitations')} 
                  className="text-zinc-400 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Limitations</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <div>
            © {new Date().getFullYear()} Sutriva. Open source under the MIT License.
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Local-first debugging</span>
            <span>•</span>
            <span>Model Context Protocol</span>
            <span>•</span>
            <span>10 MCP tools</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
