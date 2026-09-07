// lib/trending.ts — Linear regression trend classifier for goal progress

import { compareObservations, validateValue } from "./goalValidation";
import { validDate } from "./dates";
import type { IEPGoal, ProgressLogEntry, TrendResult } from "@/types/iep";

/** Parse an ISO date string into a JS Date (handles "YYYY-MM-DD" correctly). */
function parseDate(iso: string): Date {
  return new Date(iso + "T12:00:00");
}

/** Days between two dates (b - a). */
function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Simple ordinary-least-squares linear regression.
 * Returns { slope, intercept } where y = slope * x + intercept.
 */
function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Compute the trend status and projected value for a goal
 * given its sorted progress log entries.
 *
 * Classification:
 *   on_track  — projected value ≥ target
 *   at_risk   — projected value ≥ target × 0.85
 *   off_track — projected value < target × 0.85
 *   no_data   — fewer than 2 entries
 */
export function computeTrend(
  goal: IEPGoal,
  entries: ProgressLogEntry[]
): TrendResult {
  const sorted = entries.filter((e) => validDate(e.date) && !validateValue(goal, e.value)).sort(compareObservations);

  if (sorted.length === 0) {
    return {
      status: "no_data",
      projectedValue: null,
      slope: null,
      latestValue: null,
      percentToTarget: null,
    };
  }

  const latestValue = sorted[sorted.length - 1].value;
  const range = goal.targetValue - goal.baselineValue;
  const percentToTarget =
    range !== 0
      ? Math.round(((latestValue - goal.baselineValue) / range) * 100)
      : latestValue === goal.targetValue ? 100 : 0;

  if (new Set(sorted.map((e) => e.date)).size < 2 || !validDate(goal.reviewDate)) {
    return {
      status: "no_data",
      projectedValue: null,
      slope: null,
      latestValue,
      percentToTarget,
    };
  }

  const origin = parseDate(sorted[0].date);
  const reviewDate = parseDate(goal.reviewDate);
  const daysToReview = daysBetween(origin, reviewDate);

  const points = sorted.map((e) => ({
    x: daysBetween(origin, parseDate(e.date)),
    y: e.value,
  }));

  const { slope, intercept } = linearRegression(points);
  const rawProjection = intercept + slope * daysToReview;
  const upper = goal.measurementUnit === "%" ? 100 : goal.measurementUnit === "rating_scale" ? 5 : goal.measurementUnit === "trials" ? goal.trialsDenominator! : Infinity;
  const lower = goal.measurementUnit === "rating_scale" ? 1 : 0;
  const projectedValue = Math.max(lower, Math.min(upper, rawProjection));
  const direction = Math.sign(goal.targetValue - goal.baselineValue);
  const distance = Math.abs(goal.targetValue - goal.baselineValue);
  const shortfall = direction === 0 ? Math.abs(projectedValue - goal.targetValue) : (goal.targetValue - projectedValue) * direction;
  const status: TrendResult["status"] = shortfall <= 0 ? "on_track" : shortfall <= distance * 0.15 ? "at_risk" : "off_track";

  return {
    status,
    projectedValue: Math.round(projectedValue * 10) / 10,
    slope: Math.round(slope * 1000) / 1000,
    latestValue,
    percentToTarget,
  };
}
