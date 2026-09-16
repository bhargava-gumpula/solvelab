import type { Solve, SkillId } from "@/types/domain";
import { buildFeatureVector, predict, type MlpModel, type WeaknessLabel } from "@/ml/mlp";
import { selectBaselineSolves } from "@/lib/coach/baseline";
import { coefficientOfVariation, mean, validTimes } from "@/lib/coach/stats";

function timesForExercise(solves: Solve[], exerciseId: string): number[] {
  return validTimes(solves.filter((s) => s.exerciseId === exerciseId).map((s) => s.finalTimeMs));
}

/** Build the 40-d feature vector the MLP expects from real timer solves. */
export function featuresFromSolves(solves: Solve[]): number[] | null {
  const baseline = selectBaselineSolves(solves);
  const baseTimes = validTimes(baseline.map((s) => s.finalTimeMs));
  if (baseTimes.length < 8) return null;
  const paceMs = mean(baseTimes);
  if (paceMs === null || paceMs <= 0) return null;

  const cross = timesForExercise(solves, "cross_only");
  const pair = timesForExercise(solves, "cross_first_pair");
  const f2l = timesForExercise(solves, "f2l_only");
  const pll = [
    ...timesForExercise(solves, "pll_only"),
    ...timesForExercise(solves, "pll_execution_drills"),
  ];

  const crossMean = mean(cross);
  const pairMean = mean(pair);
  const f2lMean = mean(f2l);
  const pllMean = mean(pll);

  return buildFeatureVector({
    paceSec: paceMs / 1000,
    globalCv: coefficientOfVariation(baseTimes) ?? 0.15,
    crossRatio: crossMean ? crossMean / paceMs : 0.18,
    pairRatio: pairMean ? pairMean / paceMs : 0.32,
    f2lRatio: f2lMean ? f2lMean / paceMs : 0.55,
    pllShare: pllMean ? pllMean / paceMs : 0.14,
    crossCv: coefficientOfVariation(cross) ?? 0.15,
    pairCv: coefficientOfVariation(pair) ?? 0.15,
    f2lCv: coefficientOfVariation(f2l) ?? 0.15,
    inspectUsed:
      baseline.filter((s) => (s.inspectionMs ?? 0) > 0).length / Math.max(baseline.length, 1),
    sampleCross: cross.length,
    samplePair: pair.length,
    sampleF2l: f2l.length,
    samplePll: pll.length,
    baselineN: baseTimes.length,
  });
}

export function predictWeakness(
  model: MlpModel,
  solves: Solve[],
): { skillId: SkillId; confidence: number; label: WeaknessLabel } | null {
  const x = featuresFromSolves(solves);
  if (!x) return null;
  // Need at least one focused diagnostic beyond baseline for a meaningful call.
  const diagnosticCount = solves.filter(
    (s) =>
      s.exerciseId &&
      s.exerciseId !== "normal_solves" &&
      s.finalTimeMs !== null &&
      (s.source === "diagnostic" || s.source === "training"),
  ).length;
  if (diagnosticCount < 5) return null;

  const result = predict(model, x);
  // Ignore low-confidence guesses — rules stay authoritative.
  if (result.confidence < 0.55) return null;

  return {
    skillId: result.label as SkillId,
    confidence: result.confidence,
    label: result.label,
  };
}
