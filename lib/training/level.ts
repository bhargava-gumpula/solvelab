import { bandForRung, currentLevel } from "@/data/training";
import type { SolveProfile } from "@/lib/coach/profile";

/** Where someone is on the road: their average, the rung it puts them on, and its stretch. */
export function levelContext(profile: SolveProfile, goalId: string | null | undefined) {
  const average = profile.aspects.find((aspect) => aspect.id === "full_solve")?.value ?? null;
  const here = currentLevel(average, goalId);
  return { average, here, band: bandForRung(here?.level.id) };
}
