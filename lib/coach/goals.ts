import { milestones } from "@/data/milestones";
import { TARGET_MILESTONE_IDS } from "@/data/milestones/aspect-targets";

/** Goals that have a full set of aspect targets, slowest first. */
export const GOAL_OPTIONS = milestones.filter((m) => TARGET_MILESTONE_IDS.includes(m.id));

/** The next goal below the current average: 24.3 s → Sub 20. */
export function suggestedGoal(averageMs: number | null): string | null {
  if (averageMs === null) return null;
  const under = GOAL_OPTIONS.filter((m) => m.thresholdMs !== null && m.thresholdMs < averageMs);
  return under[0]?.id ?? GOAL_OPTIONS.at(-1)?.id ?? null;
}
