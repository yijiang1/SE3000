"use client";
// components/TeacherProfileForm.tsx — Modal form to create/edit the teacher's own "About Me" profile

import { useState } from "react";
import { X, Smile, Upload } from "lucide-react";
import type { TeacherProfile } from "@/types/iep";
import { saveTeacherProfile } from "@/lib/firstDayMaterials";

interface Props {
  profile: TeacherProfile;
  onClose: () => void;
  onSaved: (profile: TeacherProfile) => void;
}

const THEME_COLORS = ["#4f46e5", "#0891b2", "#db2777", "#16a34a", "#ea580c", "#7c3aed"];

export default function TeacherProfileForm({ profile, onClose, onSaved }: Props) {
  const [name, setName] = useState(profile.name);
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle);
  const [subjectsOrGrades, setSubjectsOrGrades] = useState(profile.subjectsOrGrades);
  const [yearsExperience, setYearsExperience] = useState(profile.yearsExperience || "");
  const [hobbiesInput, setHobbiesInput] = useState(profile.hobbiesAndInterests.join(", "));
  const [funFactsInput, setFunFactsInput] = useState(profile.funFacts.join("\n"));
  const [favoriteQuote, setFavoriteQuote] = useState(profile.favoriteQuote || "");
  const [teachingPhilosophy, setTeachingPhilosophy] = useState(profile.teachingPhilosophy || "");
  const [funLearningGoalForStudents, setFunLearningGoalForStudents] = useState(profile.funLearningGoalForStudents || "");
  const [contactInfo, setContactInfo] = useState(profile.contactInfo || "");
  const [themeColor, setThemeColor] = useState(profile.themeColor || THEME_COLORS[0]);
  const [photoDataUrl, setPhotoDataUrl] = useState(profile.photoDataUrl);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roleTitle.trim() || !subjectsOrGrades.trim()) {
      setError("Please fill in your name, role, and subjects/grades taught.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const saved = await saveTeacherProfile({
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        subjectsOrGrades: subjectsOrGrades.trim(),
        yearsExperience: yearsExperience.trim() || undefined,
        hobbiesAndInterests: hobbiesInput.split(",").map((s) => s.trim()).filter(Boolean),
        funFacts: funFactsInput.split("\n").map((s) => s.trim()).filter(Boolean),
        favoriteQuote: favoriteQuote.trim() || undefined,
        teachingPhilosophy: teachingPhilosophy.trim() || undefined,
        funLearningGoalForStudents: funLearningGoalForStudents.trim() || undefined,
        contactInfo: contactInfo.trim() || undefined,
        themeColor,
        photoDataUrl,
      });
      onSaved(saved);
    } catch {
      setError("Failed to save your profile. Please try again.");
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
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Your Teacher Profile</h2>
              <p className="text-xs text-slate-400">Used to generate first-day "About Me" materials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Smile className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-gray-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Upload Photo (optional)
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ms. Rivera"
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Role / Title <span className="text-red-500">*</span>
              </label>
              <input
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Special Education Resource Teacher"
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Subjects / Grades Taught <span className="text-red-500">*</span>
              </label>
              <input
                value={subjectsOrGrades}
                onChange={(e) => setSubjectsOrGrades(e.target.value)}
                placeholder="e.g. Grades 3-5 Resource Room"
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Years of Experience</label>
              <input
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="e.g. 7 years"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Hobbies & Interests (comma separated)</label>
            <input
              value={hobbiesInput}
              onChange={(e) => setHobbiesInput(e.target.value)}
              placeholder="e.g. Hiking, Baking, Board Games"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fun Facts (one per line)</label>
            <textarea
              value={funFactsInput}
              onChange={(e) => setFunFactsInput(e.target.value)}
              rows={3}
              placeholder={"I once met an astronaut\nI can solve a Rubik's cube in under a minute"}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Teaching Philosophy</label>
            <textarea
              value={teachingPhilosophy}
              onChange={(e) => setTeachingPhilosophy(e.target.value)}
              rows={2}
              placeholder="e.g. I believe every student can succeed with the right support and a little patience."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Favorite Quote</label>
            <input
              value={favoriteQuote}
              onChange={(e) => setFavoriteQuote(e.target.value)}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">What You Hope Students Take Away</label>
            <input
              value={funLearningGoalForStudents}
              onChange={(e) => setFunLearningGoalForStudents(e.target.value)}
              placeholder="e.g. To feel confident asking questions and trying new things"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Contact / Office Info</label>
            <input
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g. Room 204 · Office hours Tue/Thu 3-4pm"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
