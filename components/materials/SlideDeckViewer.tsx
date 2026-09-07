"use client";
// components/materials/SlideDeckViewer.tsx — Interactive slide deck presenter with PDF + PowerPoint (.pptx) export

import { printHtml } from "@/lib/print";
import { escapeHtml } from "@/lib/safeHtml";
import { downloadSlideDeckPptx } from "@/lib/pptx";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Printer,
  FileDown,
  Loader2,
  Maximize2,
  Minimize2,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Eye
} from "lucide-react";
import { clsx } from "clsx";
import type { SlideDeckContent } from "@/types/iep";

interface Props {
  content: SlideDeckContent;
  onClose?: () => void;
}

export default function SlideDeckViewer({ content, onClose }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const slides = content.slides || [];
  const activeSlide = slides[currentIdx] || {
    slideNumber: 1,
    title: "Lesson Slide",
    content: ["No slide content available."],
  };

  // Keyboard navigation (Left / Right arrow keys)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest("button,input,select,textarea,a,[contenteditable=true]")) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentIdx((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, isFullscreen]);

  useEffect(() => {
    setIsSpeaking(false);
    return () => { window.speechSynthesis?.cancel(); };
  }, [currentIdx]);

  // Audio Read-Aloud via Web Speech API (Accessibility support)
  function handleToggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${activeSlide.title}. ${activeSlide.content.join(" ")}. ${
      activeSlide.interactiveQuestion ? `Question: ${activeSlide.interactiveQuestion.question}` : ""
    }`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.88; // Calm, clear pacing for special education
    utterance.pitch = 1.05;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  function handlePrint() {
    printHtml(`<h1>${escapeHtml(content.title)}</h1>` + slides.map((slide) => `<section style="break-after:page"><h2>${slide.slideNumber}. ${escapeHtml(slide.title)}</h2><ul>${slide.content.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>${slide.interactiveQuestion ? `<p>${escapeHtml(slide.interactiveQuestion.question)}</p><ul>${slide.interactiveQuestion.options.map((option) => `<li>${escapeHtml(option)}</li>`).join("")}</ul>` : ""}${showNotes ? `<p>Teacher notes: ${escapeHtml(slide.teacherNotes || "")}</p>` : ""}</section>`).join(""));
  }

  async function handleExportPptx() {
    if (exporting) return;
    setExportError(false);
    setExporting(true);
    try {
      await downloadSlideDeckPptx(content);
    } catch (err) {
      console.error("PowerPoint export failed:", err);
      setExportError(true);
      setTimeout(() => setExportError(false), 6000);
    } finally {
      setExporting(false);
    }
  }

  function handleSelectOption(optIdx: number) {
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  }

  const currentAnswer = selectedAnswers[currentIdx];
  const q = activeSlide.interactiveQuestion;
  const isAnswered = currentAnswer !== undefined;
  const isCorrect = q && isAnswered && currentAnswer === q.correctIndex;

  return (
    <div
      className={clsx(
        "flex flex-col bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl transition-all",
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "w-full min-h-[560px]"
      )}
    >
      {/* ─── Presentation Top Bar ───────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/60 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
              {content.title}
            </h3>
            <p className="text-xs text-slate-400">
              Theme: <span className="text-indigo-300 font-medium">{content.theme}</span> • Level:{" "}
              <span className="text-slate-300">{content.readingLevel}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleSpeech}
            className={clsx(
              "p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
              isSpeaking
                ? "bg-amber-500 text-slate-900 font-bold"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            )}
            title="Read Slide Aloud (Speech Support)"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSpeaking ? "Stop Voice" : "Read Aloud"}</span>
          </button>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={clsx(
              "p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
              showNotes ? "bg-indigo-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            )}
            title="Teacher Facilitation Notes"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Teacher Notes</span>
          </button>

          <button
            onClick={handleExportPptx}
            disabled={exporting}
            className={clsx(
              "p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60",
              exportError ? "bg-rose-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            )}
            title={exportError ? "Export failed — try again" : "Download as PowerPoint (.pptx)"}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {exporting ? "Exporting…" : exportError ? "Failed" : "PowerPoint"}
            </span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            title="Print Slide Deck (PDF Handout)"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Presenter"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-white text-lg px-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Slide Canvas Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950/40">
          {/* Slide Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Slide {activeSlide.slideNumber} of {slides.length}
              </span>
              <span className="text-xs text-slate-400">Target: {content.targetSkill}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {activeSlide.title}
            </h2>
          </div>

          {/* Slide Body Content */}
          <div className="space-y-4 mb-6">
            {activeSlide.content.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 sm:p-5 shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-normal">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Check-in / Question */}
          {q && (
            <div className="mt-4 p-5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 shadow-inner">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm mb-3">
                <HelpCircle className="w-4 h-4" />
                Quick Explorer Check-In:
              </div>
              <p className="text-sm sm:text-base font-semibold text-white mb-3">
                {q.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = currentAnswer === optIdx;
                  const isThisCorrect = optIdx === q.correctIndex;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={clsx(
                        "p-3 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border",
                        isAnswered
                          ? isThisCorrect
                            ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                            : isThisSelected
                            ? "bg-rose-600/30 border-rose-500 text-rose-200"
                            : "bg-slate-800/40 border-slate-700 text-slate-400 opacity-60"
                          : "bg-slate-800 hover:bg-slate-700/80 border-slate-600 text-slate-100 hover:border-indigo-400"
                      )}
                    >
                      <span>{opt}</span>
                      {isAnswered && isThisCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div
                  className={clsx(
                    "mt-3.5 p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2",
                    isCorrect
                      ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                      : "bg-amber-950/60 border border-amber-500/40 text-amber-300"
                  )}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{q.explanation}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Teacher Facilitation Notes Drawer ──────────────────── */}
        {showNotes && (
          <div className="w-full md:w-80 bg-slate-850 border-t md:border-t-0 md:border-l border-slate-700 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-3">
                <Eye className="w-4 h-4" />
                Teacher Facilitation Notes
              </div>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60">
                {activeSlide.teacherNotes || "Provide positive verbal reinforcement and observe accuracy."}
              </p>

              {activeSlide.imagePrompt && (
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Visual Context / Image Prompt:
                  </span>
                  <p className="text-xs text-slate-400 italic mt-1 bg-slate-900/40 p-2.5 rounded-lg">
                    &quot;{activeSlide.imagePrompt}&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 text-xs text-slate-400">
              Tip: Use Left/Right arrow keys or Spacebar to advance slides seamlessly.
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Navigation Controller ───────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-t border-slate-700/60 print:hidden">
        <button
          onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={clsx(
                "w-3 h-3 rounded-full transition-all",
                i === currentIdx
                  ? "bg-indigo-500 ring-4 ring-indigo-500/30 scale-110"
                  : "bg-slate-600 hover:bg-slate-500"
              )}
              title={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentIdx((p) => Math.min(slides.length - 1, p + 1))}
          disabled={currentIdx === slides.length - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
