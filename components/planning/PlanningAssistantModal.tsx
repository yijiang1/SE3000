"use client";
// components/planning/PlanningAssistantModal.tsx — the AI Special Education Instructional
// Planning Assistant wizard: Present Level → PLAAFP/Skill Gap → IEP Goal →
// Accommodations → Instructional Unit → Worksheets/Homework.

import Dialog from "@/components/Dialog";
import { useMemo, useState } from "react";
import {
  Sparkles, X, Loader2, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  ClipboardList, Target, ListChecks, Layers, FileSpreadsheet, RefreshCw
} from "lucide-react";
import { clsx } from "clsx";
import type {
  StudentIEPProfile, ProgressLogEntry, PlanningSession, PresentLevelInput,
  PLAAFPAnalysis, RecommendedIEPGoal, GoalCategory, MeasurementUnit,
  GeneratedMaterial, WorksheetSpec
} from "@/types/iep";
import {
  createPlanningSession, savePresentLevel, runPlaafpAnalysis, savePlaafp,
  runGoalRecommendation, saveRecommendedGoal, saveAccommodationsSelected,
  commitRecommendedGoal, runInstructionalUnit, emptyPresentLevelInput
} from "@/lib/planning";
import { generateAndSaveMaterial } from "@/lib/materials";
import PresentLevelForm from "./PresentLevelForm";
import InstructionalUnitPanel from "./InstructionalUnitPanel";
import WorksheetSpecControls, { defaultWorksheetSpec } from "./WorksheetSpecControls";

interface Props {
  profile: StudentIEPProfile;
  allLogs: ProgressLogEntry[];
  resumeSession?: PlanningSession;
  onClose: () => void;
  onChanged: () => void;
  onOpenMaterial?: (mat: GeneratedMaterial) => void;
}

const STEPS = [
  { icon: ClipboardList, label: "Present Level" },
  { icon: Sparkles, label: "PLAAFP & Skill Gap" },
  { icon: Target, label: "IEP Goal" },
  { icon: ListChecks, label: "Accommodations" },
  { icon: Layers, label: "Instructional Unit" },
  { icon: FileSpreadsheet, label: "Worksheets" },
];

const CATEGORIES: GoalCategory[] = ["academic", "behavioral", "social_emotional", "communication", "motor"];
const UNITS: MeasurementUnit[] = ["%", "count", "minutes", "trials", "rating_scale", "frequency"];

