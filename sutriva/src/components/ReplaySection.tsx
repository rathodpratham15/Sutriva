import React, { useState } from 'react';
import { 
  Video, 
  Play, 
  RotateCcw, 
  FileCode, 
  Mic, 
  Image as ImageIcon, 
  Clock, 
  Terminal, 
  CheckCircle2, 
  Sparkles,
  GitBranch
} from 'lucide-react';

export const ReplaySection: React.FC = () => {
  const [scrubberSec, setScrubberSec] = useState<number>(14.82);

  const videoTimelinePoints = [
    { sec: 0.0, label: '0.0s — Session Start', type: 'start' },
    { sec: 4.12, label: '4.12s — Click "Place order"', type: 'dom' },
    { sec: 14.91, label: '14.91s — Uncaught TypeError', type: 'error' },
    { sec: 17.0, label: '17.0s — Still Stuck', type: 'nav' },
    { sec: 24.5, label: '24.5s — Session End', type: 'end' }
  ];

  return (
    <section id="replay" className="py-24 bg-[#08090d] border-b border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-brand-400 mb-4">
            <Video className="w-3.5 h-3.5" />
            <span>Post-Mortem & Video Ingestion</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-white mb-6">
            Run it back.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Turn any pre-recorded screen capture, MP4 bug video, or QA recording into a deterministic, timestamped evidence database.
          </p>
        </div>

        {/* CLI Command Bar */}
        <div className="mb-12 p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-brand-400 select-none">$</span>
            <span className="text-zinc-200">sutriva inspect bug.mp4</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-zinc-900 text-history-400 border border-zinc-800 font-mono">
            &gt; "Run it back to the failure."
          </span>
        </div>

        {/* The Replay Pipeline Transformation Flow */}
        <div className="mb-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: 'MP4 Video', desc: 'Raw screen capture' },
            { step: 'Timeline', desc: 'Bounded, sampled frame index' },
            { step: 'Evidence', desc: 'Extracted network/console events' },
            { step: 'Frames', desc: 'Vision-analyzed sampled frames' },
            { step: 'Transcript', desc: 'Spoken developer audio, if present' },
            { step: 'Source Correlation', desc: 'Git branch/commit/status' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center font-mono">
              <span className="text-[10px] text-zinc-500 block mb-1">0{idx + 1}</span>
              <div className="text-xs font-bold text-white mb-1">{item.step}</div>
              <div className="text-[11px] text-zinc-400 font-sans">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Interactive Video & Telemetry Scrubber Mockup */}
        <div className="rounded-2xl bg-[#0c0e15] border border-zinc-800 shadow-2xl p-6 lg:p-8">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800 mb-6">
            <div>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Video Replay Explorer</span>
              <h3 className="text-xl font-mono font-bold text-white flex items-center gap-2">
                <span>checkout-bug.mp4</span>
                <span className="text-xs font-normal text-brand-400 font-mono bg-brand-950/60 px-2 py-0.5 rounded border border-brand-800/60">
                  Indexed (24 sampled frames)
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs text-zinc-300">
              <span>Timestamp: <strong className="text-brand-400 font-bold">{scrubberSec.toFixed(2)}s</strong> / 24.50s</span>
            </div>
          </div>

          {/* Scrubber Range Slider */}
          <div className="mb-8 space-y-2">
            <input
              type="range"
              min="0"
              max="24.5"
              step="0.1"
              value={scrubberSec}
              onChange={(e) => setScrubberSec(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-400"
            />

            {/* Timeline Tick Markers */}
            <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-1">
              {videoTimelinePoints.map((pt, i) => (
                <button
                  key={i}
                  onClick={() => setScrubberSec(pt.sec)}
                  className={`hover:text-brand-400 transition-colors ${
                    pt.type === 'error' ? 'text-failure-400 font-bold' : ''
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Multimodal Telemetry Grid for Current Scrubber Position */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            
            {/* 1. Visual Frame Extraction */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-2">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <ImageIcon className="w-3.5 h-3.5 text-info-400" />
                  Keyframe @ {scrubberSec.toFixed(2)}s
                </span>
                <span className="text-[10px]">1080p WebM</span>
              </div>

              {/* Visual Mock Frame */}
              <div className="h-32 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                {scrubberSec >= 14.5 && scrubberSec <= 16.0 ? (
                  <div className="text-failure-400 space-y-1">
                    <div className="text-xs font-bold font-mono">⚡ Stuck on "Processing..."</div>
                    <div className="text-[10px] text-zinc-400 font-sans">Confirmation text never appears.</div>
                  </div>
                ) : scrubberSec < 14.5 ? (
                  <div className="text-zinc-400 space-y-1">
                    <div className="text-xs font-mono">Checkout Page Active</div>
                    <div className="text-[10px] text-zinc-500">"Place order" button visible</div>
                  </div>
                ) : (
                  <div className="text-zinc-400 space-y-1">
                    <div className="text-xs font-mono">Checkout Page (Still Stuck)</div>
                    <div className="text-[10px] text-zinc-500">No confirmation shown</div>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-zinc-500 font-sans">
                Sampled frame extracted via ffprobe/ffmpeg.
              </div>
            </div>

            {/* 2. Audio Transcript */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-2">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Mic className="w-3.5 h-3.5 text-history-400" />
                  Audio Transcript
                </span>
                <span className="text-[10px]">ElevenLabs Scribe</span>
              </div>

              <div className="h-32 rounded-lg bg-zinc-900/60 p-3 overflow-y-auto font-sans text-xs text-zinc-300 leading-relaxed border border-zinc-800">
                {scrubberSec >= 13.0 && scrubberSec <= 17.0 ? (
                  <p className="text-history-200">
                    <strong className="font-mono text-[10px] text-history-400">[14.10s]</strong> "Alright, notice what happens when I click Place order... see that? It just stays on Processing."
                  </p>
                ) : scrubberSec < 13.0 ? (
                  <p className="text-zinc-400">
                    <strong className="font-mono text-[10px] text-zinc-500">[04.20s]</strong> "I'm on the checkout page, about to click Place order."
                  </p>
                ) : (
                  <p className="text-zinc-400">
                    <strong className="font-mono text-[10px] text-zinc-500">[18.00s]</strong> "Still stuck — no confirmation, nothing in the UI."
                  </p>
                )}
              </div>
              <div className="text-[11px] text-zinc-500 font-sans">
                Transcription is optional — falls back to a deterministic mock without an ElevenLabs API key.
              </div>
            </div>

            {/* 3. Source Correlation */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-2">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <GitBranch className="w-3.5 h-3.5 text-brand-400" />
                  Git Context
                </span>
                <span className="text-[10px]">inspect_environment</span>
              </div>

              <div className="h-32 rounded-lg bg-zinc-900/60 p-3 font-mono text-[11px] text-zinc-300 border border-zinc-800 flex flex-col justify-between">
                <div className="text-zinc-400">
                  File: <span className="text-history-300">app/checkout/page.tsx:15</span>
                </div>
                <div className="p-1.5 rounded bg-black/60 text-zinc-400 text-[10px]">
                  <code>branch: main, working tree: clean</code>
                </div>
                <div className="text-brand-400 text-[11px]">
                  ✓ Correlated with current Git state
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 font-sans">
                Branch, commit, and working-tree status — not a per-line blame engine.
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
