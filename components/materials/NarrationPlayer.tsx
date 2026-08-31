"use client";
// components/materials/NarrationPlayer.tsx — Read-along narration player with sentence highlight

import { useState, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Sparkles, User, Gauge } from "lucide-react";
import { clsx } from "clsx";
import type { NarrationContent } from "@/types/iep";

interface Props {
  content: NarrationContent;
  onClose?: () => void;
}

export default function NarrationPlayer({ content, onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(content.speed || 0.9);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const segments = content.segments || [
    { segmentIndex: 1, text: content.fullTranscript, durationSeconds: 6 }
  ];

  function startPlayback() {
    setIsPlaying(true);
    let currentIdx = 0;
    setActiveSegmentIdx(0);

    // Speak with Web Speech if no audio element attached
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content.fullTranscript);
      utterance.rate = speedMultiplier;
      utterance.pitch = 1.0;

      utterance.onboundary = (e) => {
        // Approximate sentence tracking
        const charIdx = e.charIndex;
        let cumulative = 0;
        for (let i = 0; i < segments.length; i++) {
          cumulative += segments[i].text.length;
          if (charIdx <= cumulative) {
            setActiveSegmentIdx(i);
            break;
          }
        }
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setActiveSegmentIdx(null);
      };

      window.speechSynthesis.speak(utterance);
    }

    // Interval stepping fallback
    const runNextSegment = () => {
      if (currentIdx >= segments.length) {
        setIsPlaying(false);
        setActiveSegmentIdx(null);
        return;
      }
      setActiveSegmentIdx(currentIdx);
      const dur = (segments[currentIdx].durationSeconds || 3) * 1000 * (1 / speedMultiplier);
      timerRef.current = setTimeout(() => {
        currentIdx++;
        runNextSegment();
      }, dur);
    };

    runNextSegment();
  }

  function stopPlayback() {
    setIsPlaying(false);
    setActiveSegmentIdx(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  function handleReset() {
    stopPlayback();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sm:p-8 space-y-6">
      {/* ─── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                OpenAI TTS (Voice: {content.voice})
              </span>
              <span className="text-xs text-gray-400 font-medium">Read-Along Support</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">{content.title}</h2>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl px-2">
            ✕
          </button>
        )}
      </div>

      {/* ─── Main Controller Bar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? "Pause Narration" : "Listen & Read Along"}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-600"
            title="Reset to beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Adjustment Controller */}
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">Speed:</span>
          {[0.75, 0.9, 1.0, 1.2].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeedMultiplier(s);
                if (isPlaying) {
                  stopPlayback();
                }
              }}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                speedMultiplier === s
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* ─── Interactive Sentence Read-Along Transcript ───────────── */}
      <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Sentence Read-Along Transcript
        </h4>
        <div className="space-y-3 text-base sm:text-lg leading-relaxed text-gray-800 font-medium">
          {segments.map((seg, idx) => {
            const isActive = activeSegmentIdx === idx;
            return (
              <p
                key={seg.segmentIndex}
                className={clsx(
                  "p-3 rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-amber-200 text-amber-950 font-bold shadow-md scale-101 border border-amber-300"
                    : "hover:bg-amber-100/50"
                )}
              >
                {seg.text}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
