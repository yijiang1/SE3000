// app/api/generate/video/route.ts — Veo 3.1 Video generation & storyboard orchestrator

import { NextRequest, NextResponse } from "next/server";
import type { GenerationContext, VideoContent } from "@/types/iep";
import { formatContextForPrompt } from "@/lib/generators/context";
import { generateJSON } from "@/lib/ai/textGen";
import { generateRealVideo } from "@/lib/ai/videoGen";
import { estimateTextCost, VIDEO_COST_ESTIMATE, type ProviderPreferences } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx: GenerationContext = body.context;
    const customPrompt: string | undefined = body.customPrompt;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!ctx || !ctx.student || !ctx.goal) {
      return NextResponse.json({ error: "Missing required generation context" }, { status: 400 });
    }

    const studentInterest = ctx.student.interests[0] || "Exploration";
    const promptText = `
You are an expert Educational Animator & Creative Director for Special Education video production.
Design a compelling 2 to 3 scene animated explainer video script & storyboard for Veo 3.1 targeting a student's IEP goal.

${formatContextForPrompt(ctx)}

${customPrompt ? `ADDITIONAL TEACHER INSTRUCTIONS: ${customPrompt}` : ""}

GUIDELINES:
1. Scenes should be clear, sensory-friendly, colorful, and themed around: ${ctx.student.interests.join(", ")}.
2. Each scene is 4 to 8 seconds in length.
3. Include synchronized narration dialogue/cues for audio accompaniment.
4. Total duration: 8 to 16 seconds.

Respond with valid JSON matching this exact structure:
{
  "title": "Inspiring Short Video Title",
  "theme": "${studentInterest}",
  "hasNarration": true,
  "hasMusic": true,
  "modelUsed": "veo-3.1-fast",
  "scenes": [
    {
      "sceneNumber": 1,
      "visualDescription": "Detailed camera and visual description for Veo 3.1 prompt...",
      "durationSeconds": 4,
      "narrationCue": "Spoken dialogue or voiceover cue for this scene..."
    }
  ]
}
`.trim();

    const scriptAi = await generateJSON(promptText, { temperature: 0.4, preferredOrder: providerPreferences?.text });
    const storyboard: VideoContent =
      scriptAi?.json || {
        title: `${studentInterest} Mastery Story: ${ctx.goal.category.toUpperCase()}`,
        theme: studentInterest,
        hasNarration: true,
        hasMusic: true,
        modelUsed: "veo-3.1-fast",
        scenes: [
          {
            sceneNumber: 1,
            visualDescription: `Vibrant, high-contrast animated scene of a friendly ${studentInterest} world at sunrise, gentle camera push in.`,
            durationSeconds: 4,
            narrationCue: `Welcome, ${ctx.student.initials}! Our ${studentInterest} learning journey starts now.`
          },
          {
            sceneNumber: 2,
            visualDescription: `The main character demonstrates the goal skill step-by-step with glowing visual stars floating up.`,
            durationSeconds: 4,
            narrationCue: `Watch closely: when we apply our strategy, we move closer to our ${ctx.goal.targetValue}${ctx.goal.measurementUnit} target!`
          },
          {
            sceneNumber: 3,
            visualDescription: `A celebratory ${studentInterest} fireworks and confetti display with a grand gold trophy shining.`,
            durationSeconds: 4,
            narrationCue: `You've got the power! Keep up the amazing work!`
          }
        ]
      };

    // Attempt a real, playable video clip from the storyboard. If no video
    // provider is configured (or the generation fails/times out), we still
    // return the storyboard script alone — VideoPlayer simulates it.
    const combinedPrompt = storyboard.scenes
      .map((s) => s.visualDescription)
      .join(" Then, ")
      .slice(0, 2000);
    const totalDuration = storyboard.scenes.reduce((sum, s) => sum + s.durationSeconds, 0) || 8;
    const realVideo = await generateRealVideo({
      prompt: combinedPrompt,
      durationSeconds: totalDuration,
      preferredOrder: providerPreferences?.video,
    }).catch((err) => {
      console.warn("[Real video generation]", err?.message);
      return null;
    });

    const content: VideoContent = { ...storyboard, videoUrl: realVideo?.videoUrl };

    return NextResponse.json({
      content,
      modelUsed: realVideo?.model || "veo-3.1-fast",
      provider: realVideo?.provider || scriptAi?.provider,
      costEstimate: realVideo
        ? VIDEO_COST_ESTIMATE[realVideo.provider]
        : scriptAi
        ? estimateTextCost(scriptAi.provider, 0.4)
        : 0.0,
    });
  } catch (error: any) {
    console.error("Video generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate video" }, { status: 500 });
  }
}
