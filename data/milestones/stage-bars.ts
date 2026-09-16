import type { CfopStageBars } from "@/types/domain";

/**
 * Absolute CFOP stage budgets (ms) for each goal pace.
 * Sub-10 example: cross 1s · F2L 4s · OLL 2s · PLL 2s.
 * Cross + first pair sits between cross and ~cross + F2L/4.
 */
export const STAGE_BARS: Record<string, CfopStageBars> = {
  beginner: {
    crossMs: 20_000,
    crossFirstPairMs: 40_000,
    f2lMs: 90_000,
    ollMs: 25_000,
    pllMs: 25_000,
  },
  sub120: {
    crossMs: 15_000,
    crossFirstPairMs: 30_000,
    f2lMs: 70_000,
    ollMs: 18_000,
    pllMs: 17_000,
  },
  sub60: {
    crossMs: 8_000,
    crossFirstPairMs: 15_000,
    f2lMs: 35_000,
    ollMs: 8_000,
    pllMs: 9_000,
  },
  sub45: {
    crossMs: 6_000,
    crossFirstPairMs: 12_000,
    f2lMs: 26_000,
    ollMs: 6_500,
    pllMs: 6_500,
  },
  sub30: {
    crossMs: 4_000,
    crossFirstPairMs: 8_000,
    f2lMs: 17_000,
    ollMs: 4_500,
    pllMs: 4_500,
  },
  sub25: {
    crossMs: 3_200,
    crossFirstPairMs: 6_500,
    f2lMs: 14_000,
    ollMs: 3_900,
    pllMs: 3_900,
  },
  sub20: {
    crossMs: 2_500,
    crossFirstPairMs: 5_200,
    f2lMs: 11_000,
    ollMs: 3_250,
    pllMs: 3_250,
  },
  sub15: {
    crossMs: 1_800,
    crossFirstPairMs: 4_000,
    f2lMs: 8_200,
    ollMs: 2_500,
    pllMs: 2_500,
  },
  sub12: {
    crossMs: 1_400,
    crossFirstPairMs: 3_200,
    f2lMs: 6_500,
    ollMs: 2_050,
    pllMs: 2_050,
  },
  sub10: {
    crossMs: 1_000,
    crossFirstPairMs: 2_500,
    f2lMs: 4_000,
    ollMs: 2_000,
    pllMs: 2_000,
  },
};

export function stageBarsFor(milestoneId: string): CfopStageBars | null {
  return STAGE_BARS[milestoneId] ?? null;
}
