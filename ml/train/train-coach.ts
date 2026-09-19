/**
 * Trains the coach model on simulated cubers and benchmarks it against the
 * plain rules. Run with: node ml/scripts/train-coach.mjs [--quick]
 *
 * 1. Diagnoser: from any mix of finished tests, the chance each part of the
 *    solve is really slow for the goal.
 * 2. Planner: the coach asks for the test that would clear up the most doubt
 *    (the diagnoser's uncertainty about the parts that test measures) and
 *    stops once little doubt is left. The stopping threshold is chosen here.
 *    (A planner trained to predict each test's value was tried first; it did
 *    no better than a random order, so it isn't shipped.)
 * 3. Benchmark on fresh cubers: F1 for finding real weaknesses, and how many
 *    tests it took, against the rules (every test, then the profile's tags).
 */
import { writeFileSync } from "node:fs";
import {
  MODEL_ASPECTS,
  MODEL_TESTS,
  featuresOf,
  profileOf,
  type Observation,
} from "@/lib/coach/ai/features";
import { allowedTests, canStop } from "@/lib/coach/ai/guards";
import {
  createNet,
  parameterCount,
  predict,
  seededRandom,
  toJson,
  train,
  type Net,
  type TrainingExample,
} from "@/lib/coach/ai/net";
import { rankByUncertainty, type CoachModelJson } from "@/lib/coach/ai/model";
import type { AspectId } from "@/lib/coach/aspects";
import {
  simulateAllTests,
  simulateBaseline,
  simulateCuber,
  type Random,
  type SimCuber,
} from "../sim";

const quick = process.argv.includes("--quick");
const SIZES = quick
  ? { diagnoserCubers: 3_000, benchmarkCubers: 600, epochs: 6 }
  : { diagnoserCubers: 30_000, benchmarkCubers: 3_000, epochs: 14 };
const HIDDEN = 64;
const outDir = process.env.COACH_MODEL_DIR ?? "ml";

interface Case {
  cuber: SimCuber;
  results: Record<string, number[]>;
  baseline: Observation["baseline"];
}

function makeCase(random: Random): Case {
  const cuber = simulateCuber(random);
  return {
    cuber,
    results: simulateAllTests(cuber, random),
    baseline: simulateBaseline(cuber, random),
  };
}

function observe(item: Case, have: Iterable<string>): Observation {
  const tests: Partial<Record<string, number[]>> = {};
  for (const testId of have) tests[testId] = item.results[testId];
  return { goalMilestoneId: item.cuber.goalMilestoneId, tests, baseline: item.baseline };
}

const truthVector = (cuber: SimCuber) =>
  Float64Array.from(MODEL_ASPECTS, (id) => (cuber.gaps[id] ? 1 : 0));

/** A random order the guards allow, cut at a random length. */
function randomHave(random: Random, length: number): Set<string> {
  const have = new Set<string>();
  while (have.size < length) {
    const allowed = allowedTests(have, have);
    if (allowed.length === 0) break;
    have.add(allowed[Math.floor(random() * allowed.length)]!);
  }
  return have;
}

function log(message: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);
}

// ---------------------------------------------------------------------------
// 1. Diagnoser
// ---------------------------------------------------------------------------

function diagnoserExamples(count: number, seed: number): TrainingExample[] {
  const random = seededRandom(seed);
  const examples: TrainingExample[] = [];
  for (let c = 0; c < count; c++) {
    const item = makeCase(random);
    const y = truthVector(item.cuber);
    const lengths = [
      MODEL_TESTS.length,
      ...Array.from({ length: 5 }, () => Math.floor(random() * 11)),
    ];
    for (const length of lengths) {
      examples.push({ x: featuresOf(observe(item, randomHave(random, length))), y });
    }
  }
  return examples;
}

