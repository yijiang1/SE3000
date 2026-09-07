"use client";
// components/ClassroomProfileForm.tsx — Modal form to create/edit classroom rules, routines & expectations

import { useState } from "react";
import { X, ClipboardList } from "lucide-react";
import type { ClassroomProfile } from "@/types/iep";
import { saveClassroomProfile } from "@/lib/firstDayMaterials";

interface Props {
  profile: ClassroomProfile;
  onClose: () => void;
  onSaved: (profile: ClassroomProfile) => void;
}

const THEME_COLORS = ["#0891b2", "#4f46e5", "#db2777", "#16a34a", "#ea580c", "#7c3aed"];

export default function ClassroomProfileForm({ profile, onClose, onSaved }: Props) {
  const [classroomName, setClassroomName] = useState(profile.classroomName || "");
  const [theme, setTheme] = useState(profile.theme || "");
  const [rulesInput, setRulesInput] = useState(profile.rules.join("\n"));
  const [routinesInput, setRoutinesInput] = useState(profile.routines.join("\n"));
  const [rewardsSystem, setRewardsSystem] = useState(profile.rewardsSystem || "");
  const [consequencesSystem, setConsequencesSystem] = useState(profile.consequencesSystem || "");
  const [additionalNotes, setAdditionalNotes] = useState(profile.additionalNotes || "");
  const [themeColor, setThemeColor] = useState(profile.themeColor || THEME_COLORS[0]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rules = rulesInput.split("\n").map((s) => s.trim()).filter(Boolean);
    const routines = routinesInput.split("\n").map((s) => s.trim()).filter(Boolean);

    if (rules.length === 0 && routines.length === 0) {
      setError("Please add at least one rule or routine.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const saved = await saveClassroomProfile({
        classroomName: classroomName.trim() || undefined,
        theme: theme.trim() || undefined,
        rules,
        routines,
        rewardsSystem: rewardsSystem.trim() || undefined,
        consequencesSystem: consequencesSystem.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
        themeColor,
      });
      onSaved(saved);
    } catch {
      setError("Failed to save classroom profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Classroom Rules & Routines</h2>
              <p className="text-xs text-slate-400">Used to generate first-day "How Our Classroom Works" materials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Classroom Name</label>
              <input
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                placeholder="e.g. Room 204"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Classroom Theme</label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Space Explorer Classroom"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Classroom Rules <span className="text-red-500">*</span> (one per line)
            </label>
            <textarea
              value={rulesInput}
              onChange={(e) => setRulesInput(e.target.value)}
              rows={4}
              placeholder={"Be respectful\nBe responsible\nBe safe\nTry your best"}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Daily Routines & Procedures <span className="text-red-500">*</span> (one per line)
            </label>
            <textarea
              value={routinesInput}
              onChange={(e) => setRoutinesInput(e.target.value)}
              rows={4}
              placeholder={"Morning check-in at the door\nRaise a hand to ask for help\nLine up quietly for lunch"}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Rewards System</label>
            <input
              value={rewardsSystem}
              onChange={(e) => setRewardsSystem(e.target.value)}
              placeholder="e.g. Class points redeemable for a Friday game"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Consequences System</label>
            <input
              value={consequencesSystem}
              onChange={(e) => setConsequencesSystem(e.target.value)}
              placeholder="e.g. Verbal reminder → visual warning → brief break → parent contact"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
              placeholder="Optional — anything else specific to your classroom"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Theme Color</label>
            <div className="flex gap-2">
              {THEME_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setThemeColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition-all ${
                    themeColor === c ? "ring-4 ring-offset-2 ring-gray-300 scale-105" : ""
                  }`}
                  title={c}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Classroom Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
