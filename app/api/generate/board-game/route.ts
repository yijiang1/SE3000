import { validOutput } from "@/lib/schemas";
import { generationRoute } from "@/lib/apiGuard";
// app/api/generate/board-game/route.ts — Board & Card Game generator

import { NextRequest, NextResponse } from "next/server";
import type { GenerationContext, BoardGameContent } from "@/types/iep";
import { formatContextForPrompt } from "@/lib/generators/context";
import { generateJSON } from "@/lib/ai/textGen";
import { estimateTextCost, type ProviderPreferences } from "@/lib/ai/providers";

export const POST = generationRoute(async (req, body) => {
  try {
    const ctx: GenerationContext = body.context;
    const customPrompt: string | undefined = body.customPrompt;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!ctx || !ctx.student || !ctx.goal) {
      return NextResponse.json({ error: "Missing required generation context" }, { status: 400 });
    }

    const studentInterest = ctx.student.interests[0] || "Adventure";
    const promptText = `
You are an expert Assistive Technologist and Game Designer for Special Education.
Design a highly engaging, printable, thematic board game with game cards to help a student practice their specific IEP goal.

${formatContextForPrompt(ctx)}

${customPrompt ? `ADDITIONAL TEACHER INSTRUCTIONS: ${customPrompt}` : ""}

GUIDELINES:
1. Thematic Immersion: Immerse the game completely in the student's passion: ${ctx.student.interests.join(", ")}.
2. Direct IEP Target: Every challenge card and board space must provide concrete, scaffolded practice for: "${ctx.goal.goalText}".
3. Accessibility: Clear, readable rulebook, chunked turn-taking steps, calming sensory break spaces, positive reinforcement.
4. Printable format: Output a 10 to 12 tile linear/path board + 8 to 12 challenge cards with clear success criteria.

Respond with valid JSON matching this exact structure:
{
  "gameTitle": "Catchy Game Title",
  "theme": "${studentInterest}",
  "targetSkill": "Skill statement",
  "objective": "Clear winning objective",
  "playerCount": "1 to 4 Players (or Student + Teacher)",
  "materialsNeeded": ["Printable Board", "Challenge Cards", "1 Die", "Player Pawns / Counters"],
  "rules": [
    "Rule 1...",
    "Rule 2...",
    "Rule 3...",
    "Rule 4..."
  ],
  "tiles": [
    { "index": 1, "label": "Start Camp", "type": "start", "promptText": "Roll to begin!" },
    { "index": 2, "label": "Challenge Trail", "type": "challenge", "promptText": "Draw a challenge card" },
    { "index": 3, "label": "Speed Boost", "type": "bonus", "promptText": "Move forward 1 tile!" },
    { "index": 4, "label": "Calm Lagoon", "type": "rest", "promptText": "Take 3 deep breaths and high-five your partner" },
    { "index": 5, "label": "Victory Point", "type": "finish", "promptText": "You reached the goal!" }
  ],
  "cards": [
    {
      "id": "c1",
      "category": "Skill Challenge / Trivia / Action",
      "questionOrTask": "Specific prompt for the student to solve or read",
      "answerOrCriteria": "Exact criteria for the teacher/parent to judge success",
      "rewardPoints": 1
    }
  ],
  "printableInstructions": "Suggestions for printing and laminating this board and card deck for the classroom."
}
`.trim();

    const ai = await generateJSON(promptText, { temperature: 0.4, validate: (value) => validOutput("board_game", value), preferredOrder: providerPreferences?.text });
    if (ai?.json) {
      return NextResponse.json({
        content: ai.json as BoardGameContent,
        modelUsed: ai.model,
        provider: ai.provider,
        costEstimate: estimateTextCost(ai.provider, 0.02),
      });
    }

    // Fallback thematic board game generator
    const synthesized: BoardGameContent = {
      gameTitle: `${studentInterest} Quest: The ${ctx.goal.category.toUpperCase()} Trail`,
      theme: studentInterest,
      targetSkill: ctx.goal.goalText,
      objective: `Travel through the ${studentInterest} world by completing goal trials to reach the Grand Trophy!`,
      playerCount: "1 to 4 Players (Student + Case Manager or Peers)",
      materialsNeeded: [
        "Printable Board Grid",
        "Challenge Card Deck",
        "1 Standard 6-sided Die or Spinner",
        "Player Tokens (e.g. Lego figures or coins)"
      ],
      rules: [
        "Place tokens on Tile 1 (Start Camp).",
        "Players take turns rolling the die and advancing that number of spaces.",
        "When landing on a Challenge Tile, draw a card from the deck and complete the target skill task.",
        "If completed with effort/accuracy, collect 1 Golden Star token.",
        "Rest tiles offer a quick sensory stretch; Bonus tiles advance your pawn.",
        "First player to reach Tile 10 wins the Golden Trophy!"
      ],
      tiles: [
        { index: 1, label: "Base Camp", type: "start", promptText: "Gear up and roll to begin!" },
        { index: 2, label: `${studentInterest} Ridge`, type: "challenge", promptText: "Draw a Challenge Card" },
        { index: 3, label: "Rocket Boost", type: "bonus", promptText: "Glide ahead 1 space!" },
        { index: 4, label: "Echo Canyon", type: "challenge", promptText: "Draw a Practice Card" },
        { index: 5, label: "Oasis Rest", type: "rest", promptText: "Take 2 calm deep breaths and sip water" },
        { index: 6, label: "Crystal Pass", type: "challenge", promptText: "Draw a Challenge Card" },
        { index: 7, label: "Meteor Trail", type: "challenge", promptText: "Demonstrate target skill trial" },
        { index: 8, label: "Super Shield", type: "bonus", promptText: "Roll again!" },
        { index: 9, label: "Summit Gate", type: "challenge", promptText: "Final Mastery Question" },
        { index: 10, label: "Victory Citadel", type: "finish", promptText: "Goal Mastered! Collect your Crown! 👑" }
      ],
      cards: [
        {
          id: "card-1",
          category: "Direct Skill Practice",
          questionOrTask: `Demonstrate trial 1 for: "${ctx.goal.goalText.slice(0, 60)}..."`,
          answerOrCriteria: `Student responds according to their ${ctx.student.readingLevel} criteria.`,
          rewardPoints: 1
        },
        {
          id: "card-2",
          category: `${studentInterest} Challenge`,
          questionOrTask: `Connect your target skill to a ${studentInterest} scenario. Explain or demonstrate your answer.`,
          answerOrCriteria: "Student communicates clearly using verbal or visual AAC support.",
          rewardPoints: 1
        },
        {
          id: "card-3",
          category: "Rapid Fire Trial",
          questionOrTask: `Complete 2 accurate reps targeting our ${ctx.goal.targetValue}${ctx.goal.measurementUnit} benchmark.`,
          answerOrCriteria: "Teacher logs accuracy score on IEP record sheet.",
          rewardPoints: 2
        },
        {
          id: "card-4",
          category: "Peer / Partner Bonus",
          questionOrTask: "Give your teacher or peer a high-five and state one strategy you used today.",
          answerOrCriteria: "Positive social interaction and self-advocacy.",
          rewardPoints: 1
        }
      ],
      printableInstructions: "Print double-sided on heavy cardstock. Board fits standard 8.5x11 or 11x17 paper."
    };

    return NextResponse.json({
      content: synthesized,
      modelUsed: "se-3000-boardgame-engine",
      costEstimate: 0.0,
    });
  } catch (error: any) {
    console.error("Board game generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate board game" }, { status: 500 });
  }
});
