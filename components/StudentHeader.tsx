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
  ClipboardList,
  CalendarClock,
  MapPin,
  Mail,
  LayoutGrid,
  List
} from "lucide-react";
import type { StudentIEPProfile } from "@/types/iep";
import { clsx } from "clsx";

interface Props {
  profile: StudentIEPProfile;
  showPlaafp?: boolean;
  onTogglePlaafp?: () => void;
  onOpenGenerator?: () => void;
  onOpenPlanning?: () => void;
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
  onOpenGenerator,
  onOpenPlanning
}: Props) {
  const [showLearningProfile, setShowLearningProfile] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleLayout, setScheduleLayout] = useState<"row" | "list">("list");

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
  const schedule = profile.schoolSchedule ?? [];
  const scheduleByPeriod = new Map(schedule.map((item) => [item.period, item]));
  const scheduleSlots = Array.from({ length: 8 }, (_, index) => scheduleByPeriod.get(index + 1) ?? {
    period: index + 1,
    subjectName: "",
    teacherName: "",
    coTeacherName: "",
    time: "",
    classroomLocation: "",
    teacherContactInfo: "",
  });
  const populatedSchedule = schedule.filter((item) =>
    item.subjectName || item.teacherName || item.coTeacherName || item.time || item.classroomLocation || item.teacherContactInfo
  );

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
          {onOpenPlanning && (
            <button
              onClick={onOpenPlanning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Planning Assistant</span>
            </button>
          )}

          {onOpenGenerator && (
            <button
              onClick={onOpenGenerator}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
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

        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800"
        >
          <ChevronRight className={clsx("w-3.5 h-3.5 transition-transform", showSchedule && "rotate-90")} />
          <span>{showSchedule ? "Hide School Schedule" : "View School Schedule"}</span>
        </button>
      </div>

      {showSchedule && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 animate-in fade-in duration-200">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-violet-900">
              <CalendarClock className="h-4 w-4 text-violet-600" />
              <span>Eight-period school schedule</span>
            </div>
            <div className="inline-flex w-fit rounded-xl border border-violet-200 bg-white p-1" role="group" aria-label="Schedule layout">
              <button
                type="button"
                onClick={() => setScheduleLayout("row")}
                aria-pressed={scheduleLayout === "row"}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors",
                  scheduleLayout === "row" ? "bg-violet-600 text-white" : "text-violet-700 hover:bg-violet-50"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> 8-column row
              </button>
              <button
                type="button"
                onClick={() => setScheduleLayout("list")}
                aria-pressed={scheduleLayout === "list"}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors",
                  scheduleLayout === "list" ? "bg-violet-600 text-white" : "text-violet-700 hover:bg-violet-50"
                )}
              >
                <List className="h-3.5 w-3.5" /> 8-row list
              </button>
            </div>
          </div>
          {populatedSchedule.length === 0 ? (
            <p className="rounded-xl border border-dashed border-violet-200 bg-white/70 p-4 text-center text-xs text-gray-500">
              No classes have been added yet. Use Edit student profile to enter the schedule.
            </p>
          ) : (
            <div className={clsx(scheduleLayout === "row" && "overflow-x-auto pb-2")}>
              <div className={clsx(
                "grid gap-2",
                scheduleLayout === "row" ? "w-full min-w-[80rem] grid-cols-8" : "grid-cols-1"
              )}>
                {scheduleSlots.map((item) => (
                  <div key={item.period} className="rounded-xl border border-violet-100 bg-white p-3 text-xs shadow-2xs">
                    <div className={clsx("gap-3", scheduleLayout === "list" && "flex items-start justify-between")}>
                      <div>
                        <p className="font-black text-gray-900">Period {item.period}{item.subjectName ? ` · ${item.subjectName}` : ""}</p>
                        <p className="mt-1 text-gray-600">
                          {item.teacherName || "Teacher not specified"}
                          {item.coTeacherName ? ` · Co-teacher: ${item.coTeacherName}` : ""}
                        </p>
                      </div>
                      {item.time && <span className={clsx("rounded-lg bg-violet-100 px-2 py-1 font-bold text-violet-800", scheduleLayout === "row" ? "mt-2 inline-block" : "shrink-0")}>{item.time}</span>}
                    </div>
                    {(item.classroomLocation || item.teacherContactInfo) && (
                      <div className={clsx(
                        "mt-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500",
                        scheduleLayout === "list" ? "flex flex-wrap gap-x-4 gap-y-1" : "space-y-1"
                      )}>
                        {item.classroomLocation && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{item.classroomLocation}</span>}
                        {item.teacherContactInfo && <span className="flex items-center gap-1 break-all"><Mail className="h-3 w-3 shrink-0" />{item.teacherContactInfo}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
