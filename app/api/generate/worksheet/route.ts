// app/api/generate/worksheet/route.ts — Stage 5: differentiated worksheets & homework
//
// Generates practice materials aligned to the IEP goal and the student's current
// instructional level. Honors every teacher-specified knob in WorksheetSpec
// (count, difficulty, question type, reading level, scaffolding, answer key,
// visual supports, modified problems, printable) and ramps difficulty as the
// student demonstrates mastery (driven by the progress-analysis step).

import { NextRequest, NextResponse } from "next/server";
import type {
  GenerationContext,
  WorksheetContent,
  WorksheetSpec,
  WorksheetItem,
  WorksheetQuestionType,
  PLAAFPAnalysis
} from "@/types/iep";
import { formatContextForPrompt, formatPlaafpForPrompt } from "@/lib/generators/context";
import { generateJSON } from "@/lib/ai/textGen";
import { estimateTextCost, type ProviderPreferences } from "@/lib/ai/providers";

const PURPOSE_LABEL: Record<string, string> = {
  practice: "Practice Worksheet",
  guided_practice: "Guided Practice",
  independent_practice: "Independent Practice",
  homework: "Homework",
  exit_ticket: "Exit Ticket",
  quiz: "Quiz",
  progress_monitoring: "Progress-Monitoring Probe",
  review: "Review Activity",
};

