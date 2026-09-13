"use client";
// app/page.tsx — SE 3000 Special Education Materials & IEP Tracking Platform

import { useEffect, useState, useCallback, useRef } from "react";
import { Target, AlertTriangle } from "lucide-react";
import db from "@/lib/db";
import { cleanupStaleMaterials, deleteMaterial } from "@/lib/materials";
import { getPlanningSessionsForProfile } from "@/lib/planning";
import { computeTrend } from "@/lib/trending";
import type {
  StudentIEPProfile,
  ProgressLogEntry,
  TrendResult,
  GeneratedMaterial,
  IEPGoal,
  PlanningSession
} from "@/types/iep";
import StudentHeader from "@/components/StudentHeader";
import GoalCard from "@/components/GoalCard";
import ServiceTracker from "@/components/ServiceTracker";
import AccommodationList from "@/components/AccommodationList";
import ProgressSummary from "@/components/ProgressSummary";
import AddStudentForm from "@/components/AddStudentForm";
import AddGoalForm from "@/components/AddGoalForm";
import MaterialGeneratorModal from "@/components/MaterialGeneratorModal";
import CompareResultsModal from "@/components/CompareResultsModal";
import MaterialsGallery from "@/components/MaterialsGallery";
import PlanningSessionsSection from "@/components/planning/PlanningSessionsSection";
import PlanningAssistantModal from "@/components/planning/PlanningAssistantModal";

