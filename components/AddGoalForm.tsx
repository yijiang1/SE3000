"use client";
// components/AddGoalForm.tsx — Modal form to add an IEP goal to a student

import { useState } from "react";
import { X, Target } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import type { StudentIEPProfile, IEPGoal, GoalCategory, MeasurementUnit } from "@/types/iep";

interface Props {
  profile: StudentIEPProfile;
  onClose: () => void;
  onGoalAdded: () => void;
}

const CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: "academic", label: "Academic" },
  { value: "behavioral", label: "Behavioral" },
  { value: "social_emotional", label: "Social/Emotional" },
  { value: "communication", label: "Communication" },
  { value: "motor", label: "Motor" },
];

const UNITS: { value: MeasurementUnit; label: string }[] = [
  { value: "%", label: "Percentage (%)" },
  { value: "count", label: "Count (number of occurrences)" },
  { value: "minutes", label: "Minutes" },
  { value: "trials", label: "Trials (out of N)" },
  { value: "rating_scale", label: "Rating Scale (1–5)" },
  { value: "frequency", label: "Frequency (per session)" },
];

export default function AddGoalForm({ profile, onClose, onGoalAdded }: Props) {
  const [goalText, setGoalText] = useState("");
  const [category, setCategory] = useState<GoalCategory>("academic");
  const [unit, setUnit] = useState<MeasurementUnit>("%");
  const [baseline, setBaseline] = useState("");
  const [target, setTarget] = useState("");
  const [trialsDenom, setTrialsDenom] = useState("");
  const [reviewDate, setReviewDate] = useState(profile.iepAnnualReviewDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const bVal = parseFloat(baseline);
    const tVal = parseFloat(target);
    if (!goalText.trim()) { setError("Goal text is required."); return; }
    if (isNaN(bVal) || isNaN(tVal)) { setError("Baseline and target must be numbers."); return; }
    setSaving(true);
    setError("");
    const now = new Date().toISOString();
    const newGoal: IEPGoal = {
      id: uuidv4(),
      goalText: goalText.trim(),
      category,
      baselineValue: bVal,
      targetValue: tVal,
      measurementUnit: unit,
      trialsDenominator: unit === "trials" && trialsDenom ? parseInt(trialsDenom) : undefined,
      reviewDate,
      createdAt: now,
    };
    try {
      const updated: StudentIEPProfile = {
        ...profile,
        goals: [...profile.goals, newGoal],
        updatedAt: now,
      };
      await db.profiles.put(updated);
      onGoalAdded();
    } catch {
      setError("Failed to save goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Add Goal — {profile.studentInitials}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Statement <span className="text-red-500">*</span>
            </label>
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              rows={3}
              placeholder="e.g. Will complete independent reading tasks with 80% accuracy in 4/5 trials…"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baseline Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
                placeholder="e.g. 55"
                required
                step="any"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. 80"
                required
                step="any"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {unit === "trials" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Trials (N)</label>
              <input
                type="number"
                value={trialsDenom}
                onChange={(e) => setTrialsDenom(e.target.value)}
                placeholder="e.g. 5"
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
            <input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
