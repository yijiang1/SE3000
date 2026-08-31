"use client";
// components/StudentHeader.tsx — Student overview banner with expanded Learning Profile

import { useState } from "react";
import {
  GraduationCap,
  CalendarDays,
  ChevronRight,
  Heart,
  Sparkles,
  BookOpen,
  Eye,
  Activity,
  Volume2
} from "lucide-react";
import type { StudentIEPProfile } from "@/types/iep";
import { clsx } from "clsx";

interface Props {
  profile: StudentIEPProfile;
  showPlaafp?: boolean;
  onTogglePlaafp?: () => void;
  onOpenGenerator?: () => void;
}

const ELIGIBILITY_COLORS: Record<string, string> = {
  SLD: "bg-blue-100 text-blue-800 border-blue-200",
  Autism: "bg-purple-100 text-purple-800 border-purple-200",
  OHI: "bg-amber-100 text-amber-800 border-amber-200",
  EBD: "bg-red-100 text-red-800 border-red-200",
};

function getColor(elig: string) {
  for (const key of Object.keys(ELIGIBILITY_COLORS)) {
    if (elig.includes(key)) return ELIGIBILITY_COLORS[key];
  }
  return "bg-gray-100 text-gray-800 border-gray-200";
}

export default function StudentHeader({
  profile,
  showPlaafp = false,
  onTogglePlaafp,
  onOpenGenerator
}: Props) {
  const [showLearningProfile, setShowLearningProfile] = useState(false);

  const reviewDate = new Date(profile.iepAnnualReviewDate + "T12:00:00");
  const today = new Date();
  const daysUntilReview = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const reviewUrgent = daysUntilReview <= 30;

  const initials = profile.studentInitials;
  const avatarColors = [
    "bg-gradient-to-tr from-indigo-600 to-indigo-500",
    "bg-gradient-to-tr from-emerald-600 to-teal-500",
    "bg-gradient-to-tr from-amber-600 to-orange-500",
    "bg-gradient-to-tr from-rose-600 to-pink-500",
    "bg-gradient-to-tr from-purple-600 to-violet-500"
  ];
  const avatarColor = avatarColors[initials.charCodeAt(0) % avatarColors.length];
  const lp = profile.learningProfile;

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          {/* Student Initials Avatar */}
          <div
            className={clsx(
              "w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-md",
              avatarColor
            )}
          >
            {initials}
          </div>

          {/* Student Info */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900">{initials}</h2>
              <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-indigo-600" /> Grade {profile.grade}
              </span>
              <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold border", getColor(profile.primaryEligibility))}>
                {profile.primaryEligibility}
              </span>
            </div>

            <div
              className={clsx(
                "inline-flex items-center gap-1.5 text-xs font-semibold",
                reviewUrgent ? "text-red-600" : "text-gray-500"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Annual IEP Review:{" "}
              <span className="font-bold">
                {reviewDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              {reviewUrgent && (
                <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-black">
                  Due in {daysUntilReview}d
                </span>
              )}
            </div>

            {/* Quick Learning Profile Tags */}
            {lp && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {lp.readingLevel.split("(")[0].trim()}
                </span>
                {lp.interests?.slice(0, 3).map((interest, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1"
                  >
                    <Heart className="w-3 h-3 text-purple-500 fill-purple-400/40" /> {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onOpenGenerator && (
            <button
              onClick={onOpenGenerator}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Materials Hub</span>
            </button>
          )}

          <div className="text-right hidden md:block pl-3 border-l border-gray-200">
            <div className="text-2xl font-black text-indigo-600">{profile.goals.length}</div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">IEP Goals</div>
          </div>
        </div>
      </div>

      {/* ─── Expandable Details: PLAAFP & Learning Profile ──────── */}
      <div className="pt-2 flex flex-wrap items-center gap-4 border-t border-gray-100">
        <button
          onClick={() => setShowLearningProfile(!showLearningProfile)}
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
        >
          <ChevronRight className={clsx("w-3.5 h-3.5 transition-transform", showLearningProfile && "rotate-90")} />
          <span>{showLearningProfile ? "Hide Learning Profile" : "View Full Learning Profile"}</span>
        </button>

        <button
          onClick={onTogglePlaafp}
          className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-800"
        >
          <ChevronRight className={clsx("w-3.5 h-3.5 transition-transform", showPlaafp && "rotate-90")} />
          <span>{showPlaafp ? "Hide PLAAFP" : "View PLAAFP Summary"}</span>
        </button>
      </div>

      {/* Expanded Learning Profile Panel */}
      {showLearningProfile && lp && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Materials Conditioning Profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-white/80 p-3.5 rounded-xl border border-indigo-100">
              <span className="font-bold text-gray-700 block">📚 Reading & Comprehension:</span>
              <p className="text-gray-600">
                <strong>Reading:</strong> {lp.readingLevel}
              </p>
              <p className="text-gray-600">
                <strong>Comprehension:</strong> {lp.comprehensionLevel}
              </p>
            </div>

            <div className="space-y-2 bg-white/80 p-3.5 rounded-xl border border-indigo-100">
              <span className="font-bold text-gray-700 block">💬 Communication & Modality:</span>
              <p className="text-gray-600">
                <strong>Supports:</strong> {lp.communicationNeeds?.join(", ") || "Standard verbal"}
              </p>
              <p className="text-gray-600">
                <strong>Modalities:</strong> {lp.preferredModality?.join(", ") || "Visual, Hands-on"}
              </p>
            </div>

            <div className="space-y-2 bg-white/80 p-3.5 rounded-xl border border-indigo-100">
              <span className="font-bold text-gray-700 block">🎧 Sensory Considerations:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {lp.sensoryConsiderations?.length > 0 ? (
                  lp.sensoryConsiderations.map((sc, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-medium text-[11px]">
                      {sc.replace("_", " ")}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">None specified</span>
                )}
              </div>
            </div>

            <div className="space-y-2 bg-white/80 p-3.5 rounded-xl border border-indigo-100">
              <span className="font-bold text-gray-700 block">❤️ Interests & Motivators:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {lp.interests?.map((item, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold text-[11px]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {lp.additionalNotes && (
            <p className="text-xs text-indigo-900 bg-white/80 p-3 rounded-xl border border-indigo-100">
              <strong>Teacher Note:</strong> {lp.additionalNotes}
            </p>
          )}
        </div>
      )}

      {/* Expanded PLAAFP Summary */}
      {showPlaafp && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-gray-700 leading-relaxed animate-in fade-in duration-200">
          <strong className="block font-bold text-gray-900 mb-1">Present Levels of Performance (PLAAFP):</strong>
          {profile.plaafpSummary}
        </div>
      )}
    </div>
  );
}
