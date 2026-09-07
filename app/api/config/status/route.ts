// app/api/config/status/route.ts — reports which AI provider API keys are
// configured server-side, without ever exposing the key values themselves.
// Powers the Settings page's provider status indicators.

import { NextResponse } from "next/server";
import {
  TEXT_PROVIDER_ENV,
  TTS_PROVIDER_ENV,
  VIDEO_PROVIDER_ENV,
  MUSIC_PROVIDER_ENV,
  type TextProviderId,
  type TTSProviderId,
  type VideoProviderId,
  type MusicProviderId,
} from "@/lib/ai/providers";

function isSet(envVars: string[]): boolean {
  return envVars.every((v) => {
    const value = process.env[v];
    return !!value && value.trim().length > 5;
  });
}

function statusFor<T extends string>(envMap: Record<T, string[]>): Record<T, boolean> {
  const out = {} as Record<T, boolean>;
  for (const id of Object.keys(envMap) as T[]) {
    out[id] = isSet(envMap[id]);
  }
  return out;
}

export async function GET() {
  return NextResponse.json({
    text: statusFor<TextProviderId>(TEXT_PROVIDER_ENV),
    tts: statusFor<TTSProviderId>(TTS_PROVIDER_ENV),
    video: statusFor<VideoProviderId>(VIDEO_PROVIDER_ENV),
    music: statusFor<MusicProviderId>(MUSIC_PROVIDER_ENV),
  });
}
