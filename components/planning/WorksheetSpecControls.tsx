"use client";
// components/planning/WorksheetSpecControls.tsx — the teacher-facing knobs for worksheet generation
// (number of questions, difficulty, question type, reading level, scaffolding,
//  answer key, visual supports, modified problems, printable)

import { clsx } from "clsx";
import type {
  WorksheetSpec,
  WorksheetPurpose,
  WorksheetQuestionType,
  ScaffoldingLevel
} from "@/types/iep";

interface Props {
  spec: WorksheetSpec;
  onChange: (next: WorksheetSpec) => void;
}

const PURPOSES: { id: WorksheetPurpose; label: string }[] = [
  { id: "practice", label: "Practice" },
  { id: "guided_practice", label: "Guided Practice" },
  { id: "independent_practice", label: "Independent Practice" },
  { id: "homework", label: "Homework" },
  { id: "exit_ticket", label: "Exit Ticket" },
  { id: "quiz", label: "Quiz" },
  { id: "progress_monitoring", label: "Progress-Monitoring" },
  { id: "review", label: "Review Activity" },
];

const QTYPES: { id: WorksheetQuestionType; label: string }[] = [
  { id: "mixed", label: "Mixed" },
  { id: "multiple_choice", label: "Multiple choice" },
  { id: "short_answer", label: "Short answer" },
  { id: "fill_in_blank", label: "Fill in the blank" },
  { id: "matching", label: "Matching" },
  { id: "word_problem", label: "Word problems" },
];

const SCAFFOLDS: { id: ScaffoldingLevel; label: string }[] = [
  { id: "none", label: "None" },
  { id: "light", label: "Light" },
  { id: "moderate", label: "Moderate" },
  { id: "heavy", label: "Heavy" },
];

export function defaultWorksheetSpec(readingLevel: string): WorksheetSpec {
  return {
    purpose: "practice",
    numQuestions: 8,
    difficultyLevel: 2,
    questionType: "mixed",
    readingLevel: readingLevel || "Grade level",
    scaffolding: "moderate",
    includeAnswerKey: true,
    includeVisualSupports: true,
    modifiedProblems: false,
    printable: true,
  };
}

export default function WorksheetSpecControls({ spec, onChange }: Props) {
  const set = (patch: Partial<WorksheetSpec>) => onChange({ ...spec, ...patch });

  return (
    <div className="space-y-4">
      {/* Purpose */}
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Material type</label>
        <div className="flex flex-wrap gap-1.5">
          {PURPOSES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => set({ purpose: p.id })}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                spec.purpose === p.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Number of questions */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
            Number of questions: <span className="text-indigo-600">{spec.numQuestions}</span>
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={spec.numQuestions}
            onChange={(e) => set({ numQuestions: parseInt(e.target.value, 10) })}
            className="w-full accent-indigo-600"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
            Difficulty: <span className="text-indigo-600">{spec.difficultyLevel}/5</span>
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set({ difficultyLevel: d })}
                className={clsx(
                  "flex-1 py-1.5 rounded-lg text-xs font-bold border",
                  spec.difficultyLevel === d
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Question type */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Question type</label>
          <select
            value={spec.questionType}
            onChange={(e) => set({ questionType: e.target.value as WorksheetQuestionType })}
            className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {QTYPES.map((q) => (
              <option key={q.id} value={q.id}>{q.label}</option>
            ))}
          </select>
        </div>

        {/* Reading level */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Reading level</label>
          <input
            type="text"
            value={spec.readingLevel}
            onChange={(e) => set({ readingLevel: e.target.value })}
            placeholder="e.g. Early 2nd grade"
            className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Scaffolding */}
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Amount of scaffolding</label>
        <div className="flex gap-1.5">
          {SCAFFOLDS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => set({ scaffolding: s.id })}
              className={clsx(
                "flex-1 py-1.5 rounded-lg text-xs font-bold border",
                spec.scaffolding === s.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2">
        {([
          ["includeAnswerKey", "Answer key"],
          ["includeVisualSupports", "Visual supports"],
          ["modifiedProblems", "Modified / reduced complexity"],
          ["printable", "Printable layout"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => set({ [key]: !spec[key] } as Partial<WorksheetSpec>)}
            className={clsx(
              "px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all flex items-center gap-2",
              spec[key]
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-white text-gray-500 border-gray-200"
            )}
          >
            <span
              className={clsx(
                "w-4 h-4 rounded border flex items-center justify-center text-[10px]",
                spec[key] ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300"
              )}
            >
              {spec[key] ? "✓" : ""}
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
