import type { AspectId } from "@/lib/coach/aspects";
import { crossEfficiency, crossIntoF2l, inspection } from "./packs/cross";
import { f2lEfficiency, lastPairIntoOll, lookahead, pairRecognition } from "./packs/f2l";
import {
  ollAlgorithms,
  ollExecution,
  ollIntoPll,
  pllAlgorithms,
  pllExecution,
} from "./packs/last-layer";
import { consistency, practicePlan, turningTechnique } from "./packs/overall";
import {
  beginnerMethodCold,
  choosingTheNextPair,
  setUpYourCube,
  stuckPieces,
  switchToF2l,
  twoLookOll,
  twoLookPll,
} from "./packs/early";
import {
  algSetsWorthIt,
  aufBothEnds,
  colourNeutralPlan,
  competing,
  fillerMoves,
  multislotting,
  reconstructYourSolves,
  subTwentyBudget,
  xcrossProperly,
} from "./packs/late";
import {
  f2lFromTheFront,
  firstLookahead,
  goodAndBadEdges,
  lastLayerAtTheTop,
  pastTheFirstPair,
  practisingNearTen,
  speedYouCanUse,
  stuckAtFifteen,
} from "./packs/extra";
import type { AspectPack, LevelPack, TrainingPack } from "./types";

/** Packs about one part of the solve profile, in the order a solve happens. */
export const ASPECT_PACKS: AspectPack[] = [
  crossEfficiency,
  inspection,
  crossIntoF2l,
  f2lEfficiency,
  pairRecognition,
  lookahead,
  lastPairIntoOll,
  ollExecution,
  ollAlgorithms,
  ollIntoPll,
  pllExecution,
  pllAlgorithms,
  practicePlan,
  consistency,
  turningTechnique,
];

/** Packs written for one stretch of the road, from two minutes down to sub-10. */
export const LEVEL_PACKS: LevelPack[] = [
  beginnerMethodCold,
  setUpYourCube,
  switchToF2l,
  twoLookOll,
  twoLookPll,
  choosingTheNextPair,
  stuckPieces,
  aufBothEnds,
  subTwentyBudget,
  colourNeutralPlan,
  fillerMoves,
  multislotting,
  xcrossProperly,
  algSetsWorthIt,
  reconstructYourSolves,
  competing,
  firstLookahead,
  f2lFromTheFront,
  goodAndBadEdges,
  stuckAtFifteen,
  lastLayerAtTheTop,
  pastTheFirstPair,
  speedYouCanUse,
  practisingNearTen,
];

export const TRAINING_PACKS: TrainingPack[] = [...ASPECT_PACKS, ...LEVEL_PACKS];

const BY_ID = new Map(TRAINING_PACKS.map((pack) => [pack.id, pack]));
const BY_ASPECT = new Map(ASPECT_PACKS.map((pack) => [pack.aspectId, pack]));

/** Packs are read on Learn; Train is where the drills you pick end up. */
export function packHref(pack: TrainingPack): string {
  return `/learn/${pack.id}/`;
}

export function getPack(id: string): TrainingPack | undefined {
  return BY_ID.get(id);
}

/** The pack that teaches one part of the solve profile. */
export function packForAspect(aspectId: AspectId): TrainingPack | undefined {
  return BY_ASPECT.get(aspectId);
}

export function packsForIds(ids: readonly string[]): TrainingPack[] {
  return ids.map((id) => BY_ID.get(id)).filter((pack): pack is TrainingPack => !!pack);
}

export * from "./types";
export * from "./levels";
export * from "./bands";
