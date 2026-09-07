// lib/ai/providers.ts — provider IDs, display metadata, and cost heuristics
//
// Pure constants/types only (no SDK imports) so this file is safe to import
// from client components (e.g. the Settings page) as well as server routes.

export type TextProviderId = "gemini" | "deepseek" | "kimi" | "openai";
export type TTSProviderId = "openai" | "minimax";
export type VideoProviderId = "minimax" | "kling";
export type MusicProviderId = "minimax";

export interface ProviderPreferences {
  text?: TextProviderId[];
  tts?: TTSProviderId[];
  video?: VideoProviderId[];
  music?: MusicProviderId[];
}

export const DEFAULT_TEXT_PROVIDER_ORDER: TextProviderId[] = ["gemini", "deepseek", "kimi", "openai"];
export const DEFAULT_TTS_PROVIDER_ORDER: TTSProviderId[] = ["openai", "minimax"];
export const DEFAULT_VIDEO_PROVIDER_ORDER: VideoProviderId[] = ["minimax", "kling"];
export const DEFAULT_MUSIC_PROVIDER_ORDER: MusicProviderId[] = ["minimax"];

export const TEXT_PROVIDER_LABELS: Record<TextProviderId, string> = {
  gemini: "Google Gemini 2.5 Flash",
  deepseek: "DeepSeek Chat (V3)",
  kimi: "Kimi K2 (Moonshot AI)",
  openai: "OpenAI GPT-4o mini",
};

export const TTS_PROVIDER_LABELS: Record<TTSProviderId, string> = {
  openai: "OpenAI TTS (tts-1)",
  minimax: "MiniMax Speech (T2A v2)",
};

export const VIDEO_PROVIDER_LABELS: Record<VideoProviderId, string> = {
  minimax: "MiniMax Hailuo Video",
  kling: "Kling AI Video",
};

export const MUSIC_PROVIDER_LABELS: Record<MusicProviderId, string> = {
  minimax: "MiniMax Music",
};

/** Rough per-call USD cost estimates, relative to each route's Gemini baseline. */
const TEXT_COST_RATIO: Record<TextProviderId, number> = {
  gemini: 1,
  deepseek: 0.25,
  kimi: 0.5,
  openai: 1.5,
};

export function estimateTextCost(provider: TextProviderId, geminiBaselineCost: number): number {
  return Math.round(geminiBaselineCost * (TEXT_COST_RATIO[provider] ?? 1) * 1000) / 1000;
}

export const TTS_COST_ESTIMATE: Record<TTSProviderId, number> = {
  openai: 0.01,
  minimax: 0.006,
};

export const VIDEO_COST_ESTIMATE: Record<VideoProviderId, number> = {
  minimax: 0.35,
  kling: 0.5,
};

export const MUSIC_COST_ESTIMATE: Record<MusicProviderId, number> = {
  minimax: 0.05,
};

/** Which server env var(s) must be set for a given provider to be usable. */
export const TEXT_PROVIDER_ENV: Record<TextProviderId, string[]> = {
  gemini: ["GEMINI_API_KEY"],
  deepseek: ["DEEPSEEK_API_KEY"],
  kimi: ["MOONSHOT_API_KEY"],
  openai: ["OPENAI_API_KEY"],
};

export const TTS_PROVIDER_ENV: Record<TTSProviderId, string[]> = {
  openai: ["OPENAI_API_KEY"],
  minimax: ["MINIMAX_API_KEY", "MINIMAX_GROUP_ID"],
};

export const VIDEO_PROVIDER_ENV: Record<VideoProviderId, string[]> = {
  minimax: ["MINIMAX_API_KEY"],
  kling: ["KLING_ACCESS_KEY", "KLING_SECRET_KEY"],
};

export const MUSIC_PROVIDER_ENV: Record<MusicProviderId, string[]> = {
  minimax: ["MINIMAX_API_KEY"],
};

const ALL_PROVIDER_LABELS: Record<string, string> = {
  ...TEXT_PROVIDER_LABELS,
  ...TTS_PROVIDER_LABELS,
  ...VIDEO_PROVIDER_LABELS,
  ...MUSIC_PROVIDER_LABELS,
};

/** Human-readable name for any provider id, across all capabilities. Falls back to "Local Engine" for undefined (offline synthesis) and to the raw id for anything unrecognized. */
export function providerDisplayName(id: string | undefined): string {
  if (!id) return "Local Engine (offline)";
  return ALL_PROVIDER_LABELS[id] || id;
}
