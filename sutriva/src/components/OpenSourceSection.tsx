import React from 'react';
import { 
  Github, 
  Globe, 
  Package, 
  ExternalLink, 
  Terminal, 
  Code, 
  Heart,
  Sparkles
} from 'lucide-react';

export const OpenSourceSection: React.FC = () => {
  return (
    <section id="open-source" className="py-24 bg-[#08090d] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-brand-400 mb-4">
            <Github className="w-3.5 h-3.5" />
            <span>Open Source</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Built in the open.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Sutriva is an open-source project licensed under MIT. Inspect the code, contribute bug reproducers, or build custom adapters.
          </p>
        </div>

        {/* Links & Repository Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
          
          {/* 1. GitHub Repository */}
          <a
            id="card-github-repo"
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all font-mono group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform">
                <Github className="w-5 h-5" />
              </div>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Source Repository</div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span>GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-brand-400 transition-colors" />
              </h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                rathodpratham15/Sutriva — issues, pull requests, test harnesses, and architecture discussions.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-brand-400 flex items-center justify-between">
              <span>github.com/rathodpratham15/Sutriva</span>
              <span>→</span>
            </div>
          </a>

          {/* 2. Official Website */}
          <a
            id="card-website-link"
            href="https://sutriva.pratham.click"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all font-mono group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-950/80 border border-brand-800/60 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Official Website</div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span>sutriva.pratham.click</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-brand-400 transition-colors" />
              </h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Canonical documentation, release announcements, and project guidelines.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-brand-400 flex items-center justify-between">
              <span>sutriva.pratham.click</span>
              <span>→</span>
            </div>
          </a>

          {/* 3. npm Registry Packages */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 font-mono flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-failure-950/80 border border-failure-800/60 flex items-center justify-center text-failure-400 mb-4">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Package Ecosystem</div>
              <h3 className="text-base font-bold text-white mb-2">
                npm Registry
              </h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Published packages: <code className="text-zinc-200">sutriva</code> and <code className="text-zinc-200">@sutriva/mcp-server</code>.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>MCP Registry: Pending Registration</span>
              <span className="text-[10px] text-zinc-500">v0.1.1</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
