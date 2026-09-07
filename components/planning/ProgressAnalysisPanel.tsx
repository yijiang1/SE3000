"use client";
// components/planning/ProgressAnalysisPanel.tsx — Stage 6 readout for a goal's progress

import { TrendingUp, TrendingDown, AlertCircle, Minus, ArrowRightCircle, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import type { ProgressAnalysis } from "@/types/iep";

interface Props {
  analysis: ProgressAnalysis;
  onGenerateNext?: (difficultyLevel: number) => void;
  generating?: boolean;
}

const STATUS = {
  on_track: { label: "On Track", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", Icon: TrendingUp },
  at_risk: { label: "At Risk", cls: "bg-amber-100 text-amber-800 border-amber-200", Icon: AlertCircle },
  off_track: { label: "Off Track", cls: "bg-rose-100 text-rose-800 border-rose-200", Icon: TrendingDown },
  no_data: { label: "No Data", cls: "bg-gray-100 text-gray-600 border-gray-200", Icon: Minus },
} as const;

export default function ProgressAnalysisPanel({ analysis, onGenerateNext, generating }: Props) {
  const s = STATUS[analysis.trendStatus] ?? STATUS.no_data;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={clsx("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border", s.cls)}>
          <s.Icon className="w-3 h-3" /> {s.label}
        </span>
        <span className={clsx(
          "px-2.5 py-0.5 rounded-full text-xs font-bold border",
          analysis.adequateProgress ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        )}>
          {analysis.adequateProgress ? "Adequate progress" : "Progress not adequate"}
        </span>
        <span className="text-[11px] text-gray-400 font-mono ml-auto">
          {new Date(analysis.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          ["Observations", String(analysis.observations)],
          ["Latest", analysis.currentAccuracy !== null ? `${analysis.currentAccuracy}%` : "—"],
          ["Average", analysis.averageAccuracy !== null ? `${analysis.averageAccuracy}%` : "—"],
          ["To mastery", analysis.masteryPercent !== null ? `${analysis.masteryPercent}%` : "—"],
        ].map(([label, val]) => (
          <div key={label} className="rounded-xl bg-slate-50 border border-slate-200 py-2">
            <div className="text-base font-black text-slate-900">{val}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
        {analysis.narrative}
      </p>

      {analysis.strugglingAreas.length > 0 && (
        <div className="text-xs">
          <span className="font-bold text-gray-600">Still struggling: </span>
          <span className="text-gray-700">{analysis.strugglingAreas.join("; ")}</span>
        </div>
      )}

      <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-950 flex items-start gap-2">
        <ArrowRightCircle className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" />
        <span><span className="font-bold">Next instructional step: </span>{analysis.nextInstructionalStep}</span>
      </div>

      {onGenerateNext && (
        <button
          onClick={() => onGenerateNext(analysis.recommendedDifficultyLevel)}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {generating ? "Generating…" : `Generate next worksheet at difficulty ${analysis.recommendedDifficultyLevel}/5`}
        </button>
      )}
    </div>
  );
}
