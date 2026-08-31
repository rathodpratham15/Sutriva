import React from 'react';
import { 
  ShieldCheck, 
  HardDrive, 
  Lock, 
  Key, 
  CloudOff,
  EyeOff
} from 'lucide-react';

export const PrivacySection: React.FC = () => {
  const privacyPillars = [
    {
      icon: HardDrive,
      title: 'Local Storage by Default',
      desc: 'All session data — the SQLite database, extracted frames, and artifacts — is written directly to your local `.sutriva/` workspace directory.'
    },
    {
      icon: EyeOff,
      title: 'Zero Telemetry',
      desc: 'Sutriva contains no tracking pixels, telemetry pings, usage beacons, or analytics collectors by default. Your workflow stays private.'
    },
    {
      icon: CloudOff,
      title: 'No Auto-Uploads',
      desc: 'Recorded video, captured network/console events, and screenshots are never automatically uploaded to any third-party cloud infrastructure.'
    },
    {
      icon: Key,
      title: 'User-Controlled API Keys',
      desc: 'Real vision analysis (ANTHROPIC_API_KEY) and real transcription via ElevenLabs Scribe (ELEVENLABS_API_KEY) are invoked strictly using your own configured API keys, only when a tool that needs them is called — no intermediary proxy.'
    }
  ];

  return (
    <section id="privacy" className="py-24 bg-[#08090d] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-brand-400 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Sovereignty</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Local-first by default.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Your source code, browser payloads, and development recordings remain entirely on your local machine.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {privacyPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700 transition-all font-mono"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-brand-400 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {p.title}
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
