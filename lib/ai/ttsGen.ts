// lib/ai/ttsGen.ts — multi-provider text-to-speech with fallback chain

import OpenAI from "openai";
import { DEFAULT_TTS_PROVIDER_ORDER, TTS_PROVIDER_ENV, type TTSProviderId } from "./providers";

export type NarrationVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface CallOpts {
  text: string;
  voice: NarrationVoice;
  speed: number;
}

interface RawResult {
  audioBase64: string;
  model: string;
}

function isConfigured(id: TTSProviderId): boolean {
  return TTS_PROVIDER_ENV[id].every((envVar) => {
    const v = process.env[envVar];
    return !!v && v.trim().length > 5;
  });
}

async function callOpenAITTS({ text, voice, speed }: CallOpts): Promise<RawResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const mp3Response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    speed,
    response_format: "mp3",
  });
  const buffer = Buffer.from(await mp3Response.arrayBuffer());
  return { audioBase64: `data:audio/mp3;base64,${buffer.toString("base64")}`, model: "openai-tts-1" };
}

// MiniMax's English voice presets don't map 1:1 to OpenAI's voice names — pick
// a similarly-toned preset voice for each.
const MINIMAX_VOICE_MAP: Record<NarrationVoice, string> = {
  alloy: "English_CalmWoman",
  echo: "English_Deep-VoicedGentleman",
  fable: "English_Wiselady",
  onyx: "English_ManWithDeepVoice",
  nova: "English_Graceful_Lady",
  shimmer: "English_expressive_narrator",
};

async function callMiniMaxTTS({ text, voice, speed }: CallOpts): Promise<RawResult> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;
  const res = await fetch(`https://api.minimax.io/v1/t2a_v2?GroupId=${encodeURIComponent(groupId!)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "speech-02-turbo",
      text,
      output_format: "hex",
      voice_setting: {
        voice_id: MINIMAX_VOICE_MAP[voice] || "English_Graceful_Lady",
        speed,
        vol: 1,
        pitch: 0,
      },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
    }),
  });
  if (!res.ok) throw new Error(`MiniMax T2A HTTP ${res.status}`);
  const data = await res.json();
  const hex = data?.data?.audio;
  if (!hex) throw new Error("MiniMax T2A returned no audio");
  const buffer = Buffer.from(hex, "hex");
  return { audioBase64: `data:audio/mp3;base64,${buffer.toString("base64")}`, model: "minimax-speech-02-turbo" };
}

const CALLERS: Record<TTSProviderId, (opts: CallOpts) => Promise<RawResult>> = {
  openai: callOpenAITTS,
  minimax: callMiniMaxTTS,
};

export interface TTSGenResult {
  audioBase64: string;
  provider: TTSProviderId;
  model: string;
}

export async function generateSpeech(
  opts: CallOpts & { preferredOrder?: TTSProviderId[] }
): Promise<TTSGenResult | null> {
  const order = (opts.preferredOrder?.length ? opts.preferredOrder : DEFAULT_TTS_PROVIDER_ORDER).filter(
    isConfigured
  );

  for (const provider of order) {
    try {
      const result = await CALLERS[provider](opts);
      return { ...result, provider };
    } catch (err: any) {
      console.warn(`[TTS fallback] ${provider} failed:`, err?.message);
    }
  }
  return null;
}