// Interactive Material Presenters
import SlideDeckViewer from "@/components/materials/SlideDeckViewer";
import BoardGameViewer from "@/components/materials/BoardGameViewer";
import MiniGamePlayer from "@/components/materials/MiniGamePlayer";
import AudioMusicPlayer from "@/components/materials/AudioMusicPlayer";
import NarrationPlayer from "@/components/materials/NarrationPlayer";
import VideoPlayer from "@/components/materials/VideoPlayer";
import { validOutput } from "@/lib/schemas";
import Dialog from "@/components/Dialog";
import MaterialErrorBoundary from "@/components/MaterialErrorBoundary";
import WorksheetViewer from "@/components/materials/WorksheetViewer";
import { useTeacherSession } from "@/components/TeacherAccess";
import StudentManagementSection from "@/components/StudentManagementSection";
import { backfillGeorgeMartinDemoSchedules } from "@/lib/georgeMartinDemo";

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
  const { teacher: activeTeacher } = useTeacherSession();
  const [profiles, setProfiles] = useState<StudentIEPProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ProgressLogEntry[]>([]);
  const [materials, setMaterials] = useState<GeneratedMaterial[]>([]);
  const [planningSessions, setPlanningSessions] = useState<PlanningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Modals & Drawers state
  const [showPlaafp, setShowPlaafp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editStudent, setEditStudent] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [resumeSession, setResumeSession] = useState<PlanningSession | undefined>(undefined);

  // Generator & Viewer Modal state
  const [generatorGoal, setGeneratorGoal] = useState<IEPGoal | undefined>(undefined);
  const [showGenerator, setShowGenerator] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<GeneratedMaterial | null>(null);
  const [compareResults, setCompareResults] = useState<GeneratedMaterial[] | null>(null);

  const selectionRef = useRef(selectedId);
  useEffect(() => { selectionRef.current = selectedId; }, [selectedId]);
  const selectedProfile = profiles.find((p) => p.id === selectedId) ?? null;

  // Load profiles from IndexedDB
  const loadProfiles = useCallback(async () => {
    // Purge orphaned "generating" placeholders from interrupted sessions.
    // Non-fatal — never let it block the dashboard from loading.
    try {
      const purged = await cleanupStaleMaterials();
      if (purged > 0) console.info(`[SE 3000] Cleared ${purged} interrupted generation(s).`);
    } catch (err) {
      console.warn("[SE 3000] Stale material cleanup failed:", err);
    }
    try {
      const updated = await backfillGeorgeMartinDemoSchedules();
      if (updated > 0) console.info(`[SE 3000] Added schedules to ${updated} existing demo student(s).`);
    } catch (err) {
      console.warn("[SE 3000] Demo schedule backfill failed:", err);
    }
    const all = await db.profiles.toArray();
    setProfiles(all);
    if (all.length > 0 && !selectedId) {
      setSelectedId(all[0].id);
    }
  }, [selectedId]);

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

    if (selectionRef.current !== selectedId) return;
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLogs([]); setMaterials([]); setPlanningSessions([]);
    if (selectedId) void loadStudentData().catch(() => setInitError("Could not load student records. Reload to retry."));
  }, [selectedId, loadStudentData]);

  function handleLogAdded() {
    loadStudentData();
  }

  function handleStudentCreated(profile: StudentIEPProfile) {
    setProfiles((prev) => [...prev, profile]);
    setSelectedId(profile.id);
    setShowAddStudent(false);
  }

  function handleStudentSelected(profileId: string) {
    selectionRef.current = profileId;
    setSelectedId(profileId);
    setShowPlaafp(false);
  }

  function handleAddGoalForStudent(profileId: string) {
    handleStudentSelected(profileId);
    setShowAddGoal(true);
  }

  async function handleProgressReportForStudent(profileId: string) {
    handleStudentSelected(profileId);
    const studentLogs = await db.progressLogs
      .where("[profileId+goalId]")
      .between([profileId, ""], [profileId, "\uffff"])
      .toArray();
    if (selectionRef.current !== profileId) return;
    setLogs(studentLogs);
    setShowSummary(true);
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

  function handleVariantsCreated(materials: GeneratedMaterial[]) {
    setShowGenerator(false);
    loadStudentData();
    setCompareResults(materials);
  }

  async function handleCompareResultDeleted(mat: GeneratedMaterial) {
    await deleteMaterial(mat.id);
    loadStudentData();
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-900 text-white">
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-900 text-white p-6">
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
      {/* ─── Main Content Container ─────────────────────────────── */}
      <main className="mx-auto w-full space-y-6 px-4 py-6 sm:px-6 xl:px-8">
        <p className="my-3 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-900">This teacher&apos;s records are encrypted and saved to <strong>{activeTeacher.storageMode === "browser" ? "this browser's secure local storage" : `${activeTeacher.folderName}/${activeTeacher.vaultFilename}`}</strong>. Generating or analyzing sends the supplied context to configured AI providers, trying the next provider if one fails. {activeTeacher.storageMode === "browser" ? "Do not clear Brave site data." : "Keep the vault file backed up."}</p>
        <StudentManagementSection
          profiles={profiles}
          selectedId={selectedId}
          onSelect={handleStudentSelected}
          onAddStudent={() => setShowAddStudent(true)}
          onAddGoal={handleAddGoalForStudent}
          onProgressReport={(profileId) => void handleProgressReportForStudent(profileId)}
        />

        {/* Student Active Dashboard */}
        {selectedProfile && (
          <>
            {/* 1. Student Header & Learning Profile Banner */}
            <button onClick={() => setEditStudent(true)} className="text-sm font-semibold text-indigo-700">Edit student profile</button>
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
              <ServiceTracker profile={selectedProfile} onChanged={handlePlanningChanged} />
              <AccommodationList profile={selectedProfile} onChanged={handlePlanningChanged} />
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
          onVariantsCreated={handleVariantsCreated}
        />
      )}

      {/* Compare Providers Results Modal */}
      {compareResults && (
        <CompareResultsModal
          materials={compareResults}
          onView={(mat) => setViewingMaterial(mat)}
          onDelete={handleCompareResultDeleted}
          onClose={() => setCompareResults(null)}
        />
      )}

      {/* Interactive Material Viewer Dialog */}
      {viewingMaterial && ((mat: GeneratedMaterial) => {
        const parsed = safeParseContent(mat.contentJson);
        const isViewable = mat.status === "ready" && parsed !== null && validOutput(mat.type, parsed);
        return (
          <Dialog onClose={() => setViewingMaterial(null)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
                <MaterialErrorBoundary key={mat.id} onClose={() => setViewingMaterial(null)}>
                  {mat.type === "slide_deck" && (
                    <SlideDeckViewer content={parsed} onClose={() => setViewingMaterial(null)} />
                  )}
                  {mat.type === "board_game" && (
                    <BoardGameViewer content={parsed} onClose={() => setViewingMaterial(null)} />
                  )}
                  {mat.type === "mini_game" && (
                    <MiniGamePlayer key={mat.id}
                      content={parsed}
                      profileId={mat.profileId}
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
                </MaterialErrorBoundary>
              )}
            </div>
          </Dialog>
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

      {editStudent && selectedProfile && <AddStudentForm initialProfile={selectedProfile} onClose={() => setEditStudent(false)} onCreated={(updated) => {setProfiles((rows) => rows.map((p) => p.id === updated.id ? updated : p));setEditStudent(false);}} />}
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
