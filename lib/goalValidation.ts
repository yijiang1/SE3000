import type { IEPGoal } from "@/types/iep";
import { validDate } from "./dates";
export function validateValue(goal: Pick<IEPGoal, "measurementUnit" | "trialsDenominator">, value: number): string | null {
  if (!Number.isFinite(value) || value < 0) return "Enter a finite, nonnegative value.";
  if (goal.measurementUnit === "%" && value > 100) return "Percentages must be between 0 and 100.";
  if (goal.measurementUnit === "rating_scale" && (value < 1 || value > 5)) return "Ratings must be between 1 and 5.";
  if (["count", "trials"].includes(goal.measurementUnit) && !Number.isInteger(value)) return "Counts and trials must be whole numbers.";
  if (goal.measurementUnit === "trials" && (!Number.isInteger(goal.trialsDenominator) || (goal.trialsDenominator ?? 0) < 1)) return "Enter a positive whole-number trials denominator.";
  if (goal.measurementUnit === "trials" && value > goal.trialsDenominator!) return "The score cannot exceed the number of trials.";
  return null;
}
export function validateGoal(goal: Pick<IEPGoal, "goalText" | "baselineValue" | "targetValue" | "measurementUnit" | "trialsDenominator" | "reviewDate">): string | null {
  if (!goal.goalText.trim()) return "Goal text is required.";
  if (!validDate(goal.reviewDate)) return "Enter a valid review date.";
  return validateValue(goal, goal.baselineValue) || validateValue(goal, goal.targetValue);
}
export function compareObservations(a: {date: string; createdAt?: string; id?: string}, b: {date: string; createdAt?: string; id?: string}): number {
  return a.date.localeCompare(b.date) || (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || (a.id ?? "").localeCompare(b.id ?? "");
}
