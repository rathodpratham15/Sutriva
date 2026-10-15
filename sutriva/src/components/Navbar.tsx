import React, { useState, useEffect } from 'react';
import { RoutePath } from '../types';
import {
  BookOpen,
  Github,
  Search,
  Clock,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDocs = currentPath.startsWith('/docs');

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b transition-colors ${
        scrolled || isDocs ? 'border-zinc-200' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <button
          id="brand-logo-btn"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 group text-left focus:outline-none"
        >
          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white group-hover:bg-zinc-800 transition-colors">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-950 font-sans lowercase group-hover:text-zinc-700 transition-colors">
            sutriva
          </span>
        </button>

        {/* Right: Actions -- kept to the few things people actually need from
            every page: find a doc, open the repo, get started. Everything
            else (section anchors, the interactive demo) lives on the page
            itself so the bar doesn't compete with the content. */}
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

          <a
            id="nav-github-link"
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex p-2 text-zinc-500 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
            aria-label="View Sutriva on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          <button
            id="nav-get-started-btn"
            onClick={() => onNavigate('/docs/quickstart')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-md transition-all active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile menu button -- only needed to reach the items hidden
              above sm: Docs and GitHub. */}
          <button
            id="nav-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-zinc-500 hover:text-zinc-950 bg-zinc-50 border border-zinc-200 rounded-md"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-zinc-200 px-4 py-3 space-y-1">
          <button
            onClick={() => {
              onNavigate('/docs');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-md flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <span>Docs</span>
          </button>
          <a
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-md flex items-center gap-2"
          >
            <Github className="w-4 h-4 text-zinc-400" />
            <span>GitHub</span>
          </a>
          <button
            onClick={() => {
              onOpenDemo();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-brand-700 font-medium hover:bg-brand-50 rounded-md"
          >
            Interactive Demo
          </button>
        </div>
      )}
    </header>
  );
};
