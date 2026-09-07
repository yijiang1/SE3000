"use client";
// app/page.tsx — SE 3000 Special Education Materials & IEP Tracking Platform

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Target,
  FileText,
  UserPlus,
  ChevronDown,
  Layers,
  GraduationCap,
  AlertTriangle,
  ClipboardList,
  Smile,
  Users,
  Mail,
  MessageCircleHeart
} from "lucide-react";
import db from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { cleanupStaleMaterials } from "@/lib/materials";
import {
  getTeacherProfile,
  getClassroomProfile,
  getIcebreakerProfile,
  getSurveyProfile,
  getFirstDayMaterials,
  cleanupStaleFirstDayMaterials,
  emptyTeacherProfile,
  emptyClassroomProfile,
  emptyIcebreakerProfile,
  emptySurveyProfile
} from "@/lib/firstDayMaterials";
import { getPlanningSessionsForProfile } from "@/lib/planning";
import { computeTrend } from "@/lib/trending";
import type {
  StudentIEPProfile,
  ProgressLogEntry,
  TrendResult,
  GeneratedMaterial,
  IEPGoal,
  PlanningSession,
  TeacherProfile,
  ClassroomProfile,
  IcebreakerProfile,
  SurveyProfile,
  FirstDayMaterial,
  FirstDayMaterialCategory
} from "@/types/iep";
import StudentHeader from "@/components/StudentHeader";
import GoalCard from "@/components/GoalCard";
import ServiceTracker from "@/components/ServiceTracker";
import AccommodationList from "@/components/AccommodationList";
import ProgressSummary from "@/components/ProgressSummary";
import AddStudentForm from "@/components/AddStudentForm";
import AddGoalForm from "@/components/AddGoalForm";
import MaterialGeneratorModal from "@/components/MaterialGeneratorModal";
import MaterialsGallery from "@/components/MaterialsGallery";
import PlanningSessionsSection from "@/components/planning/PlanningSessionsSection";
import PlanningAssistantModal from "@/components/planning/PlanningAssistantModal";
import TeacherProfileForm from "@/components/TeacherProfileForm";
import ClassroomProfileForm from "@/components/ClassroomProfileForm";
import IcebreakerProfileForm from "@/components/IcebreakerProfileForm";
import SurveyProfileForm from "@/components/SurveyProfileForm";
import FirstDayGeneratorModal from "@/components/FirstDayGeneratorModal";
import FirstDayMaterialsGallery from "@/components/FirstDayMaterialsGallery";

// Interactive Material Presenters
import SlideDeckViewer from "@/components/materials/SlideDeckViewer";
import BoardGameViewer from "@/components/materials/BoardGameViewer";
import MiniGamePlayer from "@/components/materials/MiniGamePlayer";
import AudioMusicPlayer from "@/components/materials/AudioMusicPlayer";
import NarrationPlayer from "@/components/materials/NarrationPlayer";
import VideoPlayer from "@/components/materials/VideoPlayer";
import WorksheetViewer from "@/components/materials/WorksheetViewer";
import FirstDayWebpageViewer from "@/components/materials/FirstDayWebpageViewer";

