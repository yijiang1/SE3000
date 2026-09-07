"use client";
// components/SurveyProfileForm.tsx — Modal form to configure the Getting-to-Know-You survey questionnaire

import { useState } from "react";
import { X, MessageCircleHeart, Plus, Trash2 } from "lucide-react";
import type { SurveyProfile } from "@/types/iep";
import { saveSurveyProfile } from "@/lib/firstDayMaterials";

interface Props {
  profile: SurveyProfile;
  onClose: () => void;
  onSaved: (profile: SurveyProfile) => void;
}

const THEME_COLORS = ["#7c3aed", "#4f46e5", "#0891b2", "#db2777", "#16a34a", "#ea580c"];

export default function SurveyProfileForm({ profile, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(profile.title || "All About Me!");
  const [introMessage, setIntroMessage] = useState(profile.introMessage || "");
  const [questions, setQuestions] = useState<string[]>(profile.questions.length > 0 ? profile.questions : [""]);
  const [theme, setTheme] = useState(profile.theme || "");
  const [themeColor, setThemeColor] = useState(profile.themeColor || THEME_COLORS[0]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateQuestion(index: number, value: string) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, ""]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanQuestions = questions.map((q) => q.trim()).filter(Boolean);
    if (cleanQuestions.length === 0) {
      setError("Please add at least one question.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const saved = await saveSurveyProfile({
        title: title.trim() || "All About Me!",
        introMessage: introMessage.trim() || undefined,
        questions: cleanQuestions,
        theme: theme.trim() || undefined,
        themeColor,
      });
      onSaved(saved);
    } catch {
      setError("Failed to save survey. Please try again.");
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
            <div className="p-2 rounded-xl bg-violet-600 text-white">
              <MessageCircleHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Getting-to-Know-You Survey</h2>
              <p className="text-xs text-slate-400">Used to generate a printable "about me" questionnaire</p>
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
              <label className="block text-xs font-bold text-gray-700 mb-1">Survey Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. All About Me!"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Theme (optional)</label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Space Explorers"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Intro Message</label>
            <input
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              placeholder="e.g. I can't wait to learn more about you! Fill this out and hand it in."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Questions <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{i + 1}.</span>
                  <input
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    placeholder="e.g. What is your favorite thing to do for fun?"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    disabled={questions.length <= 1}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none shrink-0"
                    title="Remove question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
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
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Survey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
