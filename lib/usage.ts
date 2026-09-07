// lib/usage.ts — client-side AI usage tracking (Dexie-backed)
//
// A log entry is written after every successful generation call so the
// Settings page can show a running cost/activity summary. Purely local —
// nothing here is ever sent over the network.

import db from "./db";
import { v4 as uuidv4 } from "uuid";
import type { UsageFeature, UsageLogEntry } from "@/types/iep";

export async function logUsage(feature: UsageFeature, modelUsed: string, costEstimate: number, provider?: string): Promise<void> {
  const entry: UsageLogEntry = {
    id: uuidv4(),
    feature,
    provider,
    modelUsed,
    costEstimate: costEstimate || 0,
    createdAt: new Date().toISOString(),
  };
  await db.usageLogs.put(entry);
}

export async function getUsageLogs(limit = 200): Promise<UsageLogEntry[]> {
  return db.usageLogs.orderBy("createdAt").reverse().limit(limit).toArray();
}

export interface UsageSummary {
  totalCalls: number;
  totalCostEstimate: number;
  byProvider: { provider: string; calls: number; costEstimate: number }[];
  byFeature: { feature: UsageFeature; calls: number; costEstimate: number }[];
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const all = await db.usageLogs.toArray();

  const providerMap = new Map<string, { calls: number; costEstimate: number }>();
  const featureMap = new Map<UsageFeature, { calls: number; costEstimate: number }>();
  let totalCostEstimate = 0;

  for (const entry of all) {
    totalCostEstimate += entry.costEstimate;

    const providerKey = entry.provider || "local (offline)";
    const p = providerMap.get(providerKey) || { calls: 0, costEstimate: 0 };
    p.calls += 1;
    p.costEstimate += entry.costEstimate;
    providerMap.set(providerKey, p);

    const f = featureMap.get(entry.feature) || { calls: 0, costEstimate: 0 };
    f.calls += 1;
    f.costEstimate += entry.costEstimate;
    featureMap.set(entry.feature, f);
  }

  return {
    totalCalls: all.length,
    totalCostEstimate: Math.round(totalCostEstimate * 1000) / 1000,
    byProvider: Array.from(providerMap.entries())
      .map(([provider, v]) => ({ provider, ...v }))
      .sort((a, b) => b.calls - a.calls),
    byFeature: Array.from(featureMap.entries())
      .map(([feature, v]) => ({ feature, ...v }))
      .sort((a, b) => b.calls - a.calls),
  };
}

export async function clearUsageLogs(): Promise<void> {
  await db.usageLogs.clear();
}
