// app/api/planning/iep-goal/route.ts — Stage 2: PLAAFP → measurable, individualized IEP goal
//
// Recommends ONE measurable annual goal built on the student's present level and
// identified skill deficit — individualized to the current instructional level
// rather than copied from a generic grade-level standard.

import { NextRequest, NextResponse } from "next/server";
import type {
  RecommendedIEPGoal,
  PLAAFPAnalysis,
  PresentLevelInput,
  GoalCategory,
  MeasurementUnit
} from "@/types/iep";
import {
  formatStudentContextForPrompt,
  formatPlaafpForPrompt,
  formatPresentLevelForPrompt,
  type StudentContextLite
} from "@/lib/generators/context";
import { generateJSON } from "@/lib/ai/textGen";
import { estimateTextCost, type ProviderPreferences } from "@/lib/ai/providers";

function inferCategory(text: string): GoalCategory {
  const t = text.toLowerCase();
  if (/\b(social|peer|self-regulat|coping|frustrat|behavior|on-task|attention)\b/.test(t)) {
    return /\b(social|peer|emotion|regulat|coping)\b/.test(t) ? "social_emotional" : "behavioral";
  }
  if (/\b(articulat|speech sound|language|expressive|receptive|aac|communicat)\b/.test(t)) return "communication";
  if (/\b(fine motor|gross motor|handwriting|grasp|balance|coordination)\b/.test(t)) return "motor";
  return "academic";
}

/** Pull the first plausible baseline percentage/score out of free text. */
function guessBaseline(...blobs: (string | undefined)[]): number | null {
  for (const blob of blobs) {
    if (!blob) continue;
    const pct = blob.match(/(\d{1,3})\s*%/);
    if (pct) {
      const n = parseInt(pct[1], 10);
      if (n >= 0 && n <= 100) return n;
    }
    const outOf = blob.match(/(\d{1,3})\s*(?:\/|out of)\s*(\d{1,3})/i);
    if (outOf) {
      const num = parseInt(outOf[1], 10);
      const den = parseInt(outOf[2], 10);
      if (den > 0 && num <= den) return Math.round((num / den) * 100);
    }
  }
  return null;
}

