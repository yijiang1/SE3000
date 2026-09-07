// lib/ai/textGen.ts — multi-provider structured (JSON) text generation with fallback chain
//
// Tries providers in order (configurable per-request, else DEFAULT_TEXT_PROVIDER_ORDER),
// skipping any without a configured API key. The first provider that returns
// parseable JSON wins; a provider that throws or returns unparseable text is
// skipped in favor of the next one. Callers fall back to a local synthesizer
// when this returns null (no provider configured, or all failed).

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import {
  DEFAULT_TEXT_PROVIDER_ORDER,
  TEXT_PROVIDER_ENV,
  type TextProviderId,
} from "./providers";

interface CallOpts {
  promptText: string;
  temperature: number;
}

interface RawResult {
  rawText: string;
  model: string;
}

function isConfigured(id: TextProviderId): boolean {
  return (TEXT_PROVIDER_ENV[id] ?? []).length > 0 && TEXT_PROVIDER_ENV[id].every((envVar) => {
    const v = process.env[envVar];
    return !!v && v.trim().length > 5;
  });
}

async function callGemini({ promptText, temperature }: CallOpts): Promise<RawResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 45_000 } });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: promptText,
    config: { responseMimeType: "application/json", temperature },
  });
  return { rawText: response.text || "{}", model: "gemini-2.5-flash" };
}

async function callOpenAICompatible(
  baseURL: string | undefined,
  apiKey: string,
  model: string,
  { promptText, temperature }: CallOpts
): Promise<RawResult> {
  const client = new OpenAI({ apiKey, baseURL, timeout: 45_000, maxRetries: 0 });
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: promptText }],
    temperature,
    response_format: { type: "json_object" },
  });
  return { rawText: completion.choices[0]?.message?.content || "{}", model };
}

const CALLERS: Record<TextProviderId, (opts: CallOpts) => Promise<RawResult>> = {
  gemini: callGemini,
  deepseek: (opts) =>
    callOpenAICompatible("https://api.deepseek.com/v1", process.env.DEEPSEEK_API_KEY!, "deepseek-chat", opts),
  kimi: (opts) =>
    callOpenAICompatible(
      process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1",
      process.env.MOONSHOT_API_KEY!,
      "moonshot-v1-8k",
      opts
    ),
  openai: (opts) => callOpenAICompatible(undefined, process.env.OPENAI_API_KEY!, "gpt-4o-mini", opts),
};

export interface TextGenResult {
  json: any;
  provider: TextProviderId;
  model: string;
}

export async function generateJSON(
  promptText: string,
  opts: { temperature?: number; preferredOrder?: TextProviderId[]; validate: (value: unknown) => boolean }
): Promise<TextGenResult | null> {
  const order = (opts.preferredOrder ?? DEFAULT_TEXT_PROVIDER_ORDER).filter(
    isConfigured
  );

  for (const provider of order) {
    try {
      const { rawText, model } = await CALLERS[provider]({
        promptText,
        temperature: opts.temperature ?? 0.3,
      });
      const cleanJson = rawText.replace(/```json\n?|\n?```/g, "").trim();
      const json = JSON.parse(cleanJson);
      if (!opts.validate(json)) throw new Error("Provider returned an invalid response shape");
      return { json, provider, model };
    } catch (err: any) {
      console.warn(`[AI text fallback] ${provider} failed:`, err?.message);
    }
  }
  return null;
}
