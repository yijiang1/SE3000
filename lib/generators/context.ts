// lib/generators/context.ts — Shared context builder for all SE 3000 materials generators

import type {
  StudentIEPProfile,
  IEPGoal,
  ProgressLogEntry,
  GenerationContext,
  PLAAFPAnalysis,
  PresentLevelInput,
  RecommendedIEPGoal
} from "@/types/iep";
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

/**
 * Lightweight student slice used by the Planning Assistant routes (PLAAFP and
 * IEP-goal recommendation) that run *before* a goal exists.
 */
export type StudentContextLite = GenerationContext["student"];

export function buildStudentContextLite(profile: StudentIEPProfile): StudentContextLite {
  const lp = profile.learningProfile;
  return {
    initials: profile.studentInitials,
    grade: profile.grade,
    eligibility: profile.primaryEligibility,
    readingLevel: lp?.readingLevel || "Grade level",
    comprehensionLevel: lp?.comprehensionLevel || "Standard grade-level comprehension",
    communicationNeeds: lp?.communicationNeeds || ["verbal"],
    sensoryConsiderations: lp?.sensoryConsiderations || [],
    interests: lp?.interests || ["General Animals", "Space", "Science"],
    preferredModality: lp?.preferredModality || ["visual", "hands_on"],
    additionalNotes: lp?.additionalNotes,
  };
}

/**
 * Fabricate a full GenerationContext from a *recommended* (not yet committed)
 * goal so the instructional-unit and worksheet generators can reuse
 * formatContextForPrompt before the goal is saved to the student.
 */
export function buildContextFromRecommendedGoal(
  profile: StudentIEPProfile,
  rec: RecommendedIEPGoal,
  accommodations?: string[]
): GenerationContext {
  return {
    student: buildStudentContextLite(profile),
    goal: {
      id: "recommended-draft",
      goalText: rec.annualGoalText,
      category: rec.category,
      baselineValue: rec.baselineValue,
      targetValue: rec.targetValue,
      measurementUnit: rec.measurementUnit,
      currentValue: rec.baselineValue,
      trendStatus: "no_data",
    },
    accommodations:
      accommodations && accommodations.length > 0
        ? accommodations
        : profile.accommodations.filter((a) => a.active).map((a) => a.text),
  };
}

export function formatStudentContextForPrompt(student: StudentContextLite): string {
  return `
- Student: ${student.initials} (Grade ${student.grade}, Eligibility: ${student.eligibility})
- Reading Level: ${student.readingLevel}
- Comprehension Level: ${student.comprehensionLevel}
- Communication Needs: ${student.communicationNeeds.join(", ")}
- Sensory Considerations: ${student.sensoryConsiderations.join(", ") || "None specified"}
- Strong Interests / Motivators: ${student.interests.join(", ")}
- Preferred Learning Modality: ${student.preferredModality.join(", ")}
${student.additionalNotes ? `- Teacher Notes: ${student.additionalNotes}` : ""}`.trim();
}

export function formatPresentLevelForPrompt(input: PresentLevelInput): string {
  return `
=== TEACHER-REPORTED PRESENT LEVEL DATA ===
- Subject Area: ${input.subjectArea}
- Current Grade Level: ${input.currentGradeLevel}
- Current Instructional Level: ${input.currentInstructionalLevel}
- Current Academic Skills: ${input.currentAcademicSkills || "Not provided"}
- Areas of Strength: ${input.areasOfStrength || "Not provided"}
- Areas of Weakness: ${input.areasOfWeakness || "Not provided"}
- Assessment Results: ${input.assessmentResults || "Not provided"}
- Classroom Performance: ${input.classroomPerformance || "Not provided"}
- Previous IEP Goals & Progress: ${input.previousGoalsAndProgress || "Not provided"}
- Teacher Observations: ${input.teacherObservations || "Not provided"}
${input.rawNotes ? `- Additional Notes / Uploaded Records:\n${input.rawNotes.slice(0, 6000)}` : ""}`.trim();
}

export function formatPlaafpForPrompt(plaafp: PLAAFPAnalysis): string {
  const g = plaafp.skillGaps;
  return `
=== PLAAFP ANALYSIS ===
- Subject Area: ${plaafp.subjectArea}
- Instructional Level: ${plaafp.instructionalLevel}
- PLAAFP Statement: ${plaafp.plaafpStatement}
- Can currently do: ${g.canDoNow.join("; ") || "n/a"}
- Needs to improve: ${g.needsToImprove.join("; ") || "n/a"}
- Distance from grade level: ${g.distanceFromGradeLevel}
- Targeted academic skill: ${g.targetSkill}
- Prioritized skill gaps: ${g.prioritizedSkillGaps.join("; ") || "n/a"}`.trim();
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