function synthesizeGoal(
  student: StudentContextLite,
  plaafp: PLAAFPAnalysis,
  input: PresentLevelInput
): RecommendedIEPGoal {
  const name = student.initials;
  const skill = plaafp.skillGaps.targetSkill || `grade-appropriate ${plaafp.subjectArea.toLowerCase()} skills`;
  const category = inferCategory(`${skill} ${plaafp.subjectArea} ${input.areasOfWeakness}`);

  const baselineValue = guessBaseline(input.assessmentResults, input.previousGoalsAndProgress, input.classroomPerformance) ?? 40;
  const measurementUnit: MeasurementUnit = "%";
  const targetValue = Math.min(90, Math.max(75, baselineValue + 30));
  const trialsDenominator = 5;

  const isReading = /read|decod|fluenc|phonic|comprehen/i.test(`${skill} ${plaafp.subjectArea}`);
  const isMath = /math|equation|comput|fraction|number|operation|word problem/i.test(`${skill} ${plaafp.subjectArea}`);
  const progressMonitoringMethod = isReading
    ? "weekly curriculum-based oral-reading / skill probes, charted on an equal-interval graph"
    : isMath
    ? "weekly curriculum-based measurement (CBM) computation/application probes at the instructional level"
    : "weekly work-sample and observation data scored against a skill rubric";

  const measurementCriteria = `Progress is measured by ${progressMonitoringMethod}. Each data point is scored as percent accuracy on ${trialsDenominator}-item instructional-level probes.`;
  const masteryCriteria = `${targetValue}% accuracy on ${trialsDenominator}-item probes across 4 of 5 consecutive weekly data points.`;

  const annualGoalText =
    `By the annual review date, when presented with instructional-level tasks targeting ${skill}, ` +
    `${name} will demonstrate ${skill} with ${targetValue}% accuracy across 4 of 5 consecutive ${trialsDenominator}-item probes, ` +
    `improving from a baseline of ${baselineValue}%, as measured by ${progressMonitoringMethod}.`;

  const step = Math.round((targetValue - baselineValue) / 4);
  const shortTermObjectives = [1, 2, 3, 4].map((q) => ({
    order: q,
    text:
      q < 4
        ? `By the end of quarter ${q}, ${name} will perform ${skill} with ${Math.min(
            targetValue,
            baselineValue + step * q
          )}% accuracy on instructional-level probes in 3 of 4 sessions${
            q === 1 ? ", with modeling and guided practice faded across the quarter" : ""
          }.`
        : `By the end of quarter 4, ${name} will independently perform ${skill} with ${targetValue}% accuracy across 4 of 5 consecutive probes (annual goal met).`,
  }));

  return {
    targetSkill: skill,
    baselineStatement: `${name} currently performs ${skill} at approximately ${baselineValue}% accuracy at ${plaafp.instructionalLevel} (per ${
      input.assessmentResults?.trim() ? input.assessmentResults.trim().slice(0, 120) : "classroom and progress-monitoring data"
    }).`,
    baselineValue,
    annualGoalText: annualGoalText.replace(/\s+/g, " ").trim(),
    category,
    measurementUnit,
    targetValue,
    trialsDenominator,
    measurementCriteria,
    masteryCriteria,
    progressMonitoringMethod,
    shortTermObjectives,
    rationale: `The target and pacing are set to ${name}'s current instructional level (${plaafp.instructionalLevel}) and a realistic rate of improvement from the ${baselineValue}% baseline, rather than to the ${input.currentGradeLevel}-grade standard. This keeps the goal ambitious but attainable and directly tied to the prioritized skill gap: ${plaafp.skillGaps.prioritizedSkillGaps[0] || skill}.`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const student: StudentContextLite = body.student;
    const plaafp: PLAAFPAnalysis = body.plaafp;
    const input: PresentLevelInput = body.input;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!student || !plaafp || !plaafp.skillGaps) {
      return NextResponse.json({ error: "Missing student context or PLAAFP analysis" }, { status: 400 });
    }

    const promptText = `
You are an expert IEP goal writer. Based on the present level and identified skill deficit,
recommend ONE appropriate, measurable, individualized annual IEP goal.

=== STUDENT ===
${formatStudentContextForPrompt(student)}

${formatPlaafpForPrompt(plaafp)}

${input ? formatPresentLevelForPrompt(input) : ""}

REQUIREMENTS:
1. Individualize the goal to the student's CURRENT INSTRUCTIONAL LEVEL — do NOT simply
   restate a grade-level standard.
2. The goal must be measurable: include target skill, baseline (number), annual target
   (number), measurement unit, measurement criteria, mastery criteria, and a
   progress-monitoring method.
3. Provide 3-4 short-term objectives / benchmarks that scaffold from the baseline to the
   annual target across the year.
4. Explain in "rationale" why the target is set to the instructional level.

Respond with ONLY valid JSON in this exact shape:
{
  "targetSkill": "single concrete skill",
  "baselineStatement": "narrative baseline with data",
  "baselineValue": 40,
  "annualGoalText": "full measurable annual goal statement",
  "category": "academic | behavioral | social_emotional | communication | motor",
  "measurementUnit": "% | count | minutes | trials | rating_scale | frequency",
  "targetValue": 80,
  "trialsDenominator": 5,
  "measurementCriteria": "how progress is measured",
  "masteryCriteria": "what counts as mastered",
  "progressMonitoringMethod": "specific method + frequency",
  "shortTermObjectives": [
    { "order": 1, "text": "benchmark 1" },
    { "order": 2, "text": "benchmark 2" },
    { "order": 3, "text": "benchmark 3" }
  ],
  "rationale": "why this is individualized to the instructional level"
}`.trim();

    const ai = await generateJSON(promptText, { temperature: 0.3, preferredOrder: providerPreferences?.text });
    const parsed: RecommendedIEPGoal | undefined = ai?.json;
    if (parsed?.annualGoalText && typeof parsed?.targetValue === "number") {
      return NextResponse.json({
        content: parsed,
        modelUsed: ai!.model,
        provider: ai!.provider,
        costEstimate: estimateTextCost(ai!.provider, 0.012),
      });
    }

    return NextResponse.json({
      content: synthesizeGoal(student, plaafp, input),
      modelUsed: "se-3000-goal-engine",
      costEstimate: 0.0,
    });
  } catch (error: any) {
    console.error("IEP goal recommendation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to recommend IEP goal" },
      { status: 500 }
    );
  }
}
