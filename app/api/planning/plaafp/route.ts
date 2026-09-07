// app/api/planning/plaafp/route.ts — Stage 1: Present Level → PLAAFP + skill-gap analysis
//
// Analyzes teacher-reported present-level data and produces a clear PLAAFP
// statement plus answers to the four required questions:
//   • What can the student currently do?
//   • What skills does the student need to improve?
//   • How far is the student from grade-level expectations?
//   • What specific academic skill should be targeted in the IEP?

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { PLAAFPAnalysis, PresentLevelInput } from "@/types/iep";
import {
  formatStudentContextForPrompt,
  formatPresentLevelForPrompt,
  type StudentContextLite
} from "@/lib/generators/context";

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
  const instr = input.currentInstructionalLevel || "a below-grade instructional level";

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

  const distanceFromGradeLevel = `${name} is currently working at ${instr}, approximately below the ${grade}-grade expectation in ${subject}. ${
    input.assessmentResults?.trim()
      ? `Recent assessment data (${input.assessmentResults.trim().slice(0, 160)}) confirms this gap.`
      : "Assessment and classroom data indicate a meaningful gap from grade-level benchmarks."
  }`;

  const plaafpStatement =
    `${name} is a ${grade}-grade student receiving special education services. In ${subject}, ${name} currently performs at ${instr}. ` +
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
      canDoNow: canDoNow.length ? canDoNow : [`Emerging foundational skills in ${subject.toLowerCase()}`],
      needsToImprove: needsToImprove.length ? needsToImprove : [`Consistent, independent performance of ${targetSkill}`],
      distanceFromGradeLevel: distanceFromGradeLevel.replace(/\s+/g, " ").trim(),
      targetSkill,
      prioritizedSkillGaps: (needsToImprove.length ? needsToImprove : [targetSkill]).slice(0, 5),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const student: StudentContextLite = body.student;
    const input: PresentLevelInput = body.input;

    if (!student || !input || !input.subjectArea) {
      return NextResponse.json(
        { error: "Missing student context or present-level input (subjectArea required)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
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
4. Be honest about the size of the gap from grade-level expectations.

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

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptText,
          config: { responseMimeType: "application/json", temperature: 0.3 },
        });
        const rawText = response.text || "{}";
        const cleanJson = rawText.replace(/```json\n?|\n?```/g, "").trim();
        const parsed: PLAAFPAnalysis = JSON.parse(cleanJson);
        if (parsed?.plaafpStatement && parsed?.skillGaps?.targetSkill) {
          return NextResponse.json({
            content: parsed,
            modelUsed: "gemini-2.5-flash",
            costEstimate: 0.012,
          });
        }
      } catch (geminiErr: any) {
        console.warn("[Gemini PLAAFP fallback]", geminiErr?.message);
      }
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
}
