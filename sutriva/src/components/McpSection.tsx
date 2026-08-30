import React, { useState } from 'react';
import { 
  Network, 
  Terminal, 
  Copy, 
  Check, 
  Code2, 
  Bot, 
  Layers, 
  ExternalLink, 
  Cpu, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { MCP_TOOLS_LIST } from '../data/docsContent';
import { RoutePath } from '../types';

interface McpSectionProps {
  onNavigate: (path: RoutePath) => void;
}

export const McpSection: React.FC<McpSectionProps> = ({ onNavigate }) => {
  const [selectedToolIndex, setSelectedToolIndex] = useState<number>(0);
  const [copiedInstall, setCopiedInstall] = useState(false);

  const selectedTool = MCP_TOOLS_LIST[selectedToolIndex];

  const mcpInstallCmd = 'npm install -g @sutriva/mcp-server';

  const copyMcpInstall = () => {
    navigator.clipboard.writeText(mcpInstallCmd);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const capabilities = [
    'inspect video',
    'get timeline',
    'get evidence',
    'search session',
    'get frame',
    'analyze segment',
    'get transcript',
    'inspect environment',
    'get current context',
    'compare sessions'
  ];

  return (
    <section id="mcp" className="py-24 bg-[#090a0f] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-cyan-400 mb-4">
            <Network className="w-3.5 h-3.5" />
            <span>Open Protocol Standard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Built for coding agents.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Sutriva exposes temporal debugging evidence through the open <strong className="text-zinc-200">Model Context Protocol (MCP)</strong>, over stdio. Usable by any MCP-compatible coding agent — tested against Claude Code.
          </p>
        </div>

        {/* Package Installation Command Card */}
        <div className="mb-12 p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 select-none">$</span>
            <span className="text-zinc-200">{mcpInstallCmd}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="btn-copy-mcp"
              onClick={copyMcpInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-xs"
            >
              {copiedInstall ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedInstall ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              id="btn-view-mcp-setup"
              onClick={() => onNavigate('/docs/mcp')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold transition-colors text-xs"
            >
              <span>View MCP setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Capabilities Pill Grid */}
        <div className="mb-12">
          <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider block mb-3">
            Exposed MCP Capabilities
          </span>
          <div className="flex flex-wrap gap-2">
            {capabilities.map((cap, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{cap}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Interactive MCP Tool Schema Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Tool Selector List (Left) */}
          <div className="lg:col-span-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 p-4 space-y-1.5 font-mono text-xs">
            <span className="text-zinc-500 text-[11px] uppercase tracking-wider block px-2 pb-2">
              Select Tool Schema
            </span>
            {MCP_TOOLS_LIST.map((tool, idx) => {
              const isSelected = selectedToolIndex === idx;
              return (
                <button
                  key={tool.name}
                  onClick={() => setSelectedToolIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-zinc-800 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate">{tool.name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Tool Specification Viewer (Right) */}
          <div className="lg:col-span-8 rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-zinc-500 text-[11px] block">Tool Declaration</span>
                <h3 className="text-base font-bold text-white">
                  {selectedTool.name}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[11px]">
                stdio transport
              </span>
            </div>

            <p className="text-zinc-300 font-sans text-xs leading-relaxed">
              {selectedTool.description}
            </p>

            {/* Parameters Table */}
            <div>
              <span className="text-zinc-400 text-[11px] uppercase tracking-wider block mb-2 font-semibold">
                Parameters
              </span>
              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/80 overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Required</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {selectedTool.parameters.map((p, pIdx) => (
                      <tr key={pIdx}>
                        <td className="p-2.5 text-emerald-400 font-semibold">{p.name}</td>
                        <td className="p-2.5 text-cyan-300">{p.type}</td>
                        <td className="p-2.5">
                          {p.required ? (
                            <span className="text-amber-400 font-bold">yes</span>
                          ) : (
                            <span className="text-zinc-500">no</span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans text-zinc-400">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Example MCP Call & Response */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <span className="text-zinc-500 text-[10px] block mb-1">Example Tool Call:</span>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 text-[11px] overflow-x-auto">
                  <code>{selectedTool.exampleCall}</code>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] block mb-1">Example JSON Payload:</span>
                <pre className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] overflow-x-auto max-h-32">
                  {selectedTool.exampleResponse}
                </pre>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
