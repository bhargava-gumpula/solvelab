/**
 * Prints one simulated cuber as JSON: their weaknesses, goal, true gaps, a
 * finished run of every core test and 50 timer solves. Useful for demos,
 * screenshots and checking the coach by hand.
 *
 *   node ml/scripts/run.mjs ml/train/sample-cuber.ts [seed] [weakness,…]
 */
import { CORE_TESTS } from "@/data/exercises";
import { gaussian, seededRandom } from "@/lib/coach/ai/net";
import { simulateCuber, simulateTest, WEAKNESSES, type Weakness } from "../sim";

const seed = Number(process.argv[2] ?? 1);
const forced = (process.argv[3]?.split(",").filter(Boolean) ?? []) as Weakness[];
for (const weakness of forced) {
  if (!WEAKNESSES.includes(weakness)) throw new Error(`Unknown weakness ${weakness}`);
}
const random = seededRandom(seed);
const cuber = simulateCuber(random, forced.length ? forced : undefined);
const tests = Object.fromEntries(
  CORE_TESTS.map((testId) => [
    testId,
    simulateTest(cuber, testId, random, testId === "tps_test" ? 5 : undefined),
  ]),
);
const solves = Array.from({ length: 50 }, () =>
  Math.round(cuber.averageMs * Math.exp(gaussian(random) * cuber.latent.timerCv)),
);
console.log(
  JSON.stringify(
    {
      seed,
      weaknesses: cuber.weaknesses,
      averageMs: Math.round(cuber.averageMs),
      goalMilestoneId: cuber.goalMilestoneId,
      gaps: Object.entries(cuber.gaps)
        .filter(([, gap]) => gap)
        .map(([id]) => id),
      tests,
      solves,
    },
    null,
    2,
  ),
);
