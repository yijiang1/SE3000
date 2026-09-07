"use client";
// components/materials/WorksheetViewer.tsx — printable differentiated worksheet / homework viewer

import { useState } from "react";
import { Printer, Key, KeyRound, Eye, EyeOff, ClipboardList, X } from "lucide-react";
import { clsx } from "clsx";
import type { WorksheetContent } from "@/types/iep";

interface Props {
  content: WorksheetContent;
  onClose?: () => void;
}

const PURPOSE_LABEL: Record<string, string> = {
  practice: "Practice",
  guided_practice: "Guided Practice",
  independent_practice: "Independent Practice",
  homework: "Homework",
  exit_ticket: "Exit Ticket",
  quiz: "Quiz",
  progress_monitoring: "Progress-Monitoring Probe",
  review: "Review Activity",
};

export default function WorksheetViewer({ content, onClose }: Props) {
  const [showKey, setShowKey] = useState(false);
  const [showHints, setShowHints] = useState(true);

  const items = content.items || [];
  const hasKey = (content.answerKey?.length ?? 0) > 0;

  return (
    <div className="flex flex-col bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl w-full">
      {/* ─── Toolbar (hidden on print) ─────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 text-white print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{content.title}</h3>
            <p className="text-xs text-slate-400">
              {PURPOSE_LABEL[content.purpose] || "Practice"} • Difficulty{" "}
              <span className="text-indigo-300 font-bold">{content.difficultyLevel}/5</span> •{" "}
              {items.length} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowHints((v) => !v)}
            className={clsx(
              "p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
              showHints ? "bg-indigo-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            )}
            title="Toggle scaffolding hints"
          >
            {showHints ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Hints</span>
          </button>

          {hasKey && (
            <button
              onClick={() => setShowKey((v) => !v)}
              className={clsx(
                "p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
                showKey ? "bg-amber-500 text-slate-900 font-bold" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              )}
              title="Toggle answer key"
            >
              {showKey ? <KeyRound className="w-4 h-4" /> : <Key className="w-4 h-4" />}
              <span className="hidden sm:inline">Answer Key</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            title="Print worksheet"
          >
            <Printer className="w-4 h-4" />
          </button>

          {onClose && (
            <button onClick={onClose} className="ml-1 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Printable worksheet body ──────────────────────────── */}
      <div className="overflow-y-auto max-h-[80vh] print:max-h-none p-6 sm:p-8 print:p-0 space-y-5">
        {/* Name / date line */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-900 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight">{content.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Target skill: <span className="font-semibold text-slate-700">{content.targetSkill}</span>
              {" · "}Instructional level: {content.instructionalLevel}
              {" · "}Reading level: {content.readingLevel}
            </p>
          </div>
          <div className="flex gap-6 text-sm text-slate-600">
            <span>Name: ______________________</span>
            <span>Date: ____________</span>
          </div>
        </div>

        {/* Instructions + accommodations */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2 rounded-xl bg-indigo-50 border border-indigo-200 p-3.5 text-sm text-indigo-950">
            <span className="font-bold">Directions: </span>
            {content.instructions}
          </div>
          {content.accommodationsApplied?.length > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-950">
              <span className="font-bold block mb-1">Supports built in</span>
              <ul className="list-disc list-inside space-y-0.5">
                {content.accommodationsApplied.slice(0, 6).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Items */}
        <ol className="space-y-4">
          {items.map((it) => (
            <li key={it.number} className="rounded-xl border border-slate-200 p-4 break-inside-avoid">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {it.number}
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-[15px] leading-relaxed font-medium text-slate-900 whitespace-pre-wrap">
                    {it.prompt}
                  </p>

                  {it.choices && it.choices.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {it.choices.map((c, ci) => (
                        <label key={ci} className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="w-5 h-5 rounded-full border-2 border-slate-400 flex items-center justify-center text-[11px] font-bold">
                            {String.fromCharCode(65 + ci)}
                          </span>
                          {c}
                        </label>
                      ))}
                    </div>
                  )}

                  {it.visualSupport && (
                    <p className="text-xs text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5">
                      🖼 Visual: {it.visualSupport}
                    </p>
                  )}

                  {showHints && it.scaffold && (
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 print:block">
                      💡 Hint: {it.scaffold}
                    </p>
                  )}

                  {it.workingSpace && (
                    <div className="mt-1 h-16 rounded-lg border border-dashed border-slate-300 bg-slate-50/60" />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {content.teacherNotes && (
          <div className="rounded-xl bg-slate-100 border border-slate-200 p-3.5 text-xs text-slate-600 print:hidden">
            <span className="font-bold text-slate-800">Teacher notes: </span>
            {content.teacherNotes}
          </div>
        )}

        {/* Answer key */}
        {hasKey && (showKey || false) && (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 print:break-before-page">
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
              <KeyRound className="w-4 h-4" /> Answer Key
            </div>
            <ol className="space-y-1.5 text-sm text-amber-950">
              {content.answerKey.map((k) => (
                <li key={k.number}>
                  <span className="font-bold">{k.number}.</span> {k.answer}
                  {k.explanation && <span className="text-amber-800"> — {k.explanation}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
