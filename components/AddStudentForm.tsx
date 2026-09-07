"use client";
// components/AddStudentForm.tsx — Modal form to create a new student with expanded Learning Profile

import Dialog from "@/components/Dialog";
import { useState } from "react";
import { X, UserPlus, Sparkles, BookOpen, Heart, Activity } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import type {
  StudentIEPProfile,
  CommunicationNeed,
  SensoryConsideration,
  LearningModality
} from "@/types/iep";
import { clsx } from "clsx";

interface Props {
  onClose: () => void;
  initialProfile?: StudentIEPProfile;
  onCreated: (profile: StudentIEPProfile) => void;
}

const COMMUNICATION_OPTIONS: { id: CommunicationNeed; label: string }[] = [
  { id: "verbal", label: "Verbal / Spoken" },
  { id: "visual_supports", label: "Visual Supports / Storyboards" },
  { id: "aac_device", label: "AAC Speech Device" },
  { id: "picture_exchange", label: "PECS / Picture Exchange" },
  { id: "limited_verbal", label: "Limited Verbal" },
  { id: "sign_language", label: "Sign Language (ASL)" },
  { id: "nonverbal", label: "Nonverbal" },
];

const SENSORY_OPTIONS: { id: SensoryConsideration; label: string }[] = [
  { id: "sound_sensitivity", label: "Sound / Noise Sensitive" },
  { id: "light_sensitivity", label: "Light / Glare Sensitive" },
  { id: "fidget_needs", label: "Fidget / Motor Needs" },
  { id: "movement_seeking", label: "Movement Seeking" },
  { id: "calm_environment", label: "Calm Environment Required" },
  { id: "minimal_visual_clutter", label: "Minimal Visual Clutter" },
  { id: "tactile_sensitivity", label: "Tactile Sensitive" },
];

const MODALITY_OPTIONS: { id: LearningModality; label: string }[] = [
  { id: "visual", label: "Visual" },
  { id: "hands_on", label: "Hands-on" },
  { id: "kinesthetic", label: "Kinesthetic" },
  { id: "auditory", label: "Auditory" },
  { id: "reading_writing", label: "Reading & Writing" },
  { id: "social", label: "Social / Peer" },
  { id: "solitary", label: "Solitary / Independent" },
];

