// app/api/planning/progress-analysis/route.ts — Stage 6: track progress toward the IEP goal
//
// Reads logged performance data and returns accuracy/mastery, struggling areas,
// the recommended next instructional step, a difficulty level for the next
// worksheet, and whether the student is making adequate progress.

import { NextRequest, NextResponse } from "next/server";
import type {
  IEPGoal,
  ProgressLogEntry,
  ProgressAnalysis,
  InstructionalUnitContent
} from "@/types/iep";
import { computeTrend } from "@/lib/trending";
import { generateJSON } from "@/lib/ai/textGen";
import { estimateTextCost, type ProviderPreferences } from "@/lib/ai/providers";

const NEGATIVE_HINTS = /(struggl|difficult|missed|error|incorrect|prompt|redirect|distract|regress|confus|reteach|below|declin)/i;

function synthesizeAnalysis(
  goal: IEPGoal,
  logs: ProgressLogEntry[],
  currentDifficultyLevel: number,
  unit?: InstructionalUnitContent
): ProgressAnalysis {
  const goalLogs = [...logs]
    .filter((l) => l.goalId === goal.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const trend = computeTrend(goal, goalLogs);

  const values = goalLogs.map((l) => l.value);
  const latest = values.length ? values[values.length - 1] : null;
  const avg = values.length
    ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
    : null;

  const toPct = (v: number | null) => {
    if (v === null) return null;
    if (goal.measurementUnit === "%") return Math.round(v);
    const range = goal.targetValue - goal.baselineValue || 1;
    return Math.round(((v - goal.baselineValue) / range) * 100);
  };

  const masteryPercent = trend.percentToTarget;
  const recentNegatives = goalLogs
    .slice(-4)
    .filter((l) => l.note && NEGATIVE_HINTS.test(l.note))
    .map((l) => l.note!.trim());

  const strugglingAreas = recentNegatives.length
    ? Array.from(new Set(recentNegatives)).slice(0, 3)
    : trend.status === "off_track" || trend.status === "at_risk"
    ? [`Consistency on ${goal.targetSkill || "the target skill"} across sessions`, "Independent application without prompting"]
    : [];

  // Difficulty recommendation relative to what was last used.
  const base = Math.max(1, Math.min(5, Math.round(currentDifficultyLevel || 2)));
  let recommendedDifficultyLevel = base;
  if (trend.status === "on_track" && (masteryPercent ?? 0) >= 70) recommendedDifficultyLevel = Math.min(5, base + 1);
  else if (trend.status === "off_track") recommendedDifficultyLevel = Math.max(1, base - 1);

  const adequateProgress =
    trend.status === "on_track" ||
    (trend.status === "at_risk" && (trend.slope ?? 0) > 0);

  const nextStepFromUnit = (() => {
    if (!unit?.steps?.length) return null;
    // Map mastery % onto the unit sequence.
    const idx = Math.min(
      unit.steps.length - 1,
      Math.max(0, Math.floor(((masteryPercent ?? 0) / 100) * unit.steps.length))
    );
    const step = unit.steps[idx];
    return `${step.title}: ${step.objective}`;
  })();

  const nextInstructionalStep =
    trend.status === "off_track"
      ? `Reteach the current step with heavier scaffolding and drop worksheet difficulty to level ${recommendedDifficultyLevel}. ${
          nextStepFromUnit ? `Focus: ${nextStepFromUnit}` : ""
        }`.trim()
      : trend.status === "at_risk"
      ? `Hold difficulty at level ${recommendedDifficultyLevel}, add a guided-practice set, and progress-monitor twice this week. ${
          nextStepFromUnit ? `Focus: ${nextStepFromUnit}` : ""
        }`.trim()
      : trend.status === "on_track"
      ? `Advance: raise worksheet difficulty to level ${recommendedDifficultyLevel} and move to the next unit step. ${
          nextStepFromUnit ? `Next: ${nextStepFromUnit}` : ""
        }`.trim()
      : `Collect at least 2 more data points before adjusting instruction. ${
          nextStepFromUnit ? `Continue: ${nextStepFromUnit}` : ""
        }`.trim();

  const unit_ = goal.measurementUnit === "%" ? "%" : ` ${goal.measurementUnit}`;
  const narrative =
    goalLogs.length < 2
      ? `Only ${goalLogs.length} data point(s) logged for "${goal.targetSkill || goal.goalText}". Log a few more progress-monitoring probes to establish a trend before adjusting instruction.`
      : `Across ${goalLogs.length} data points, ${
          latest !== null ? `the most recent score is ${latest}${unit_}` : "no recent score is available"
        } (average ${avg}${unit_}) against a target of ${goal.targetValue}${unit_}. ` +
        `That is about ${masteryPercent}% of the way from baseline to target. ` +
        `The linear trend projects ${trend.projectedValue}${unit_} by the review date — status ${trend.status.replace("_", " ")}. ` +
        `${adequateProgress ? "Progress is adequate toward the annual goal." : "Progress is not yet adequate; an instructional change is warranted."} ` +
        (strugglingAreas.length ? `Persistent difficulty: ${strugglingAreas.join("; ")}.` : "");

  return {
    goalId: goal.id,
    observations: goalLogs.length,
    currentAccuracy: toPct(latest),
    averageAccuracy: toPct(avg),
    masteryPercent,
    trendStatus: trend.status,
    projectedValue: trend.projectedValue,
    strugglingAreas,
    nextInstructionalStep,
    recommendedDifficultyLevel,
    adequateProgress,
    narrative: narrative.replace(/\s+/g, " ").trim(),
    createdAt: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const goal: IEPGoal = body.goal;
    const logs: ProgressLogEntry[] = Array.isArray(body.logs) ? body.logs : [];
    const unit: InstructionalUnitContent | undefined = body.instructionalUnit;
    const currentDifficultyLevel: number = Number(body.currentDifficultyLevel) || 2;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!goal || !goal.id) {
      return NextResponse.json({ error: "Missing goal" }, { status: 400 });
    }

    const local = synthesizeAnalysis(goal, logs, currentDifficultyLevel, unit);

    if (local.observations >= 2) {
      const dataTable = [...logs]
          .filter((l) => l.goalId === goal.id)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((l) => `${l.date}: ${l.value}${goal.measurementUnit}${l.note ? ` — ${l.note}` : ""}`)
          .join("\n");
        const promptText = `
You are an expert Special Education data analyst. Analyze this progress-monitoring data
for the IEP goal and decide the next instructional move.

GOAL: ${goal.goalText}
TARGET SKILL: ${goal.targetSkill || "(see goal text)"}
BASELINE: ${goal.baselineValue}${goal.measurementUnit}  TARGET: ${goal.targetValue}${goal.measurementUnit}
LAST WORKSHEET DIFFICULTY: ${currentDifficultyLevel}/5
${unit ? `UNIT STEPS: ${unit.steps.map((s) => `${s.order}. ${s.title}`).join(" | ")}` : ""}

DATA POINTS (oldest first):
${dataTable}

COMPUTED TREND (authoritative — do not contradict): status=${local.trendStatus},
projectedValue=${local.projectedValue}, masteryPercent=${local.masteryPercent}.

Respond with ONLY valid JSON:
{
  "strugglingAreas": ["..."],
  "nextInstructionalStep": "concrete next step",
  "recommendedDifficultyLevel": 1-5,
  "adequateProgress": true,
  "narrative": "2-4 sentence plain-language analysis for a progress report"
}`.trim();

      const ai = await generateJSON(promptText, { temperature: 0.3, preferredOrder: providerPreferences?.text });
      const parsed = ai?.json;
      if (parsed?.nextInstructionalStep) {
        return NextResponse.json({
          content: {
            ...local,
            strugglingAreas: Array.isArray(parsed.strugglingAreas) ? parsed.strugglingAreas : local.strugglingAreas,
            nextInstructionalStep: parsed.nextInstructionalStep,
            recommendedDifficultyLevel:
              Math.max(1, Math.min(5, Math.round(parsed.recommendedDifficultyLevel))) || local.recommendedDifficultyLevel,
            adequateProgress:
              typeof parsed.adequateProgress === "boolean" ? parsed.adequateProgress : local.adequateProgress,
            narrative: parsed.narrative || local.narrative,
          } as ProgressAnalysis,
          modelUsed: ai!.model,
          provider: ai!.provider,
          costEstimate: estimateTextCost(ai!.provider, 0.01),
        });
      }
    }

    return NextResponse.json({
      content: local,
      modelUsed: "se-3000-progress-engine",
      costEstimate: 0.0,
    });
  } catch (error: any) {
    console.error("Progress analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze progress" },
      { status: 500 }
    );
  }
}
