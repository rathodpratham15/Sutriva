import React, { useState, useEffect } from 'react';
import { RoutePath } from '../types';
import {
  BookOpen,
  Github,
  Search,
  Clock,
  Play,
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

  const navLinks = [
    { id: 'nav-link-problem', section: 'problem', label: 'The Problem' },
    { id: 'nav-link-temporal', section: 'memory-vs-observation', label: 'Memory vs. Observation' },
    { id: 'nav-link-how', section: 'how-it-works', label: 'How It Works' },
    { id: 'nav-link-live', section: 'live-debugging', label: 'Live & Replay' },
    { id: 'nav-link-mcp', section: 'mcp', label: 'MCP' },
    { id: 'nav-link-verification', section: 'verification', label: 'Verification' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b transition-colors ${
        scrolled || isDocs ? 'border-zinc-200' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
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
          <span className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
            v0.1.1
          </span>
        </button>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden lg:flex items-center justify-center gap-0.5">
          {navLinks.map((link) => (
            <button
              key={link.id}
              id={link.id}
              onClick={() => scrollToSection(link.section)}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
            >
              {link.label}
            </button>
          ))}
          <button
            id="nav-link-docs"
            onClick={() => onNavigate('/docs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              isDocs
                ? 'text-brand-700 bg-brand-50 border border-brand-200'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Docs
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <button
            id="nav-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
            title="Search docs and concepts (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline text-zinc-500 font-sans">Search docs...</span>
            <kbd className="hidden md:inline-block font-mono text-[10px] text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
              ⌘K
            </kbd>
          </button>

          {/* Interactive Demo Trigger */}
          <button
            id="nav-demo-btn"
            onClick={onOpenDemo}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-md transition-colors"
          >
            <Play className="w-3 h-3 fill-brand-700 text-brand-700" />
            <span>Interactive Demo</span>
          </button>

          {/* GitHub Repo */}
          <a
            id="nav-github-link"
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-500 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
            aria-label="View Sutriva on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Quickstart CTA */}
          <button
            id="nav-get-started-btn"
            onClick={() => onNavigate('/docs/quickstart')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-md transition-all active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile menu button */}
          <button
            id="nav-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-500 hover:text-zinc-950 bg-zinc-50 border border-zinc-200 rounded-md"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-zinc-200 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.section)}
              className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-md"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              onNavigate('/docs');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-brand-700 font-medium hover:bg-zinc-100 rounded-md flex items-center justify-between"
          >
            <span>Full Documentation</span>
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onOpenDemo();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-brand-700 font-medium bg-brand-50 border border-brand-200 rounded-md flex items-center justify-between"
          >
            <span>Interactive Demo Explorer</span>
            <Play className="w-3.5 h-3.5 fill-brand-700" />
          </button>
        </div>
      )}
    </header>
  );
};