/** Parse a stored material's contentJson, returning null instead of throwing. */
function safeParseContent(json: string | undefined): any | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<StudentIEPProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ProgressLogEntry[]>([]);
  const [materials, setMaterials] = useState<GeneratedMaterial[]>([]);
  const [planningSessions, setPlanningSessions] = useState<PlanningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // First-Day Materials Hub (Teacher Introduction, Classroom Expectations, Icebreaker
  // Activities, Family Welcome Letter & Getting-to-Know-You Survey) — not tied to any student
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [classroomProfile, setClassroomProfile] = useState<ClassroomProfile | null>(null);
  const [icebreakerProfile, setIcebreakerProfile] = useState<IcebreakerProfile | null>(null);
  const [surveyProfile, setSurveyProfile] = useState<SurveyProfile | null>(null);
  const [teacherMaterials, setTeacherMaterials] = useState<FirstDayMaterial[]>([]);
  const [classroomMaterials, setClassroomMaterials] = useState<FirstDayMaterial[]>([]);
  const [icebreakerMaterials, setIcebreakerMaterials] = useState<FirstDayMaterial[]>([]);
  const [familyLetterMaterials, setFamilyLetterMaterials] = useState<FirstDayMaterial[]>([]);
  const [surveyMaterials, setSurveyMaterials] = useState<FirstDayMaterial[]>([]);
  const [showTeacherProfileForm, setShowTeacherProfileForm] = useState(false);
  const [showClassroomProfileForm, setShowClassroomProfileForm] = useState(false);
  const [showIcebreakerProfileForm, setShowIcebreakerProfileForm] = useState(false);
  const [showSurveyProfileForm, setShowSurveyProfileForm] = useState(false);
  const [generatorCategory, setGeneratorCategory] = useState<FirstDayMaterialCategory | null>(null);
  const [viewingFirstDayMaterial, setViewingFirstDayMaterial] = useState<FirstDayMaterial | null>(null);

  // Modals & Drawers state
  const [showPlaafp, setShowPlaafp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [resumeSession, setResumeSession] = useState<PlanningSession | undefined>(undefined);

  // Generator & Viewer Modal state
  const [generatorGoal, setGeneratorGoal] = useState<IEPGoal | undefined>(undefined);
  const [showGenerator, setShowGenerator] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<GeneratedMaterial | null>(null);

  const selectedProfile = profiles.find((p) => p.id === selectedId) ?? null;

  // Load profiles from IndexedDB
  const loadProfiles = useCallback(async () => {
    await seedIfEmpty();
    // Purge orphaned "generating" placeholders from interrupted sessions.
    // Non-fatal — never let it block the dashboard from loading.
    try {
      const purged = await cleanupStaleMaterials();
      if (purged > 0) console.info(`[SE 3000] Cleared ${purged} interrupted generation(s).`);
    } catch (err) {
      console.warn("[SE 3000] Stale material cleanup failed:", err);
    }
    const all = await db.profiles.toArray();
    setProfiles(all);
    if (all.length > 0 && !selectedId) {
      setSelectedId(all[0].id);
    }
  }, [selectedId]);

  // Load the teacher's "About Me" & classroom profiles plus their generated first-day materials
  const loadFirstDayData = useCallback(async () => {
    try {
      const purged = await cleanupStaleFirstDayMaterials();
      if (purged > 0) console.info(`[SE 3000] Cleared ${purged} interrupted first-day generation(s).`);
    } catch (err) {
      console.warn("[SE 3000] Stale first-day material cleanup failed:", err);
    }
    const [teacher, classroom, icebreaker, survey, teacherMats, classroomMats, icebreakerMats, familyLetterMats, surveyMats] = await Promise.all([
      getTeacherProfile(),
      getClassroomProfile(),
      getIcebreakerProfile(),
      getSurveyProfile(),
      getFirstDayMaterials("teacher_intro"),
      getFirstDayMaterials("classroom_expectations"),
      getFirstDayMaterials("icebreaker_activities"),
      getFirstDayMaterials("family_letter"),
      getFirstDayMaterials("getting_to_know_you"),
    ]);
    setTeacherProfile(teacher);
    setClassroomProfile(classroom);
    setIcebreakerProfile(icebreaker);
    setSurveyProfile(survey);
    setTeacherMaterials(teacherMats);
    setClassroomMaterials(classroomMats);
    setIcebreakerMaterials(icebreakerMats);
    setFamilyLetterMaterials(familyLetterMats);
    setSurveyMaterials(surveyMats);
  }, []);

  // Load logs and generated materials for selected student
  const loadStudentData = useCallback(async () => {
    if (!selectedId) return;
    const [studentLogs, studentMaterials, sessions] = await Promise.all([
      db.progressLogs
        .where("[profileId+goalId]")
        .between([selectedId, ""], [selectedId, "\uffff"])
        .toArray(),
      db.generatedMaterials
        .where("profileId")
        .equals(selectedId)
        .reverse()
        .sortBy("createdAt"),
      getPlanningSessionsForProfile(selectedId),
    ]);

    setLogs(studentLogs);
    setMaterials(studentMaterials);
    setPlanningSessions(sessions);
  }, [selectedId]);

  useEffect(() => {
    loadProfiles()
      .catch((err) => {
        console.error("[SE 3000] Failed to initialize local database:", err);
        const msg = err instanceof Error ? err.message : String(err);
        setInitError(
          /indexeddb|not supported|access|denied|quota/i.test(msg)
            ? "This browser is blocking local storage (IndexedDB). Open the app in a normal (non-private) window and allow site data."
            : "Could not load the local database. Your browser may be blocking storage, or the stored data may be corrupted."
        );
      })
      .finally(() => setLoading(false));
    loadFirstDayData().catch((err) => console.warn("[SE 3000] Failed to load first-day materials data:", err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedId) loadStudentData();
  }, [selectedId, loadStudentData]);

  function handleLogAdded() {
    loadStudentData();
  }

  function handleStudentCreated(profile: StudentIEPProfile) {
    setProfiles((prev) => [...prev, profile]);
    setSelectedId(profile.id);
    setShowAddStudent(false);
  }

  async function handleGoalAdded() {
    const all = await db.profiles.toArray();
    setProfiles(all);
    setShowAddGoal(false);
  }

  function handleOpenGenerator(goal?: IEPGoal) {
    setGeneratorGoal(goal);
    setShowGenerator(true);
  }

  async function handlePlanningChanged() {
    const all = await db.profiles.toArray();
    setProfiles(all);
    await loadStudentData();
  }

  function handleStartPlanning() {
    setResumeSession(undefined);
    setShowPlanning(true);
  }

  function handleResumePlanning(session: PlanningSession) {
    setResumeSession(session);
    setShowPlanning(true);
  }

  function handleMaterialCreated(mat: GeneratedMaterial) {
    setShowGenerator(false);
    loadStudentData();
    // Immediately launch the created material in its player
    setViewingMaterial(mat);
  }

  function handleTeacherProfileSaved(profile: TeacherProfile) {
    setTeacherProfile(profile);
    setShowTeacherProfileForm(false);
  }

  function handleClassroomProfileSaved(profile: ClassroomProfile) {
    setClassroomProfile(profile);
    setShowClassroomProfileForm(false);
  }

  function handleIcebreakerProfileSaved(profile: IcebreakerProfile) {
    setIcebreakerProfile(profile);
    setShowIcebreakerProfileForm(false);
  }

  function handleSurveyProfileSaved(profile: SurveyProfile) {
    setSurveyProfile(profile);
    setShowSurveyProfileForm(false);
  }

  function handleFirstDayMaterialCreated(mat: FirstDayMaterial) {
    setGeneratorCategory(null);
    loadFirstDayData();
    setViewingFirstDayMaterial(mat);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-indigo-200">
            Loading SE 3000 Platform…
          </p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Local storage unavailable</h1>
          <p className="text-sm text-slate-300">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* ─── Top Brand Header Bar ───────────────────────────────── */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">SE 3000</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                  Local-First
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Special Education AI Materials & IEP Progress Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedProfile && (
              <>
                <button
                  onClick={handleStartPlanning}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Planning Assistant</span>
                </button>

                <button
                  onClick={() => handleOpenGenerator()}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">AI Materials Hub</span>
                </button>

                <button
                  onClick={() => setShowAddGoal(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
                >
                  <Target className="w-3.5 h-3.5 text-indigo-400" /> Add Goal
                </button>

                <button
                  onClick={() => setShowSummary(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" /> Progress Report
                </button>
              </>
            )}

            <button
              onClick={() => setShowAddStudent(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Add Student</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ─────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* First-Day Materials Hub (not tied to any student) */}
        <FirstDayMaterialsGallery
          accent="amber"
          icon={Smile}
          heading="First-Day Teacher Introduction"
          subtitle={
            teacherProfile?.name
              ? `Materials to introduce ${teacherProfile.name} (${teacherProfile.roleTitle}) on day one.`
              : "Create your teacher profile to generate About-Me materials for the first lesson."
          }
          hasProfile={!!teacherProfile?.name}
          emptyProfileTitle="No teacher profile yet"
          emptyProfileBody="Add your name, role, hobbies, and fun facts so SE 3000 can generate a slide deck, webpage, or video introducing you on the first day."
          materials={teacherMaterials}
          onOpenMaterial={(mat) => setViewingFirstDayMaterial(mat)}
          onOpenGenerator={() => setGeneratorCategory("teacher_intro")}
          onEditProfile={() => setShowTeacherProfileForm(true)}
          onMaterialDeleted={loadFirstDayData}
        />

        <FirstDayMaterialsGallery
          accent="teal"
          icon={ClipboardList}
          heading="Classroom Expectations & Rules"
          subtitle={
            classroomProfile && (classroomProfile.rules.length > 0 || classroomProfile.routines.length > 0)
              ? `Materials explaining how ${classroomProfile.classroomName || "your classroom"} works on day one.`
              : "Add your classroom rules & routines to generate first-day expectations materials."
          }
          hasProfile={!!classroomProfile && (classroomProfile.rules.length > 0 || classroomProfile.routines.length > 0)}
          emptyProfileTitle="No classroom rules set up yet"
          emptyProfileBody="Add your classroom rules, routines, and rewards system so SE 3000 can generate a slide deck, webpage, or video explaining how your classroom works."
          materials={classroomMaterials}
          onOpenMaterial={(mat) => setViewingFirstDayMaterial(mat)}
          onOpenGenerator={() => setGeneratorCategory("classroom_expectations")}
          onEditProfile={() => setShowClassroomProfileForm(true)}
          onMaterialDeleted={loadFirstDayData}
        />

        <FirstDayMaterialsGallery
          accent="pink"
          icon={Users}
          heading="Icebreaker Activities"
          subtitle={
            icebreakerProfile && icebreakerProfile.groupSize
              ? `Get-to-know-you activities for ${icebreakerProfile.groupSize.toLowerCase()} on day one.`
              : "Set your activity preferences to generate first-day icebreaker materials."
          }
          hasProfile={!!icebreakerProfile?.groupSize}
          emptyProfileTitle="No icebreaker preferences set up yet"
          emptyProfileBody="Choose your group size, duration, and activity styles so SE 3000 can generate fun get-to-know-you activities for the first day."
          materials={icebreakerMaterials}
          onOpenMaterial={(mat) => setViewingFirstDayMaterial(mat)}
          onOpenGenerator={() => setGeneratorCategory("icebreaker_activities")}
          onEditProfile={() => setShowIcebreakerProfileForm(true)}
          onMaterialDeleted={loadFirstDayData}
        />

        <FirstDayMaterialsGallery
          accent="indigo"
          icon={Mail}
          heading="Family Welcome Letter"
          subtitle={
            teacherProfile?.name
              ? `A welcome letter home from ${teacherProfile.name}${classroomProfile?.classroomName ? ` (${classroomProfile.classroomName})` : ""}.`
              : "Set up your teacher profile to generate a family welcome letter."
          }
          hasProfile={!!teacherProfile?.name}
          emptyProfileTitle="No teacher profile yet"
          emptyProfileBody="This reuses your Teacher Introduction profile (plus your classroom rules, if set) to write a welcome letter home to families."
          materials={familyLetterMaterials}
          onOpenMaterial={(mat) => setViewingFirstDayMaterial(mat)}
          onOpenGenerator={() => setGeneratorCategory("family_letter")}
          onEditProfile={() => setShowTeacherProfileForm(true)}
          onMaterialDeleted={loadFirstDayData}
        />

        <FirstDayMaterialsGallery
          accent="violet"
          icon={MessageCircleHeart}
          heading="Getting-to-Know-You Survey"
          subtitle={
            surveyProfile && surveyProfile.questions.length > 0
              ? `"${surveyProfile.title}" · ${surveyProfile.questions.length} question${surveyProfile.questions.length !== 1 ? "s" : ""}`
              : "Set up your questions to generate a printable getting-to-know-you questionnaire."
          }
          hasProfile={!!surveyProfile && surveyProfile.questions.length > 0}
          emptyProfileTitle="No survey questions set up yet"
          emptyProfileBody="Add a few getting-to-know-you questions so SE 3000 can generate a printable questionnaire or a live class-interview slide deck."
          materials={surveyMaterials}
          onOpenMaterial={(mat) => setViewingFirstDayMaterial(mat)}
          onOpenGenerator={() => setGeneratorCategory("getting_to_know_you")}
          onEditProfile={() => setShowSurveyProfileForm(true)}
          onMaterialDeleted={loadFirstDayData}
        />

        {/* Student Selector Switcher */}
        {profiles.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide shrink-0">
                Active Student:
              </span>
              <div className="relative">
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setShowPlaafp(false);
                  }}
                  className="appearance-none bg-slate-100 hover:bg-slate-200 border border-gray-300 rounded-xl pl-3.5 pr-9 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.studentInitials} — Grade {p.grade} ({p.primaryEligibility.split("(")[0].trim()})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {selectedProfile && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  {materials.length} generated teaching asset{materials.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setShowSummary(true)}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">IEP Progress Summary</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {profiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">No Student Records Found</h2>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                Add a student profile to begin tracking IEP goals and generating personalized teaching materials.
              </p>
            </div>
            <button
              onClick={() => setShowAddStudent(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-md"
            >
              <UserPlus className="w-4 h-4" /> Add First Student
            </button>
          </div>
        )}

        {/* Student Active Dashboard */}
        {selectedProfile && (
          <>
            {/* 1. Student Header & Learning Profile Banner */}
            <StudentHeader
              profile={selectedProfile}
              showPlaafp={showPlaafp}
              onTogglePlaafp={() => setShowPlaafp(!showPlaafp)}
              onOpenGenerator={() => handleOpenGenerator()}
              onOpenPlanning={handleStartPlanning}
            />

            {/* 2. Instructional Planning Assistant Section */}
            <PlanningSessionsSection
              profile={selectedProfile}
              sessions={planningSessions}
              allLogs={logs}
              onStartNew={handleStartPlanning}
              onResume={handleResumePlanning}
              onChanged={handlePlanningChanged}
              onOpenMaterial={(mat) => setViewingMaterial(mat)}
            />

            {/* 3. IEP Goals Grid Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-gray-900">
                    IEP Goals & Progress Tracking ({selectedProfile.goals.length})
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-2 text-xs font-bold">
                    {(["on_track", "at_risk", "off_track", "no_data"] as const).map((s) => {
                      const count = selectedProfile.goals.filter((g) => {
                        const entries = logs.filter((l) => l.goalId === g.id);
                        return computeTrend(g, entries).status === s;
                      }).length;
                      if (count === 0) return null;
                      const label =
                        s === "on_track" ? "On Track" : s === "at_risk" ? "At Risk" : s === "off_track" ? "Off Track" : "No Data";
                      const color =
                        s === "on_track"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : s === "at_risk"
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : s === "off_track"
                          ? "text-rose-700 bg-rose-50 border-rose-200"
                          : "text-gray-600 bg-gray-100 border-gray-200";
                      return (
                        <span key={s} className={`px-2 py-0.5 rounded-full border text-[11px] ${color}`}>
                          {count} {label}
                        </span>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setShowAddGoal(true)}
                    className="p-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold flex items-center gap-1 shadow-2xs"
                    title="Add Goal to Student"
                  >
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Add Goal</span>
                  </button>
                </div>
              </div>

              {selectedProfile.goals.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
                  <Target className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-bold text-gray-700">No IEP Goals Configured</p>
                  <button
                    onClick={() => setShowAddGoal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700"
                  >
                    Add First Goal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProfile.goals.map((goal) => {
                    const goalLogs = logs.filter((l) => l.goalId === goal.id);
                    const trend: TrendResult = computeTrend(goal, goalLogs);
                    const goalMaterials = materials.filter((m) => m.goalId === goal.id);
                    return (
                      <GoalCard
                        key={goal.id}
                        profileId={selectedProfile.id}
                        goal={goal}
                        entries={goalLogs}
                        trend={trend}
                        materialsCount={goalMaterials.length}
                        onLogAdded={handleLogAdded}
                        onOpenGenerator={() => handleOpenGenerator(goal)}
                        onViewMaterials={() => {
                          // Scroll to gallery or view
                          const el = document.getElementById("materials-gallery-section");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Generated Teaching Materials Gallery Section */}
            <div id="materials-gallery-section">
              <MaterialsGallery
                profile={selectedProfile}
                materials={materials}
                onOpenMaterial={(mat) => setViewingMaterial(mat)}
                onOpenGenerator={(goal) => handleOpenGenerator(goal)}
                onMaterialDeleted={loadStudentData}
              />
            </div>

            {/* 5. Mandated Services & Accommodations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ServiceTracker profile={selectedProfile} />
              <AccommodationList profile={selectedProfile} />
            </div>
          </>
        )}
      </main>

      {/* ─── MODAL DIALOGS & MATERIAL VIEWERS ────────────────────── */}

      {/* Material Generator Modal */}
      {showGenerator && selectedProfile && (
        <MaterialGeneratorModal
          profile={selectedProfile}
          selectedGoal={generatorGoal}
          allLogs={logs}
          onClose={() => setShowGenerator(false)}
          onMaterialCreated={handleMaterialCreated}
        />
      )}

      {/* Interactive Material Viewer Dialog */}
      {viewingMaterial && ((mat: GeneratedMaterial) => {
        const parsed = safeParseContent(mat.contentJson);
        const isViewable = mat.status === "ready" && parsed !== null;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {!isViewable ? (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">This material can&apos;t be opened</h3>
                  <p className="text-sm text-slate-300">
                    {mat.status === "generating"
                      ? "This item is still generating, or generation was interrupted."
                      : mat.status === "error"
                      ? mat.error || "Generation failed for this item."
                      : "Its saved content is missing or corrupted. Try deleting it and generating a new one."}
                  </p>
                  <button
                    onClick={() => setViewingMaterial(null)}
                    className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {mat.type === "slide_deck" && (
                    <SlideDeckViewer content={parsed} onClose={() => setViewingMaterial(null)} />
                  )}
                  {mat.type === "board_game" && (
                    <BoardGameViewer content={parsed} onClose={() => setViewingMaterial(null)} />
                  )}
                  {mat.type === "mini_game" && (
                    <MiniGamePlayer
                      content={parsed}
                      profileId={selectedProfile?.id}
                      goalId={mat.goalId}
                      onObservationLogged={handleLogAdded}
                      onClose={() => setViewingMaterial(null)}
                    />
                  )}
                  {mat.type === "music" && (
                    <AudioMusicPlayer content={parsed} onClose={() => setViewingMaterial(null)} />
                  )}
                  {mat.type === "narration" && (
                    <NarrationPlayer content={parsed} onClose={() => setViewingMaterial(null)} />
                  )}
                  {mat.type === "video_clip" && (
                    <VideoPlayer content={parsed} onClose={() => setViewingMaterial(null)} />
                  )}
                  {mat.type === "worksheet" && (
                    <WorksheetViewer content={parsed} onClose={() => setViewingMaterial(null)} />
                  )}
                </>
              )}
            </div>
          </div>
        );
      })(viewingMaterial)}

      {/* Progress Summary Report Modal */}
      {showSummary && selectedProfile && (
        <ProgressSummary
          profile={selectedProfile}
          allLogs={logs}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <AddStudentForm
          onClose={() => setShowAddStudent(false)}
          onCreated={handleStudentCreated}
        />
      )}

      {/* Add Goal Modal */}
      {showAddGoal && selectedProfile && (
        <AddGoalForm
          profile={selectedProfile}
          onClose={() => setShowAddGoal(false)}
          onGoalAdded={handleGoalAdded}
        />
      )}

      {/* Teacher Profile Form */}
      {showTeacherProfileForm && (
        <TeacherProfileForm
          profile={teacherProfile || emptyTeacherProfile()}
          onClose={() => setShowTeacherProfileForm(false)}
          onSaved={handleTeacherProfileSaved}
        />
      )}

      {/* Classroom Profile Form */}
      {showClassroomProfileForm && (
        <ClassroomProfileForm
          profile={classroomProfile || emptyClassroomProfile()}
          onClose={() => setShowClassroomProfileForm(false)}
          onSaved={handleClassroomProfileSaved}
        />
      )}

      {/* Icebreaker Profile Form */}
      {showIcebreakerProfileForm && (
        <IcebreakerProfileForm
          profile={icebreakerProfile || emptyIcebreakerProfile()}
          onClose={() => setShowIcebreakerProfileForm(false)}
          onSaved={handleIcebreakerProfileSaved}
        />
      )}

      {/* Survey Profile Form (Getting-to-Know-You) */}
      {showSurveyProfileForm && (
        <SurveyProfileForm
          profile={surveyProfile || emptySurveyProfile()}
          onClose={() => setShowSurveyProfileForm(false)}
          onSaved={handleSurveyProfileSaved}
        />
      )}

      {/* First-Day Material Generator (shared by all five categories) */}
      {generatorCategory === "teacher_intro" && teacherProfile && (
        <FirstDayGeneratorModal
          category="teacher_intro"
          subject={teacherProfile}
          onClose={() => setGeneratorCategory(null)}
          onMaterialCreated={handleFirstDayMaterialCreated}
        />
      )}
      {generatorCategory === "classroom_expectations" && classroomProfile && (
        <FirstDayGeneratorModal
          category="classroom_expectations"
          subject={classroomProfile}
          onClose={() => setGeneratorCategory(null)}
          onMaterialCreated={handleFirstDayMaterialCreated}
        />
      )}
      {generatorCategory === "icebreaker_activities" && icebreakerProfile && (
        <FirstDayGeneratorModal
          category="icebreaker_activities"
          subject={icebreakerProfile}
          onClose={() => setGeneratorCategory(null)}
          onMaterialCreated={handleFirstDayMaterialCreated}
        />
      )}
      {generatorCategory === "family_letter" && teacherProfile && (
        <FirstDayGeneratorModal
          category="family_letter"
          subject={{ teacher: teacherProfile, classroom: classroomProfile }}
          onClose={() => setGeneratorCategory(null)}
          onMaterialCreated={handleFirstDayMaterialCreated}
        />
      )}
      {generatorCategory === "getting_to_know_you" && surveyProfile && (
        <FirstDayGeneratorModal
          category="getting_to_know_you"
          subject={surveyProfile}
          onClose={() => setGeneratorCategory(null)}
          onMaterialCreated={handleFirstDayMaterialCreated}
        />
      )}

      {/* First-Day Material Viewer (shared by all five categories) */}
      {viewingFirstDayMaterial && ((mat: FirstDayMaterial) => {
        const parsed = safeParseContent(mat.contentJson);
        const isViewable = mat.status === "ready" && parsed !== null;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {!isViewable ? (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">This material can&apos;t be opened</h3>
                  <p className="text-sm text-slate-300">
                    {mat.status === "generating"
                      ? "This item is still generating, or generation was interrupted."
                      : mat.status === "error"
                      ? mat.error || "Generation failed for this item."
                      : "Its saved content is missing or corrupted. Try deleting it and generating a new one."}
                  </p>
                  <button
                    onClick={() => setViewingFirstDayMaterial(null)}
                    className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {mat.format === "slide_deck" && (
                    <SlideDeckViewer content={parsed} onClose={() => setViewingFirstDayMaterial(null)} />
                  )}
                  {mat.format === "video_clip" && (
                    <VideoPlayer content={parsed} onClose={() => setViewingFirstDayMaterial(null)} />
                  )}
                  {mat.format === "html_page" && (
                    <FirstDayWebpageViewer content={parsed} onClose={() => setViewingFirstDayMaterial(null)} />
                  )}
                </>
              )}
            </div>
          </div>
        );
      })(viewingFirstDayMaterial)}

      {/* Instructional Planning Assistant */}
      {showPlanning && selectedProfile && (
        <PlanningAssistantModal
          key={resumeSession?.id ?? "new"}
          profile={selectedProfile}
          allLogs={logs}
          resumeSession={resumeSession}
          onClose={() => {
            setShowPlanning(false);
            setResumeSession(undefined);
          }}
          onChanged={handlePlanningChanged}
          onOpenMaterial={(mat) => setViewingMaterial(mat)}
        />
      )}
    </div>
  );
}
