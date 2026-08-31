"use client";
// components/materials/VideoPlayer.tsx — Veo 3.1 Video clip & Storyboard presenter

import { useState, useEffect, useRef } from "react";
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Clapperboard,
  Layers,
  Volume2
} from "lucide-react";
import { clsx } from "clsx";
import type { VideoContent } from "@/types/iep";

interface Props {
  content: VideoContent;
  onClose?: () => void;
}

export default function VideoPlayer({ content, onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scenes = content.scenes || [
    {
      sceneNumber: 1,
      visualDescription: "Animation introduction scene.",
      durationSeconds: 4,
      narrationCue: "Welcome to our learning video!",
    }
  ];

  const currentScene = scenes[activeSceneIdx] || scenes[0];

  function togglePlay() {
    if (isPlaying) {
      setIsPlaying(false);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    } else {
      setIsPlaying(true);
      const interval = setInterval(() => {
        setSceneProgress((p) => {
          if (p >= 100) {
            setActiveSceneIdx((idx) => {
              if (idx + 1 < scenes.length) {
                return idx + 1;
              } else {
                clearInterval(interval);
                setIsPlaying(false);
                return 0;
              }
            });
            return 0;
          }
          return p + 4;
        });
      }, (currentScene.durationSeconds * 1000) / 25);
      playTimerRef.current = interval;
    }
  }

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  function handleReset() {
    setIsPlaying(false);
    setActiveSceneIdx(0);
    setSceneProgress(0);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-2xl overflow-hidden space-y-0">
      {/* ─── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Veo 3.1 Animated Storyboard
              </span>
              <span className="text-xs text-slate-400">Theme: {content.theme}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{content.title}</h2>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl px-2">
            ✕
          </button>
        )}
      </div>

      {/* ─── Video Canvas Stage ─────────────────────────────────── */}
      <div className="relative aspect-video max-h-[380px] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between p-6 overflow-hidden">
        {/* Scene Indicator & Badges */}
        <div className="flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs font-extrabold text-rose-400 flex items-center gap-1.5 shadow">
            <Clapperboard className="w-3.5 h-3.5" /> Scene {currentScene.sceneNumber} of {scenes.length}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 text-[11px] font-semibold text-slate-300">
            {currentScene.durationSeconds}s clip
          </span>
        </div>

        {/* Visual Scene Description Artwork */}
        <div className="my-auto text-center px-4 max-w-xl mx-auto space-y-3 z-10">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className={clsx("w-7 h-7", isPlaying && "animate-spin")} />
          </div>
          <p className="text-sm sm:text-base text-slate-200 font-semibold leading-relaxed bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/80 shadow-lg">
            "{currentScene.visualDescription}"
          </p>
        </div>

        {/* Synchronized Voiceover Cue Bar */}
        <div className="z-10 p-3.5 rounded-xl bg-rose-950/80 backdrop-blur-md border border-rose-500/40 flex items-center gap-2.5 shadow-lg">
          <Volume2 className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-xs sm:text-sm font-bold text-rose-100 italic">
            "{currentScene.narrationCue}"
          </p>
        </div>

        {/* Dynamic Scene Background Lighting Effect */}
        <div
          className="absolute inset-0 opacity-20 transition-all duration-700 pointer-events-none"
          style={{
            background:
              activeSceneIdx % 2 === 0
                ? "radial-gradient(circle at center, #f43f5e 0%, transparent 70%)"
                : "radial-gradient(circle at center, #6366f1 0%, transparent 70%)"
          }}
        />
      </div>

      {/* ─── Timeline & Controls ─────────────────────────────────── */}
      <div className="p-5 bg-slate-850 border-t border-slate-700 space-y-4">
        {/* Timeline Bar */}
        <div className="flex items-center gap-2">
          {scenes.map((sc, idx) => (
            <div
              key={idx}
              className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden cursor-pointer"
              onClick={() => {
                setActiveSceneIdx(idx);
                setSceneProgress(0);
              }}
            >
              <div
                className="h-full bg-rose-500 transition-all"
                style={{
                  width:
                    idx < activeSceneIdx
                      ? "100%"
                      : idx === activeSceneIdx
                      ? `${sceneProgress}%`
                      : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* Controller Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Pause Scene" : "Play Storyboard"}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {scenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveSceneIdx(idx);
                  setSceneProgress(0);
                }}
                className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  activeSceneIdx === idx
                    ? "bg-rose-600 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                )}
              >
                Scene {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
