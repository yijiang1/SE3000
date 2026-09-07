"use client";
// components/GoalCard.tsx — Interactive goal tracking card with SE 3000 AI Generator trigger

import { compareObservations, validateValue } from "@/lib/goalValidation";
import { validDate } from "@/lib/dates";
import { localDate } from "@/lib/dates";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Sparkles,
  Layers
} from "lucide-react";
import { clsx } from "clsx";
import type { IEPGoal, ProgressLogEntry, TrendResult } from "@/types/iep";
import ProgressChart from "./ProgressChart";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface Props {
  profileId: string;
  goal: IEPGoal;
  entries: ProgressLogEntry[];
  trend: TrendResult;
  materialsCount?: number;
  onLogAdded: () => void;
  onOpenGenerator?: (goal: IEPGoal) => void;
  onViewMaterials?: (goal: IEPGoal) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  academic: "Academic",
  behavioral: "Behavioral",
  social_emotional: "Social/Emotional",
  communication: "Communication",
  motor: "Motor",
};

const CATEGORY_COLORS: Record<string, string> = {
  academic: "bg-blue-100 text-blue-800 border-blue-200",
  behavioral: "bg-amber-100 text-amber-800 border-amber-200",
  social_emotional: "bg-purple-100 text-purple-800 border-purple-200",
  communication: "bg-emerald-100 text-emerald-800 border-emerald-200",
  motor: "bg-red-100 text-red-800 border-red-200",
};

const UNIT_LABELS: Record<string, string> = {
  "%": "%",
  count: "count",
  minutes: "min",
  trials: "trials",
  rating_scale: "/ 5",
  frequency: "per session",
};

function TrendBadge({ trend }: { trend: TrendResult }) {
  if (trend.status === "no_data") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
        <Minus className="w-3 h-3" /> No Data
      </span>
    );
  }
  if (trend.status === "on_track") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <TrendingUp className="w-3 h-3" /> On Track
      </span>
    );
  }
  if (trend.status === "at_risk") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3 h-3" /> At Risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
      <TrendingDown className="w-3 h-3" /> Off Track
    </span>
  );
}

