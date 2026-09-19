import { getAspect, type AspectId } from "@/lib/coach/aspects";
import { featuresOf, MODEL_ASPECTS, MODEL_TESTS, profileOf, type Observation } from "./features";
import { allowedTests, canStop } from "./guards";
import { fromJson, predict, type Net, type NetJson } from "./net";

/**
 * The coach model: a diagnoser (how likely each part is a real weakness),
 * trained offline on simulated cubers by ml/train/train-coach.ts (weights in
 * ml/coach-model.json). The planner uses the diagnoser's own uncertainty: it
 * asks for the test that would clear up the most doubt, and stops once the
 * doubt left is below `stopThreshold`.
 */

export interface CoachModelJson {
  version: number;
  trainedAt: string;
  featureCount: number;
  tests: string[];
  aspects: string[];
  diagnoser: NetJson;
  /** Probability above which each aspect counts as a weakness (tuned for F1). */
  thresholds: number[];
  /** Doubt (summed uncertainty, nats) a test must clear up to be asked for. */
  stopThreshold: number;
  benchmark?: unknown;
}

export interface CoachModel {
  version: number;
  trainedAt: string;
  diagnoser: Net;
  thresholds: number[];
  stopThreshold: number;
}

export function modelFromJson(json: CoachModelJson): CoachModel {
  const sameLayout =
    json.tests.join() === MODEL_TESTS.join() && json.aspects.join() === MODEL_ASPECTS.join();
  if (!sameLayout) throw new Error("The coach model was trained for different tests or aspects.");
  return {
    version: json.version,
    trainedAt: json.trainedAt,
    diagnoser: fromJson(json.diagnoser),
    thresholds: json.thresholds,
    stopThreshold: json.stopThreshold,
  };
}

let loading: Promise<CoachModel | null> | null = null;

/** Loads the weights once, on demand. Null if they're missing or don't fit. */
export function loadCoachModel(): Promise<CoachModel | null> {
  loading ??= import("@/ml/coach-model.json")
    .then((module) => modelFromJson((module.default ?? module) as unknown as CoachModelJson))
    .catch((error: unknown) => {
      console.warn("Coach model unavailable; using the plain rules.", error);
      return null;
    });
  return loading;
}

export interface Diagnosis {
  /** Aspect → probability it's a real weakness for the goal. */
  probability: Record<AspectId, number>;
  weak: Record<AspectId, boolean>;
}

export function diagnose(model: CoachModel, observation: Observation): Diagnosis {
  const probs = predict(model.diagnoser, featuresOf(observation, profileOf(observation)));
  const probability = {} as Record<AspectId, number>;
  const weak = {} as Record<AspectId, boolean>;
  MODEL_ASPECTS.forEach((id, index) => {
    probability[id] = probs[index]!;
    weak[id] = probs[index]! >= (model.thresholds[index] ?? 0.5);
  });
  return { probability, weak };
}

export interface PlanChoice {
  /** The test to ask for, or null for "enough data". */
  testId: string | null;
  /** How much doubt the chosen test should clear up (nats). */
  value: number;
}

/**
 * The next test among those the rules allow, or null when little doubt is
 * left. `skip` holds tests measured recently enough not to ask for again.
 */
export function planNext(
  model: CoachModel,
  observation: Observation,
  skip: ReadonlySet<string>,
): PlanChoice {
  const have = new Set(MODEL_TESTS.filter((testId) => observation.tests[testId]?.length));
  // Tests measured long ago can be asked for again; recent ones are in `skip`.
  const allowed = allowedTests(have, skip);
  const { probability } = diagnose(model, observation);
  const [best] = rankByUncertainty(probability, have, allowed);
  if (!best) return { testId: null, value: 0 };
  if (canStop(have) && best.value < model.stopThreshold) return { testId: null, value: best.value };
  return best;
}

/** Uncertainty of a yes/no call with probability p, in nats (0 when sure, 0.69 at 50/50). */
export function entropy(p: number): number {
  const q = Math.min(1 - 1e-9, Math.max(1e-9, p));
  return -(q * Math.log(q) + (1 - q) * Math.log(1 - q));
}

/** Parts of the solve a test measures once the tests it's compared with are in `have`. */
export function partsMeasuredBy(testId: string, have: ReadonlySet<string>): AspectId[] {
  return MODEL_ASPECTS.filter((id) => {
    const tests = getAspect(id).tests;
    return (
      tests.includes(testId) && tests.every((required) => required === testId || have.has(required))
    );
  });
}

/**
 * How much doubt each allowed test would clear up: the summed uncertainty of
 * the diagnoser's calls on the parts that test would measure. Best first.
 */
export function rankByUncertainty(
  probability: Record<AspectId, number>,
  have: ReadonlySet<string>,
  allowed: readonly string[],
): { testId: string; value: number }[] {
  return allowed
    .map((testId) => ({
      testId,
      value: partsMeasuredBy(testId, have).reduce((sum, id) => sum + entropy(probability[id]), 0),
    }))
    .sort(
      (a, b) => b.value - a.value || MODEL_TESTS.indexOf(a.testId) - MODEL_TESTS.indexOf(b.testId),
    );
}