const toLines = (arr?: string[]) => (arr || []).join("\n");
const fromLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export default function PlanningAssistantModal({
  profile, allLogs, resumeSession, onClose, onChanged, onOpenMaterial,
}: Props) {
  const [session, setSession] = useState<PlanningSession | null>(resumeSession ?? null);
  const [step, setStep] = useState(() => {
    if (!resumeSession) return 0;
    if (resumeSession.instructionalUnit) return 5;
    if (resumeSession.goalId) return 3;
    if (resumeSession.recommendedGoal) return 2;
    if (resumeSession.plaafp) return 1;
    return 0;
  });

  const [input, setInput] = useState<PresentLevelInput>(
    resumeSession?.input ?? emptyPresentLevelInput({ currentGradeLevel: profile.grade })
  );
  const [plaafp, setPlaafp] = useState<PLAAFPAnalysis | null>(resumeSession?.plaafp ?? null);
  const [goal, setGoal] = useState<RecommendedIEPGoal | null>(resumeSession?.recommendedGoal ?? null);
  const [accs, setAccs] = useState<string[]>(
    resumeSession?.accommodationsSelected ?? profile.accommodations.filter((a) => a.active).map((a) => a.text)
  );
  const [extraAcc, setExtraAcc] = useState("");
  const [spec, setSpec] = useState<WorksheetSpec>(defaultWorksheetSpec(profile.learningProfile?.readingLevel || "Grade level"));
  const [lastWorksheet, setLastWorksheet] = useState<GeneratedMaterial | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const committedGoal = useMemo(
    () => (session?.goalId ? profile.goals.find((g) => g.id === session.goalId) : undefined),
    [session, profile.goals]
  );

  async function guard(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  // ── Stage transitions ────────────────────────────────────────────────
  const analyzePresentLevel = () =>
    guard("plaafp", async () => {
      if (!input.subjectArea.trim()) throw new Error("Subject area is required.");
      let s = session;
      if (!s) s = await createPlanningSession(profile, input);
      else s = await savePresentLevel(s, input);
      s = await runPlaafpAnalysis(s, profile);
      setSession(s);
      setPlaafp(s.plaafp ?? null);
      setStep(1);
    });

  const regeneratePlaafp = () =>
    guard("plaafp", async () => {
      if (!session) return;
      const s = await runPlaafpAnalysis(await savePresentLevel(session, input), profile);
      setSession(s);
      setPlaafp(s.plaafp ?? null);
    });

  const recommendGoal = () =>
    guard("goal", async () => {
      if (!session || !plaafp) return;
      let s = await savePlaafp(session, plaafp);
      s = await runGoalRecommendation(s, profile);
      setSession(s);
      setGoal(s.recommendedGoal ?? null);
      setStep(2);
    });

  const regenerateGoal = () =>
    guard("goal", async () => {
      if (!session || !plaafp) return;
      const s = await runGoalRecommendation(await savePlaafp(session, plaafp), profile);
      setSession(s);
      setGoal(s.recommendedGoal ?? null);
    });

  const commitGoal = () =>
    guard("commit", async () => {
      if (!session || !goal) return;
      const s1 = await saveRecommendedGoal(session, goal);
      const { session: s2 } = await commitRecommendedGoal(s1, profile);
      setSession(s2);
      onChanged();
      setStep(3);
    });

  const buildUnit = () =>
    guard("unit", async () => {
      if (!session) return;
      const merged = Array.from(new Set([...accs, ...fromLines(extraAcc)]));
      let s = await saveAccommodationsSelected(session, merged);
      setAccs(merged);
      setExtraAcc("");
      s = await runInstructionalUnit(s, profile, allLogs);
      setSession(s);
      onChanged();
      setStep(4);
    });

  const regenerateUnit = () =>
    guard("unit", async () => {
      if (!session) return;
      const s = await runInstructionalUnit(session, profile, allLogs);
      setSession(s);
    });

  const generateWorksheet = () =>
    guard("worksheet", async () => {
      const target = committedGoal;
      if (!session || !target) throw new Error("Add the IEP goal first.");
      const mat = await generateAndSaveMaterial(profile, target, allLogs, "worksheet", {
        worksheetSpec: spec,
        plaafp: session.plaafp,
        accommodations: session.accommodationsSelected,
      });
      setLastWorksheet(mat);
      onChanged();
    });

  const stepReached = (i: number) => {
    if (i === 0) return true;
    if (i === 1) return !!plaafp;
    if (i === 2) return !!goal;
    if (i === 3) return !!session?.goalId;
    if (i === 4) return !!session?.instructionalUnit;
    if (i === 5) return !!session?.goalId;
    return false;
  };

  return (
    <Dialog onClose={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Instructional Planning Assistant</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                {profile.studentInitials} · Grade {profile.grade} · {input.subjectArea || "—"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Step rail */}
          <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const reached = stepReached(i);
              return (
                <button
                  key={s.label}
                  onClick={() => reached && setStep(i)}
                  disabled={!reached || !!busy}
                  className={clsx(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all",
                    step === i
                      ? "bg-indigo-600 text-white shadow"
                      : reached
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-gray-300 cursor-not-allowed"
                  )}
                >
                  <span className={clsx(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                    step === i ? "bg-white/20" : reached ? "bg-indigo-50 text-indigo-600" : "bg-gray-100"
                  )}>
                    {reached && step !== i && i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </span>
                  <span>{i + 1}. {s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Body */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* STEP 0 — Present Level */}
              {step === 0 && (
                <>
                  <StepHeading title="1 · Identify the present level of academic performance"
                    sub="Enter what you know, or upload an existing report. The AI analyzes this to write a PLAAFP statement and pinpoint the skill gap." />
                  <PresentLevelForm value={input} onChange={setInput} />
                </>
              )}

              {/* STEP 1 — PLAAFP */}
              {step === 1 && plaafp && (
                <>
                  <StepHeading title="1 · PLAAFP statement & skill-gap analysis"
                    sub="Review and edit. This answers: what can the student do, what needs improvement, how far from grade level, and what skill to target." />
                  <Field label="PLAAFP statement">
                    <textarea rows={6} value={plaafp.plaafpStatement}
                      onChange={(e) => setPlaafp({ ...plaafp, plaafpStatement: e.target.value })}
                      className={inputCls} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="What the student can do now (one per line)">
                      <textarea rows={4} value={toLines(plaafp.skillGaps.canDoNow)}
                        onChange={(e) => setPlaafp({ ...plaafp, skillGaps: { ...plaafp.skillGaps, canDoNow: fromLines(e.target.value) } })}
                        className={inputCls} />
                    </Field>
                    <Field label="Skills to improve (one per line)">
                      <textarea rows={4} value={toLines(plaafp.skillGaps.needsToImprove)}
                        onChange={(e) => setPlaafp({ ...plaafp, skillGaps: { ...plaafp.skillGaps, needsToImprove: fromLines(e.target.value) } })}
                        className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Distance from grade-level expectations">
                    <textarea rows={2} value={plaafp.skillGaps.distanceFromGradeLevel}
                      onChange={(e) => setPlaafp({ ...plaafp, skillGaps: { ...plaafp.skillGaps, distanceFromGradeLevel: e.target.value } })}
                      className={inputCls} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Targeted academic skill for the IEP">
                      <input value={plaafp.skillGaps.targetSkill}
                        onChange={(e) => setPlaafp({ ...plaafp, skillGaps: { ...plaafp.skillGaps, targetSkill: e.target.value } })}
                        className={inputCls} />
                    </Field>
                    <Field label="Instructional level">
                      <input value={plaafp.instructionalLevel}
                        onChange={(e) => setPlaafp({ ...plaafp, instructionalLevel: e.target.value })}
                        className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Prioritized skill gaps (one per line)">
                    <textarea rows={3} value={toLines(plaafp.skillGaps.prioritizedSkillGaps)}
                      onChange={(e) => setPlaafp({ ...plaafp, skillGaps: { ...plaafp.skillGaps, prioritizedSkillGaps: fromLines(e.target.value) } })}
                      className={inputCls} />
                  </Field>
                  <button onClick={regeneratePlaafp} disabled={!!busy}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5">
                    <RefreshCw className={clsx("w-3.5 h-3.5", busy === "plaafp" && "animate-spin")} /> Regenerate from present level
                  </button>
                </>
              )}

              {/* STEP 2 — IEP Goal */}
              {step === 2 && goal && (
                <>
                  <StepHeading title="2 · Recommended measurable IEP goal"
                    sub="Individualized to the current instructional level — not a generic grade-level standard. Edit anything, then add it to the student's goals." />
                  {session?.goalId && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Added to {profile.studentInitials}&apos;s IEP goals.
                    </div>
                  )}
                  <Field label="Annual goal statement">
                    <textarea rows={4} value={goal.annualGoalText}
                      onChange={(e) => setGoal({ ...goal, annualGoalText: e.target.value })} className={inputCls} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Target skill">
                      <input value={goal.targetSkill} onChange={(e) => setGoal({ ...goal, targetSkill: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Category">
                      <select value={goal.category} onChange={(e) => setGoal({ ...goal, category: e.target.value as GoalCategory })} className={inputCls}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="Baseline value">
                      <input type="number" value={goal.baselineValue}
                        onChange={(e) => setGoal({ ...goal, baselineValue: parseFloat(e.target.value) || 0 })} className={inputCls} />
                    </Field>
                    <Field label="Target value">
                      <input type="number" value={goal.targetValue}
                        onChange={(e) => setGoal({ ...goal, targetValue: parseFloat(e.target.value) || 0 })} className={inputCls} />
                    </Field>
                    <Field label="Measurement unit">
                      <select value={goal.measurementUnit}
                        onChange={(e) => setGoal({ ...goal, measurementUnit: e.target.value as MeasurementUnit })} className={inputCls}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Baseline statement">
                    <textarea rows={2} value={goal.baselineStatement}
                      onChange={(e) => setGoal({ ...goal, baselineStatement: e.target.value })} className={inputCls} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Measurement criteria">
                      <textarea rows={3} value={goal.measurementCriteria}
                        onChange={(e) => setGoal({ ...goal, measurementCriteria: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Mastery criteria">
                      <textarea rows={3} value={goal.masteryCriteria}
                        onChange={(e) => setGoal({ ...goal, masteryCriteria: e.target.value })} className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Progress-monitoring method">
                    <textarea rows={2} value={goal.progressMonitoringMethod}
                      onChange={(e) => setGoal({ ...goal, progressMonitoringMethod: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Short-term objectives / benchmarks (one per line)">
                    <textarea rows={4} value={toLines(goal.shortTermObjectives?.map((o) => o.text))}
                      onChange={(e) => setGoal({ ...goal, shortTermObjectives: fromLines(e.target.value).map((text, i) => ({ order: i + 1, text })) })}
                      className={inputCls} />
                  </Field>
                  <Field label="Rationale (why individualized to the instructional level)">
                    <textarea rows={3} value={goal.rationale}
                      onChange={(e) => setGoal({ ...goal, rationale: e.target.value })} className={inputCls} />
                  </Field>
                  <button onClick={regenerateGoal} disabled={!!busy}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5">
                    <RefreshCw className={clsx("w-3.5 h-3.5", busy === "goal" && "animate-spin")} /> Regenerate goal
                  </button>
                </>
              )}

              {/* STEP 3 — Accommodations */}
              {step === 3 && (
                <>
                  <StepHeading title="3 · Accommodations & modifications"
                    sub="These are woven into every instructional step and worksheet the assistant generates." />
                  <div className="flex flex-wrap gap-1.5">
                    {profile.accommodations.map((a) => {
                      const on = accs.includes(a.text);
                      return (
                        <button key={a.id} type="button"
                          onClick={() => setAccs(on ? accs.filter((x) => x !== a.text) : [...accs, a.text])}
                          className={clsx("px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                            on ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}>
                          {a.text}{!a.active && <span className="opacity-60"> (inactive)</span>}
                        </button>
                      );
                    })}
                    {profile.accommodations.length === 0 && (
                      <p className="text-xs text-gray-400">No accommodations on this student&apos;s profile yet — add some below.</p>
                    )}
                  </div>
                  <Field label="Add more (one per line)">
                    <textarea rows={3} value={extraAcc} onChange={(e) => setExtraAcc(e.target.value)}
                      placeholder={"Extended time\nReduced number of problems\nRead-aloud\nGraphic organizers"} className={inputCls} />
                  </Field>
                </>
              )}

              {/* STEP 4 — Instructional Unit */}
              {step === 4 && session?.instructionalUnit && (
                <>
                  <StepHeading title="4 · Differentiated instructional unit"
                    sub="A scaffolded lesson sequence from prerequisite skills to independent mastery, pitched at the student's instructional level." />
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <InstructionalUnitPanel content={session.instructionalUnit} standalone={false} />
                  </div>
                  <button onClick={regenerateUnit} disabled={!!busy}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5">
                    <RefreshCw className={clsx("w-3.5 h-3.5", busy === "unit" && "animate-spin")} /> Regenerate unit
                  </button>
                </>
              )}

              {/* STEP 5 — Worksheets */}
              {step === 5 && (
                <>
                  <StepHeading title="5 · Worksheets & homework"
                    sub="Aligned to the IEP goal and instructional level. Difficulty ramps up as the student demonstrates mastery (see Progress on the planning card)." />
                  {!committedGoal ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                      Add the recommended IEP goal (step 2) before generating aligned worksheets.
                    </div>
                  ) : (
                    <>
                      <WorksheetSpecControls spec={spec} onChange={setSpec} />
                      <button onClick={generateWorksheet} disabled={!!busy}
                        className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg disabled:opacity-60">
                        {busy === "worksheet" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {busy === "worksheet" ? "Generating…" : "Generate worksheet"}
                      </button>
                      {lastWorksheet && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {lastWorksheet.title}</span>
                          {onOpenMaterial && (
                            <button
                              onClick={() => {
                                // Close the wizard first so the material viewer (also a
                                // fixed full-screen overlay) isn't stacked underneath it.
                                onOpenMaterial(lastWorksheet);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500">Open</button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer nav */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || !!busy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <PrimaryButton
                step={step}
                busy={busy}
                hasGoalCommitted={!!session?.goalId}
                onAnalyze={analyzePresentLevel}
                onRecommend={recommendGoal}
                onCommit={commitGoal}
                onNextFromGoal={commitGoal}
                onBuildUnit={buildUnit}
                onNextFromUnit={() => setStep(5)}
                onDone={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

const inputCls =
  "w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y";

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="pb-1">
      <h3 className="text-base font-black text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

function PrimaryButton(props: {
  step: number; busy: string | null; hasGoalCommitted: boolean;
  onAnalyze: () => void; onRecommend: () => void; onCommit: () => void;
  onNextFromGoal: () => void; onBuildUnit: () => void; onNextFromUnit: () => void; onDone: () => void;
}) {
  const { step, busy, hasGoalCommitted } = props;
  const cls =
    "flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg disabled:opacity-60";
  const spin = <Loader2 className="w-4 h-4 animate-spin" />;
  const arrow = <ArrowRight className="w-4 h-4" />;

  if (step === 0)
    return <button onClick={props.onAnalyze} disabled={!!busy} className={cls}>{busy === "plaafp" ? spin : <Sparkles className="w-4 h-4" />}{busy === "plaafp" ? "Analyzing…" : "Analyze present level"}{!busy && arrow}</button>;
  if (step === 1)
    return <button onClick={props.onRecommend} disabled={!!busy} className={cls}>{busy === "goal" ? spin : <Target className="w-4 h-4" />}{busy === "goal" ? "Writing goal…" : "Save & recommend IEP goal"}{!busy && arrow}</button>;
  if (step === 2)
    return hasGoalCommitted
      ? <button onClick={props.onNextFromGoal} disabled={!!busy} className={cls}>Save changes & continue {arrow}</button>
      : <button onClick={props.onCommit} disabled={!!busy} className={cls}>{busy === "commit" ? spin : <CheckCircle2 className="w-4 h-4" />}{busy === "commit" ? "Adding…" : "Add to IEP goals"}{!busy && arrow}</button>;
  if (step === 3)
    return <button onClick={props.onBuildUnit} disabled={!!busy} className={cls}>{busy === "unit" ? spin : <Layers className="w-4 h-4" />}{busy === "unit" ? "Building unit…" : "Save & build instructional unit"}{!busy && arrow}</button>;
  if (step === 4)
    return <button onClick={props.onNextFromUnit} className={cls}>Next: worksheets {arrow}</button>;
  return <button onClick={props.onDone} className={cls}><CheckCircle2 className="w-4 h-4" /> Done</button>;
}
