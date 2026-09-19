import { describe, expect, it } from "vitest";
import modelJson from "@/ml/coach-model.json";
import { CORE_TESTS } from "@/data/exercises";
import { aspectTargetsFor, aspectTargetsForTime } from "@/data/milestones/aspect-targets";
import {
  FEATURE_COUNT,
  MODEL_ASPECTS,
  MODEL_TESTS,
  featuresOf,
  observationFromRuns,
  profileOf,
  type Observation,
} from "@/lib/coach/ai/features";
import { allowedTests, canStop, ruleNextTest, testMask } from "@/lib/coach/ai/guards";
import {
  diagnose,
  entropy,
  modelFromJson,
  partsMeasuredBy,
  planNext,
  rankByUncertainty,
  type CoachModelJson,
} from "@/lib/coach/ai/model";
import type { AspectId } from "@/lib/coach/aspects";
import {
  createNet,
  fromJson,
  loss,
  predict,
  seededRandom,
  toJson,
  train,
  type TrainingExample,
} from "@/lib/coach/ai/net";
import { buildSolveProfile } from "@/lib/coach/profile";
import { simulateCuber, simulateTest, trueValues } from "@/ml/sim";
import type { DiagnosticRun } from "@/types/domain";

const model = modelFromJson(modelJson as unknown as CoachModelJson);

function observation(tests: Partial<Record<string, number[]>>, goal = "sub20"): Observation {
  return { goalMilestoneId: goal, tests, baseline: { count: 0, averageMs: null, cv: null } };
}

describe("network", () => {
  it("learns a simple rule with each kind of output, and survives saving", () => {
    const random = seededRandom(5);
    const examples: TrainingExample[] = Array.from({ length: 400 }, () => {
      const a = random();
      const b = random();
      return { x: Float64Array.from([a, b]), y: Float64Array.from([a + b > 1 ? 1 : 0]) };
    });
    const net = createNet([2, 8, 1], "sigmoid", 3);
    const before = loss(net, examples);
    train(net, examples, { epochs: 30, learningRate: 0.02, seed: 1 });
    expect(loss(net, examples)).toBeLessThan(before * 0.6);
    expect(predict(net, [0.9, 0.9])[0]).toBeGreaterThan(0.8);
    expect(predict(net, [0.05, 0.05])[0]).toBeLessThan(0.2);

    const restored = fromJson(JSON.parse(JSON.stringify(toJson(net, 8))));
    expect(predict(restored, [0.7, 0.6])[0]).toBeCloseTo(predict(net, [0.7, 0.6])[0]!, 5);

    const linear = createNet([2, 8, 2], "linear", 4);
    const targets: TrainingExample[] = examples.map((example) => ({
      x: example.x,
      y: Float64Array.from([example.x[0]! * 2, 0]),
      mask: Uint8Array.from([1, 0]),
    }));
    const linearBefore = loss(linear, targets);
    train(linear, targets, { epochs: 30, learningRate: 0.01, seed: 2 });
    expect(loss(linear, targets)).toBeLessThan(linearBefore * 0.2);

    const softmax = createNet([2, 4, 3], "softmax", 6);
    const masked = predict(softmax, [0.5, 0.5], [1, 0, 1]);
    expect(masked[1]).toBe(0);
    expect(masked[0]! + masked[2]!).toBeCloseTo(1, 10);
  });
});

describe("features", () => {
  it("has a fixed length and uses the same formulas as the solve profile", () => {
    const obs = observation({ cross_only: Array(10).fill(2000), f2l_only: Array(10).fill(9000) });
    const x = featuresOf(obs);
    expect(x.length).toBe(FEATURE_COUNT);
    expect(x.length).toBe((modelJson as unknown as CoachModelJson).featureCount);
    // The cross test's slot is filled; the OLL test's is empty.
    expect(x[0]).toBe(1);
    expect(x[MODEL_TESTS.indexOf("oll_only") * 5]).toBe(0);

    const runs: DiagnosticRun[] = [
      {
        id: "a",
        exerciseId: "cross_only",
        createdAt: "2026-09-01T00:00:00.000Z",
        completedAt: "2026-09-01T00:05:00.000Z",
        solveIds: [],
        sampleCount: 10,
        timesMs: Array(10).fill(2000),
      },
    ];
    const fromRuns = observationFromRuns(runs, [], "sub20");
    expect(fromRuns.tests.cross_only).toHaveLength(10);
    const direct = buildSolveProfile({ runs, solves: [], goalMilestoneId: "sub20" });
    expect(profileOf(fromRuns).aspects.find((a) => a.id === "cross")!.value).toBe(
      direct.aspects.find((a) => a.id === "cross")!.value,
    );
  });

  it("holds odd data at the edge instead of extrapolating", () => {
    const tiny = featuresOf(observation({ f2l_only: Array(10).fill(500) }));
    const huge = featuresOf(observation({ f2l_only: Array(10).fill(500_000) }));
    const ratio = MODEL_TESTS.indexOf("f2l_only") * 5 + 1;
    expect(tiny[ratio]).toBe(-1);
    expect(huge[ratio]).toBe(1.5);
  });
});

