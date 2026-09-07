// app/api/generate/instructional-unit/route.ts — Stage 4: scaffolded instructional unit
//
// Turns the identified area of need + IEP goal into an individualized lesson
// sequence scaffolded to the student's current instructional level, with every
// active accommodation/modification built into the steps.

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { GenerationContext, InstructionalUnitContent, PLAAFPAnalysis } from "@/types/iep";
import { formatContextForPrompt, formatPlaafpForPrompt } from "@/lib/generators/context";

type StepSeed = { title: string; objective: string };

function stepSeeds(skill: string): StepSeed[] {
  const s = skill.toLowerCase();

  if (/equation|algebra|one-variable|linear|solve for/.test(s)) {
    return [
      { title: "Review prerequisite skills", objective: "Recall addition/subtraction and multiplication/division fact families and integer operations." },
      { title: "Understand variables and constants", objective: "Identify the variable, coefficients, and constants in an expression." },
      { title: "Use inverse operations", objective: "Name the inverse of each operation and explain 'keep the equation balanced'." },
      { title: "Solve one-step equations", objective: "Solve x + a = b and ax = b with 80% accuracy on instructional-level items." },
      { title: "Solve two-step equations", objective: "Solve ax + b = c using the order of inverse operations." },
      { title: "Solve equations with variables on both sides", objective: "Combine like terms and isolate the variable across the equals sign." },
      { title: "Apply equations to word problems", objective: "Translate a short real-world scenario into a one-variable equation and solve it." },
      { title: "Review and assess mastery", objective: "Complete a mixed progress-monitoring probe and self-check against a rubric." },
    ];
  }
  if (/read|decod|phonic|fluenc|vowel|syllable|sight word/.test(s)) {
    return [
      { title: "Review prerequisite skills", objective: "Blend and segment single sounds in CVC words." },
      { title: "Introduce the target pattern", objective: "Name the target sound/pattern and its spelling(s) with picture anchors." },
      { title: "Sound-by-sound decoding", objective: "Decode isolated words with the target pattern at 80% accuracy." },
      { title: "Word chains and word building", objective: "Change one grapheme at a time to build new words with the pattern." },
      { title: "Phrases and sentences", objective: "Read decodable phrases and sentences containing the pattern." },
      { title: "Connected decodable text", objective: "Read a short chunked passage, self-correcting with the pattern." },
      { title: "Fluency and expression", objective: "Reread the passage for rate and prosody; chart words correct per minute." },
      { title: "Review and assess mastery", objective: "Run a running record on an unpracticed passage and score accuracy." },
    ];
  }
  if (/writ|sentence|paragraph|composition|word sequence/.test(s)) {
    return [
      { title: "Review prerequisite skills", objective: "Identify a complete sentence vs. a fragment." },
      { title: "Sentence parts", objective: "Label subject and predicate in model sentences." },
      { title: "Write complete sentences", objective: "Produce complete sentences from a picture/topic prompt." },
      { title: "Expand sentences", objective: "Add who/what/where/when detail using a sentence-expansion frame." },
      { title: "Link ideas", objective: "Join two sentences with a conjunction to show a relationship." },
      { title: "Build a short paragraph", objective: "Use a graphic organizer to write a topic sentence + 3 details." },
      { title: "Revise and edit", objective: "Use a checklist to fix capitals, end marks, and run-ons." },
      { title: "Review and assess mastery", objective: "Write to a timed prompt; score correct word sequences against baseline." },
    ];
  }
  return [
    { title: "Review prerequisite skills", objective: "Activate and check the sub-skills the target skill depends on." },
    { title: "Introduce concept and vocabulary", objective: "Define the skill and key terms with visuals and a worked example." },
    { title: "Model with a think-aloud (I do)", objective: "Demonstrate the full strategy step by step while narrating decisions." },
    { title: "Guided practice (we do)", objective: "Complete items together, releasing responsibility as accuracy rises." },
    { title: "Structured independent practice (you do)", objective: "Practice at the instructional level with immediate feedback." },
    { title: "Apply to real / word-problem contexts", objective: "Use the skill in an applied scenario tied to the student's interests." },
    { title: "Generalize and self-monitor", objective: "Use the skill in a new setting/format and self-check with a rubric." },
    { title: "Review and assess mastery", objective: "Complete a progress-monitoring probe and compare to the goal criterion." },
  ];
}

