import type { CoachEvent, CoachThread, DiagnosticRun, Solve } from "@/types/domain";
import { aspectTargetsFor } from "@/data/milestones/aspect-targets";
import { MODEL_ASPECTS, MODEL_TESTS, observationFromRuns, type Observation } from "./ai/features";
import { allowedTests } from "./ai/guards";
import { diagnose, planNext, type CoachModel } from "./ai/model";
import { ASPECTS, aspectsForTest, getAspect, type AspectId } from "./aspects";
import { buildSolveProfile } from "./profile";

/**
 * The coach conversation as a pure function: given the thread so far and the
 * person's data, which steps come next. Messages are rendered from the events
 * (components/coach/coach-thread.tsx), so wording can change without
 * touching saved conversations.
 */

/** Tests finished this recently count as current; older ones can be asked for again. */
export const FRESH_DAYS = 14;
const DAY_MS = 86_400_000;

export interface EngineInput {
  thread: CoachThread;
  runs: DiagnosticRun[];
  solves: Solve[];
  goalMilestoneId: string | null;
  model: CoachModel | null;
  now: Date;
}

type Requested = Extract<CoachEvent, { type: "requested" }>;
export type Summary = Extract<CoachEvent, { type: "summary" }>;

export function lastGoal(events: CoachEvent[]): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]!;
    if (event.type === "goal") return event.goalMilestoneId;
  }
  return null;
}

/** Tests finished or skipped in this conversation. */
export function testsDone(events: CoachEvent[]): Set<string> {
  return new Set(
    events.flatMap((event) =>
      event.type === "result" || event.type === "skipped" ? [event.testId] : [],
    ),
  );
}

/** The request still waiting for its test, if any. */
export function openRequest(events: CoachEvent[]): Requested | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]!;
    if (event.type === "result" || event.type === "skipped" || event.type === "summary")
      return null;
    if (event.type === "requested") return event;
  }
  return null;
}

export function summaryOf(thread: CoachThread | null | undefined): Summary | null {
  const events = thread?.events ?? [];
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]!;
    if (event.type === "summary") return event;
  }
  return null;
}

function finishedRunSince(runs: DiagnosticRun[], testId: string, since: string) {
  return runs
    .filter(
      (run) =>
        run.exerciseId === testId &&
        run.completedAt &&
        run.completedAt >= since &&
        (run.timesMs?.length ?? 0) > 0,
    )
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0];
}

/** Tests with a finished run in the last FRESH_DAYS days. */
export function freshTests(runs: DiagnosticRun[], now: Date): Set<string> {
  const since = new Date(now.getTime() - FRESH_DAYS * DAY_MS).toISOString();
  return new Set(
    runs
      .filter(
        (run) => run.completedAt && run.completedAt >= since && (run.timesMs?.length ?? 0) > 0,
      )
      .map((run) => run.exerciseId),
  );
}

/** Tests to retake to check on a summary's measured weak parts: each part's deciding test. */
export function retestPlan(summary: Summary): string[] {
  const tests = new Set<string>();
  for (const aspect of summary.aspects) {
    if (!aspect.weak || aspect.value === null) continue;
    const definition = getAspect(aspect.id as AspectId);
    const deciding = definition.tests[definition.tests.length - 1];
    if (deciding) tests.add(deciding);
  }
  return MODEL_TESTS.filter((testId) => tests.has(testId));
}

function observationFor(input: EngineInput, goal: string): Observation {
  if (input.thread.mode !== "fresh") return observationFromRuns(input.runs, input.solves, goal);
  // Starting over: only what's been measured since this conversation began.
  const since = input.thread.createdAt;
  const recent = input.runs.filter((run) => (run.completedAt ?? "") >= since);
  return observationFromRuns(recent, input.solves, goal);
}

/** The part of the solve a test should clear up: the most uncertain one it measures. */
function focusFor(testId: string, input: EngineInput, observation: Observation): AspectId | null {
  const measured = aspectsForTest(testId)
    .map((aspect) => aspect.id)
    .filter((id) => MODEL_ASPECTS.includes(id));
  if (measured.length === 0) return null;
  if (!input.model) return measured[0]!;
  const { probability } = diagnose(input.model, observation);
  return [...measured].sort(
    (a, b) => Math.abs(probability[a] - 0.5) - Math.abs(probability[b] - 0.5),
  )[0]!;
}

