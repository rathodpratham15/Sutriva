import React, { useState, useEffect, useRef } from 'react';
import { RoutePath } from '../types';
import {
  BookOpen,
  Github,
  Search,
  Clock,
  Menu,
  X,
  Play
} from 'lucide-react';

interface NavbarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  onOpenSearch: () => void;
  onOpenDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  onOpenDemo
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const isDocs = currentPath.startsWith('/docs');

  const scrollToSection = (sectionId: string) => {
    if (isDocs) {
      onNavigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  // The 3 links most people actually want quick access to, shown inline on
  // larger screens. Everything else (plus these 3 again, for small screens
  // where there's nowhere else to put them) lives behind the hamburger.
  const primaryLinks = [
    { id: 'nav-link-how', section: 'how-it-works', label: 'How It Works' },
    { id: 'nav-link-live', section: 'live-debugging', label: 'Live & Replay' },
    { id: 'nav-link-mcp', section: 'mcp', label: 'MCP' },
  ];

  const moreLinks = [
    { id: 'nav-link-problem', section: 'problem', label: 'The Problem' },
    { id: 'nav-link-temporal', section: 'memory-vs-observation', label: 'Memory vs. Observation' },
    { id: 'nav-link-verification', section: 'verification', label: 'Verification' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b transition-colors ${
        scrolled || isDocs ? 'border-zinc-200' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + primary section links (desktop only) */}
        <div className="flex items-center gap-1">
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 group text-left focus:outline-none mr-2"
          >
            <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white group-hover:bg-zinc-800 transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-950 font-sans lowercase group-hover:text-zinc-700 transition-colors">
              sutriva
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-0.5">
            {primaryLinks.map((link) => (
              <button
                key={link.id}
                id={link.id}
                onClick={() => scrollToSection(link.section)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="nav-link-docs"
            onClick={() => onNavigate('/docs')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isDocs
                ? 'text-brand-700 bg-brand-50 border border-brand-200'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Docs
          </button>

          <button
            id="nav-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
            title="Search docs and concepts (Cmd+K)"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <kbd className="hidden lg:inline-block font-mono text-[10px] text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
              ⌘K
            </kbd>
          </button>

          <button
            id="nav-get-started-btn"
            onClick={() => onNavigate('/docs/quickstart')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-md transition-all active:scale-95"
          >
            Get Started
          </button>

          {/* Hamburger: holds everything not promoted above -- always
              available, not just a small-screen fallback. */}
          <div className="relative" ref={menuRef}>
            <button
              id="nav-menu-toggle-btn"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 text-zinc-500 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
              aria-label="More links"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white border border-zinc-200 shadow-xl py-1.5 text-sm">
                {/* Section links hidden from the top bar on this screen size */}
                <div className="lg:hidden px-1 pb-1 mb-1 border-b border-zinc-100">
                  {primaryLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.section)}
                      className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                <div className="px-1">
                  {moreLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.section)}
                      className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                <div className="px-1 pt-1 mt-1 border-t border-zinc-100 space-y-0.5">
                  <button
                    onClick={() => {
                      onOpenDemo();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-brand-700 font-medium hover:bg-brand-50 rounded-md flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-brand-700" />
                    <span>Interactive Demo</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/docs');
                      setMenuOpen(false);
                    }}
                    className="sm:hidden w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md flex items-center gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Docs</span>
                  </button>
                  <a
                    href="https://github.com/rathodpratham15/Sutriva"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md flex items-center gap-2"
                  >
                    <Github className="w-3.5 h-3.5 text-zinc-400" />
                    <span>GitHub</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