log(`Simulating ${SIZES.diagnoserCubers} cubers for the diagnoser…`);
const diagTrain = diagnoserExamples(SIZES.diagnoserCubers, 101);
const diagVal = diagnoserExamples(Math.round(SIZES.diagnoserCubers / 10), 202);
const featureCount = diagTrain[0]!.x.length;
const diagnoser = createNet([featureCount, HIDDEN, HIDDEN, MODEL_ASPECTS.length], "sigmoid", 11);
log(
  `Training the diagnoser (${parameterCount(diagnoser)} parameters, ${diagTrain.length} examples)…`,
);
train(diagnoser, diagTrain, {
  epochs: SIZES.epochs,
  batchSize: 64,
  learningRate: 0.002,
  seed: 3,
  onEpoch: (epoch, value) => log(`  epoch ${epoch + 1}: loss ${value.toFixed(4)}`),
});

/** Per-aspect probability cut-offs that give the best F1 on held-out states with 4+ tests. */
function tuneThresholds(net: Net, examples: TrainingExample[]): number[] {
  const scored = examples
    .filter((example) => example.x[example.x.length - 1]! >= 0.4)
    .map((example) => ({ p: predict(net, example.x), y: example.y }));
  return MODEL_ASPECTS.map((_, a) => {
    let best = { threshold: 0.5, f1: -1 };
    for (let t = 0.2; t <= 0.8001; t += 0.025) {
      let tp = 0;
      let fp = 0;
      let fn = 0;
      for (const { p, y } of scored) {
        const predicted = p[a]! >= t;
        const actual = y[a] === 1;
        if (predicted && actual) tp++;
        else if (predicted) fp++;
        else if (actual) fn++;
      }
      const f1 = tp === 0 ? 0 : (2 * tp) / (2 * tp + fp + fn);
      if (f1 > best.f1) best = { threshold: Number(t.toFixed(3)), f1 };
    }
    return best.threshold;
  });
}
const thresholds = tuneThresholds(diagnoser, diagVal);
log(`Thresholds: ${thresholds.join(", ")}`);

// ---------------------------------------------------------------------------
// 3. Benchmark
// ---------------------------------------------------------------------------

interface Counts {
  tp: number;
  fp: number;
  fn: number;
}
const f1 = ({ tp, fp, fn }: Counts) => (tp === 0 ? 0 : (2 * tp) / (2 * tp + fp + fn));
const emptyCounts = (): Counts => ({ tp: 0, fp: 0, fn: 0 });

function score(counts: Counts, perAspect: Counts[], predicted: boolean[], cuber: SimCuber) {
  MODEL_ASPECTS.forEach((id, a) => {
    const actual = cuber.gaps[id];
    const bucket = perAspect[a]!;
    if (predicted[a] && actual) {
      counts.tp++;
      bucket.tp++;
    } else if (predicted[a]) {
      counts.fp++;
      bucket.fp++;
    } else if (actual) {
      counts.fn++;
      bucket.fn++;
    }
  });
}

const diagnosePredicted = (obs: Observation) => {
  const p = predict(diagnoser, featuresOf(obs));
  return MODEL_ASPECTS.map((_, a) => p[a]! >= thresholds[a]!);
};
const rulesPredicted = (obs: Observation) => {
  const profile = profileOf(obs);
  return MODEL_ASPECTS.map(
    (id) => profile.aspects.find((aspect) => aspect.id === id)!.tag === "slow",
  );
};

/** Ask for the test that clears up the most doubt; stop when little doubt is left. */
function runUncertainty(item: Case, threshold: number): Set<string> {
  const have = new Set<string>();
  while (have.size < MODEL_TESTS.length) {
    const allowed = allowedTests(have, have);
    if (allowed.length === 0) break;
    const p = predict(diagnoser, featuresOf(observe(item, have)));
    const probability = Object.fromEntries(MODEL_ASPECTS.map((id, a) => [id, p[a]!])) as Record<
      AspectId,
      number
    >;
    const [best] = rankByUncertainty(probability, have, allowed);
    if (!best) break;
    if (canStop(have) && best.value < threshold) break;
    have.add(best.testId);
  }
  return have;
}
/** Thresholds to try: summed uncertainty (nats) below which the coach stops. */
const THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0];

