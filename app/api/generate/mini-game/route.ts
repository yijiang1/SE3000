// app/api/generate/mini-game/route.ts — Interactive browser mini-game generator

import { NextRequest, NextResponse } from "next/server";
import type { GenerationContext, MiniGameContent, MiniGameEngineType } from "@/types/iep";
import { formatContextForPrompt } from "@/lib/generators/context";
import { generateJSON } from "@/lib/ai/textGen";
import { estimateTextCost, type ProviderPreferences } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx: GenerationContext = body.context;
    const engineType: MiniGameEngineType = body.engineType || "matching";
    const customPrompt: string | undefined = body.customPrompt;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!ctx || !ctx.student || !ctx.goal) {
      return NextResponse.json({ error: "Missing required generation context" }, { status: 400 });
    }

    const studentInterest = ctx.student.interests[0] || "Exploration";
    const promptText = `
You are an expert Educational Game Developer and Special Education Specialist.
Design a highly motivating, interactive browser-based mini-game targeting the student's IEP goal.

${formatContextForPrompt(ctx)}

Game Engine Format requested: "${engineType}" (options: matching | sorting | multiple_choice | sequencing)
${customPrompt ? `ADDITIONAL TEACHER INSTRUCTIONS: ${customPrompt}` : ""}

GUIDELINES:
1. Target the skill: "${ctx.goal.goalText}".
2. Theme the entire game visuals, clues, and reward text around: ${ctx.student.interests.join(", ")}.
3. Match reading level (${ctx.student.readingLevel}) and sensory needs (clear concise text, low frustration).
4. Provide high-quality content for the requested engine:
   - For "matching": Provide 5-6 matchingPairs ({ id, prompt, match, category }).
   - For "sorting": Provide 2-3 sortingBuckets ({ id, title, items: [] }).
   - For "multiple_choice": Provide 4-5 quizQuestions ({ id, question, options, correctIndex, hint }).
   - For "sequencing": Provide 4-5 sequencingSteps in logical order ({ id, order, text }).

Respond with valid JSON matching this exact structure:
{
  "title": "Exciting Game Title",
  "theme": "${studentInterest}",
  "instructions": "Simple, friendly 1-2 sentence instructions for the student",
  "engineType": "${engineType}",
  "matchingPairs": [
    { "id": "p1", "prompt": "Clue or Term 1", "match": "Matching Answer 1" }
  ],
  "sortingBuckets": [
    { "id": "b1", "title": "Category Name 1", "items": ["Item A", "Item B"] }
  ],
  "quizQuestions": [
    { "id": "q1", "question": "Question text", "options": ["Choice 1", "Choice 2", "Choice 3"], "correctIndex": 0, "hint": "Helpful clue" }
  ],
  "sequencingSteps": [
    { "id": "s1", "order": 1, "text": "First step description" }
  ],
  "successMessage": "Encouraging victory cheer referencing the student's interests!"
}
`.trim();

    const ai = await generateJSON(promptText, { temperature: 0.3, preferredOrder: providerPreferences?.text });
    if (ai?.json) {
      return NextResponse.json({
        content: ai.json as MiniGameContent,
        modelUsed: ai.model,
        provider: ai.provider,
        costEstimate: estimateTextCost(ai.provider, 0.01),
      });
    }

    // Dynamic fallback generation based on requested engineType
    let dynamicGame: MiniGameContent;

    if (engineType === "sorting") {
      dynamicGame = {
        title: `${studentInterest} Category Sorter`,
        theme: studentInterest,
        instructions: `Drag and place each ${studentInterest} item into the correct category bucket!`,
        engineType: "sorting",
        sortingBuckets: [
          {
            id: "b1",
            title: `Accurate / Correct Examples`,
            items: [`Target skill master example`, `Focused response trial`, `Consistent accurate answer`]
          },
          {
            id: "b2",
            title: `Needs Teacher Support / Practice`,
            items: [`Rushed without checking`, `Skipped prompt step`, `Need visual helper clue`]
          }
        ],
        successMessage: `Fantastic sorting! You categorized every ${studentInterest} challenge like a champion!`
      };
    } else if (engineType === "multiple_choice") {
      dynamicGame = {
        title: `${studentInterest} Master Quiz`,
        theme: studentInterest,
        instructions: `Select the best answer for each ${studentInterest} trial challenge!`,
        engineType: "multiple_choice",
        quizQuestions: [
          {
            id: "q1",
            question: `When practicing our goal for ${ctx.goal.category.replace("_", " ")}, what is our best strategy?`,
            options: [`Take our time, use our visual support, and check our answer`, `Click as fast as possible`, `Skip to the end`],
            correctIndex: 0,
            hint: `Think about how ${studentInterest} explorers stay focused and observant.`
          },
          {
            id: "q2",
            question: `What is our target benchmark for this IEP goal?`,
            options: [`${ctx.goal.targetValue}${ctx.goal.measurementUnit}`, `0${ctx.goal.measurementUnit}`, `Halfway`],
            correctIndex: 0,
            hint: `Check your target goal indicator.`
          },
          {
            id: "q3",
            question: `What should we do if a problem feels challenging?`,
            options: [`Use our accommodation tool or ask for a supportive hint`, `Give up immediately`, `Ignore the problem`],
            correctIndex: 0,
            hint: `Self-advocacy is a super power!`
          }
        ],
        successMessage: `100% on the ${studentInterest} Quiz! Excellent mastery!`
      };
    } else if (engineType === "sequencing") {
      dynamicGame = {
        title: `${studentInterest} Step Sequencer`,
        theme: studentInterest,
        instructions: `Put the steps in the correct order from first to last to complete the ${studentInterest} mission!`,
        engineType: "sequencing",
        sequencingSteps: [
          { id: "s1", order: 1, text: `1. Check our goal and review our ${studentInterest} checklist.` },
          { id: "s2", order: 2, text: `2. Attempt the trial step-by-step with focus.` },
          { id: "s3", order: 3, text: `3. Review our work to confirm accuracy.` },
          { id: "s4", order: 4, text: `4. Celebrate our progress toward ${ctx.goal.targetValue}${ctx.goal.measurementUnit}!` }
        ],
        successMessage: `Awesome sequencing! You arranged all steps in perfect order!`
      };
    } else {
      // Default: matching
      dynamicGame = {
        title: `${studentInterest} Memory Matcher`,
        theme: studentInterest,
        instructions: `Tap and match each ${studentInterest} clue card with its corresponding answer!`,
        engineType: "matching",
        matchingPairs: [
          { id: "p1", prompt: `${studentInterest} Challenge 1`, match: `Mastery Target: ${ctx.goal.targetValue}${ctx.goal.measurementUnit}` },
          { id: "p2", prompt: `Focused Strategy`, match: `Step-by-step execution` },
          { id: "p3", prompt: `Visual Support Card`, match: `Accommodation in action` },
          { id: "p4", prompt: `Trial Success`, match: `Accurate progress score` },
          { id: "p5", prompt: `Perseverance Power`, match: `Growth Mindset` }
        ],
        successMessage: `Super Match! You solved all ${studentInterest} pairs with great accuracy!`
      };
    }

    return NextResponse.json({
      content: dynamicGame,
      modelUsed: "se-3000-minigame-engine",
      costEstimate: 0.0,
    });
  } catch (error: any) {
    console.error("Mini-game generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate mini-game" }, { status: 500 });
  }
}
