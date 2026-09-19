/**
 * Compares real shared test results with the simulator, to see where the
 * simulated cubers need tuning before retraining.
 *
 *   npm run ml:calibrate -- ml/exports/contributions-<date>.json
 *
 * For each goal band and test: the median time as a share of the goal, and
 * the spread between attempts, in real data and in the simulator. Also counts
 * retests (the same person taking a test again on a later day), which is the
 * data needed to check the coach's calls against real improvement.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { aspectTargetsFor, testGoal } from "@/data/milestones/aspect-targets";
import { getExercise } from "@/data/exercises";
import { MODEL_TESTS } from "@/lib/coach/ai/features";
import { estimate } from "@/lib/coach/profile";
import { seededRandom } from "@/lib/coach/ai/net";
import type { ExportFile } from "../export";
import { simulateCuber, simulateTest } from "../sim";

const path = process.argv[2];
if (!path) {
  console.error("Usage: npm run ml:calibrate -- <export file>");
  process.exit(1);
}
const file = JSON.parse(readFileSync(path, "utf8")) as ExportFile;

type Band = "slow" | "middle" | "fast";
const bandOf = (goal: string | null): Band | null =>
  !goal
    ? null
    : ["sub120", "sub60", "sub45"].includes(goal)
      ? "slow"
      : ["sub30", "sub25"].includes(goal)
        ? "middle"
        : "fast";

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

/** Time as a share of the goal for that test (turning speed as time per attempt). */
function ratio(
  testId: string,
  goal: string,
  times: number[],
): { ratio: number; spread: number } | null {
  const targets = aspectTargetsFor(goal);
  const target = targets ? testGoal(testId, targets) : null;
  const stats = estimate(times);
  if (!target || !stats) return null;
  const algorithm = getExercise(testId)?.algorithm;
  const turns = algorithm ? algorithm.moves.trim().split(/\s+/).length * algorithm.repetitions : 0;
  const goalMs = target.kind === "speed" ? (turns / target.value) * 1000 : target.value;
  return { ratio: stats.mean / goalMs, spread: stats.se / stats.mean };
}

type Bucket = Record<Band, Record<string, { ratios: number[]; spreads: number[] }>>;
const emptyBucket = (): Bucket => {
  const tests = () =>
    Object.fromEntries(
      MODEL_TESTS.map((testId) => [testId, { ratios: [] as number[], spreads: [] as number[] }]),
    );
  return { slow: tests(), middle: tests(), fast: tests() };
};

const real = emptyBucket();
for (const run of file.runs) {
  const band = bandOf(run.goal);
  if (!band || !run.goal || !real[band][run.testId]) continue;
  const value = ratio(run.testId, run.goal, run.attemptsMs);
  if (!value) continue;
  real[band][run.testId]!.ratios.push(value.ratio);
  real[band][run.testId]!.spreads.push(value.spread);
}

const simulated = emptyBucket();
const random = seededRandom(4242);
for (let i = 0; i < 3000; i++) {
  const cuber = simulateCuber(random);
  const band = bandOf(cuber.goalMilestoneId)!;
  for (const testId of MODEL_TESTS) {
    const value = ratio(testId, cuber.goalMilestoneId, simulateTest(cuber, testId, random));
    if (!value) continue;
    simulated[band][testId]!.ratios.push(value.ratio);
    simulated[band][testId]!.spreads.push(value.spread);
  }
}

const rows = [];
for (const band of ["slow", "middle", "fast"] as Band[]) {
  for (const testId of MODEL_TESTS) {
    const r = real[band][testId]!;
    const s = simulated[band][testId]!;
    if (r.ratios.length === 0) continue;
    const realRatio = median(r.ratios)!;
    const simRatio = median(s.ratios)!;
    rows.push({
      band,
      testId,
      runs: r.ratios.length,
      realTimeVsGoal: Number(realRatio.toFixed(2)),
      simTimeVsGoal: Number(simRatio.toFixed(2)),
      realSpread: Number(median(r.spreads)!.toFixed(3)),
      simSpread: Number(median(s.spreads)!.toFixed(3)),
      tune: Math.abs(realRatio / simRatio - 1) > 0.15 ? "check" : "",
    });
  }
}

// Retests: the same person and test on more than one day.
const byPersonTest = new Map<string, { day: string; mean: number }[]>();
for (const run of file.runs) {
  const stats = estimate(run.attemptsMs);
  if (!stats) continue;
  const key = `${run.contributor}:${run.testId}`;
  byPersonTest.set(key, [...(byPersonTest.get(key) ?? []), { day: run.day, mean: stats.mean }]);
}
const retests = [...byPersonTest.values()].filter(
  (entries) => new Set(entries.map((e) => e.day)).size > 1,
);

console.log(
  `${file.runs.length} runs from ${file.contributors} people (exported ${file.exportedAt}).`,
);
console.table(rows);
console.log(`Retests available: ${retests.length} (person + test taken on more than one day).`);
const out = path.replace(/\.json$/, ".calibration.json");
writeFileSync(out, `${JSON.stringify({ source: path, rows, retests: retests.length }, null, 2)}\n`);
console.log(`Wrote ${out}. Rows marked "check" differ from the simulator by over 15%.`);
