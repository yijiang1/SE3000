// lib/ai/musicGen.ts — multi-provider real music generation with fallback chain
//
// Unlike video, MiniMax's music generation endpoint is synchronous — it
// returns the finished track in the same request/response.

import { DEFAULT_MUSIC_PROVIDER_ORDER, MUSIC_PROVIDER_ENV, type MusicProviderId } from "./providers";

interface CallOpts {
  stylePrompt: string;
  lyrics: string;
}

interface RawResult {
  audioBase64: string;
  model: string;
}

function isConfigured(id: MusicProviderId): boolean {
  return MUSIC_PROVIDER_ENV[id].every((envVar) => {
    const v = process.env[envVar];
    return !!v && v.trim().length > 5;
  });
}

async function callMiniMaxMusic({ stylePrompt, lyrics }: CallOpts): Promise<RawResult> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const res = await fetch("https://api.minimax.io/v1/music_generation", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "music-3.0",
      prompt: stylePrompt.slice(0, 2000),
      lyrics: lyrics.slice(0, 3500),
      output_format: "hex",
      audio_setting: { sample_rate: 44100, bitrate: 256000, format: "mp3" },
    }),
  });
  if (!res.ok) throw new Error(`MiniMax music HTTP ${res.status}`);
  const data = await res.json();
  const hex = data?.data?.audio;
  if (!hex) throw new Error("MiniMax music returned no audio");
  const buffer = Buffer.from(hex, "hex");
  return { audioBase64: `data:audio/mp3;base64,${buffer.toString("base64")}`, model: "minimax-music-3.0" };
}

const CALLERS: Record<MusicProviderId, (opts: CallOpts) => Promise<RawResult>> = {
  minimax: callMiniMaxMusic,
};

export interface MusicGenResult {
  audioBase64: string;
  provider: MusicProviderId;
  model: string;
}

export async function generateRealMusic(
  opts: CallOpts & { preferredOrder?: MusicProviderId[] }
): Promise<MusicGenResult | null> {
  const order = (opts.preferredOrder?.length ? opts.preferredOrder : DEFAULT_MUSIC_PROVIDER_ORDER).filter(
    isConfigured
  );

  for (const provider of order) {
    try {
      const result = await CALLERS[provider](opts);
      return { ...result, provider };
    } catch (err: any) {
      console.warn(`[Music fallback] ${provider} failed:`, err?.message);
    }
  }
  return null;
}
