import type { CfopStageKey } from "./pace";

/** Short, actionable notes shown next to slow/average stages. */
export const STAGE_TIPS: Record<CfopStageKey, string[]> = {
  cross: [
    "Use inspection to plan the whole cross — not just the first two pieces.",
    "Keep the cross on bottom and avoid rotations during execution.",
  ],
  cross_first_pair: [
    "Track one F2L pair while you finish the last cross edge.",
    "Place that pair without a cube rotation when you can.",
  ],
  f2l: [
    "Slow down turning so you can see the next pair before the current one is done.",
    "Prefer solutions that don’t rotate the cube; insert from the back when it’s free.",
  ],
  oll: [
    "Name the case before you start turning — recognition, then execution.",
    "Drill 2-look OLL until 1-look cases are instant, then add algs one set at a time.",
  ],
  pll: [
    "A-perm / U-perm / T-perm / J-perm first; add the rest once those are automatic.",
    "Finish with AUF in the same motion as the last turns — don’t pause to check.",
  ],
};

export function tipsForStage(stage: CfopStageKey): string[] {
  return STAGE_TIPS[stage] ?? [];
}
