// lib/planning.ts — client-side bridge for the Instructional Planning Assistant
//
// Mirrors lib/materials.ts: each `run*` call POSTs to a planning route, then
// patches the PlanningSession record in Dexie and returns the updated session.

import db from "./db";
import { v4 as uuidv4 } from "uuid";
import type {
  StudentIEPProfile,
  IEPGoal,
  ProgressLogEntry,
  PlanningSession,
  PresentLevelInput,
  PLAAFPAnalysis,
  RecommendedIEPGoal,
  InstructionalUnitContent,
  ProgressAnalysis
} from "@/types/iep";
import {
  buildStudentContextLite,
  buildContextFromRecommendedGoal,
  buildGenerationContext
} from "./generators/context";

export function emptyPresentLevelInput(partial: Partial<PresentLevelInput> = {}): PresentLevelInput {
  return {
    subjectArea: "Mathematics",
    currentGradeLevel: "",
    currentInstructionalLevel: "",
    currentAcademicSkills: "",
    areasOfStrength: "",
    areasOfWeakness: "",
    assessmentResults: "",
    classroomPerformance: "",
    previousGoalsAndProgress: "",
    teacherObservations: "",
    rawNotes: "",
    ...partial,
  };
}

async function persist(session: PlanningSession): Promise<PlanningSession> {
  const next = { ...session, updatedAt: new Date().toISOString() };
  await db.planningSessions.put(next);
  return next;
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request to ${url} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function createPlanningSession(
  profile: StudentIEPProfile,
  input: PresentLevelInput
): Promise<PlanningSession> {
  const now = new Date().toISOString();
  const session: PlanningSession = {
    id: uuidv4(),
    profileId: profile.id,
    subjectArea: input.subjectArea || "Academics",
    status: "draft",
    input,
    accommodationsSelected: profile.accommodations.filter((a) => a.active).map((a) => a.text),
    progressAnalyses: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.planningSessions.put(session);
  return session;
}

export async function savePresentLevel(
  session: PlanningSession,
  input: PresentLevelInput
): Promise<PlanningSession> {
  return persist({ ...session, input, subjectArea: input.subjectArea || session.subjectArea });
}

export async function runPlaafpAnalysis(
  session: PlanningSession,
  profile: StudentIEPProfile
): Promise<PlanningSession> {
  const { content } = await postJson<{ content: PLAAFPAnalysis }>("/api/planning/plaafp", {
    student: buildStudentContextLite(profile),
    input: session.input,
  });
  return persist({ ...session, plaafp: content });
}

export async function savePlaafp(
  session: PlanningSession,
  plaafp: PLAAFPAnalysis
): Promise<PlanningSession> {
  return persist({ ...session, plaafp });
}

export async function runGoalRecommendation(
  session: PlanningSession,
  profile: StudentIEPProfile
): Promise<PlanningSession> {
  if (!session.plaafp) throw new Error("Run the PLAAFP analysis first.");
  const { content } = await postJson<{ content: RecommendedIEPGoal }>("/api/planning/iep-goal", {
    student: buildStudentContextLite(profile),
    plaafp: session.plaafp,
    input: session.input,
  });
  return persist({ ...session, recommendedGoal: content });
}

export async function saveRecommendedGoal(
  session: PlanningSession,
  recommendedGoal: RecommendedIEPGoal
): Promise<PlanningSession> {
  return persist({ ...session, recommendedGoal });
}

export async function saveAccommodationsSelected(
  session: PlanningSession,
  accommodationsSelected: string[]
): Promise<PlanningSession> {
  return persist({ ...session, accommodationsSelected });
}

/**
 * Turn the recommended goal into a real IEPGoal on the student, adopt the
 * generated PLAAFP statement, and link the session to the new goal.
 * Returns the updated session AND the reloaded profile.
 */
export async function commitRecommendedGoal(
  session: PlanningSession,
  profile: StudentIEPProfile
): Promise<{ session: PlanningSession; profile: StudentIEPProfile; goal: IEPGoal }> {
  const rec = session.recommendedGoal;
  if (!rec) throw new Error("No recommended goal to commit.");
  const now = new Date().toISOString();

  const goal: IEPGoal = {
    id: uuidv4(),
    goalText: rec.annualGoalText,
    category: rec.category,
    baselineValue: rec.baselineValue,
    targetValue: rec.targetValue,
    measurementUnit: rec.measurementUnit,
    trialsDenominator: rec.trialsDenominator,
    reviewDate: profile.iepAnnualReviewDate,
    createdAt: now,
    targetSkill: rec.targetSkill,
    baselineStatement: rec.baselineStatement,
    measurementCriteria: rec.measurementCriteria,
    masteryCriteria: rec.masteryCriteria,
    progressMonitoringMethod: rec.progressMonitoringMethod,
    shortTermObjectives: rec.shortTermObjectives,
    instructionalLevel: session.plaafp?.instructionalLevel,
    sourcePlanId: session.id,
  };

  const updatedProfile: StudentIEPProfile = {
    ...profile,
    goals: [...profile.goals, goal],
    plaafpSummary: session.plaafp?.plaafpStatement || profile.plaafpSummary,
    updatedAt: now,
  };
  await db.profiles.put(updatedProfile);

  const updatedSession = await persist({
    ...session,
    goalId: goal.id,
    status: "goal_committed",
  });

  return { session: updatedSession, profile: updatedProfile, goal };
}

export async function runInstructionalUnit(
  session: PlanningSession,
  profile: StudentIEPProfile,
  logs: ProgressLogEntry[] = []
): Promise<PlanningSession> {
  const committedGoal = session.goalId
    ? profile.goals.find((g) => g.id === session.goalId)
    : undefined;

  const context = committedGoal
    ? buildGenerationContext(profile, committedGoal, logs)
    : session.recommendedGoal
    ? buildContextFromRecommendedGoal(profile, session.recommendedGoal, session.accommodationsSelected)
    : null;

  if (!context) throw new Error("Recommend or commit a goal before building the unit.");

  const { content } = await postJson<{ content: InstructionalUnitContent }>(
    "/api/generate/instructional-unit",
    { context, plaafp: session.plaafp, accommodations: session.accommodationsSelected }
  );
  return persist({ ...session, instructionalUnit: content, status: session.goalId ? "active" : session.status });
}

export async function runProgressAnalysis(
  session: PlanningSession,
  goal: IEPGoal,
  logs: ProgressLogEntry[],
  currentDifficultyLevel = 2
): Promise<{ session: PlanningSession; analysis: ProgressAnalysis }> {
  const { content } = await postJson<{ content: ProgressAnalysis }>(
    "/api/planning/progress-analysis",
    {
      goal,
      logs: logs.filter((l) => l.goalId === goal.id),
      instructionalUnit: session.instructionalUnit,
      currentDifficultyLevel,
    }
  );
  const updated = await persist({
    ...session,
    status: "active",
    progressAnalyses: [...session.progressAnalyses, content],
  });
  return { session: updated, analysis: content };
}

export async function getPlanningSessionsForProfile(profileId: string): Promise<PlanningSession[]> {
  return db.planningSessions.where("profileId").equals(profileId).reverse().sortBy("createdAt");
}

export async function getPlanningSession(id: string): Promise<PlanningSession | undefined> {
  return db.planningSessions.get(id);
}

export async function deletePlanningSession(id: string): Promise<void> {
  await db.planningSessions.delete(id);
}

/** Latest difficulty level used for a goal, from prior analyses (defaults to 2). */
export function latestDifficultyForSession(session: PlanningSession): number {
  const last = session.progressAnalyses[session.progressAnalyses.length - 1];
  return last?.recommendedDifficultyLevel ?? 2;
}
