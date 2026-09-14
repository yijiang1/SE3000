// lib/settings.ts — client-side app settings (Dexie-backed, single "default" row)
//
// Holds the teacher's preferred AI provider order per capability. Preferences
// are sent along with each generation request; the server only honors a
// provider that actually has a key configured, falling back down its default
// chain otherwise — so an unconfigured preference here is harmless.

import db from "./db";
import type { AppSettings } from "@/types/iep";
import type { ProviderPreferences } from "@/lib/ai/providers";

// A single class period shared by all students — teachers add/remove/edit
// these in Settings; a student's SchoolSchedulePeriod.period indexes into
// this list (1-based) to find its time.
export interface ClassPeriodDefinition {
  startTime: string; // "HH:MM", 24-hour — <input type="time"> value
  endTime: string;   // "HH:MM", 24-hour
}

// Fallback bell schedule shown until a teacher sets their own periods.
export const DEFAULT_CLASS_PERIODS: ClassPeriodDefinition[] = [
  { startTime: "08:00", endTime: "08:45" },
  { startTime: "08:50", endTime: "09:35" },
  { startTime: "09:40", endTime: "10:25" },
  { startTime: "10:30", endTime: "11:15" },
  { startTime: "11:20", endTime: "12:05" },
  { startTime: "12:40", endTime: "13:25" },
  { startTime: "13:30", endTime: "14:15" },
  { startTime: "14:20", endTime: "15:05" },
];

function formatClockTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!hhmm || Number.isNaN(h) || Number.isNaN(m)) return "";
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Human-readable range for a class period, e.g. "8:00 AM–8:45 AM". Empty string if unset. */
export function formatPeriodRange(period: ClassPeriodDefinition | undefined): string {
  if (!period) return "";
  const start = formatClockTime(period.startTime);
  const end = formatClockTime(period.endTime);
  if (start && end) return `${start}–${end}`;
  return start || end;
}

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

/** Resolved class-period schedule, falling back to DEFAULT_CLASS_PERIODS until the teacher sets their own. */
export async function getClassPeriods(): Promise<ClassPeriodDefinition[]> {
  const settings = await getAppSettings();
  return settings.classPeriods?.length ? settings.classPeriods : DEFAULT_CLASS_PERIODS;
}

export async function saveProviderPreferences(providerPreferences: ProviderPreferences): Promise<AppSettings> {
  const current = await getAppSettings();
  const next: AppSettings = { ...current, id: "default", providerPreferences, updatedAt: new Date().toISOString() };
  await db.settings.put(next);
  return next;
}

export async function saveClassPeriods(classPeriods: ClassPeriodDefinition[]): Promise<AppSettings> {
  const current = await getAppSettings();
  const next: AppSettings = { ...current, id: "default", classPeriods, updatedAt: new Date().toISOString() };
  await db.settings.put(next);
  return next;
}