export default function GoalCard({
  profileId,
  goal,
  entries,
  trend,
  materialsCount = 0,
  onLogAdded,
  onOpenGenerator,
  onViewMaterials
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(localDate());
  const [logValue, setLogValue] = useState("");
  const [logNote, setLogNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const unit = UNIT_LABELS[goal.measurementUnit] ?? goal.measurementUnit;
  const pct = trend.percentToTarget !== null ? Math.max(0, Math.min(100, trend.percentToTarget)) : 0;

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(logValue);
    const invalid = validateValue(goal, val) || (!validDate(logDate) ? "Enter a valid observation date." : null);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await db.progressLogs.put({
        id: editingId ?? uuidv4(),
        profileId,
        goalId: goal.id,
        date: logDate,
        value: val,
        note: logNote || undefined,
        createdAt: new Date().toISOString(),
      });
      setEditingId(null);
      setLogValue("");
      setLogNote("");
      setLogOpen(false);
      onLogAdded();
    } catch {
      setError("Failed to save observation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const latestEntry =
    entries.length > 0 ? entries.reduce((a, b) => (compareObservations(a, b) >= 0 ? a : b)) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
      {/* ─── Card Header ─────────────────────────────────────────── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-extrabold border", CATEGORY_COLORS[goal.category])}>
              {CATEGORY_LABELS[goal.category]}
            </span>
            <TrendBadge trend={trend} />

            {materialsCount > 0 && (
              <button
                onClick={() => onViewMaterials?.(goal)}
                className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 transition-colors"
                title="View generated teaching materials for this goal"
              >
                <Layers className="w-3 h-3 text-indigo-600" />
                <span>{materialsCount} Assets</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onOpenGenerator && (
              <button
                onClick={() => onOpenGenerator(goal)}
                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200/60"
                title="Generate Teaching Materials with AI for this Goal"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Generator</span>
              </button>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
              aria-label={expanded ? "Collapse card" : "Expand card"}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className={clsx("text-sm text-gray-800 font-medium leading-snug", !expanded && "line-clamp-2")}>
          {goal.goalText}
        </p>

        {/* Progress Bar and Criteria */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-1.5 text-xs">
            <span className="text-gray-500">
              Baseline: <strong className="text-gray-900">{goal.baselineValue}{unit}</strong>
            </span>
            <span className="text-gray-500">
              Latest:{" "}
              <strong className="text-gray-900 font-extrabold">
                {latestEntry !== null ? `${latestEntry.value}${unit}` : "—"}
              </strong>
            </span>
            <span className="text-gray-500">
              Target: <strong className="text-indigo-600 font-black">{goal.targetValue}{unit}</strong>
            </span>
          </div>

          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full transition-all duration-500",
                trend.status === "on_track"
                  ? "bg-emerald-500"
                  : trend.status === "at_risk"
                  ? "bg-amber-400"
                  : trend.status === "off_track"
                  ? "bg-rose-500"
                  : "bg-gray-300"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex justify-between mt-1.5 text-[11px] text-gray-400 font-medium">
            <span>{pct}% toward mastery</span>
            <span>
              Review:{" "}
              {new Date(goal.reviewDate + "T12:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Expanded View (Chart & Observations) ───────────────── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-slate-50/50">
          <div className="px-5 pt-3 pb-2">
            {entries.length >= 2 ? (
              <ProgressChart goal={goal} entries={entries} height={160} />
            ) : (
              <div className="h-20 flex items-center justify-center text-gray-400 text-xs italic">
                Log at least 2 observations to view the trend chart
              </div>
            )}
          </div>

          {/* Recent Observations */}
          {entries.length > 0 && (
            <div className="px-5 pb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Recent Observations
              </p>
              <div className="space-y-1.5">
                {[...entries]
                  .sort((a, b) => compareObservations(b, a))
                  .slice(0, 4)
                  .map((e) => (
                    <div key={e.id} className="flex items-start gap-2 text-xs bg-white p-2 rounded-lg border border-gray-200/80 shadow-2xs">
                      <span className="text-gray-400 shrink-0 font-mono">
                        {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-extrabold text-gray-900">{e.value}{unit}</span>
                      {e.note && <span className="text-gray-600 truncate">{e.note}</span>}
                      <button className="text-indigo-700" onClick={() => {setEditingId(e.id);setLogDate(e.date);setLogValue(String(e.value));setLogNote(e.note ?? "");setLogOpen(true);}}>Correct</button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Linear Regression Projection */}
          {trend.projectedValue !== null && (
            <div className="mx-5 mb-3 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
              <strong className="font-bold">Projected Trajectory: </strong> At current rate, projected value at review date is{" "}
              <strong className="font-black text-indigo-700">{trend.projectedValue}{unit}</strong> (Target: {goal.targetValue}{unit}).
            </div>
          )}
        </div>
      )}

      {/* ─── Log Observation Action Footer ──────────────────────── */}
      <div className="border-t border-gray-100 px-5 py-3.5 bg-gray-50/40">
        {!logOpen ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLogOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Observation</span>
            </button>

            {onOpenGenerator && (
              <button
                onClick={() => onOpenGenerator(goal)}
                className="text-xs text-purple-700 hover:text-purple-800 font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Generate Materials</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveLog} className="space-y-2.5">
            <p className="text-xs font-bold text-gray-700">New Observation Entry</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-gray-500 block mb-0.5 font-medium">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="w-28">
                <label className="text-[11px] text-gray-500 block mb-0.5 font-medium">Value ({unit})</label>
                <input
                  type="number"
                  value={logValue}
                  onChange={(e) => setLogValue(e.target.value)}
                  placeholder={`e.g. ${goal.targetValue}`}
                  required
                  step="any"
                  className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-0.5 font-medium">Observation Note (Optional)</label>
              <input
                type="text"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="Observed strategy, prompts needed..."
                className="w-full border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Observation"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogOpen(false);
                  setError("");
                }}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
