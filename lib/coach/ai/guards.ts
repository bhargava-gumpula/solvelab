import { MODEL_TESTS } from "./features";

/**
 * Rules the planner always follows, whatever the model says. Used the same way
 * in training (simulated cubers) and on the Coach page.
 */

/** The four stages come first; the coach can't finish before they're measured. */
export const CORE_STAGE_TESTS = ["cross_only", "f2l_only", "oll_only", "pll_only"] as const;

/** A comparison test only makes sense once the tests it's compared with are done. */
export const PREREQUISITES: Readonly<Record<string, readonly string[]>> = {
  cross_unlimited: ["cross_only"],
  cross_f2l: ["cross_only", "f2l_only"],
  ls_oll: ["last_slot", "oll_only"],
  oll_pll_only: ["oll_only", "pll_only"],
};

/**
 * Tests the coach may ask for next: not already measured recently (`skip`),
 * and with their prerequisites measured (`have`).
 */
export function allowedTests(have: ReadonlySet<string>, skip: ReadonlySet<string>): string[] {
  return MODEL_TESTS.filter(
    (testId) =>
      !skip.has(testId) && (PREREQUISITES[testId] ?? []).every((required) => have.has(required)),
  );
}

/** The fewest tests the coach takes before it may decide it has enough. */
export const MIN_TESTS = 4;

export function canStop(have: ReadonlySet<string>): boolean {
  return have.size >= MIN_TESTS;
}

/** 1 for each test the planner may pick, in MODEL_TESTS order. */
export function testMask(allowed: readonly string[]): Uint8Array {
  const mask = new Uint8Array(MODEL_TESTS.length);
  for (const testId of allowed) mask[MODEL_TESTS.indexOf(testId)] = 1;
  return mask;
}

/** The plain-rules plan: the first allowed test in the usual order, then stop. */
export function ruleNextTest(have: ReadonlySet<string>, skip: ReadonlySet<string>): string | null {
  return allowedTests(have, skip)[0] ?? null;
}
