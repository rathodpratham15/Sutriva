import React, { useState } from 'react';
import { RoutePath, DocSection } from '../types';
import { DOCS_SECTIONS } from '../data/docsContent';
import { 
  BookOpen, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  Clock, 
  Info, 
  AlertTriangle, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Search,
  Menu,
  X
} from 'lucide-react';

interface DocsLayoutProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
}

export const DocsLayout: React.FC<DocsLayoutProps> = ({ currentPath, onNavigate }) => {
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Find active doc
  const activeDoc = DOCS_SECTIONS.find((s) => s.path === currentPath) || DOCS_SECTIONS[0];
  const activeIndex = DOCS_SECTIONS.findIndex((s) => s.path === currentPath);
  const prevDoc = activeIndex > 0 ? DOCS_SECTIONS[activeIndex - 1] : null;
  const nextDoc = activeIndex < DOCS_SECTIONS.length - 1 ? DOCS_SECTIONS[activeIndex + 1] : null;

  const categories: ('Getting Started' | 'Core Concepts' | 'Integration' | 'Reference')[] = [
    'Getting Started',
    'Core Concepts',
    'Integration',
    'Reference'
  ];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlockId(id);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  return (
    <div className="pt-16 min-h-screen bg-[#08090d] text-zinc-100 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex">
        
        {/* Mobile Sidebar Toggle Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-400 text-zinc-950 font-mono text-xs font-bold shadow-xl shadow-emerald-500/20"
          >
            {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>{mobileSidebarOpen ? 'Close Menu' : 'Docs Navigation'}</span>
          </button>
        </div>

        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed lg:sticky top-16 inset-y-0 left-0 z-30 w-72 h-[calc(100vh-4rem)] overflow-y-auto bg-[#090a0f] lg:bg-transparent border-r border-zinc-800/80 p-6 transition-transform duration-200 lg:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
          </div>

          <div className="space-y-6 font-mono text-xs">
            {categories.map((cat) => {
              const catDocs = DOCS_SECTIONS.filter((s) => s.category === cat);
              if (catDocs.length === 0) return null;

              return (
                <div key={cat} className="space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                    {cat}
                  </div>
                  <ul className="space-y-1">
                    {catDocs.map((doc) => {
                      const isActive = doc.path === currentPath;
                      return (
                        <li key={doc.id}>
                          <button
                            onClick={() => {
                              onNavigate(doc.path);
                              setMobileSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-hover'
                            }`}
                          >
                            <span className="truncate">{doc.title}</span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 py-8 lg:py-12 lg:px-12">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6 flex-wrap">
            {activeDoc.content.breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span>{crumb}</span>
                {idx < activeDoc.content.breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Doc Header */}
          <div className="pb-8 mb-10 border-b border-zinc-800">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-400 mb-3">
              <span>{activeDoc.content.lastUpdated}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white mb-4">
              {activeDoc.content.title}
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 font-sans leading-relaxed">
              {activeDoc.content.description}
            </p>
          </div>

          {/* Doc Sections */}
          <div className="space-y-12">
            {activeDoc.content.sections.map((section) => (
              <div key={section.id} id={section.id} className="space-y-4">
                <h2 className="text-xl font-mono font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-400 font-normal">#</span>
                  <span>{section.title}</span>
                </h2>

                <div className="space-y-3 font-sans text-sm text-zinc-300 leading-relaxed">
                  {section.body.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>

                {/* Callout Box */}
                {section.callout && (
                  <div className={`p-4 rounded-xl border text-xs font-sans leading-relaxed flex items-start gap-3 my-4 ${
                    section.callout.type === 'warning'
                      ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      : section.callout.type === 'tip'
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                        : 'bg-zinc-900/60 border-zinc-700 text-zinc-300'
                  }`}>
                    {section.callout.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      {section.callout.text}
                    </div>
                  </div>
                )}

                {/* Code Block */}
                {section.codeBlock && (
                  <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden my-4 shadow-xl">
                    <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between font-mono text-xs text-zinc-400">
                      <span>{section.codeBlock.language}</span>
                      <button
                        onClick={() => handleCopy(section.codeBlock!.code, section.id)}
                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                      >
                        {copiedBlockId === section.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedBlockId === section.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
                      {section.codeBlock.code}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Related Links */}
          {activeDoc.content.relatedLinks && (
            <div className="mt-14 pt-8 border-t border-zinc-800">
              <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider block mb-4">
                Related Documentation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeDoc.content.relatedLinks.map((rel, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate(rel.path)}
                    className="p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors font-mono"
                  >
                    <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center justify-between">
                      <span>{rel.title}</span>
                      <span>→</span>
                    </div>
                    <div className="text-xs text-zinc-400 font-sans">
                      {rel.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Previous / Next Page Nav */}
          <div className="mt-12 pt-8 border-t border-zinc-800 flex items-center justify-between font-mono text-xs">
            {prevDoc ? (
              <button
                onClick={() => onNavigate(prevDoc.path)}
                className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900 hover:bg-surface-hover text-zinc-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <div className="text-left">
                  <div className="text-[10px] text-zinc-500 uppercase">Previous</div>
                  <div className="font-bold">{prevDoc.title}</div>
                </div>
              </button>
            ) : <div />}

            {nextDoc && (
              <button
                onClick={() => onNavigate(nextDoc.path)}
                className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900 hover:bg-surface-hover text-zinc-300 hover:text-white transition-colors"
              >
                <div className="text-right">
                  <div className="text-[10px] text-zinc-500 uppercase">Next</div>
                  <div className="font-bold">{nextDoc.title}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            )}
          </div>

        </main>

        {/* Right Side: On-Page Table of Contents (Desktop only) */}
        <aside className="hidden xl:block w-60 h-[calc(100vh-4rem)] sticky top-16 py-12 pl-6 text-xs font-mono">
          <div className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold mb-3">
            On this page
          </div>
          <ul className="space-y-2 border-l border-zinc-800 pl-3 text-zinc-400">
            {activeDoc.content.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="hover:text-emerald-400 transition-colors block truncate"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

      </div>
    </div>
  );
};
