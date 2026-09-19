import { describe, expect, it } from "vitest";
import modelJson from "@/ml/coach-model.json";
import { ASPECT_TIPS } from "@/data/coach/tips";
import { MODEL_TESTS } from "@/lib/coach/ai/features";
import { modelFromJson, type CoachModelJson } from "@/lib/coach/ai/model";
import { ASPECTS } from "@/lib/coach/aspects";
import {
  advance,
  freshTests,
  openRequest,
  retestPlan,
  summaryOf,
  type EngineInput,
  type Summary,
} from "@/lib/coach/coach-engine";
import {
  confidenceLabel,
  focusAspects,
  requestText,
  summaryHeadline,
  summaryStatus,
  worthChecking,
} from "@/lib/coach/coach-messages";
import type { CoachEvent, CoachThread, DiagnosticRun } from "@/types/domain";

const NOW = new Date("2026-09-19T12:00:00.000Z");
const model = modelFromJson(modelJson as unknown as CoachModelJson);

function thread(patch: Partial<CoachThread> = {}): CoachThread {
  return {
    id: "t1",
    createdAt: "2026-09-19T11:00:00.000Z",
    mode: "normal",
    plannedTests: [],
    events: [],
    ...patch,
  };
}

let runCounter = 0;
function run(
  exerciseId: string,
  completedAt: string,
  timesMs = Array(10).fill(2000),
): DiagnosticRun {
  runCounter++;
  return {
    id: `r${runCounter}`,
    exerciseId,
    createdAt: completedAt,
    completedAt,
    solveIds: [],
    sampleCount: timesMs.length,
    timesMs,
  };
}

function step(input: Partial<EngineInput> & { thread: CoachThread }) {
  const result = advance({
    runs: [],
    solves: [],
    goalMilestoneId: "sub20",
    model: null,
    now: NOW,
    ...input,
  });
  return {
    ...result,
    thread: { ...input.thread, events: [...input.thread.events, ...result.events] },
  };
}

describe("coach engine", () => {
  it("waits for a goal, then records it and asks for a first test", () => {
    expect(step({ thread: thread(), goalMilestoneId: null }).events).toEqual([]);
    const { events } = step({ thread: thread() });
    expect(events.map((event) => event.type)).toEqual(["goal", "requested"]);
    const request = events[1] as Extract<CoachEvent, { type: "requested" }>;
    // Without the model, the plain rules start with the cross test.
    expect(request).toMatchObject({ testId: "cross_only", source: "rules", focus: "cross" });
  });

  it("records a finished test and moves on; skipping also moves on", () => {
    const started = step({ thread: thread() }).thread;
    const finished = run("cross_only", "2026-09-19T12:10:00.000Z");
    const later = new Date("2026-09-19T12:11:00.000Z");
    const next = step({ thread: started, runs: [finished], now: later });
    expect(next.events.map((event) => event.type)).toEqual(["result", "requested"]);
    expect(next.events[0]).toMatchObject({ testId: "cross_only", runId: finished.id });
    expect((next.events[1] as { testId: string }).testId).toBe("f2l_only");

    // A run finished before the request doesn't count as doing it.
    const early = run("f2l_only", "2026-09-19T11:30:00.000Z");
    expect(step({ thread: next.thread, runs: [finished, early], now: later }).events).toEqual([]);

    const skipped = {
      ...next.thread,
      events: [
        ...next.thread.events,
        { type: "skipped" as const, at: later.toISOString(), testId: "f2l_only" },
      ],
    };
    const afterSkip = step({ thread: skipped, runs: [finished], now: later });
    expect(openRequest(afterSkip.thread.events)?.testId).toBe("oll_only");
  });

  it("uses recent tests instead of asking again, and sums up when nothing is left", () => {
    const runs = MODEL_TESTS.map((testId) => run(testId, "2026-09-18T10:00:00.000Z"));
    expect(freshTests(runs, NOW).size).toBe(MODEL_TESTS.length);
    const { events, complete, thread: done } = step({ thread: thread(), runs });
    expect(complete).toBe(true);
    expect(events.map((event) => event.type)).toEqual(["goal", "summary"]);
    const summary = summaryOf(done)!;
    expect(summary.testsUsed).toHaveLength(MODEL_TESTS.length);
    expect(summary.aspects).toHaveLength(ASPECTS.length);
    expect(summary.source).toBe("rules");

    // Old tests (over two weeks) can be asked for again.
    const old = MODEL_TESTS.map((testId) => run(testId, "2026-08-01T10:00:00.000Z"));
    expect(step({ thread: thread(), runs: old }).events[1]).toMatchObject({ type: "requested" });
  });

  it("with the model, asks for fewer than every test and explains a focus", () => {
    const { events } = step({ thread: thread(), model });
    const request = events[1] as Extract<CoachEvent, { type: "requested" }>;
    expect(request.source).toBe("ai");
    expect(MODEL_TESTS).toContain(request.testId);
    expect(request.focus).not.toBeNull();
  });

  it("starting over ignores earlier tests; a retest retakes the planned ones then sums up", () => {
    const runs = MODEL_TESTS.map((testId) => run(testId, "2026-09-18T10:00:00.000Z"));
    const fresh = step({ thread: thread({ mode: "fresh" }), runs });
    expect(fresh.events.map((event) => event.type)).toEqual(["goal", "requested"]);

    const retest = thread({ mode: "retest", plannedTests: ["cross_f2l", "pll_only"] });
    const first = step({ thread: retest, runs });
    expect(openRequest(first.thread.events)?.testId).toBe("cross_f2l");
    const redone = [
      ...runs,
      run("cross_f2l", "2026-09-19T12:20:00.000Z"),
      run("pll_only", "2026-09-19T12:30:00.000Z"),
    ];
    const second = step({
      thread: first.thread,
      runs: redone,
      now: new Date("2026-09-19T12:25:00.000Z"),
    });
    expect(openRequest(second.thread.events)?.testId).toBe("pll_only");
    const third = step({
      thread: second.thread,
      runs: redone,
      now: new Date("2026-09-19T12:35:00.000Z"),
    });
    expect(third.complete).toBe(true);
  });

  it("does nothing once a conversation is finished", () => {
    expect(step({ thread: thread({ completedAt: NOW.toISOString() }) }).events).toEqual([]);
  });
});

