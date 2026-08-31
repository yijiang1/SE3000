"use client";
// components/ProgressSummary.tsx — Plain-language progress report generator

import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";
import type { StudentIEPProfile, ProgressLogEntry } from "@/types/iep";
import { generateGoalSummary } from "@/lib/summary";

interface Props {
  profile: StudentIEPProfile;
  allLogs: ProgressLogEntry[];
  onClose: () => void;
}

export default function ProgressSummary({ profile, allLogs, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const paragraphs = profile.goals.map((goal) => {
    const entries = allLogs.filter((l) => l.goalId === goal.id);
    return generateGoalSummary(profile, goal, entries);
  });

  const fullText = paragraphs.join("\n\n");

  async function handleCopy() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Progress Report — {profile.studentInitials}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy All"}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ This summary uses placeholder data only. Do not use for official IEP documentation with real student information.
          </p>
          {paragraphs.map((para, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                Goal {i + 1} — {profile.goals[i].category.replace("_", "/")}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{para}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
