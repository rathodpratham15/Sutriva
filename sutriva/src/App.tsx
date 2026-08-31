import React, { useState, useEffect } from 'react';
import { RoutePath } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { MemoryVsObservationSection } from './components/MemoryVsObservationSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { LiveDebuggingSection } from './components/LiveDebuggingSection';
import { ReplaySection } from './components/ReplaySection';
import { TemporalMemorySection } from './components/TemporalMemorySection';
import { ClosedLoopVerificationSection } from './components/ClosedLoopVerificationSection';
import { McpSection } from './components/McpSection';
import { EvaluationSection } from './components/EvaluationSection';
import { InstallSection } from './components/InstallSection';
import { PrivacySection } from './components/PrivacySection';
import { LimitationsSection } from './components/LimitationsSection';
import { OpenSourceSection } from './components/OpenSourceSection';
import { Footer } from './components/Footer';
import { DocsLayout } from './components/DocsLayout';
import { InteractiveDemoModal } from './components/InteractiveDemoModal';
import { SearchModal } from './components/SearchModal';

export default function App() {
  const [currentPath, setCurrentPath] = useState<RoutePath>(() => {
    const pathname = window.location.pathname as RoutePath;
    if (pathname.startsWith('/docs')) {
      return pathname;
    }
    return '/';
  });

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Sync state with browser URL history
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname as RoutePath;
      if (pathname.startsWith('/docs')) {
        setCurrentPath(pathname);
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global keydown for Search Modal (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = (path: RoutePath) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDocsView = currentPath.startsWith('/docs');

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 selection:bg-brand-500/30 selection:text-brand-200">
      
      {/* Top Fixed Navigation Bar */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigateTo}
        onOpenDemo={() => setIsDemoModalOpen(true)}
      />

      {/* Main View Router */}
      {isDocsView ? (
        <DocsLayout
          currentPath={currentPath}
          onNavigate={navigateTo}
        />
      ) : (
        <main className="relative overflow-hidden">
          {/* Landing Page Content Sections */}
          <HeroSection 
            onNavigate={navigateTo} 
            onOpenDemo={() => setIsDemoModalOpen(true)} 
          />
          <ProblemSection />
          <MemoryVsObservationSection />
          <HowItWorksSection />
          <LiveDebuggingSection />
          <ReplaySection />
          <TemporalMemorySection />
          <ClosedLoopVerificationSection />
          <McpSection onNavigate={navigateTo} />
          <EvaluationSection />
          <InstallSection onNavigate={navigateTo} />
          <PrivacySection />
          <LimitationsSection />
          <OpenSourceSection />
        </main>
      )}

      {/* Persistent Global Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Interactive Temporal Sandbox Modal */}
      <InteractiveDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />

      {/* Quick Command & Search Palette Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={navigateTo}
      />

    </div>
  );
}
