"use client";
// components/planning/PlanningSessionsSection.tsx — dashboard section for saved planning sessions

import { useState } from "react";
import {
  Sparkles, ClipboardList, Layers, Trash2, PlayCircle, LineChart, X, Loader2, PlusCircle
} from "lucide-react";
import { clsx } from "clsx";
import type {
  StudentIEPProfile, PlanningSession, ProgressLogEntry, GeneratedMaterial, ProgressAnalysis
} from "@/types/iep";
import { runProgressAnalysis, deletePlanningSession, latestDifficultyForSession } from "@/lib/planning";
import { generateAndSaveMaterial } from "@/lib/materials";
import { defaultWorksheetSpec } from "./WorksheetSpecControls";
import InstructionalUnitPanel from "./InstructionalUnitPanel";
import ProgressAnalysisPanel from "./ProgressAnalysisPanel";

interface Props {
  profile: StudentIEPProfile;
  sessions: PlanningSession[];
  allLogs: ProgressLogEntry[];
  onStartNew: () => void;
  onResume: (s: PlanningSession) => void;
  onChanged: () => void;
  onOpenMaterial: (m: GeneratedMaterial) => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  goal_committed: "Goal added",
  active: "Active",
};

export default function PlanningSessionsSection({
  profile, sessions, allLogs, onStartNew, onResume, onChanged, onOpenMaterial,
}: Props) {
  const [viewUnit, setViewUnit] = useState<PlanningSession | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState<string | null>(null);
  const [freshAnalysis, setFreshAnalysis] = useState<Record<string, ProgressAnalysis>>({});
  const [err, setErr] = useState<string | null>(null);

  function goalFor(s: PlanningSession) {
    return s.goalId ? profile.goals.find((g) => g.id === s.goalId) : undefined;
  }
  function logCountFor(s: PlanningSession) {
    return s.goalId ? allLogs.filter((l) => l.goalId === s.goalId).length : 0;
  }
  function latestAnalysisFor(s: PlanningSession): ProgressAnalysis | undefined {
    return freshAnalysis[s.id] ?? s.progressAnalyses[s.progressAnalyses.length - 1];
  }

  async function handleRunAnalysis(s: PlanningSession) {
    const goal = goalFor(s);
    if (!goal) return;
    setRunning(s.id);
    setErr(null);
    try {
      const { analysis } = await runProgressAnalysis(s, goal, allLogs, latestDifficultyForSession(s));
      setFreshAnalysis((m) => ({ ...m, [s.id]: analysis }));
      onChanged();
    } catch (e: any) {
      setErr(e?.message || "Could not analyze progress.");
    } finally {
      setRunning(null);
    }
  }

  async function handleGenerateNext(s: PlanningSession, difficultyLevel: number) {
    const goal = goalFor(s);
    if (!goal) return;
    setGenBusy(s.id);
    setErr(null);
    try {
      const spec = { ...defaultWorksheetSpec(profile.learningProfile?.readingLevel || "Grade level"), difficultyLevel, purpose: "independent_practice" as const };
      const mat = await generateAndSaveMaterial(profile, goal, allLogs, "worksheet", { worksheetSpec: spec, plaafp: s.plaafp });
      onChanged();
      onOpenMaterial(mat);
    } catch (e: any) {
      setErr(e?.message || "Could not generate the worksheet.");
    } finally {
      setGenBusy(null);
    }
  }

  async function handleDelete(s: PlanningSession) {
    if (!confirm("Delete this planning session? The committed IEP goal and any generated worksheets are kept.")) return;
    await deletePlanningSession(s.id);
    onChanged();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-gray-900">Instructional Planning ({sessions.length})</h3>
        </div>
        <button
          onClick={onStartNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" /> New Planning Session
        </button>
      </div>

      {err && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{err}</div>
      )}

      {sessions.length === 0 ? (
        <div className="py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-gray-700">No planning sessions yet</p>
          <p className="text-xs text-gray-400 max-w-sm">
            Start from a student's present level to generate a PLAAFP, a measurable IEP goal, a scaffolded unit, and aligned worksheets.
          </p>
          <button onClick={onStartNew} className="mt-1 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">
            <PlusCircle className="w-4 h-4" /> Start Planning Session
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const goal = goalFor(s);
            const logs = logCountFor(s);
            const analysis = latestAnalysisFor(s);
            return (
              <div key={s.id} className="rounded-2xl border border-gray-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {s.subjectArea}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {STATUS_LABEL[s.status] || s.status}
                  </span>
                  {s.instructionalUnit && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {s.instructionalUnit.steps.length}-step unit
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400 font-mono ml-auto">
                    {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>

                {s.plaafp && (
                  <p className="text-sm text-gray-800">
                    <span className="font-bold">Target skill:</span> {s.plaafp.skillGaps.targetSkill}
                  </p>
                )}
                {goal ? (
                  <p className="text-xs text-gray-500 line-clamp-2">{goal.goalText}</p>
                ) : (
                  <p className="text-xs text-amber-600 font-semibold">Goal not added yet — resume to finish.</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => onResume(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100">
                    <PlayCircle className="w-3.5 h-3.5" /> Resume steps
                  </button>
                  {s.instructionalUnit && (
                    <button onClick={() => setViewUnit(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-gray-700 border border-gray-200 text-xs font-bold hover:bg-gray-50">
                      <Layers className="w-3.5 h-3.5" /> View unit
                    </button>
                  )}
                  {goal && (
                    <button onClick={() => handleRunAnalysis(s)} disabled={running === s.id || logs < 1}
                      title={logs < 1 ? "Log progress observations on this goal first" : undefined}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-gray-700 border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-40">
                      {running === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LineChart className="w-3.5 h-3.5" />}
                      {running === s.id ? "Analyzing…" : `Analyze progress (${logs})`}
                    </button>
                  )}
                  <button onClick={() => handleDelete(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-bold ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {analysis && (
                  <ProgressAnalysisPanel
                    analysis={analysis}
                    generating={genBusy === s.id}
                    onGenerateNext={(d) => handleGenerateNext(s, d)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unit viewer modal */}
      {viewUnit?.instructionalUnit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setViewUnit(null)}
                className="absolute right-3 top-3 z-10 p-2 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>
              <InstructionalUnitPanel content={viewUnit.instructionalUnit} onClose={() => setViewUnit(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
