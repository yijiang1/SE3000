// app/api/generate/narration/route.ts — OpenAI TTS audio narration generator

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { GenerationContext, NarrationContent } from "@/types/iep";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx: GenerationContext = body.context;
    const voice: NarrationContent["voice"] = body.voice || "nova";
    const speed: number = typeof body.speed === "number" ? body.speed : 0.9;
    const textOverride: string | undefined = body.textOverride;

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

    const apiKey = process.env.OPENAI_API_KEY;
    let audioBase64: string | undefined = undefined;

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const openai = new OpenAI({ apiKey });
        const mp3Response = await openai.audio.speech.create({
          model: "tts-1",
          voice: voice,
          input: script,
          speed: speed,
          response_format: "mp3",
        });

        const arrayBuffer = await mp3Response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        audioBase64 = `data:audio/mp3;base64,${buffer.toString("base64")}`;
      } catch (openAiErr: any) {
        console.warn("[OpenAI TTS API fallback]", openAiErr?.message);
      }
    }

    const content: NarrationContent = {
      title: `${studentInterest} Read-Along Narration`,
      voice,
      speed,
      fullTranscript: script,
      audioUrl: audioBase64,
      segments,
    };

    return NextResponse.json({
      content,
      modelUsed: audioBase64 ? "openai-tts-1" : "web-speech-narrator",
      costEstimate: audioBase64 ? 0.01 : 0.0,
    });
  } catch (error: any) {
    console.error("Narration generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate narration" }, { status: 500 });
  }
}
