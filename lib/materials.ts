// lib/materials.ts — Client-side materials manager and Dexie persistence bridge

import db from "./db";
import { v4 as uuidv4 } from "uuid";
import type {
  StudentIEPProfile,
  IEPGoal,
  ProgressLogEntry,
  MaterialType,
  GeneratedMaterial,
  MiniGameEngineType,
  WorksheetSpec,
  PLAAFPAnalysis
} from "@/types/iep";
import { buildGenerationContext } from "./generators/context";
import { getAppSettings } from "./settings";
import { logUsage } from "./usage";

export interface GenerateOptions {
  customPrompt?: string;
  miniGameEngine?: MiniGameEngineType;
  musicPurpose?: "mnemonic_song" | "calming_focus" | "reward_jingle" | "transition_cue";
  musicDuration?: "clip" | "pro";
  narrationVoice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  narrationSpeed?: number;
  narrationText?: string;
  worksheetSpec?: WorksheetSpec;
  plaafp?: PLAAFPAnalysis;
}

export async function generateAndSaveMaterial(
  profile: StudentIEPProfile,
  goal: IEPGoal,
  logs: ProgressLogEntry[],
  type: MaterialType,
  options: GenerateOptions = {}
): Promise<GeneratedMaterial> {
  const context = buildGenerationContext(profile, goal, logs);
  const now = new Date().toISOString();
  const materialId = uuidv4();

  const tempRecord: GeneratedMaterial = {
    id: materialId,
    profileId: profile.id,
    goalId: goal.id,
    type,
    status: "generating",
    title: `Generating ${type.replace("_", " ")}…`,
    description: `Targeting: ${goal.goalText.slice(0, 50)}…`,
    promptUsed: options.customPrompt || `Standard ${type} generation for ${profile.studentInitials}`,
    modelUsed: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await db.generatedMaterials.put(tempRecord);

  let endpoint = "/api/generate/slides";
  let payload: any = { context, customPrompt: options.customPrompt };

  switch (type) {
    case "slide_deck":
      endpoint = "/api/generate/slides";
      break;
    case "board_game":
      endpoint = "/api/generate/board-game";
      break;
    case "mini_game":
      endpoint = "/api/generate/mini-game";
      payload.engineType = options.miniGameEngine || "matching";
      break;
    case "music":
      endpoint = "/api/generate/music";
      payload.purpose = options.musicPurpose || "mnemonic_song";
      payload.durationType = options.musicDuration || "clip";
      break;
    case "narration":
      endpoint = "/api/generate/narration";
      payload.voice = options.narrationVoice || "nova";
      payload.speed = options.narrationSpeed ?? 0.9;
      payload.textOverride = options.narrationText;
      break;
    case "video_clip":
      endpoint = "/api/generate/video";
      break;
    case "worksheet":
      endpoint = "/api/generate/worksheet";
      payload.spec = options.worksheetSpec || {
        purpose: "practice",
        numQuestions: 8,
        difficultyLevel: 2,
        questionType: "mixed",
        readingLevel: profile.learningProfile?.readingLevel || "Grade level",
        scaffolding: "moderate",
        includeAnswerKey: true,
        includeVisualSupports: true,
        modifiedProblems: false,
        printable: true,
      };
      payload.plaafp = options.plaafp;
      break;
  }

  try {
    const settings = await getAppSettings();
    payload.providerPreferences = settings.providerPreferences;

    const res = await fetch(endpoint, {
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

    const worksheetDescription =
      type === "worksheet" && content.targetSkill
        ? `${content.items?.length ?? "?"}-item ${String(content.purpose || "practice").replace(/_/g, " ")} · Difficulty ${content.difficultyLevel ?? "?"}/5 · ${content.targetSkill}`
        : null;

    const readyRecord: GeneratedMaterial = {
      id: materialId,
      profileId: profile.id,
      goalId: goal.id,
      type,
      status: "ready",
      title: content.title || content.gameTitle || `${type.replace("_", " ")} Resource`,
      description: worksheetDescription || content.topic || content.instructions || content.objective || `Personalized ${type.replace("_", " ")} resource for ${profile.studentInitials}`,
      promptUsed: options.customPrompt || `Generated with ${type} engine`,
      modelUsed: data.modelUsed || "se-3000-engine",
      generationCostEstimate: data.costEstimate || 0,
      contentJson: JSON.stringify(content),
      createdAt: now,
      updatedAt: new Date().toISOString(),
    };

    await db.generatedMaterials.put(readyRecord);
    await logUsage(type, readyRecord.modelUsed, readyRecord.generationCostEstimate || 0, data.provider);
    return readyRecord;
  } catch (err: any) {
    const errorRecord: GeneratedMaterial = {
      ...tempRecord,
      status: "error",
      error: err.message || "Failed to generate material",
      updatedAt: new Date().toISOString(),
    };
    await db.generatedMaterials.put(errorRecord);
    throw err;
  }
}

export async function deleteMaterial(materialId: string): Promise<void> {
  await db.transaction("rw", db.generatedMaterials, db.materialBlobs, async () => {
    await db.generatedMaterials.delete(materialId);
    await db.materialBlobs.where("materialId").equals(materialId).delete();
  });
}

/**
 * Remove orphaned "generating" placeholder records left behind when a
 * generation request was interrupted (tab closed, navigation, hard reload).
 * Generation only runs within a live page session, so any such record found
 * on load is stale. Returns the number of records purged.
 */
export async function cleanupStaleMaterials(): Promise<number> {
  const stale = await db.generatedMaterials
    .where("status")
    .equals("generating")
    .toArray();

  if (stale.length === 0) return 0;

  await db.transaction("rw", db.generatedMaterials, db.materialBlobs, async () => {
    for (const m of stale) {
      await db.generatedMaterials.delete(m.id);
      await db.materialBlobs.where("materialId").equals(m.id).delete();
    }
  });

  return stale.length;
}

export async function getMaterialsForProfile(profileId: string): Promise<GeneratedMaterial[]> {
  return await db.generatedMaterials
    .where("profileId")
    .equals(profileId)
    .reverse()
    .sortBy("createdAt");
}

export async function getMaterialsForGoal(goalId: string): Promise<GeneratedMaterial[]> {
  return await db.generatedMaterials
    .where("goalId")
    .equals(goalId)
    .reverse()
    .sortBy("createdAt");
}
