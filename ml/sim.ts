/**
 * Simulated cubers for training and benchmarking the coach model.
 *
 * Each cuber starts as a typical solver for their average (the level table in
 * data/milestones/aspect-targets.ts), varies a little person to person, and
 * gets 0–3 real weaknesses. Test attempts are drawn with realistic noise:
 * lognormal spread, occasional lockups, and OLL/PLL cases that are much
 * slower when the algorithm isn't known. Because every cuber's true numbers
 * are known, so are the right answers: which parts are really slow for the
 * goal they picked.
 */
import { getExercise, TEST_ORDER } from "@/data/exercises";
import { aspectTargetsFor, aspectTargetsForTime } from "@/data/milestones/aspect-targets";
import { milestones } from "@/data/milestones";
import { getAspect, rateAspect, type AspectId } from "@/lib/coach/aspects";
import { MODEL_ASPECTS, type Baseline } from "@/lib/coach/ai/features";
import { gaussian } from "@/lib/coach/ai/net";

export type Random = () => number;

export const WEAKNESSES = [
  "cross_execution",
  "inspection_planning",
  "cross_to_f2l",
  "pair_fluency",
  "lookahead",
  "f2l_to_oll",
  "oll_execution",
  "oll_knowledge",
  "oll_to_pll",
  "pll_execution",
  "pll_knowledge",
  "slow_turning",
  "inconsistency",
] as const;
export type Weakness = (typeof WEAKNESSES)[number];

/** A cuber's true, noise-free numbers (ms unless noted). */
export interface Latent {
  crossExecMs: number;
  planningGapMs: number;
  crossToF2lMs: number;
  pairMs: number;
  lookaheadMs: number;
  f2lToOllMs: number;
  /** A known OLL / PLL case; unknown cases take `slowFactor` times longer. */
  ollBaseMs: number;
  ollUnknown: number;
  pllBaseMs: number;
  pllUnknown: number;
  slowFactor: number;
  ollToPllMs: number;
  tps: number;
  /** Multiplies every attempt's spread. */
  spread: number;
  timerCv: number;
}

export interface SimCuber {
  latent: Latent;
  weaknesses: Weakness[];
  /** What their timer average works out to. */
  averageMs: number;
  goalMilestoneId: string;
  /** True value of each model aspect. */
  values: Record<AspectId, number>;
  /** True if the part is really slow for their goal. */
  gaps: Record<AspectId, boolean>;
}

const lognormal = (random: Random, sigma: number) => Math.exp(gaussian(random) * sigma);
const between = (random: Random, low: number, high: number) => low + (high - low) * random();
const pick = <T>(random: Random, items: readonly T[]) =>
  items[Math.floor(random() * items.length)]!;

const GOALS = milestones
  .filter((m) => m.thresholdMs !== null && aspectTargetsFor(m.id))
  .sort((a, b) => b.thresholdMs! - a.thresholdMs!);

/** The goal someone at this average usually picks: the next level, sometimes one further. */
export function goalFor(averageMs: number, random: Random): string {
  const faster = GOALS.filter((goal) => goal.thresholdMs! < averageMs);
  if (faster.length === 0) return GOALS[GOALS.length - 1]!.id;
  const step = random() < 0.25 && faster.length > 1 ? 1 : 0;
  return faster[step]!.id;
}

function weaknessCount(random: Random): number {
  const r = random();
  return r < 0.2 ? 0 : r < 0.55 ? 1 : r < 0.85 ? 2 : 3;
}

