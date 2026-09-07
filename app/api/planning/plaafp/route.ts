import { validOutput } from "@/lib/schemas";
import { generationRoute } from "@/lib/apiGuard";
// app/api/planning/plaafp/route.ts — Stage 1: Present Level → PLAAFP + skill-gap analysis
//
// Analyzes teacher-reported present-level data and produces a clear PLAAFP
// statement plus answers to the four required questions:
//   • What can the student currently do?
//   • What skills does the student need to improve?
//   • How far is the student from grade-level expectations?
//   • What specific academic skill should be targeted in the IEP?

import { NextRequest, NextResponse } from "next/server";
import type { PLAAFPAnalysis, PresentLevelInput } from "@/types/iep";
import {
  formatStudentContextForPrompt,
  formatPresentLevelForPrompt,
  type StudentContextLite
} from "@/lib/generators/context";
import { generateJSON } from "@/lib/ai/textGen";
import { estimateTextCost, type ProviderPreferences } from "@/lib/ai/providers";

/** Break a free-text blob into short, de-duplicated bullet phrases. */
function toBullets(text: string, max = 6): string[] {
  if (!text?.trim()) return [];
  const parts = text
    .split(/\n+|(?<=[.;])\s+|\s•\s|\s-\s/)
    .map((s) => s.replace(/^[\s•\-*\d.)]+/, "").trim())
    .filter((s) => s.length > 3);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p.replace(/\.$/, ""));
    if (out.length >= max) break;
  }
  return out;
}

function synthesizePlaafp(student: StudentContextLite, input: PresentLevelInput): PLAAFPAnalysis {
  const name = student.initials;
  const subject = input.subjectArea || "the target academic area";
  const grade = input.currentGradeLevel || student.grade;
  const instr = input.currentInstructionalLevel || "an instructional level not yet documented";

  const canDoNow = [
    ...toBullets(input.areasOfStrength, 3),
    ...toBullets(input.currentAcademicSkills, 3),
  ].slice(0, 5);
  const needsToImprove = [
    ...toBullets(input.areasOfWeakness, 4),
    ...toBullets(input.previousGoalsAndProgress, 2),
  ].slice(0, 5);

  const targetSkill =
    needsToImprove[0] ||
    toBullets(input.areasOfWeakness, 1)[0] ||
    `grade-appropriate ${subject.toLowerCase()} skills`;

  const distanceFromGradeLevel = "A grade-level gap has not been established by this local template. Compare the documented instructional level and assessment results with the relevant grade-level benchmarks before drawing conclusions.";

  const plaafpStatement =
    `Local template — review before use. ${name} is a ${grade}-grade student receiving special education services. In ${subject}, ${name} currently performs at ${instr}. ` +
    (canDoNow.length
      ? `${name} is able to ${canDoNow.slice(0, 3).join("; ")}. `
      : "") +
    (input.classroomPerformance?.trim()
      ? `In the classroom, ${input.classroomPerformance.trim().slice(0, 220)} `
      : "") +
    (needsToImprove.length
      ? `Areas of need include ${needsToImprove.slice(0, 3).join("; ")}. `
      : "") +
    (input.assessmentResults?.trim()
      ? `Assessment results: ${input.assessmentResults.trim().slice(0, 220)}. `
      : "") +
    (input.teacherObservations?.trim()
      ? `Teacher observations note that ${input.teacherObservations.trim().slice(0, 220)} `
      : "") +
    `This present level of performance establishes the baseline for a measurable annual goal targeting ${targetSkill}.`;

  return {
    plaafpStatement: plaafpStatement.replace(/\s+/g, " ").trim(),
    subjectArea: subject,
    instructionalLevel: instr,
    skillGaps: {
      canDoNow: canDoNow.length ? canDoNow : ["Current skills have not been documented."],
      needsToImprove: needsToImprove.length ? needsToImprove : ["Areas of need have not been documented."],
      distanceFromGradeLevel: distanceFromGradeLevel.replace(/\s+/g, " ").trim(),
      targetSkill,
      prioritizedSkillGaps: (needsToImprove.length ? needsToImprove : [targetSkill]).slice(0, 5),
    },
  };
}

export const POST = generationRoute(async (req, body) => {
  try {
    const student: StudentContextLite = body.student;
    const input: PresentLevelInput = body.input;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!student || !input || !input.subjectArea) {
      return NextResponse.json(
        { error: "Missing student context or present-level input (subjectArea required)" },
        { status: 400 }
      );
    }

    const promptText = `
You are an expert Special Education Diagnostician and IEP writer.
Analyze the teacher-reported present-level data below and produce a clear, compliant
Present Level of Academic Achievement and Functional Performance (PLAAFP) statement,
then answer the four required analysis questions.

=== STUDENT ===
${formatStudentContextForPrompt(student)}

${formatPresentLevelForPrompt(input)}

GUIDELINES:
1. The PLAAFP statement must be specific, strengths-based, data-referenced, and written in
   professional IEP language. Cite the assessment results and classroom performance given.
2. Anchor everything to the student's CURRENT INSTRUCTIONAL LEVEL, not just the grade level.
3. "targetSkill" must be a single, concrete, measurable academic skill (e.g.
   "solving one-variable linear equations", "reading multisyllabic words with vowel teams").
4. Never invent assessment results or missing student facts. Mark unknown information explicitly.
5. Be honest about the size of the gap from grade-level expectations.

Respond with ONLY valid JSON in this exact shape:
{
  "plaafpStatement": "full PLAAFP narrative paragraph",
  "subjectArea": "${input.subjectArea}",
  "instructionalLevel": "concise current instructional level",
  "skillGaps": {
    "canDoNow": ["specific skill the student can do now", "..."],
    "needsToImprove": ["specific skill to improve", "..."],
    "distanceFromGradeLevel": "1-3 sentence explanation of the gap with data",
    "targetSkill": "the single academic skill to target in the IEP goal",
    "prioritizedSkillGaps": ["most urgent gap", "next", "..."]
  }
}`.trim();

    const ai = await generateJSON(promptText, { temperature: 0.3, validate: (value) => validOutput("plaafp", value), preferredOrder: providerPreferences?.text });
    const parsed: PLAAFPAnalysis | undefined = ai?.json;
    if (parsed?.plaafpStatement && parsed?.skillGaps?.targetSkill) {
      return NextResponse.json({
        content: parsed,
        modelUsed: ai!.model,
        provider: ai!.provider,
        costEstimate: estimateTextCost(ai!.provider, 0.012),
      });
    }

    if (input.rawNotes?.trim()) {
      return NextResponse.json({error:"The local template cannot interpret uploaded records. Copy the relevant evidence into the structured assessment/skills fields and clear the raw notes, or configure an AI provider and retry. No assessment has been inferred from the upload."}, {status:422});
    }
    return NextResponse.json({
      content: synthesizePlaafp(student, input),
      modelUsed: "se-3000-plaafp-engine",
      costEstimate: 0.0,
    });
  } catch (error: any) {
    console.error("PLAAFP analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze present level" },
      { status: 500 }
    );
  }
});
