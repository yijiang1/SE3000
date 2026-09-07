// lib/firstDayMaterials.ts — Client-side manager for First-Day Materials
// (Teacher Introduction, Classroom Expectations, Icebreaker Activities,
// Family Welcome Letters & the Getting-to-Know-You Survey)

import db from "./db";
import { v4 as uuidv4 } from "uuid";
import type {
  TeacherProfile,
  ClassroomProfile,
  IcebreakerProfile,
  SurveyProfile,
  FirstDayMaterialCategory,
  FirstDayMaterialFormat,
  FirstDayMaterial
} from "@/types/iep";
import { getAppSettings } from "./settings";
import { logUsage } from "./usage";

// Family Welcome Letter has no dedicated profile of its own — it's generated
// from the existing Teacher (+ optional Classroom) profile, bundled together.
export interface FamilyLetterSubject {
  teacher: TeacherProfile;
  classroom?: ClassroomProfile | null;
}

type FirstDaySubject = TeacherProfile | ClassroomProfile | IcebreakerProfile | SurveyProfile | FamilyLetterSubject;

const TEACHER_PROFILE_ID = "current-teacher";
const CLASSROOM_PROFILE_ID = "current-classroom";
const ICEBREAKER_PROFILE_ID = "current-icebreakers";
const SURVEY_PROFILE_ID = "current-survey";

export const DEFAULT_SURVEY_QUESTIONS = [
  "What is your favorite thing to do for fun?",
  "What subject do you enjoy the most, and why?",
  "What is something you're really good at?",
  "What is something new you'd like to learn this year?",
  "What helps you feel comfortable when you're having a hard day?",
  "Do you have a favorite book, show, or game? Tell me about it!",
  "What is one thing you want your teacher to know about you?",
];