type Band = "slow" | "middle" | "fast";
const bandOf = (goal: string): Band =>
  ["sub120", "sub60", "sub45"].includes(goal)
    ? "slow"
    : ["sub30", "sub25"].includes(goal)
      ? "middle"
      : "fast";

// Choose the stopping threshold on separate cubers: the fewest tests whose F1
// stays within 0.015 of the diagnoser with every test.
log("Choosing when the coach has seen enough…");
const sweepRandom = seededRandom(707);
const sweepCases = Array.from({ length: Math.round(SIZES.benchmarkCubers / 2) }, () =>
  makeCase(sweepRandom),
);
const sweepAll = emptyCounts();
for (const item of sweepCases) {
  score(
    sweepAll,
    MODEL_ASPECTS.map(emptyCounts),
    diagnosePredicted(observe(item, MODEL_TESTS)),
    item.cuber,
  );
}
const sweep = THRESHOLDS.map((threshold) => {
  const counts = emptyCounts();
  const randomCounts = emptyCounts();
  const matched = seededRandom(Math.round(threshold * 1000) + 5);
  let tests = 0;
  for (const item of sweepCases) {
    const planned = runUncertainty(item, threshold);
    tests += planned.size;
    score(
      counts,
      MODEL_ASPECTS.map(emptyCounts),
      diagnosePredicted(observe(item, planned)),
      item.cuber,
    );
    score(
      randomCounts,
      MODEL_ASPECTS.map(emptyCounts),
      diagnosePredicted(observe(item, randomHave(matched, planned.size))),
      item.cuber,
    );
  }
  return {
    threshold,
    f1: Number(f1(counts).toFixed(3)),
    randomSameCountF1: Number(f1(randomCounts).toFixed(3)),
    meanTests: Number((tests / sweepCases.length).toFixed(2)),
  };
});
console.table(sweep);
const allF1 = f1(sweepAll);
const eligible = sweep.filter((entry) => entry.f1 >= allF1 - 0.015);
const STOP_THRESHOLD = (eligible.length ? eligible[eligible.length - 1]! : sweep[0]!).threshold;
log(`Every test: F1 ${allF1.toFixed(3)}. Stopping threshold ${STOP_THRESHOLD}.`);

log(`Benchmarking on ${SIZES.benchmarkCubers} fresh cubers…`);
const random = seededRandom(909);
const policies = ["rules_all", "model_all", "planner", "random_same_count"] as const;
type Policy = (typeof policies)[number];
const totals = Object.fromEntries(policies.map((p) => [p, emptyCounts()])) as Record<
  Policy,
  Counts
>;
const perAspect = Object.fromEntries(
  policies.map((p) => [p, MODEL_ASPECTS.map(emptyCounts)]),
) as Record<Policy, Counts[]>;
const byBand = {} as Record<Band, { cubers: number; tests: number } & Record<Policy, Counts>>;
const fixedOrder = Array.from({ length: MODEL_TESTS.length + 1 }, () => ({
  rules: emptyCounts(),
  model: emptyCounts(),
}));
let plannerTests = 0;
const testHistogram = new Array<number>(MODEL_TESTS.length + 1).fill(0);