function synthesizeUnit(
  ctx: GenerationContext,
  accommodations: string[],
  plaafp?: PLAAFPAnalysis
): InstructionalUnitContent {
  const theme = ctx.student.interests[0] || "Exploration";
  const skill = plaafp?.skillGaps.targetSkill || ctx.goal.goalText;
  const instructionalLevel = plaafp?.instructionalLevel || ctx.student.readingLevel;
  const accs = accommodations.length ? accommodations : ctx.accommodations;

  const seeds = stepSeeds(skill);
  const steps = seeds.map((seed, i) => {
    // Rotate accommodations so each step names 1-2 concrete supports.
    const applied = accs.length
      ? [accs[i % accs.length], accs[(i + 1) % accs.length]].filter((v, idx, a) => v && a.indexOf(v) === idx)
      : ["Step-by-step directions", "Visual supports"];
    return {
      order: i + 1,
      title: seed.title,
      objective: seed.objective,
      activities: [
        `Warm-up: quick ${theme}-themed review of the previous step (2-3 items).`,
        `Mini-lesson at ${instructionalLevel}: teacher models 1-2 examples using ${theme} contexts.`,
        `Practice set: ${i < 3 ? "6-8 heavily scaffolded" : i < 6 ? "8-10 partially scaffolded" : "10 independent"} items; ${theme} word problems where relevant.`,
        `Wrap-up: student explains their steps aloud or with a visual sequence card.`,
      ],
      scaffolds: [
        i < 4 ? "Worked example / anchor chart left visible" : "Anchor chart faded to a checklist",
        "Chunk each problem into numbered steps",
        "Sentence/step frames for explaining thinking",
        i < 2 ? "Manipulatives or picture supports" : "Manipulatives available on request",
      ],
      accommodationsApplied: applied,
      checkForUnderstanding:
        i === seeds.length - 1
          ? "Score the progress-monitoring probe; if <80%, reteach the lowest step before advancing."
          : `Exit check: 3 items at this step's level; advance when the student reaches 80% across 2 sessions.`,
    };
  });

  return {
    title: `${theme} ${skill} Unit — built for ${ctx.student.initials}`,
    targetSkill: skill,
    instructionalLevel,
    theme,
    accommodationsSummary: accs.length ? accs : ["Step-by-step directions", "Visual supports", "Extended time"],
    steps,
    masteryAssessment: `Cumulative probe of ${skill} at ${instructionalLevel}: ${ctx.goal.targetValue}${ctx.goal.measurementUnit} accuracy across 4 of 5 consecutive weekly data points signals readiness to raise difficulty or move to the next skill.`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx: GenerationContext = body.context;
    const plaafp: PLAAFPAnalysis | undefined = body.plaafp;
    const accommodations: string[] = Array.isArray(body.accommodations) ? body.accommodations : [];

    if (!ctx || !ctx.student || !ctx.goal) {
      return NextResponse.json({ error: "Missing required generation context" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const theme = ctx.student.interests[0] || "Exploration";
    const accsForPrompt = (accommodations.length ? accommodations : ctx.accommodations)
      .map((a) => `- ${a}`)
      .join("\n") || "- Standard instructional supports";

    const promptText = `
You are an expert Special Education instructional designer.
Design an individualized instructional unit (a scaffolded LESSON SEQUENCE, not a single
lesson) that moves the student toward their IEP goal from their CURRENT instructional level.

${formatContextForPrompt(ctx)}
${plaafp ? "\n" + formatPlaafpForPrompt(plaafp) : ""}

=== ACCOMMODATIONS / MODIFICATIONS TO BUILD IN (every step) ===
${accsForPrompt}

GUIDELINES:
1. 6-9 ordered steps from prerequisite skills to independent mastery (gradual release).
2. Pitch every step at the student's instructional level; do not jump to grade level.
3. Weave the student's interests (${ctx.student.interests.join(", ")}) into examples.
4. Each step must explicitly list which accommodations/modifications it applies and how.
5. Each step needs a concrete check for understanding with an advancement criterion.

Respond with ONLY valid JSON in this exact shape:
{
  "title": "unit title",
  "targetSkill": "the skill",
  "instructionalLevel": "level",
  "theme": "${theme}",
  "accommodationsSummary": ["...","..."],
  "steps": [
    {
      "order": 1,
      "title": "Review prerequisite skills",
      "objective": "...",
      "activities": ["...","..."],
      "scaffolds": ["...","..."],
      "accommodationsApplied": ["...","..."],
      "checkForUnderstanding": "..."
    }
  ],
  "masteryAssessment": "how mastery of the whole unit is assessed"
}`.trim();

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptText,
          config: { responseMimeType: "application/json", temperature: 0.4 },
        });
        const rawText = response.text || "{}";
        const cleanJson = rawText.replace(/```json\n?|\n?```/g, "").trim();
        const parsed: InstructionalUnitContent = JSON.parse(cleanJson);
        if (parsed?.steps?.length) {
          return NextResponse.json({
            content: parsed,
            modelUsed: "gemini-2.5-flash",
            costEstimate: 0.016,
          });
        }
      } catch (geminiErr: any) {
        console.warn("[Gemini instructional-unit fallback]", geminiErr?.message);
      }
    }

    return NextResponse.json({
      content: synthesizeUnit(ctx, accommodations, plaafp),
      modelUsed: "se-3000-unit-engine",
      costEstimate: 0.0,
    });
  } catch (error: any) {
    console.error("Instructional unit generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate instructional unit" },
      { status: 500 }
    );
  }
}
