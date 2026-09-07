// lib/settings.ts — client-side app settings (Dexie-backed, single "default" row)
//
// Holds the teacher's preferred AI provider order per capability. Preferences
// are sent along with each generation request; the server only honors a
// provider that actually has a key configured, falling back down its default
// chain otherwise — so an unconfigured preference here is harmless.

import db from "./db";
import type { AppSettings } from "@/types/iep";
import type { ProviderPreferences } from "@/lib/ai/providers";

function emptySettings(): AppSettings {
  return {
    id: "default",
    providerPreferences: {},
    updatedAt: new Date().toISOString(),
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  const existing = await db.settings.get("default");
  return existing || emptySettings();
}

export async function saveProviderPreferences(providerPreferences: ProviderPreferences): Promise<AppSettings> {
  const next: AppSettings = {
    id: "default",
    providerPreferences,
    updatedAt: new Date().toISOString(),
  };
  await db.settings.put(next);
  return next;
}
