import type { CfopStageBars } from "@/types/domain";
import { aspectTargetsFor, TARGET_MILESTONE_IDS } from "./aspect-targets";

/**
 * CFOP stage goals (ms) for each goal pace, taken from the aspect targets so
 * the stage diagnostic and the solve profile always agree.
 */
function barsFor(milestoneId: string): CfopStageBars | null {
  const targets = aspectTargetsFor(milestoneId);
  if (!targets) return null;
  return {
    crossMs: targets.crossMs,
    crossFirstPairMs: targets.crossFirstPairMs,
    f2lMs: targets.f2lMs,
    ollMs: targets.ollMs,
    pllMs: targets.pllMs,
  };
}

export const STAGE_BARS: Record<string, CfopStageBars> = {
  // Beginners have no time goal; these are only a loose reference.
  beginner: {
    crossMs: 20_000,
    crossFirstPairMs: 40_000,
    f2lMs: 90_000,
    ollMs: 25_000,
    pllMs: 25_000,
  },
  ...Object.fromEntries(TARGET_MILESTONE_IDS.map((id) => [id, barsFor(id)!])),
};

export function stageBarsFor(milestoneId: string): CfopStageBars | null {
  return STAGE_BARS[milestoneId] ?? null;
}