describe("guards", () => {
  it("only allows comparison tests after their parts, and stops after the four stages", () => {
    const none = new Set<string>();
    expect(allowedTests(none, none)).toEqual([
      "cross_only",
      "f2l_only",
      "oll_only",
      "pll_only",
      "last_slot",
      "tps_test",
    ]);
    const stages = new Set(["cross_only", "f2l_only", "oll_only", "pll_only"]);
    expect(allowedTests(stages, stages)).toEqual([
      "cross_f2l",
      "last_slot",
      "oll_pll_only",
      "cross_unlimited",
      "tps_test",
    ]);
    expect(canStop(new Set(["cross_only", "f2l_only", "oll_only"]))).toBe(false);
    expect(canStop(stages)).toBe(true);
    expect(ruleNextTest(none, none)).toBe("cross_only");
    expect(Array.from(testMask(["f2l_only"]))).toEqual(
      MODEL_TESTS.map((id) => (id === "f2l_only" ? 1 : 0)),
    );
  });
});

describe("uncertainty planner", () => {
  it("values a test by the doubt it clears up about the parts it measures", () => {
    expect(entropy(0.5)).toBeCloseTo(Math.log(2), 6);
    expect(entropy(0.01)).toBeLessThan(0.1);
    expect(partsMeasuredBy("pll_only", new Set())).toEqual(["pll", "pll_algorithms"]);
    // A comparison test measures its join only once its parts are in.
    expect(partsMeasuredBy("cross_f2l", new Set(["cross_only"]))).toEqual([]);
    expect(partsMeasuredBy("cross_f2l", new Set(["cross_only", "f2l_only"]))).toEqual([
      "cross_to_f2l",
    ]);

    const probability = Object.fromEntries(MODEL_ASPECTS.map((id) => [id, 0.02])) as Record<
      AspectId,
      number
    >;
    probability.oll = 0.5;
    probability.oll_algorithms = 0.5;
    const ranked = rankByUncertainty(probability, new Set(), [
      "cross_only",
      "oll_only",
      "tps_test",
    ]);
    expect(ranked[0]!.testId).toBe("oll_only");
    expect(ranked[0]!.value).toBeCloseTo(2 * Math.log(2), 6);
  });
});

describe("simulator", () => {
  it("builds consistent cubers whose weaknesses show up where they should", () => {
    const healthy = simulateCuber(seededRandom(9), []);
    const joined = simulateCuber(seededRandom(9), ["cross_to_f2l"]);
    expect(joined.latent.crossToF2lMs).toBeGreaterThan(healthy.latent.crossToF2lMs * 1.5);
    const values = trueValues(healthy.latent);
    expect(values.f2l).toBeCloseTo(4 * values.pair_speed + values.lookahead, 6);
    expect(healthy.weaknesses).toEqual([]);

    // The joined cuber loses more time between cross and F2L in the combined test.
    const random = seededRandom(1);
    const loss = (cuber: typeof healthy) => {
      const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
      return (
        mean(simulateTest(cuber, "cross_f2l", random, 60)) -
        mean(simulateTest(cuber, "cross_only", random, 60)) -
        mean(simulateTest(cuber, "f2l_only", random, 60))
      );
    };
    expect(loss(joined)).toBeGreaterThan(loss(healthy));
  });

  it("gives every level a goal table, including in-between averages", () => {
    const t = aspectTargetsForTime(17_500);
    const slower = aspectTargetsFor("sub20")!;
    const faster = aspectTargetsFor("sub15")!;
    expect(t.crossMs).toBeLessThan(slower.crossMs);
    expect(t.crossMs).toBeGreaterThan(faster.crossMs);
    expect(aspectTargetsForTime(20_000).f2lMs).toBe(slower.f2lMs);
  });
});

describe("shipped coach model", () => {
  it("covers the same tests and parts as the app, and beat the rules in its benchmark", () => {
    const json = modelJson as unknown as CoachModelJson & {
      benchmark: { beatsRules: boolean; f1: Record<string, number>; plannerMeanTests: number };
    };
    expect(json.tests).toEqual([...CORE_TESTS]);
    expect(json.aspects).toEqual([...MODEL_ASPECTS]);
    expect(json.benchmark.beatsRules).toBe(true);
    expect(json.benchmark.f1.planner).toBeGreaterThan(json.benchmark.f1.rules_all!);
    expect(json.benchmark.plannerMeanTests).toBeLessThan(MODEL_TESTS.length);
  });

  it("gives a probability for every part and only asks for allowed tests", () => {
    const empty = observation({});
    const { probability } = diagnose(model, empty);
    for (const id of MODEL_ASPECTS) {
      expect(probability[id]).toBeGreaterThanOrEqual(0);
      expect(probability[id]).toBeLessThanOrEqual(1);
    }
    const first = planNext(model, empty, new Set());
    expect(allowedTests(new Set(), new Set())).toContain(first.testId);

    // Walk a simulated cuber through the planner: every pick is allowed, and it
    // never stops before the four stages are measured.
    const random = seededRandom(21);
    for (let c = 0; c < 20; c++) {
      const cuber = simulateCuber(random);
      const tests: Partial<Record<string, number[]>> = {};
      for (let step = 0; step < MODEL_TESTS.length; step++) {
        const have = new Set(Object.keys(tests));
        const choice = planNext(model, observation(tests, cuber.goalMilestoneId), have);
        if (choice.testId === null) {
          expect(canStop(have) || allowedTests(have, have).length === 0).toBe(true);
          break;
        }
        expect(allowedTests(have, have)).toContain(choice.testId);
        tests[choice.testId] = simulateTest(cuber, choice.testId, random);
      }
    }
  });
});
