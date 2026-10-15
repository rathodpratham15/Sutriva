import React, { useState, useEffect, useRef } from 'react';
import { RoutePath } from '../types';
import {
  Github,
  Search,
  Clock,
  Menu,
  X,
  ChevronDown,
  Compass,
  Eye,
  Workflow,
  Radio,
  Network,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  onOpenSearch: () => void;
  onOpenDemo: () => void;
}

const featureLinks = [
  { id: 'nav-link-problem', section: 'problem', label: 'The Problem', desc: 'Why coding agents forget everything between sessions', icon: Compass },
  { id: 'nav-link-temporal', section: 'memory-vs-observation', label: 'Memory vs. Observation', desc: 'Temporal evidence, not just raw logs', icon: Eye },
  { id: 'nav-link-how', section: 'how-it-works', label: 'How It Works', desc: 'Capture → Index → Correlate → Query → Verify', icon: Workflow },
  { id: 'nav-link-live', section: 'live-debugging', label: 'Live & Replay', desc: 'Debug a live session or replay a recording', icon: Radio },
  { id: 'nav-link-mcp', section: 'mcp', label: 'MCP', desc: '10 tools over stdio for any MCP-compatible agent', icon: Network },
  { id: 'nav-link-verification', section: 'verification', label: 'Verification', desc: 'Before/after proof via compare_sessions', icon: ShieldCheck },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  onOpenDemo
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
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
      if (featuresOpen && featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [featuresOpen, menuOpen]);

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
    setFeaturesOpen(false);
    setMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b transition-colors ${
        scrolled || isDocs ? 'border-zinc-200' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand */}
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

        {/* Center: Flat nav -- one dropdown, one link. Everything else lives
            one level down, not spread across the bar. */}
        <nav className="hidden lg:flex items-center gap-1">
          <div className="relative" ref={featuresRef}>
            <button
              id="nav-features-toggle-btn"
              onClick={() => setFeaturesOpen((v) => !v)}
              aria-expanded={featuresOpen}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:text-zinc-950 rounded-md transition-colors"
            >
              Features
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>

            {featuresOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 rounded-lg bg-white border border-zinc-200 shadow-xl py-2">
                {featureLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.id}
                      id={link.id}
                      onClick={() => scrollToSection(link.section)}
                      className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-zinc-50 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="block text-sm font-medium text-zinc-900">{link.label}</span>
                        <span className="block text-xs text-zinc-500">{link.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            id="nav-link-docs"
            onClick={() => onNavigate('/docs')}
            className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
              isDocs ? 'text-brand-700' : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Docs
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center p-2 text-zinc-500 hover:text-zinc-950 rounded-md transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          <button
            id="nav-search-btn"
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
            title="Search docs and concepts (Cmd+K)"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <kbd className="hidden lg:inline-block font-mono text-[10px] text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
              ⌘K
            </kbd>
          </button>

          <button
            id="nav-demo-btn"
            onClick={onOpenDemo}
            className="hidden md:flex px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-950 bg-brand-300 hover:bg-brand-400 rounded-md transition-all active:scale-95"
          >
            Live Demo
          </button>

          <button
            id="nav-get-started-btn"
            onClick={() => onNavigate('/docs/quickstart')}
            className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile: everything collapses behind one hamburger below `lg`. */}
          <div className="relative lg:hidden" ref={menuRef}>
            <button
              id="nav-menu-toggle-btn"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 text-zinc-500 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white border border-zinc-200 shadow-xl py-1.5 text-sm">
                <div className="px-1 pb-1 mb-1 border-b border-zinc-100">
                  {featureLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.section)}
                      className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                <div className="px-1 space-y-0.5">
                  <button
                    onClick={() => {
                      onOpenDemo();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-brand-700 font-medium hover:bg-brand-50 rounded-md"
                  >
                    Live Demo
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/docs');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                  >
                    Docs
                  </button>
                  <a
                    href="https://github.com/rathodpratham15/Sutriva"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                  >
                    <Github className="w-3.5 h-3.5 text-zinc-400" />
                    <span>GitHub</span>
                  </a>
                  <button
                    onClick={() => {
                      onOpenSearch();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
