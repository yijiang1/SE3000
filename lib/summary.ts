// lib/summary.ts — Plain-language progress summary generator

import type { IEPGoal, ProgressLogEntry, StudentIEPProfile } from "@/types/iep";
import { computeTrend } from "./trending";

const UNIT_LABELS: Record<string, string> = {
  "%": "%",
  count: "occurrences",
  minutes: "minutes",
  trials: "trials",
  rating_scale: "/ 5",
  frequency: "times",
};

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function unitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit;
}

export function generateGoalSummary(
  profile: StudentIEPProfile,
  goal: IEPGoal,
  entries: ProgressLogEntry[]
): string {
  const name = profile.studentInitials;
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const today = new Date().toISOString().split("T")[0];
  const trend = computeTrend(goal, sorted);

  if (sorted.length === 0) {
    return `As of ${formatDate(today)}, no progress data has been recorded for ${name}'s goal: "${goal.goalText}". Baseline is ${goal.baselineValue}${unitLabel(goal.measurementUnit)}, with a target of ${goal.targetValue}${unitLabel(goal.measurementUnit)} by ${formatDate(goal.reviewDate)}.`;
  }

  const latest = sorted[sorted.length - 1];
  const values = sorted.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const unit = unitLabel(goal.measurementUnit);

  let trendSentence = "";
  if (trend.status === "on_track" && trend.projectedValue !== null) {
    trendSentence = `At the current rate of progress, ${name} is projected to reach ${trend.projectedValue}${unit} by the review date — on track to meet the ${goal.targetValue}${unit} target.`;
  } else if (trend.status === "at_risk" && trend.projectedValue !== null) {
    trendSentence = `At the current rate, ${name} is projected to reach approximately ${trend.projectedValue}${unit} by the review date, which is close to but may fall short of the ${goal.targetValue}${unit} target. Status: At Risk. Continued monitoring and support are recommended.`;
  } else if (trend.status === "off_track" && trend.projectedValue !== null) {
    trendSentence = `At the current rate, ${name} is projected to reach only ${trend.projectedValue}${unit} by the review date — below the ${goal.targetValue}${unit} target. Status: Off Track. Adjustment to supports or instructional strategies may be warranted.`;
  } else {
    trendSentence = `Insufficient data is available to project progress toward the ${goal.targetValue}${unit} target.`;
  }

  return (
    `As of ${formatDate(latest.date)}, ${name} has demonstrated performance of ${latest.value}${unit} on the goal: "${goal.goalText}." ` +
    `Across ${sorted.length} observation${sorted.length !== 1 ? "s" : ""} (range: ${min}${unit}–${max}${unit}; average: ${avg}${unit}), ${name}'s baseline was ${goal.baselineValue}${unit} and the target is ${goal.targetValue}${unit} by ${formatDate(goal.reviewDate)}. ` +
    trendSentence
  );
}