for (let c = 0; c < SIZES.benchmarkCubers; c++) {
  const item = makeCase(random);
  const all = observe(item, MODEL_TESTS);
  const band = bandOf(item.cuber.goalMilestoneId);
  byBand[band] ??= {
    cubers: 0,
    tests: 0,
    ...(Object.fromEntries(policies.map((p) => [p, emptyCounts()])) as Record<Policy, Counts>),
  };
  const bucket = byBand[band];
  bucket.cubers++;

  const planned = runUncertainty(item, STOP_THRESHOLD);
  plannerTests += planned.size;
  bucket.tests += planned.size;
  testHistogram[planned.size]!++;

  const predictions: Record<Policy, boolean[]> = {
    rules_all: rulesPredicted(all),
    model_all: diagnosePredicted(all),
    planner: diagnosePredicted(observe(item, planned)),
    random_same_count: diagnosePredicted(observe(item, randomHave(random, planned.size))),
  };
  for (const policy of policies) {
    score(totals[policy], perAspect[policy], predictions[policy], item.cuber);
    score(bucket[policy], MODEL_ASPECTS.map(emptyCounts), predictions[policy], item.cuber);
  }
  for (let k = 1; k <= MODEL_TESTS.length; k++) {
    const obs = observe(item, MODEL_TESTS.slice(0, k));
    score(fixedOrder[k]!.rules, MODEL_ASPECTS.map(emptyCounts), rulesPredicted(obs), item.cuber);
    score(fixedOrder[k]!.model, MODEL_ASPECTS.map(emptyCounts), diagnosePredicted(obs), item.cuber);
  }
}

const round = (value: number, digits = 3) => Number(value.toFixed(digits));
const meanTests = plannerTests / SIZES.benchmarkCubers;
const benchmark = {
  cubers: SIZES.benchmarkCubers,
  stopThreshold: STOP_THRESHOLD,
  thresholdSweep: sweep,
  f1: Object.fromEntries(policies.map((p) => [p, round(f1(totals[p]))])),
  plannerMeanTests: round(meanTests, 2),
  plannerTestHistogram: testHistogram,
  fixedOrderF1: fixedOrder.slice(1).map((entry, index) => ({
    tests: index + 1,
    rules: round(f1(entry.rules)),
    model: round(f1(entry.model)),
  })),
  perAspectF1: Object.fromEntries(
    MODEL_ASPECTS.map((id, a) => [
      id,
      Object.fromEntries(policies.map((p) => [p, round(f1(perAspect[p][a]!))])),
    ]),
  ) as Record<AspectId, Record<Policy, number>>,
  byGoal: Object.fromEntries(
    (Object.entries(byBand) as [Band, (typeof byBand)[Band]][]).map(([band, value]) => [
      band,
      {
        cubers: value.cubers,
        plannerMeanTests: round(value.tests / value.cubers, 2),
        ...Object.fromEntries(policies.map((p) => [p, round(f1(value[p]))])),
      },
    ]),
  ),
};
const beatsRules =
  benchmark.f1.planner! >= benchmark.f1.rules_all! && meanTests < MODEL_TESTS.length;

console.log("\nF1 for finding real weaknesses (higher is better):");
console.table(benchmark.f1);
console.log(
  `Planner: ${benchmark.plannerMeanTests} tests on average (rules: ${MODEL_TESTS.length}).`,
);
console.log("Tests used by the planner:", testHistogram.join(" "));
console.log("\nF1 after the first k tests in the usual order:");
console.table(benchmark.fixedOrderF1);
console.log("\nF1 per part of the solve:");
console.table(benchmark.perAspectF1);
console.log("\nBy goal:");
console.table(benchmark.byGoal);
console.log(
  beatsRules ? "\n✅ The model beats the rules." : "\n❌ The model does not beat the rules.",
);

const model: CoachModelJson = {
  version: 1,
  trainedAt: new Date().toISOString(),
  featureCount,
  tests: [...MODEL_TESTS],
  aspects: [...MODEL_ASPECTS],
  diagnoser: toJson(diagnoser),
  thresholds,
  stopThreshold: STOP_THRESHOLD,
  benchmark: { ...benchmark, beatsRules, quick },
};
writeFileSync(`${outDir}/coach-model.json`, `${JSON.stringify(model)}\n`);
writeFileSync(
  `${outDir}/benchmark.json`,
  `${JSON.stringify({ ...benchmark, beatsRules, quick }, null, 2)}\n`,
);
log(`Wrote ${outDir}/coach-model.json and ${outDir}/benchmark.json.`);
