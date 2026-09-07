"use client";
// components/IcebreakerProfileForm.tsx — Modal form to configure first-day icebreaker activity preferences

import { useState } from "react";
import { X, Users } from "lucide-react";
import { clsx } from "clsx";
import type { IcebreakerProfile } from "@/types/iep";
import { saveIcebreakerProfile } from "@/lib/firstDayMaterials";

interface Props {
  profile: IcebreakerProfile;
  onClose: () => void;
  onSaved: (profile: IcebreakerProfile) => void;
}

const THEME_COLORS = ["#db2777", "#4f46e5", "#0891b2", "#16a34a", "#ea580c", "#7c3aed"];
const GROUP_SIZE_OPTIONS = ["Whole class", "Small groups of 3-4", "Pairs", "Individual then share"];
const ACTIVITY_STYLE_OPTIONS = [
  "Get-to-know-you questions",
  "Movement games",
  "Team challenges",
  "Creative / artistic",
  "Sensory-friendly quiet activities",
];

export default function IcebreakerProfileForm({ profile, onClose, onSaved }: Props) {
  const [theme, setTheme] = useState(profile.theme || "");
  const [groupSize, setGroupSize] = useState(profile.groupSize || GROUP_SIZE_OPTIONS[0]);
  const [durationMinutes, setDurationMinutes] = useState(profile.durationMinutes || "10-15 minutes");
  const [numberOfActivities, setNumberOfActivities] = useState(profile.numberOfActivities || 3);
  const [activityStyles, setActivityStyles] = useState<string[]>(profile.activityStyles || []);
  const [specialConsiderations, setSpecialConsiderations] = useState(profile.specialConsiderations || "");
  const [additionalNotes, setAdditionalNotes] = useState(profile.additionalNotes || "");
  const [themeColor, setThemeColor] = useState(profile.themeColor || THEME_COLORS[0]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleStyle(style: string) {
    setActivityStyles((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupSize) {
      setError("Please select a group size.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const saved = await saveIcebreakerProfile({
        theme: theme.trim() || undefined,
        groupSize,
        durationMinutes: durationMinutes.trim() || undefined,
        numberOfActivities: Math.max(1, Math.min(numberOfActivities || 3, 6)),
        activityStyles,
        specialConsiderations: specialConsiderations.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
        themeColor,
      });
      onSaved(saved);
    } catch {
      setError("Failed to save icebreaker preferences. Please try again.");
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
            <div className="p-2 rounded-xl bg-pink-600 text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Icebreaker Activity Preferences</h2>
              <p className="text-xs text-slate-400">Used to generate first-day "get to know each other" materials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Theme (optional)</label>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Space Explorers, Under the Sea"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Group Size <span className="text-red-500">*</span>
              </label>
              <select
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                {GROUP_SIZE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Duration</label>
              <input
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g. 10-15 minutes"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Number of Activities</label>
            <input
              type="number"
              min={1}
              max={6}
              value={numberOfActivities}
              onChange={(e) => setNumberOfActivities(parseInt(e.target.value, 10) || 1)}
              className="w-24 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Preferred Activity Styles</label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_STYLE_OPTIONS.map((style) => {
                const isSelected = activityStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                      isSelected ? "bg-pink-600 text-white border-pink-600 shadow-2xs" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Special Considerations</label>
            <textarea
              value={specialConsiderations}
              onChange={(e) => setSpecialConsiderations(e.target.value)}
              rows={2}
              placeholder="e.g. Avoid loud noises, offer a quiet-corner alternative for sensory-sensitive students"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
              placeholder="Optional — anything else you'd like included"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
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
              className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
