import React, { useState, useEffect } from 'react';
import { RoutePath } from '../types';
import { 
  Terminal, 
  BookOpen, 
  Github, 
  Search, 
  Layers, 
  Clock, 
  Play, 
  ExternalLink,
  Menu,
  X,
  Sparkles
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
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b ${
        scrolled || isDocs
          ? 'bg-[#090a0f]/90 backdrop-blur-md border-zinc-800/80 shadow-lg shadow-black/40' 
          : 'bg-[#090a0f]/60 backdrop-blur-sm border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-6">
          <button 
            id="brand-logo-btn"
            onClick={() => onNavigate('/')} 
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 group-hover:text-emerald-300 transition-colors shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                SUTRIVA
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                v0.1.1
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-link-problem"
              onClick={() => scrollToSection('problem')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-md transition-colors"
            >
              The Problem
            </button>
            <button
              id="nav-link-temporal"
              onClick={() => scrollToSection('memory-vs-observation')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-md transition-colors"
            >
              Memory vs. Observation
            </button>
            <button
              id="nav-link-architecture"
              onClick={() => scrollToSection('how-it-works')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-md transition-colors"
            >
              How It Works
            </button>
            <button
              id="nav-link-live"
              onClick={() => scrollToSection('live-debugging')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-md transition-colors"
            >
              Live & Replay
            </button>
            <button
              id="nav-link-mcp"
              onClick={() => scrollToSection('mcp')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-md transition-colors"
            >
              MCP
            </button>
            <button
              id="nav-link-verification"
              onClick={() => scrollToSection('verification')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-md transition-colors"
            >
              Verification
            </button>
            <button
              id="nav-link-docs"
              onClick={() => onNavigate('/docs')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                isDocs 
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Docs
            </button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <button
            id="nav-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-400 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
            title="Search docs and concepts (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline text-zinc-400 font-sans">Search docs...</span>
            <kbd className="hidden md:inline-block font-mono text-[10px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50">
              ⌘K
            </kbd>
          </button>

          {/* Interactive Demo Trigger */}
          <button
            id="nav-demo-btn"
            onClick={onOpenDemo}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 hover:border-emerald-700 rounded-md transition-colors"
          >
            <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
            <span>Interactive Demo</span>
          </button>

          {/* GitHub Repo */}
          <a
            id="nav-github-link"
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
            aria-label="View Sutriva on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Quickstart CTA */}
          <button
            id="nav-get-started-btn"
            onClick={() => onNavigate('/docs/quickstart')}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile menu button */}
          <button
            id="nav-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-md"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0c0e14] border-b border-zinc-800 px-4 py-4 space-y-2">
          <button
            onClick={() => scrollToSection('problem')}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/60 rounded-md"
          >
            The Problem
          </button>
          <button
            onClick={() => scrollToSection('memory-vs-observation')}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/60 rounded-md"
          >
            Memory vs. Observation
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/60 rounded-md"
          >
            How It Works (Architecture)
          </button>
          <button
            onClick={() => scrollToSection('live-debugging')}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/60 rounded-md"
          >
            Live & Replay
          </button>
          <button
            onClick={() => scrollToSection('temporal-memory')}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/60 rounded-md"
          >
            Temporal Memory
          </button>
          <button
            onClick={() => scrollToSection('verification')}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/60 rounded-md"
          >
            Closed-Loop Verification
          </button>
          <button
            onClick={() => scrollToSection('mcp')}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800/60 rounded-md"
          >
            MCP Server
          </button>
          <button
            onClick={() => {
              onNavigate('/docs');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-emerald-400 font-medium hover:bg-zinc-800/60 rounded-md flex items-center justify-between"
          >
            <span>Full Documentation</span>
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onOpenDemo();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-emerald-300 font-medium bg-emerald-950/40 border border-emerald-800/50 rounded-md flex items-center justify-between"
          >
            <span>Interactive Demo Explorer</span>
            <Play className="w-3.5 h-3.5 fill-emerald-300" />
          </button>
        </div>
      )}
    </header>
  );
};