export function simulateCuber(random: Random, forced?: Weakness[]): SimCuber {
  const startMs = Math.exp(between(random, Math.log(9_000), Math.log(100_000)));
  const t = aspectTargetsForTime(startMs);
  const slowFactor = 2.2 * lognormal(random, 0.15);
  const typicalUnknown = t.ollSlowShare;
  const person = (sigma: number) => lognormal(random, sigma);

  const latent: Latent = {
    crossExecMs: (t.crossMs - t.crossPlanningGapMs) * person(0.08),
    planningGapMs: t.crossPlanningGapMs * person(0.35),
    crossToF2lMs: t.crossToF2lMs * person(0.3),
    pairMs: t.pairMs * person(0.08),
    lookaheadMs: t.lookaheadMs * person(0.3),
    f2lToOllMs: t.f2lToOllMs * person(0.3),
    ollBaseMs: (t.ollMs / (1 + typicalUnknown * (slowFactor - 1))) * person(0.08),
    ollUnknown: Math.min(0.6, typicalUnknown * person(0.35)),
    pllBaseMs: (t.pllMs / (1 + typicalUnknown * (slowFactor - 1))) * person(0.08),
    pllUnknown: Math.min(0.6, typicalUnknown * person(0.35)),
    slowFactor,
    ollToPllMs: t.ollToPllMs * person(0.3),
    tps: t.turningTps * person(0.1),
    spread: 1,
    timerCv: t.consistencyCv * person(0.15),
  };

  const weaknesses: Weakness[] = forced ? [...forced] : [];
  if (!forced) {
    const count = weaknessCount(random);
    while (weaknesses.length < count) {
      const next = pick(random, WEAKNESSES);
      if (!weaknesses.includes(next)) weaknesses.push(next);
    }
  }
  for (const weakness of weaknesses) {
    const severity = between(random, 0.4, 1);
    applyWeakness(latent, weakness, severity, t.crossMs, t.ollMs, t.pllMs);
  }

  const values = trueValues(latent);
  const averageMs =
    values.cross +
    latent.crossToF2lMs +
    values.f2l +
    latent.f2lToOllMs +
    values.oll +
    latent.ollToPllMs +
    values.pll;
  const goalMilestoneId = goalFor(averageMs, random);
  const targets = aspectTargetsFor(goalMilestoneId)!;
  const gaps = Object.fromEntries(
    MODEL_ASPECTS.map((id) => {
      const definition = getAspect(id);
      const value = definition.kind === "loss" ? Math.max(0, values[id]) : values[id];
      return [id, rateAspect(definition.kind, value, definition.target(targets)) === "slow"];
    }),
  ) as Record<AspectId, boolean>;

  return { latent, weaknesses, averageMs, goalMilestoneId, values, gaps };
}

function applyWeakness(
  latent: Latent,
  weakness: Weakness,
  severity: number,
  crossMs: number,
  ollMs: number,
  pllMs: number,
) {
  switch (weakness) {
    case "cross_execution":
      latent.crossExecMs *= 1.25 + 0.5 * severity;
      break;
    case "inspection_planning":
      latent.planningGapMs += crossMs * (0.15 + 0.35 * severity);
      break;
    case "cross_to_f2l":
      latent.crossToF2lMs += crossMs * (0.4 + 1.0 * severity);
      break;
    case "pair_fluency":
      latent.pairMs *= 1.3 + 0.5 * severity;
      break;
    case "lookahead":
      latent.lookaheadMs += 4 * latent.pairMs * (0.15 + 0.35 * severity);
      break;
    case "f2l_to_oll":
      latent.f2lToOllMs += ollMs * (0.3 + 0.8 * severity);
      break;
    case "oll_execution":
      latent.ollBaseMs *= 1.25 + 0.4 * severity;
      break;
    case "oll_knowledge":
      latent.ollUnknown = Math.min(0.6, latent.ollUnknown + 0.15 + 0.3 * severity);
      break;
    case "oll_to_pll":
      latent.ollToPllMs += pllMs * (0.3 + 0.8 * severity);
      break;
    case "pll_execution":
      latent.pllBaseMs *= 1.25 + 0.4 * severity;
      break;
    case "pll_knowledge":
      latent.pllUnknown = Math.min(0.6, latent.pllUnknown + 0.15 + 0.3 * severity);
      break;
    case "slow_turning": {
      latent.tps *= 0.6 + 0.2 * (1 - severity);
      // Slow hands slow down every algorithm a little.
      const drag = 1 + 0.15 * severity;
      latent.pairMs *= drag;
      latent.ollBaseMs *= drag;
      latent.pllBaseMs *= drag;
      break;
    }
    case "inconsistency":
      latent.spread = 1.3 + 0.4 * severity;
      latent.timerCv *= 1.5 + 0.8 * severity;
      break;
  }
}

/** Expected share of attempts over 1.5× the median: the unknown cases. */
function expectedSlowShare(unknown: number, slowFactor: number): number {
  return slowFactor > 1.6 ? unknown : unknown * 0.5;
}