// ── Teacher Profile ──────────────────────────────────────────────────────
export function emptyTeacherProfile(): TeacherProfile {
  const now = new Date().toISOString();
  return {
    id: TEACHER_PROFILE_ID,
    name: "",
    roleTitle: "",
    subjectsOrGrades: "",
    yearsExperience: "",
    hobbiesAndInterests: [],
    funFacts: [],
    favoriteQuote: "",
    teachingPhilosophy: "",
    funLearningGoalForStudents: "",
    contactInfo: "",
    themeColor: "#4f46e5",
    photoDataUrl: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTeacherProfile(): Promise<TeacherProfile | null> {
  const existing = await db.teacherProfiles.get(TEACHER_PROFILE_ID);
  return existing ?? null;
}

export async function saveTeacherProfile(profile: Partial<TeacherProfile>): Promise<TeacherProfile> {
  const existing = await db.teacherProfiles.get(TEACHER_PROFILE_ID);
  const now = new Date().toISOString();
  const merged: TeacherProfile = {
    ...emptyTeacherProfile(),
    ...existing,
    ...profile,
    id: TEACHER_PROFILE_ID,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await db.teacherProfiles.put(merged);
  return merged;
}

// ── Classroom Profile ────────────────────────────────────────────────────
export function emptyClassroomProfile(): ClassroomProfile {
  const now = new Date().toISOString();
  return {
    id: CLASSROOM_PROFILE_ID,
    classroomName: "",
    rules: [],
    routines: [],
    rewardsSystem: "",
    consequencesSystem: "",
    theme: "",
    additionalNotes: "",
    themeColor: "#0891b2",
    createdAt: now,
    updatedAt: now,
  };
}

export async function getClassroomProfile(): Promise<ClassroomProfile | null> {
  const existing = await db.classroomProfiles.get(CLASSROOM_PROFILE_ID);
  return existing ?? null;
}

export async function saveClassroomProfile(profile: Partial<ClassroomProfile>): Promise<ClassroomProfile> {
  const existing = await db.classroomProfiles.get(CLASSROOM_PROFILE_ID);
  const now = new Date().toISOString();
  const merged: ClassroomProfile = {
    ...emptyClassroomProfile(),
    ...existing,
    ...profile,
    id: CLASSROOM_PROFILE_ID,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await db.classroomProfiles.put(merged);
  return merged;
}

// ── Icebreaker Profile ───────────────────────────────────────────────────
export function emptyIcebreakerProfile(): IcebreakerProfile {
  const now = new Date().toISOString();
  return {
    id: ICEBREAKER_PROFILE_ID,
    theme: "",
    groupSize: "Whole class",
    durationMinutes: "10-15 minutes",
    numberOfActivities: 3,
    activityStyles: [],
    specialConsiderations: "",
    additionalNotes: "",
    themeColor: "#db2777",
    createdAt: now,
    updatedAt: now,
  };
}

export async function getIcebreakerProfile(): Promise<IcebreakerProfile | null> {
  const existing = await db.icebreakerProfiles.get(ICEBREAKER_PROFILE_ID);
  return existing ?? null;
}

export async function saveIcebreakerProfile(profile: Partial<IcebreakerProfile>): Promise<IcebreakerProfile> {
  const existing = await db.icebreakerProfiles.get(ICEBREAKER_PROFILE_ID);
  const now = new Date().toISOString();
  const merged: IcebreakerProfile = {
    ...emptyIcebreakerProfile(),
    ...existing,
    ...profile,
    id: ICEBREAKER_PROFILE_ID,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await db.icebreakerProfiles.put(merged);
  return merged;
}

// ── Survey Profile (Getting-to-Know-You questionnaire) ──────────────────
export function emptySurveyProfile(): SurveyProfile {
  const now = new Date().toISOString();
  return {
    id: SURVEY_PROFILE_ID,
    title: "All About Me!",
    introMessage: "",
    questions: [...DEFAULT_SURVEY_QUESTIONS],
    theme: "",
    themeColor: "#7c3aed",
    createdAt: now,
    updatedAt: now,
  };
}

export async function getSurveyProfile(): Promise<SurveyProfile | null> {
  const existing = await db.surveyProfiles.get(SURVEY_PROFILE_ID);
  return existing ?? null;
}

export async function saveSurveyProfile(profile: Partial<SurveyProfile>): Promise<SurveyProfile> {
  const existing = await db.surveyProfiles.get(SURVEY_PROFILE_ID);
  const now = new Date().toISOString();
  const merged: SurveyProfile = {
    ...emptySurveyProfile(),
    ...existing,
    ...profile,
    id: SURVEY_PROFILE_ID,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await db.surveyProfiles.put(merged);
  return merged;
}

// ── First-Day Materials (shared by all five categories) ─────────────────
export interface GenerateFirstDayMaterialOptions {
  customPrompt?: string;
}

function subjectLabelFor(category: FirstDayMaterialCategory, subject: FirstDaySubject): string {
  if (category === "teacher_intro") return (subject as TeacherProfile).name || "your class";
  if (category === "classroom_expectations") return (subject as ClassroomProfile).classroomName || "your classroom";
  if (category === "icebreaker_activities") return (subject as IcebreakerProfile).theme || "your class";
  if (category === "family_letter") return (subject as FamilyLetterSubject).teacher.name || "your class";
  return (subject as SurveyProfile).title || "your class";
}

function buildPayload(category: FirstDayMaterialCategory, subject: FirstDaySubject): Record<string, unknown> {
  if (category === "family_letter") {
    const { teacher, classroom } = subject as FamilyLetterSubject;
    return classroom ? { teacher, classroom } : { teacher };
  }
  const SUBJECT_PAYLOAD_KEY: Record<Exclude<FirstDayMaterialCategory, "family_letter">, string> = {
    teacher_intro: "teacher",
    classroom_expectations: "classroom",
    icebreaker_activities: "icebreaker",
    getting_to_know_you: "survey",
  };
  return { [SUBJECT_PAYLOAD_KEY[category]]: subject };
}

async function runOneFirstDayGeneration(
  category: FirstDayMaterialCategory,
  subject: FirstDaySubject,
  format: FirstDayMaterialFormat,
  options: GenerateFirstDayMaterialOptions,
  payload: any
): Promise<FirstDayMaterial> {
  const now = new Date().toISOString();
  const materialId = uuidv4();
  const subjectLabel = subjectLabelFor(category, subject);

  const tempRecord: FirstDayMaterial = {
    id: materialId,
    category,
    format,
    status: "generating",
    title: `Generating ${format.replace("_", " ")}…`,
    description: `First-day material for ${subjectLabel}`,
    promptUsed: options.customPrompt || `Standard ${format} generation for ${category}`,
    modelUsed: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await db.firstDayMaterials.put(tempRecord);

  try {
    const res = await fetch("/api/generate/first-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Generation failed with status ${res.status}`);
    }

    const data = await res.json();
    const content = data.content;

    const readyRecord: FirstDayMaterial = {
      id: materialId,
      category,
      format,
      status: "ready",
      title: content.title || `${subjectLabel} — ${format.replace("_", " ")}`,
      description: content.tagline || content.topic || `First-day ${category.replace("_", " ")} · ${format.replace("_", " ")}`,
      promptUsed: options.customPrompt || `Generated with first-day engine`,
      modelUsed: data.modelUsed || "se-3000-engine",
      provider: data.provider,
      generationCostEstimate: data.costEstimate || 0,
      contentJson: JSON.stringify(content),
      createdAt: now,
      updatedAt: new Date().toISOString(),
    };

    await db.firstDayMaterials.put(readyRecord);
    await logUsage("first_day", readyRecord.modelUsed, readyRecord.generationCostEstimate || 0, data.provider);
    return readyRecord;
  } catch (err: any) {
    const errorRecord: FirstDayMaterial = {
      ...tempRecord,
      status: "error",
      error: err.message || "Failed to generate first-day material",
      updatedAt: new Date().toISOString(),
    };
    await db.firstDayMaterials.put(errorRecord);
    throw err;
  }
}

export async function generateAndSaveFirstDayMaterial(
  category: FirstDayMaterialCategory,
  subject: FirstDaySubject,
  format: FirstDayMaterialFormat,
  options: GenerateFirstDayMaterialOptions = {}
): Promise<FirstDayMaterial> {
  const payload: any = { category, format, customPrompt: options.customPrompt, ...buildPayload(category, subject) };
  const settings = await getAppSettings();
  payload.providerPreferences = settings.providerPreferences;

  return runOneFirstDayGeneration(category, subject, format, options, payload);
}

/**
 * Generate the same first-day material once per given text provider so a
 * teacher can compare results and keep the best one. Every first-day format
 * (slide deck, webpage, storyboard) is driven purely by the text-generation
 * chain, so the provider set is always "text".
 */
export async function generateFirstDayMaterialVariants(
  category: FirstDayMaterialCategory,
  subject: FirstDaySubject,
  format: FirstDayMaterialFormat,
  providerIds: string[],
  options: GenerateFirstDayMaterialOptions = {}
): Promise<FirstDayMaterial[]> {
  const basePayload: any = { category, format, customPrompt: options.customPrompt, ...buildPayload(category, subject) };

  const settled = await Promise.allSettled(
    providerIds.map(async (providerId) => {
      const payload = { ...basePayload, providerPreferences: { text: [providerId] } };
      const result = await runOneFirstDayGeneration(category, subject, format, options, payload);
      // See generateMaterialVariants for why: a forced single-provider
      // request can silently fall back to local without throwing, so label
      // the card with what was actually requested in that case.
      if (result.status === "ready" && !result.provider) {
        const tagged: FirstDayMaterial = { ...result, provider: providerId };
        await db.firstDayMaterials.put(tagged);
        return tagged;
      }
      return result;
    })
  );

  return settled
    .filter((r): r is PromiseFulfilledResult<FirstDayMaterial> => r.status === "fulfilled")
    .map((r) => r.value);
}

export async function deleteFirstDayMaterial(materialId: string): Promise<void> {
  await db.firstDayMaterials.delete(materialId);
}

/**
 * Remove orphaned "generating" placeholder records left behind when a
 * generation request was interrupted (tab closed, navigation, hard reload).
 */
export async function cleanupStaleFirstDayMaterials(): Promise<number> {
  const stale = await db.firstDayMaterials.where("status").equals("generating").toArray();
  if (stale.length === 0) return 0;
  await db.firstDayMaterials.bulkDelete(stale.map((m) => m.id));
  return stale.length;
}

export async function getFirstDayMaterials(category: FirstDayMaterialCategory): Promise<FirstDayMaterial[]> {
  return await db.firstDayMaterials.where("category").equals(category).reverse().sortBy("createdAt");
}
