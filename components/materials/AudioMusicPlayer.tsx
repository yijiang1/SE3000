"use client";
// components/materials/AudioMusicPlayer.tsx — Music Music & Melodic Player

import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Music, Sparkles, Volume2, Download, Disc3 } from "lucide-react";
import { clsx } from "clsx";
import type { MusicContent } from "@/types/iep";

interface Props {
  content: MusicContent;
  onClose?: () => void;
}

export default function AudioMusicPlayer({ content, onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const synthTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const hasRealAudio = !!content.audioUrl;

  // Web Audio synthetic musical tone player (plays harmonic progression when no raw mp3 is attached)
  const audioCtxRef = useRef<AudioContext | null>(null);

  function playHarmonicToneSequence() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Play a calming 5-note pentatonic chord arpeggio
      const frequencies = [261.63, 329.63, 392.0, 523.25, 659.25]; // C major pentatonic
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.3);

        gain.gain.setValueAtTime(0.01, ctx.currentTime + idx * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + idx * 0.3 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.3 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.3);
        osc.stop(ctx.currentTime + idx * 0.3 + 1.3);
      });
    } catch (e) {
      console.warn("Web Audio playback note:", e);
    }
  }

  function togglePlay() {
    if (hasRealAudio) {
      const el = audioElRef.current;
      if (!el) return;
      if (isPlaying) {
        el.pause();
        setIsPlaying(false);
      } else {
        el.play();
        setIsPlaying(true);
      }
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    } else {
      setIsPlaying(true);
      playHarmonicToneSequence();
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return p + 2;
        });
      }, 600);
      synthTimerRef.current = interval;
    }
  }

  useEffect(() => {
    return () => {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };
  }, []);

  function handleReset() {
    setProgress(0);
    setIsPlaying(false);
    if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
  }

  function handleAudioTimeUpdate() {
    const el = audioElRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
  }

  function handleAudioEnded() {
    setIsPlaying(false);
    setProgress(0);
  }

  function handleDownloadLyrics() {
    const blob = new Blob([`${content.title}\nGenre: ${content.genre}\nBPM: ${content.tempoBpm}\n\n${content.lyricsOrStructure || ""}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.title.toLowerCase().replace(/\s+/g, "-")}-lyrics.txt`;
    a.click();
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl border border-indigo-700/40 shadow-2xl p-6 sm:p-8 space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {hasRealAudio
                  ? "AI-Generated Track"
                  : `Local tone preview (${content.durationSeconds}s)`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                {content.purpose.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">{content.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadLyrics}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Download Lyrics & Chords"
          >
            <Download className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl px-2">
              ✕
            </button>
          )}
        </div>
      </div>

      {hasRealAudio && (
        <audio
          ref={audioElRef}
          src={content.audioUrl}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* ─── Audio Visualizer Waves & Metadata ───────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-indigo-900/60 flex flex-col items-center space-y-5">
        <div className="flex items-center gap-1.5 h-16 w-full justify-center">
          {[40, 65, 80, 50, 95, 70, 30, 85, 90, 60, 45, 75, 100, 55, 35, 80, 65, 90, 40, 70].map((h, i) => (
            <div
              key={i}
              className={clsx(
                "w-2 sm:w-2.5 rounded-full transition-all duration-300",
                isPlaying
                  ? "bg-gradient-to-t from-indigo-500 to-purple-400 animate-pulse"
                  : "bg-slate-700/60"
              )}
              style={{
                height: isPlaying ? `${Math.max(15, (h * (progress + 20)) % 100)}%` : "20%",
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-1.5">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>0:{String(Math.floor((progress / 100) * content.durationSeconds)).padStart(2, "0")}</span>
            <span>0:{String(content.durationSeconds).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="p-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>

          <div className="p-3 rounded-full bg-slate-800 text-indigo-400">
            <Disc3 className={clsx("w-4 h-4", isPlaying && "animate-spin")} />
          </div>
        </div>

        {/* Track Specs */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-300">
          <span className="bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
            Genre: <strong className="text-white">{content.genre}</strong>
          </span>
          <span className="bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
            Tempo: <strong className="text-white">{content.tempoBpm} BPM</strong>
          </span>
          <span className="bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
            Mood: <strong className="text-white">{content.mood}</strong>
          </span>
        </div>
      </div>

      {/* ─── Lyrics / Structure Sheet ───────────────────────────── */}
      {content.lyricsOrStructure && (
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Mnemonic Lyrics & Musical Score Sheet
          </h4>
          <pre className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {content.lyricsOrStructure}
          </pre>
        </div>
      )}
    </div>
  );
}
