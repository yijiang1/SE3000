// app/api/generate/narration/route.ts — OpenAI TTS audio narration generator

import { NextRequest, NextResponse } from "next/server";
import type { GenerationContext, NarrationContent } from "@/types/iep";
import { generateSpeech } from "@/lib/ai/ttsGen";
import { TTS_COST_ESTIMATE, type ProviderPreferences } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx: GenerationContext = body.context;
    const voice: NarrationContent["voice"] = body.voice || "nova";
    const speed: number = typeof body.speed === "number" ? body.speed : 0.9;
    const textOverride: string | undefined = body.textOverride;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!ctx || !ctx.student || !ctx.goal) {
      return NextResponse.json({ error: "Missing required generation context" }, { status: 400 });
    }

    const studentInterest = ctx.student.interests[0] || "Exploration";
    
    // Construct default educational read-along script if not provided
    const script =
      textOverride?.trim() ||
      `Hello ${ctx.student.initials}! Welcome to our ${studentInterest} learning adventure. Today we are practicing our goal: ${ctx.goal.goalText}. Remember, take your time, use your visual aids, and do your very best. You are doing fantastic! Let's get started together!`;

    // Segment text by sentences for read-along tracking
    const sentences = script
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);

    const segments = sentences.map((text, idx) => ({
      segmentIndex: idx + 1,
      text,
      durationSeconds: Math.max(2, Math.round(text.split(" ").length * 0.5)),
    }));

    const tts = await generateSpeech({ text: script, voice, speed, preferredOrder: providerPreferences?.tts });

    const content: NarrationContent = {
      title: `${studentInterest} Read-Along Narration`,
      voice,
      speed,
      fullTranscript: script,
      audioUrl: tts?.audioBase64,
      segments,
    };

    return NextResponse.json({
      content,
      modelUsed: tts?.model || "web-speech-narrator",
      provider: tts?.provider,
      costEstimate: tts ? TTS_COST_ESTIMATE[tts.provider] : 0.0,
    });
  } catch (error: any) {
    console.error("Narration generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate narration" }, { status: 500 });
  }
}
