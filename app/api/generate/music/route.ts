// app/api/generate/music/route.ts — Lyria 3 Music & Audio synthesizer

import { NextRequest, NextResponse } from "next/server";
import type { GenerationContext, MusicContent } from "@/types/iep";
import { formatContextForPrompt } from "@/lib/generators/context";
import { generateJSON } from "@/lib/ai/textGen";
import { generateRealMusic } from "@/lib/ai/musicGen";
import { estimateTextCost, MUSIC_COST_ESTIMATE, type ProviderPreferences } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx: GenerationContext = body.context;
    const purpose: MusicContent["purpose"] = body.purpose || "mnemonic_song";
    const durationType: "clip" | "pro" = body.durationType || "clip"; // clip ~30s, pro ~2-3min
    const customPrompt: string | undefined = body.customPrompt;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    if (!ctx || !ctx.student || !ctx.goal) {
      return NextResponse.json({ error: "Missing required generation context" }, { status: 400 });
    }

    const studentInterest = ctx.student.interests[0] || "Learning Adventure";
    
    // We construct the specialized Lyria prompt with musical descriptors (BPM, key, tags, structure)
    const promptText = `
You are a master Music Producer and Educational Composer specializing in mnemonic songs and calming audio for students with special needs.
Generate a complete musical plan and structured lyrics for Lyria 3.

${formatContextForPrompt(ctx)}

Music Purpose: ${purpose.replace("_", " ")}
Target Duration Model: Lyria 3 ${durationType === "clip" ? "Clip (30s)" : "Pro (2-3 minutes)"}
${customPrompt ? `ADDITIONAL TEACHER INSTRUCTIONS: ${customPrompt}` : ""}

GUIDELINES:
1. If "mnemonic_song": Create catchy, rhythmic rhyming lyrics that lock in the exact skill: "${ctx.goal.goalText}".
2. If "calming_focus": Create soothing, ambient acoustic or lo-fi arrangements with gentle instrumentation (40-70 BPM).
3. If "reward_jingle": Create an uplifting, celebratory fanfare (120-130 BPM) themed around ${studentInterest}.
4. If "transition_cue": Create a clear musical chime and supportive reminder song for smooth classroom transitions.
5. Provide explicit musical tags: [Intro], [Verse 1], [Chorus], [Bridge], [Outro].

Respond with valid JSON matching this exact structure:
{
  "title": "Inspiring Track Title",
  "genre": "Musical Genre (e.g. Acoustic Folk, Lo-Fi Chillhop, Upbeat Pop, Orchestral Fanfare)",
  "mood": "Emotional feel (e.g. Uplifting, Soothing, Rhythmic, Joyful)",
  "tempoBpm": 110,
  "durationSeconds": ${durationType === "clip" ? 30 : 120},
  "modelUsed": "lyria-3-${durationType}",
  "purpose": "${purpose}",
  "lyricsOrStructure": "[Intro]\\n...\\n[Verse 1]\\n...\\n[Chorus]\\n...\\n[Outro]"
}
`.trim();

    const lyricsAi = await generateJSON(promptText, { temperature: 0.5, preferredOrder: providerPreferences?.text });
    const composition: MusicContent =
      lyricsAi?.json || {
        title: `${studentInterest} ${purpose === "calming_focus" ? "Peaceful Focus Zone" : "Skill Power Song"}`,
        genre: purpose === "calming_focus" ? "Lo-Fi Acoustic Ambient" : "Upbeat Rhythmic Pop / Jingle",
        mood: purpose === "calming_focus" ? "Calm, Centered, Reassuring" : "Energetic, Joyful, Empowering",
        tempoBpm: purpose === "calming_focus" ? 68 : 116,
        durationSeconds: durationType === "clip" ? 30 : 120,
        modelUsed: `lyria-3-${durationType}`,
        purpose,
        lyricsOrStructure:
          purpose === "calming_focus"
            ? "[Intro: Soft rainstick & warm piano chords, 68 BPM]\n" +
              "Breathe in deep like a mountain high...\n" +
              "Let the quiet float gently by...\n" +
              "[Gentle marimba pulse]\n" +
              "Safe and steady, calm and clear,\n" +
              "Great ideas are growing here.\n" +
              "[Outro: Fading soft bell harmonics]"
            : `[Intro: Upbeat ${studentInterest} acoustic groove & handclaps, 116 BPM]\n` +
              `[Verse 1]\n` +
              `Step on the path with our ${studentInterest} crew,\n` +
              `Look at the goal and we know what to do!\n` +
              `Baseline to target, reaching high,\n` +
              `Target ${ctx.goal.targetValue}${ctx.goal.measurementUnit}, watch our progress fly!\n` +
              `[Chorus]\n` +
              `Yes we can, step by step every day,\n` +
              `Learning and growing our special way!\n` +
              `[Outro: Cheerful celebratory fanfare]`
      };

    // Attempt a real, playable audio track from the style + lyrics. If no
    // music provider is configured (or the call fails), we still return the
    // lyrics/structure alone — AudioMusicPlayer synthesizes a tone preview.
    const stylePrompt = `${composition.genre}, ${composition.mood}, ${composition.tempoBpm} BPM`;
    const realMusic = await generateRealMusic({
      stylePrompt,
      lyrics: composition.lyricsOrStructure || "",
      preferredOrder: providerPreferences?.music,
    }).catch((err) => {
      console.warn("[Real music generation]", err?.message);
      return null;
    });

    const content: MusicContent = { ...composition, audioUrl: realMusic?.audioBase64 };

    return NextResponse.json({
      content,
      modelUsed: realMusic?.model || `lyria-3-${durationType}`,
      provider: realMusic?.provider || lyricsAi?.provider,
      costEstimate: realMusic
        ? MUSIC_COST_ESTIMATE[realMusic.provider]
        : lyricsAi
        ? estimateTextCost(lyricsAi.provider, durationType === "clip" ? 0.04 : 0.08)
        : 0.0,
    });
  } catch (error: any) {
    console.error("Music generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate music" }, { status: 500 });
  }
}
