"use client";
// components/planning/InstructionalUnitPanel.tsx — renders a scaffolded instructional unit

import { Printer, X, Layers, CheckCircle2, ListChecks } from "lucide-react";
import type { InstructionalUnitContent } from "@/types/iep";

interface Props {
  content: InstructionalUnitContent;
  onClose?: () => void;
  /** When true, render standalone chrome (toolbar). Inside the wizard we pass false. */
  standalone?: boolean;
}

export default function InstructionalUnitPanel({ content, onClose, standalone = true }: Props) {
  const steps = content.steps || [];

  return (
    <div className="bg-white text-slate-900 rounded-2xl overflow-hidden w-full">
      {standalone && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{content.title}</h3>
              <p className="text-xs text-slate-400">
                {steps.length} steps • Level: {content.instructionalLevel} • Theme: {content.theme}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
              title="Print unit"
            >
              <Printer className="w-4 h-4" />
            </button>
            {onClose && (
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto print:max-h-none">
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
          <h2 className="text-lg font-black text-indigo-950">{content.title}</h2>
          <p className="text-sm text-indigo-900 mt-1">
            Target skill: <span className="font-semibold">{content.targetSkill}</span>
          </p>
          {content.accommodationsSummary?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {content.accommodationsSummary.map((a, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold bg-white text-indigo-800 border border-indigo-200 rounded-full px-2 py-0.5"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        <ol className="space-y-3">
          {steps.map((s) => (
            <li key={s.order} className="rounded-xl border border-slate-200 p-4 break-inside-avoid">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {s.order}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-600 mt-0.5">{s.objective}</p>

                  <div className="grid gap-3 sm:grid-cols-2 mt-3 text-sm">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Activities</p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {s.activities?.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Scaffolds</p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {s.scaffolds?.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  </div>

                  {s.accommodationsApplied?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.accommodationsApplied.map((a, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-2 py-0.5"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="mt-2 text-xs text-slate-600 flex items-start gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
                    <span><span className="font-semibold">Check: </span>{s.checkForUnderstanding}</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-950 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span><span className="font-bold">Mastery assessment: </span>{content.masteryAssessment}</span>
        </div>
      </div>
    </div>
  );
}