function summaryWith(aspects: Partial<Summary["aspects"][number]>[]): Summary {
  return {
    type: "summary",
    at: NOW.toISOString(),
    goalMilestoneId: "sub20",
    source: "ai",
    modelVersion: 1,
    testsUsed: [],
    aspects: aspects.map((aspect) => ({
      id: "cross",
      value: 2000,
      target: 2600,
      tag: "fast",
      probability: 0.1,
      weak: false,
      ...aspect,
    })),
  };
}

describe("coach messages", () => {
  it("names tests and parts in plain sentences", () => {
    const request = {
      type: "requested" as const,
      at: "",
      testId: "pll_only",
      source: "ai" as const,
      focus: "pll_algorithms",
    };
    expect(requestText(request, true)).toBe(
      "Let's start with the PLL test (12 attempts). It'll show whether PLL cases you don't know well yet are slowing you down.",
    );
    expect(requestText({ ...request, testId: "cross_f2l", focus: "cross_to_f2l" }, false)).toBe(
      "Next, the cross + F2L test (10 attempts). It'll show whether the move from the cross into F2L is slowing you down.",
    );
  });

  it("puts measured weak parts first, untested suspects apart, and explains disagreements", () => {
    const summary = summaryWith([
      { id: "lookahead", value: 3000, target: 1500, tag: "slow", probability: 0.9, weak: true },
      { id: "cross_to_f2l", value: null, target: 800, tag: null, probability: 0.7, weak: true },
      { id: "oll_to_pll", value: 2000, target: 600, tag: "slow", probability: 0.2, weak: false },
      { id: "pll_algorithms", value: 0.1, target: 0.15, tag: "fast", probability: 0.8, weak: true },
    ]);
    expect(focusAspects(summary).map((aspect) => aspect.id)).toEqual([
      "lookahead",
      "pll_algorithms",
    ]);
    expect(worthChecking(summary).map((aspect) => aspect.id)).toEqual(["cross_to_f2l"]);
    expect(summaryHeadline(summary, "Sub 20")).toBe(
      "2 parts of your solve are holding you back from Sub 20.",
    );
    expect(summaryStatus(summary.aspects[2]!)).toMatchObject({ tag: "average" });
    expect(summaryStatus(summary.aspects[3]!)).toMatchObject({ tag: "slow" });
    expect(summaryStatus(summary.aspects[1]!)).toEqual({ tag: "untested", note: null });
    // Each measured weak part's deciding test, in the usual order.
    expect(retestPlan(summary)).toEqual(["pll_only", "last_slot"]);
    expect(confidenceLabel(0.9, true)).toBe("Very likely a weakness");
    expect(confidenceLabel(0.4, true)).toBe("Possibly a weakness");
    expect(confidenceLabel(0.05, false)).toBe("Very likely fine");
  });
});

describe("coach tips", () => {
  it("has tips, a drill and working sources for every part of the solve", () => {
    for (const aspect of ASPECTS) {
      const tips = ASPECT_TIPS[aspect.id];
      expect(tips, aspect.id).toBeDefined();
      expect(tips.tips.length, aspect.id).toBeGreaterThanOrEqual(3);
      expect(tips.why.length, aspect.id).toBeGreaterThan(20);
      expect(tips.drill.length, aspect.id).toBeGreaterThan(20);
      expect(tips.keep.length, aspect.id).toBeGreaterThan(10);
      expect(tips.sources.length, aspect.id).toBeGreaterThan(0);
      for (const source of tips.sources) expect(source.url).toMatch(/^https?:\/\//);
    }
  });
});
