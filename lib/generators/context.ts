// lib/generators/context.ts — Shared context builder for all SE 3000 materials generators

import type { StudentIEPProfile, IEPGoal, ProgressLogEntry, GenerationContext } from "@/types/iep";
import { computeTrend } from "../trending";

export function buildGenerationContext(
  profile: StudentIEPProfile,
  goal: IEPGoal,
  logs: ProgressLogEntry[]
): GenerationContext {
  const goalLogs = logs.filter((l) => l.goalId === goal.id);
  const trend = computeTrend(goal, goalLogs);

  const activeAccommodations = profile.accommodations
    .filter((a) => a.active)
    .map((a) => a.text);

  return {
    student: {
      initials: profile.studentInitials,
      grade: profile.grade,
      eligibility: profile.primaryEligibility,
      readingLevel: profile.learningProfile?.readingLevel || "Grade level",
      comprehensionLevel: profile.learningProfile?.comprehensionLevel || "Standard grade-level comprehension",
      communicationNeeds: profile.learningProfile?.communicationNeeds || ["verbal"],
      sensoryConsiderations: profile.learningProfile?.sensoryConsiderations || [],
      interests: profile.learningProfile?.interests || ["General Animals", "Space", "Science"],
      preferredModality: profile.learningProfile?.preferredModality || ["visual", "hands_on"],
      additionalNotes: profile.learningProfile?.additionalNotes,
    },
    goal: {
      id: goal.id,
      goalText: goal.goalText,
      category: goal.category,
      baselineValue: goal.baselineValue,
      targetValue: goal.targetValue,
      measurementUnit: goal.measurementUnit,
      currentValue: trend.latestValue ?? undefined,
      trendStatus: trend.status,
    },
    accommodations: activeAccommodations,
  };
}

export function formatContextForPrompt(ctx: GenerationContext): string {
  return `
=== STUDENT IEP PROFILE & LEARNING CONTEXT ===
- Student: ${ctx.student.initials} (Grade ${ctx.student.grade}, Eligibility: ${ctx.student.eligibility})
- Reading Level: ${ctx.student.readingLevel}
- Comprehension Level: ${ctx.student.comprehensionLevel}
- Communication Needs: ${ctx.student.communicationNeeds.join(", ")}
- Sensory Considerations: ${ctx.student.sensoryConsiderations.join(", ") || "None specified"}
- Strong Interests / Motivators: ${ctx.student.interests.join(", ")}
- Preferred Learning Modality: ${ctx.student.preferredModality.join(", ")}
${ctx.student.additionalNotes ? `- Teacher Notes: ${ctx.student.additionalNotes}` : ""}

=== TARGET IEP GOAL ===
- Category: ${ctx.goal.category}
- Goal Statement: "${ctx.goal.goalText}"
- Baseline: ${ctx.goal.baselineValue}${ctx.goal.measurementUnit} | Target: ${ctx.goal.targetValue}${ctx.goal.measurementUnit}
${ctx.goal.currentValue !== undefined ? `- Current Progress: ${ctx.goal.currentValue}${ctx.goal.measurementUnit} (${ctx.goal.trendStatus || "in progress"})` : ""}

=== ACTIVE ACCOMMODATIONS ===
${ctx.accommodations.length > 0 ? ctx.accommodations.map((a) => `- ${a}`).join("\n") : "- Standard instructional supports"}
`.trim();
}
