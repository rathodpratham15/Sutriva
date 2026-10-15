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

type DropdownKey = 'product' | 'why';

interface NavLink {
  id: string;
  section: string;
  label: string;
}

const productLinks: NavLink[] = [
  { id: 'nav-link-how', section: 'how-it-works', label: 'How It Works' },
  { id: 'nav-link-live', section: 'live-debugging', label: 'Live & Replay' },
  { id: 'nav-link-mcp', section: 'mcp', label: 'MCP Tools' },
];

const whyLinks: NavLink[] = [
  { id: 'nav-link-problem', section: 'problem', label: 'The Problem' },
  { id: 'nav-link-temporal', section: 'memory-vs-observation', label: 'Memory vs. Observation' },
  { id: 'nav-link-verification', section: 'verification', label: 'Verification' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  onOpenDemo
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRowRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dropdowns and the mobile menu share one outside-click handler each, keyed
  // off their own container ref so opening one never fights the other.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown && navRowRef.current && !navRowRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (menuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, menuOpen]);

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
    setMenuOpen(false);
  };

  const renderDropdown = (key: DropdownKey, label: string, links: NavLink[]) => {
    const isOpen = openDropdown === key;
    return (
      <div
        className="relative"
        onMouseEnter={() => setOpenDropdown(key)}
        onMouseLeave={() => setOpenDropdown((cur) => (cur === key ? null : cur))}
      >
        <button
          id={`nav-dropdown-${key}-btn`}
          onClick={() => setOpenDropdown(isOpen ? null : key)}
          aria-expanded={isOpen}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            isOpen
              ? 'text-zinc-950 bg-white border-brand-400'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border-transparent'
          }`}
        >
          {label}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          // pt-2 (not mt-2 on this element) keeps the visual gap inside this
          // div's own hit-box, so the mouse never crosses an empty pixel row
          // between the button and the panel and triggers a stray mouseleave.
          <div className="absolute left-0 top-full w-56 pt-2">
            <div className="rounded-lg bg-white border border-zinc-200 shadow-xl py-1.5 text-sm">
              {links.map((link) => (
                <button
                  key={link.id}
                  id={link.id}
                  onClick={() => scrollToSection(link.section)}
                  className="w-full text-left px-3.5 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b transition-colors ${
        scrolled || isDocs ? 'border-zinc-200' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + grouped dropdown nav (desktop only) */}
        <div className="flex items-center gap-1">
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

          <nav ref={navRowRef} className="hidden md:flex items-center gap-0.5">
            {renderDropdown('product', 'Product', productLinks)}
            {renderDropdown('why', 'Why Sutriva', whyLinks)}
            <button
              id="nav-link-docs-inline"
              onClick={() => onNavigate('/docs')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isDocs ? 'text-brand-700' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              Docs
            </button>
            <button
              id="nav-link-demo-inline"
              onClick={onOpenDemo}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
            >
              Demo
            </button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
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
            href="https://github.com/rathodpratham15/Sutriva"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center p-2 text-zinc-500 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-3.5 h-3.5" />
          </a>

          <button
            id="nav-get-started-btn"
            onClick={() => onNavigate('/docs/quickstart')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded-md transition-all active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile fallback: everything above collapses into one menu below md */}
          <div className="relative md:hidden" ref={mobileMenuRef}>
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
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white border border-zinc-200 shadow-xl py-1.5 text-sm">
                <div className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Product
                </div>
                <div className="px-1 pb-1 mb-1 border-b border-zinc-100">
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

                <div className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Why Sutriva
                </div>
                <div className="px-1 pb-1 mb-1 border-b border-zinc-100">
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
                    className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-md flex items-center gap-2"
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
