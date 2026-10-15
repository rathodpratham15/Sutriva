import React, { useState, useEffect, useRef } from 'react';
import { RoutePath } from '../types';
import {
  BookOpen,
  Github,
  Search,
  Clock,
  Menu,
  X,
  Play,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  onOpenSearch: () => void;
  onOpenDemo: () => void;
}

type DropdownKey = 'product' | 'why' | null;

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  onOpenDemo
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown && navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, mobileMenuOpen]);

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
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  // Grouped the way Warp's nav is: a couple of labeled dropdowns instead of
  // a flat row of links or a catch-all hamburger. Docs stays a flat
  // top-level link since it's a real route, not a scroll target.
  const productLinks = [
    { id: 'nav-link-how', section: 'how-it-works', label: 'How It Works' },
    { id: 'nav-link-live', section: 'live-debugging', label: 'Live & Replay' },
    { id: 'nav-link-mcp', section: 'mcp', label: 'MCP Tools' },
  ];

  const whyLinks = [
    { id: 'nav-link-problem', section: 'problem', label: 'The Problem' },
    { id: 'nav-link-temporal', section: 'memory-vs-observation', label: 'Memory vs. Observation' },
    { id: 'nav-link-verification', section: 'verification', label: 'Verification' },
  ];

  const dropdownButtonClass = (key: 'product' | 'why') =>
    `flex items-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors ${
      openDropdown === key ? 'text-zinc-950 bg-zinc-100' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b transition-colors ${
        scrolled || isDocs ? 'border-zinc-200' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + grouped nav (desktop only) */}
        <div className="flex items-center gap-1" ref={navRef}>
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 group text-left focus:outline-none mr-3"
          >
            <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white group-hover:bg-zinc-800 transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-950 font-sans lowercase group-hover:text-zinc-700 transition-colors">
              sutriva
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-0.5">
            <div className="relative">
              <button
                id="nav-dropdown-product"
                onClick={() => setOpenDropdown((v) => (v === 'product' ? null : 'product'))}
                className={dropdownButtonClass('product')}
                aria-expanded={openDropdown === 'product'}
              >
                Product
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'product' && (
                <div className="absolute left-0 mt-2 w-56 rounded-lg bg-white border border-zinc-200 shadow-xl py-1.5 text-sm">
                  {productLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.section)}
                      className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                id="nav-dropdown-why"
                onClick={() => setOpenDropdown((v) => (v === 'why' ? null : 'why'))}
                className={dropdownButtonClass('why')}
                aria-expanded={openDropdown === 'why'}
              >
                Why Sutriva
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'why' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'why' && (
                <div className="absolute left-0 mt-2 w-60 rounded-lg bg-white border border-zinc-200 shadow-xl py-1.5 text-sm">
                  {whyLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.section)}
                      className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              id="nav-link-docs-flat"
              onClick={() => onNavigate('/docs')}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors ${
                isDocs ? 'text-brand-700' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              Docs
            </button>
          </nav>
        </div>

        {/* Right: Actions -- Warp-style: a quiet icon/link, a highlighted pill, a dark CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="nav-search-btn"
            onClick={onOpenSearch}
            className="hidden lg:flex items-center justify-center w-8 h-8 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
            title="Search docs and concepts (Cmd+K)"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <a
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:block px-2 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            GitHub
          </a>

          <button
            id="nav-demo-btn"
            onClick={onOpenDemo}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-800 bg-brand-100 hover:bg-brand-200 rounded-full transition-colors"
          >
            <Play className="w-3 h-3 fill-brand-800" />
            Live Demo
          </button>

          <button
            id="nav-get-started-btn"
            onClick={() => onNavigate('/docs/quickstart')}
            className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-full transition-all active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile fallback: everything collapses here below `lg` */}
          <div className="relative lg:hidden" ref={mobileMenuRef}>
            <button
              id="nav-menu-toggle-btn"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 text-zinc-500 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
              aria-label="More links"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white border border-zinc-200 shadow-xl py-1.5 text-sm">
                <div className="px-1 pb-1 mb-1 border-b border-zinc-100">
                  <span className="block px-3 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Product
                  </span>
                  {productLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.section)}
                      className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
                <div className="px-1 pb-1 mb-1 border-b border-zinc-100">
                  <span className="block px-3 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Why Sutriva
                  </span>
                  {whyLinks.map((link) => (
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
                      onNavigate('/docs');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md flex items-center gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Docs</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenSearch();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md flex items-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Search</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenDemo();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-brand-700 font-medium hover:bg-brand-50 rounded-md flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-brand-700" />
                    <span>Interactive Demo</span>
                  </button>
                  <a
                    href="https://github.com/rathodpratham15/Sutriva"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
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