export default function AddStudentForm({ onClose, onCreated, initialProfile }: Props) {
  const [activeTab, setActiveTab] = useState<"general" | "learning">("general");

  // General Fields
  const [initials, setInitials] = useState(initialProfile?.studentInitials ?? "");
  const [grade, setGrade] = useState(initialProfile?.grade ?? "");
  const [eligibility, setEligibility] = useState(initialProfile?.primaryEligibility ?? "");
  const [reviewDate, setReviewDate] = useState(initialProfile?.iepAnnualReviewDate ?? "");
  const [plaafp, setPlaafp] = useState(initialProfile?.plaafpSummary ?? "");

  // Learning Profile Fields
  const [readingLevel, setReadingLevel] = useState(initialProfile?.learningProfile?.readingLevel ?? "");
  const [comprehensionLevel, setComprehensionLevel] = useState(initialProfile?.learningProfile?.comprehensionLevel ?? "");
  const [selectedCommunication, setSelectedCommunication] = useState<CommunicationNeed[]>(initialProfile?.learningProfile?.communicationNeeds ?? []);
  const [selectedSensory, setSelectedSensory] = useState<SensoryConsideration[]>(initialProfile?.learningProfile?.sensoryConsiderations ?? []);
  const [interestsInput, setInterestsInput] = useState(initialProfile?.learningProfile?.interests.join(", ") ?? "");
  const [selectedModalities, setSelectedModalities] = useState<LearningModality[]>(initialProfile?.learningProfile?.preferredModality ?? []);
  const [additionalNotes, setAdditionalNotes] = useState(initialProfile?.learningProfile?.additionalNotes ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleArrayItem<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initials.trim() || !grade.trim() || !eligibility.trim() || !reviewDate) {
      setError("Please complete all required fields on the General tab.");
      setActiveTab("general");
      return;
    }

    setSaving(true);
    setError("");

    const interestsList = interestsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const now = new Date().toISOString();
    const profile: StudentIEPProfile = {
      id: initialProfile?.id ?? uuidv4(),
      studentInitials: initials.toUpperCase().slice(0, 4),
      grade,
      primaryEligibility: eligibility,
      iepAnnualReviewDate: reviewDate,
      plaafpSummary: plaafp || "No PLAAFP summary provided.",
      learningProfile: {
        readingLevel: readingLevel.trim(),
        comprehensionLevel: comprehensionLevel.trim(),
        communicationNeeds: selectedCommunication,
        sensoryConsiderations: selectedSensory,
        interests: interestsList,
        preferredModality: selectedModalities,
        additionalNotes: additionalNotes.trim() || undefined,
      },
      goals: [],
      services: [],
      accommodations: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.transaction("rw", db.profiles, async () => {
        if (initialProfile) {
          const current = await db.profiles.get(initialProfile.id);
          if (!current) throw new Error("Student no longer exists.");
          Object.assign(profile, {goals:current.goals,services:current.services,accommodations:current.accommodations,createdAt:current.createdAt});
          await db.profiles.put(profile);
        } else await db.profiles.add(profile);
      });
      onCreated(profile);
    } catch {
      setError("Failed to save student profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog onClose={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{initialProfile ? "Edit Student Profile" : "Add Student Profile"}</h2>
              <p className="text-xs text-slate-400">SE 3000 Individualized Learning Record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={clsx(
              "px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "general"
                ? "bg-white border-indigo-600 text-indigo-600 shadow-2xs"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            <BookOpen className="w-4 h-4" /> 1. IEP Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("learning")}
            className={clsx(
              "px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "learning"
                ? "bg-white border-indigo-600 text-indigo-600 shadow-2xs"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> 2. AI Learning Profile
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          {activeTab === "general" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Student Initials <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={initials}
                    onChange={(e) => setInitials(e.target.value)}
                    placeholder="e.g. JD"
                    maxLength={4}
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Initials only — no real names</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">Select Grade…</option>
                    {["Pre-K", "K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Primary Eligibility <span className="text-red-500">*</span>
                </label>
                <select
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">Select Primary Eligibility…</option>
                  {[
                    "Specific Learning Disability (SLD)",
                    "Autism Spectrum Disorder (ASD)",
                    "Other Health Impairment (OHI)",
                    "Emotional/Behavioral Disorder (EBD)",
                    "Developmental Delay (DD)",
                    "Speech/Language Impairment (SLI)",
                    "Intellectual Disability (ID)",
                    "Multiple Disabilities",
                    "Orthopedic Impairment",
                    "Traumatic Brain Injury (TBI)",
                    "Visual Impairment",
                    "Hearing Impairment",
                  ].map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  IEP Annual Review Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">PLAAFP Narrative Summary</label>
                <textarea
                  value={plaafp}
                  onChange={(e) => setPlaafp(e.target.value)}
                  rows={3}
                  placeholder="Present levels of academic achievement and functional performance..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Reading / Decoding Level</label>
                  <input
                    value={readingLevel}
                    onChange={(e) => setReadingLevel(e.target.value)}
                    placeholder="e.g. Early 2nd Grade, Pre-reader"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Comprehension Level</label>
                  <input
                    value={comprehensionLevel}
                    onChange={(e) => setComprehensionLevel(e.target.value)}
                    placeholder="e.g. Responds to 2-step visual cues"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Interests & Motivators (Comma separated):
                </label>
                <input
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  placeholder="e.g. Dinosaurs, Minecraft, Space Exploration, Train Schedules"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <p className="text-[10px] text-purple-700 mt-1">
                  ✨ Used by Gemini & Lyria to theme all generated materials around the student&apos;s passions.
                </p>
              </div>

              {/* Communication Supports */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Communication Supports Needed:</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMUNICATION_OPTIONS.map((c) => {
                    const isSelected = selectedCommunication.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCommunication(toggleArrayItem(selectedCommunication, c.id))}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sensory Considerations */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Sensory Considerations:</label>
                <div className="flex flex-wrap gap-1.5">
                  {SENSORY_OPTIONS.map((s) => {
                    const isSelected = selectedSensory.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSensory(toggleArrayItem(selectedSensory, s.id))}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                          isSelected
                            ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Modalities */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Preferred Learning Modalities:</label>
                <div className="flex flex-wrap gap-1.5">
                  {MODALITY_OPTIONS.map((m) => {
                    const isSelected = selectedModalities.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModalities(toggleArrayItem(selectedModalities, m.id))}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                          isSelected
                            ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Additional Teaching Notes:</label>
                <input
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Needs high contrast visuals, positive praise every 3 trials"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              {activeTab === "general" ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("learning")}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-xl"
                >
                  Next: Learning Profile →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold rounded-xl"
                >
                  ← Back
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Student Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