function nextRequest(
  events: CoachEvent[],
  input: EngineInput,
  goal: string,
  at: string,
): Requested | null {
  const done = testsDone(events);
  const observation = observationFor(input, goal);

  if (input.thread.mode === "retest") {
    const testId = input.thread.plannedTests.find((id) => !done.has(id));
    return testId
      ? {
          type: "requested",
          at,
          testId,
          source: "rules",
          focus: focusFor(testId, input, observation),
        }
      : null;
  }

  const skip = new Set(done);
  if (input.thread.mode === "normal") {
    for (const testId of freshTests(input.runs, input.now)) skip.add(testId);
  }
  let testId: string | null;
  let source: Requested["source"];
  if (input.model) {
    testId = planNext(input.model, observation, skip).testId;
    source = "ai";
  } else {
    const have = new Set(MODEL_TESTS.filter((id) => observation.tests[id]?.length));
    testId = allowedTests(have, skip)[0] ?? null;
    source = "rules";
  }
  return testId
    ? { type: "requested", at, testId, source, focus: focusFor(testId, input, observation) }
    : null;
}

function resultEvent(
  input: EngineInput,
  goal: string,
  testId: string,
  runId: string,
  at: string,
): CoachEvent {
  const profile = buildSolveProfile({
    runs: input.runs,
    solves: input.solves,
    goalMilestoneId: goal,
  });
  return {
    type: "result",
    at,
    testId,
    runId,
    aspects: aspectsForTest(testId)
      .filter((aspect) => aspect.tests.includes(testId))
      .map((definition) => {
        const aspect = profile.aspects.find((entry) => entry.id === definition.id)!;
        return { id: aspect.id, value: aspect.value, tag: aspect.tag };
      }),
  };
}

export function summaryEvent(input: EngineInput, goal: string, at: string): Summary {
  const profile = buildSolveProfile({
    runs: input.runs,
    solves: input.solves,
    goalMilestoneId: goal,
  });
  const observation = observationFromRuns(input.runs, input.solves, goal);
  const diagnosis = input.model ? diagnose(input.model, observation) : null;
  const targets = aspectTargetsFor(goal);
  return {
    type: "summary",
    at,
    goalMilestoneId: goal,
    source: diagnosis ? "ai" : "rules",
    modelVersion: input.model?.version ?? null,
    testsUsed: MODEL_TESTS.filter((id) => observation.tests[id]?.length),
    aspects: ASPECTS.map((definition) => {
      const aspect = profile.aspects.find((entry) => entry.id === definition.id)!;
      const modelled = diagnosis && MODEL_ASPECTS.includes(definition.id);
      return {
        id: definition.id,
        value: aspect.value,
        target: targets ? definition.target(targets) : null,
        tag: aspect.tag,
        probability: modelled ? Number(diagnosis.probability[definition.id].toFixed(3)) : null,
        weak: modelled ? diagnosis.weak[definition.id] : aspect.tag === "slow",
      };
    }),
  };
}

/**
 * The steps to add so the thread catches up with the person's data: record
 * finished tests, ask for the next one, or sum up when no test is worth it.
 */
export function advance(input: EngineInput): { events: CoachEvent[]; complete: boolean } {
  const { thread, goalMilestoneId: goal } = input;
  const added: CoachEvent[] = [];
  if (thread.completedAt || !goal) return { events: added, complete: false };
  const at = input.now.toISOString();
  const all = [...thread.events];
  const push = (event: CoachEvent) => {
    added.push(event);
    all.push(event);
  };

  if (lastGoal(all) !== goal) push({ type: "goal", at, goalMilestoneId: goal });

  for (let step = 0; step <= MODEL_TESTS.length; step++) {
    const open = openRequest(all);
    if (open) {
      const run = finishedRunSince(input.runs, open.testId, open.at);
      if (!run) break;
      push(resultEvent(input, goal, open.testId, run.id, at));
      continue;
    }
    const request = nextRequest(all, input, goal, at);
    if (request) {
      push(request);
      break;
    }
    push(summaryEvent(input, goal, at));
    return { events: added, complete: true };
  }
  return { events: added, complete: false };
}
