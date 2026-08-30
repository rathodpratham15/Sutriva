import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, Clock, Terminal, ChevronRight } from 'lucide-react';
import { RoutePath } from '../types';
import { DOCS_SECTIONS } from '../data/docsContent';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: RoutePath) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent, but we can prevent default
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredDocs = DOCS_SECTIONS.filter((doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.summary.toLowerCase().includes(query) ||
      doc.content.sections.some((s) => 
        s.title.toLowerCase().includes(query) || 
        s.body.some((b) => b.toLowerCase().includes(query))
      )
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0e1017] border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        
        {/* Input Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search Sutriva docs, MCP tools, architecture, and concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 font-sans focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 font-mono text-xs">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  onNavigate(doc.path);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-zinc-900 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-950 transition-colors">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-zinc-200 font-bold group-hover:text-emerald-300 transition-colors">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-sans truncate max-w-md">
                      {doc.summary}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-zinc-400 group-hover:text-emerald-400">
                  <span className="text-[10px]">{doc.category}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-zinc-500 font-sans text-xs">
              No results found for "{searchQuery}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Navigate with click • ESC to close</span>
          <span className="text-emerald-400 font-semibold">Sutriva v0.1.1</span>
        </div>

      </div>
    </div>
  );
};