function rint(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Solvable one-variable linear equation items, scaled by difficulty 1-5 ──
function makeEquationItem(
  n: number,
  difficulty: number,
  qType: WorksheetQuestionType,
  scaffoldOn: boolean,
  visualOn: boolean
): WorksheetItem {
  const x = rint(1, difficulty <= 2 ? 9 : 12);
  let promptEq = "";
  let scaffold = "";

  if (difficulty <= 1) {
    const a = rint(1, 9);
    promptEq = `x + ${a} = ${x + a}`;
    scaffold = `Subtract ${a} from both sides: x = ${x + a} − ${a}.`;
  } else if (difficulty === 2) {
    const a = rint(2, 6);
    promptEq = `${a}x = ${a * x}`;
    scaffold = `Divide both sides by ${a}: x = ${a * x} ÷ ${a}.`;
  } else if (difficulty === 3) {
    const a = rint(2, 5);
    const b = rint(1, 9);
    promptEq = `${a}x + ${b} = ${a * x + b}`;
    scaffold = `Subtract ${b}, then divide by ${a}: x = (${a * x + b} − ${b}) ÷ ${a}.`;
  } else if (difficulty === 4) {
    const a = rint(2, 6);
    const b = rint(1, 12);
    promptEq = `${a}x − ${b} = ${a * x - b}`;
    scaffold = `Add ${b}, then divide by ${a}: x = (${a * x - b} + ${b}) ÷ ${a}.`;
  } else {
    const a = rint(3, 7);
    const c = rint(1, a - 1);
    const d = rint(1, 9);
    // a·x + d = c·x + (d + (a-c)·x)  → keep integer solution x
    const rhsConst = d + (a - c) * x;
    promptEq = `${a}x + ${d} = ${c}x + ${rhsConst}`;
    scaffold = `Subtract ${c}x from both sides, subtract ${d}, then divide by ${a - c}.`;
  }

  const base: WorksheetItem = {
    number: n,
    prompt:
      qType === "fill_in_blank"
        ? `${promptEq}   →   x = ______`
        : qType === "word_problem"
        ? `Write and solve an equation: "${promptEq}" describes the puzzle. What is x?`
        : `Solve for x:   ${promptEq}`,
    type: qType === "mixed" ? "short_answer" : qType,
    answer: `x = ${x}`,
    workingSpace: true,
  };
  if (qType === "multiple_choice") {
    const distractors = new Set<number>();
    while (distractors.size < 3) {
      const d = x + pick([-3, -2, -1, 1, 2, 3, 4]);
      if (d !== x && d > -20) distractors.add(d);
    }
    const choices = [x, ...distractors].sort(() => Math.random() - 0.5).map((v) => `x = ${v}`);
    base.choices = choices;
  }
  if (scaffoldOn) base.scaffold = scaffold;
  if (visualOn) base.visualSupport = "Balance-scale diagram: both pans stay level after each identical move.";
  return base;
}

// ── Themed multi-step word problems ─────────────────────────────────────
function makeWordProblem(
  n: number,
  difficulty: number,
  theme: string,
  scaffoldOn: boolean,
  visualOn: boolean
): WorksheetItem {
  const per = rint(2, 3 + difficulty);
  const groups = rint(2, 2 + difficulty);
  const extra = rint(1, 4 + difficulty);
  const total = per * groups + extra;
  const noun = /dino/i.test(theme) ? "fossils" : /space|rocket|planet/i.test(theme) ? "star charts" : /lego|build|minecraft/i.test(theme) ? "blocks" : "cards";
  const item: WorksheetItem = {
    number: n,
    prompt: `A ${theme} explorer packs ${groups} kits with ${per} ${noun} in each kit, then finds ${extra} more ${noun}. How many ${noun} in all? Show each step.`,
    type: "word_problem",
    answer: `${per} × ${groups} = ${per * groups}; ${per * groups} + ${extra} = ${total}`,
    workingSpace: true,
  };
  if (scaffoldOn)
    item.scaffold = `Step 1: multiply ${per} × ${groups}. Step 2: add ${extra} to that product.`;
  if (visualOn) item.visualSupport = `${groups} groups of ${per} dots, plus ${extra} loose dots.`;
  return item;
}

// ── Generic skill-application items when the skill isn't math ───────────
function makeGenericItem(
  n: number,
  skill: string,
  theme: string,
  qType: WorksheetQuestionType,
  scaffoldOn: boolean,
  visualOn: boolean
): WorksheetItem {
  const item: WorksheetItem = {
    number: n,
    prompt:
      qType === "multiple_choice"
        ? `Which choice best shows "${skill}" in a ${theme} context?`
        : qType === "fill_in_blank"
        ? `In this ${theme} example, the step that shows "${skill}" is ______.`
        : `Read the short ${theme} example, then demonstrate "${skill}". Explain your steps.`,
    type: qType === "mixed" ? "short_answer" : qType,
    answer: `Response correctly demonstrates ${skill} with teacher-scored accuracy.`,
    workingSpace: qType !== "multiple_choice",
  };
  if (qType === "multiple_choice") {
    item.choices = [
      `Correctly applies ${skill} step by step`,
      `Skips a required step`,
      `Uses an unrelated strategy`,
      `Guesses without checking`,
    ];
    item.answer = `Correctly applies ${skill} step by step`;
  }
  if (scaffoldOn) item.scaffold = `Use your ${skill} checklist and think aloud through each step.`;
  if (visualOn) item.visualSupport = `Numbered sequence card for the ${skill} steps.`;
  return item;
}

function synthesizeWorksheet(
  ctx: GenerationContext,
  spec: WorksheetSpec,
  plaafp?: PLAAFPAnalysis
): WorksheetContent {
  const theme = ctx.student.interests[0] || "Exploration";
  const skill = plaafp?.skillGaps.targetSkill || ctx.goal.goalText;
  const instructionalLevel = plaafp?.instructionalLevel || ctx.student.readingLevel;
  const count = Math.max(1, Math.min(40, Math.round(spec.numQuestions || 8)));
  const difficulty = Math.max(1, Math.min(5, Math.round(spec.difficultyLevel || 2)));
  const scaffoldOn = spec.scaffolding !== "none";
  const heavyScaffold = spec.scaffolding === "heavy" || spec.modifiedProblems;
  const effectiveCount = spec.modifiedProblems ? Math.max(1, Math.round(count * 0.6)) : count;

  const isEquation = /equation|algebra|one-variable|linear|solve for x/i.test(skill);
  const isMath = isEquation || /math|comput|arithmetic|fraction|multiplication|word problem|number sense/i.test(`${skill} ${ctx.goal.category}`);

  const items: WorksheetItem[] = [];
  for (let i = 0; i < effectiveCount; i++) {
    const n = i + 1;
    // Gently ramp difficulty across the page (last third one step harder).
    const localDiff = Math.min(5, difficulty + (i >= Math.round(effectiveCount * 0.7) ? 1 : 0));
    const useScaffold = scaffoldOn && (heavyScaffold || i < Math.ceil(effectiveCount / 2));
    if (isEquation) {
      items.push(makeEquationItem(n, localDiff, spec.questionType, useScaffold, spec.includeVisualSupports));
    } else if (isMath && (spec.questionType === "word_problem" || spec.questionType === "mixed")) {
      items.push(makeWordProblem(n, localDiff, theme, useScaffold, spec.includeVisualSupports));
    } else if (isMath) {
      items.push(makeEquationItem(n, Math.max(1, localDiff - 1), spec.questionType, useScaffold, spec.includeVisualSupports));
    } else {
      items.push(makeGenericItem(n, skill, theme, spec.questionType, useScaffold, spec.includeVisualSupports));
    }
  }

  const accs = ctx.accommodations.length ? ctx.accommodations : ["Step-by-step directions", "Extended time"];

  return {
    title: `${theme} ${PURPOSE_LABEL[spec.purpose] || "Practice"} — ${skill}`,
    purpose: spec.purpose,
    targetSkill: skill,
    instructionalLevel,
    readingLevel: spec.readingLevel || ctx.student.readingLevel,
    difficultyLevel: difficulty,
    theme,
    instructions:
      `Complete each item. Show your work in the space provided. ` +
      (scaffoldOn ? `Use the hint under an item if you get stuck. ` : "") +
      `Reading level: ${spec.readingLevel || ctx.student.readingLevel}.`,
    accommodationsApplied: [
      ...accs.slice(0, 4),
      ...(spec.modifiedProblems ? ["Reduced number of problems (modified assignment)"] : []),
      ...(spec.includeVisualSupports ? ["Visual supports on each item"] : []),
      ...(scaffoldOn ? [`${spec.scaffolding} scaffolding (worked steps / frames)`] : []),
    ],
    items,
    answerKey: spec.includeAnswerKey
      ? items.map((it) => ({
          number: it.number,
          answer: it.answer,
          explanation: it.scaffold,
        }))
      : [],
    teacherNotes:
      `Difficulty level ${difficulty}/5, pitched at ${instructionalLevel}. ` +
      `Score as percent accuracy and log to the IEP goal. ` +
      `If the student reaches 80%+ on two consecutive uses, raise difficulty by one level next time; ` +
      `if below 60%, drop one level and reteach the weakest step.`,
    printable: spec.printable !== false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx: GenerationContext = body.context;
    const spec: WorksheetSpec = body.spec;
    const plaafp: PLAAFPAnalysis | undefined = body.plaafp;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!ctx || !ctx.student || !ctx.goal) {
      return NextResponse.json({ error: "Missing required generation context" }, { status: 400 });
    }
    if (!spec || !spec.purpose) {
      return NextResponse.json({ error: "Missing worksheet spec" }, { status: 400 });
    }

    const skill = plaafp?.skillGaps.targetSkill || ctx.goal.goalText;

    const promptText = `
You are an expert Special Education materials writer. Create a differentiated
${PURPOSE_LABEL[spec.purpose] || "practice"} worksheet aligned to the student's IEP goal
and CURRENT instructional level.

${formatContextForPrompt(ctx)}
${plaafp ? "\n" + formatPlaafpForPrompt(plaafp) : ""}

=== WORKSHEET SPEC (obey exactly) ===
- Target skill: ${skill}
- Purpose: ${spec.purpose}
- Number of questions: ${spec.numQuestions}${spec.modifiedProblems ? " (reduce ~40% — modified assignment)" : ""}
- Difficulty level: ${spec.difficultyLevel}/5 (1 = easiest; ramp the last third one step harder)
- Question type: ${spec.questionType}
- Reading level: ${spec.readingLevel}
- Scaffolding: ${spec.scaffolding} (provide worked-step hints / frames accordingly)
- Answer key: ${spec.includeAnswerKey ? "include" : "omit"}
- Visual supports: ${spec.includeVisualSupports ? "describe a visual for each item" : "not required"}
- Printable: ${spec.printable}

GUIDELINES:
1. Every item must be solvable and correct; put the exact answer in "answer".
2. Pitch items at the instructional level, not the grade level.
3. Theme items around: ${ctx.student.interests.join(", ")}.
4. Build in the student's accommodations. Keep language at the stated reading level.

Respond with ONLY valid JSON in this exact shape:
{
  "title": "...",
  "purpose": "${spec.purpose}",
  "targetSkill": "${skill}",
  "instructionalLevel": "...",
  "readingLevel": "${spec.readingLevel}",
  "difficultyLevel": ${spec.difficultyLevel},
  "theme": "${ctx.student.interests[0] || "Exploration"}",
  "instructions": "student-facing directions",
  "accommodationsApplied": ["..."],
  "items": [
    { "number": 1, "prompt": "...", "type": "${spec.questionType === "mixed" ? "short_answer" : spec.questionType}", "choices": ["..."], "answer": "...", "workingSpace": true, "scaffold": "...", "visualSupport": "..." }
  ],
  "answerKey": [ { "number": 1, "answer": "...", "explanation": "..." } ],
  "teacherNotes": "scoring + difficulty-adjustment guidance",
  "printable": ${spec.printable}
}`.trim();

    const ai = await generateJSON(promptText, { temperature: 0.3, preferredOrder: providerPreferences?.text });
    const parsed: WorksheetContent | undefined = ai?.json;
    if (parsed?.items?.length) {
      if (!spec.includeAnswerKey) parsed.answerKey = [];
      return NextResponse.json({
        content: parsed,
        modelUsed: ai!.model,
        provider: ai!.provider,
        costEstimate: estimateTextCost(ai!.provider, 0.014),
      });
    }

    return NextResponse.json({
      content: synthesizeWorksheet(ctx, spec, plaafp),
      modelUsed: "se-3000-worksheet-engine",
      costEstimate: 0.0,
    });
  } catch (error: any) {
    console.error("Worksheet generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate worksheet" },
      { status: 500 }
    );
  }
}