export function trueValues(latent: Latent): Record<AspectId, number> {
  const oll = latent.ollBaseMs * (1 + latent.ollUnknown * (latent.slowFactor - 1));
  const pll = latent.pllBaseMs * (1 + latent.pllUnknown * (latent.slowFactor - 1));
  return {
    cross: latent.crossExecMs + latent.planningGapMs,
    cross_planning: latent.planningGapMs,
    cross_to_f2l: latent.crossToF2lMs,
    f2l: 4 * latent.pairMs + latent.lookaheadMs,
    pair_speed: latent.pairMs,
    lookahead: latent.lookaheadMs,
    f2l_to_oll: latent.f2lToOllMs,
    oll,
    oll_algorithms: expectedSlowShare(latent.ollUnknown, latent.slowFactor),
    oll_to_pll: latent.ollToPllMs,
    pll,
    pll_algorithms: expectedSlowShare(latent.pllUnknown, latent.slowFactor),
    turning_speed: latent.tps,
    full_solve: 0,
    consistency: latent.timerCv,
  };
}

/** Attempts someone takes: usually the full count, sometimes they finish early. */
export function attemptCount(testId: string, random: Random): number {
  const full = getExercise(testId)?.recommendedSampleCount ?? 10;
  return random() < 0.15 ? 3 + Math.floor(random() * Math.max(1, full - 3)) : full;
}

export function simulateTest(
  cuber: SimCuber,
  testId: string,
  random: Random,
  attempts = attemptCount(testId, random),
): number[] {
  const l = cuber.latent;
  const noise = (sigma: number) => lognormal(random, sigma * l.spread);
  const cross = (inspection: boolean) =>
    inspection
      ? l.crossExecMs * noise(0.18) + l.planningGapMs * noise(0.5)
      : l.crossExecMs * noise(0.15);
  const pair = () => l.pairMs * noise(0.28);
  const f2l = () => (4 * l.pairMs + l.lookaheadMs) * noise(0.12);
  const join = (ms: number) => ms * noise(0.45);
  const oll = () => l.ollBaseMs * (random() < l.ollUnknown ? l.slowFactor : 1) * noise(0.12);
  const pll = () => l.pllBaseMs * (random() < l.pllUnknown ? l.slowFactor : 1) * noise(0.1);

  const one = (): number => {
    switch (testId) {
      case "cross_only":
        return cross(true);
      case "cross_unlimited":
        return cross(false);
      case "f2l_only":
        return f2l();
      case "oll_only":
        return oll();
      case "pll_only":
        return pll();
      case "cross_f2l":
        return cross(true) + join(l.crossToF2lMs) + f2l();
      case "last_slot":
        return pair();
      case "ls_oll":
        return pair() + join(l.f2lToOllMs) + oll();
      case "oll_pll_only":
        return oll() + join(l.ollToPllMs) + pll();
      case "tps_test":
        return (24 / (l.tps * noise(0.07))) * 1000;
      case "slow_turning_f2l":
        return f2l() * 1.6;
      case "cross_first_pair":
        return cross(true) + join(l.crossToF2lMs) + pair();
      default:
        throw new Error(`Unknown test ${testId}`);
    }
  };

  return Array.from({ length: attempts }, () => {
    const lockup = random() < 0.04 * l.spread ? between(random, 1.3, 1.8) : 1;
    return Math.max(150, Math.round(one() * lockup));
  });
}

/** Every test's attempts, for a cuber, drawn once. */
export function simulateAllTests(cuber: SimCuber, random: Random): Record<string, number[]> {
  return Object.fromEntries(
    TEST_ORDER.map((testId) => [testId, simulateTest(cuber, testId, random)]),
  );
}

export function simulateBaseline(cuber: SimCuber, random: Random): Baseline {
  const r = random();
  const count = r < 0.3 ? Math.floor(random() * 5) : 12 + Math.floor(random() * 90);
  if (count < 5) return { count, averageMs: null, cv: null };
  return {
    count,
    averageMs: cuber.averageMs * lognormal(random, 0.04),
    cv: count >= 12 ? cuber.latent.timerCv * lognormal(random, 0.2) : null,
  };
}
