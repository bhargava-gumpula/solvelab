import { describe, expect, it } from "vitest";
import {
  createTimerStore,
  elapsedMs,
  formatAverage,
  formatSolve,
  formatTime,
  initialTimerState,
  inspectionPenaltyFor,
  isHoldArmed,
  transition,
  type TimerConfig,
  type TimerEvent,
  type TimerState,
} from "@/lib/timer";

const noInspection: TimerConfig = { inspectionMs: 0, holdToStartMs: 300 };
const wcaInspection: TimerConfig = { inspectionMs: 15000, holdToStartMs: 300 };

function run(events: TimerEvent[], config: TimerConfig, from: TimerState = initialTimerState) {
  return events.reduce((state, event) => transition(state, event, config), from);
}

const press = (at: number): TimerEvent => ({ type: "press", at });
const release = (at: number): TimerEvent => ({ type: "release", at });

describe("timer state machine", () => {
  it("holds to ready, starts on release, and stops on the next press", () => {
    const ready = run([press(1000)], noInspection);
    expect(ready.phase).toBe("ready");
    expect(isHoldArmed(ready, 1200, noInspection)).toBe(false);
    expect(isHoldArmed(ready, 1300, noInspection)).toBe(true);

    const running = run([release(1400)], noInspection, ready);
    expect(running.phase).toBe("running");
    expect(elapsedMs(running, 2400.4)).toBe(1000);

    const stopped = run([press(13745.6)], noInspection, running);
    expect(stopped.phase).toBe("stopped");
    expect(stopped.result).toEqual({
      rawTimeMs: 12346,
      inspectionMs: null,
      inspectionPenalty: "none",
    });
  });

  it("computes elapsed time from timestamps, not from ticks", () => {
    const running = run([press(0), release(500)], noInspection);
    // No tick events are needed; any later clock reading is exact.
    expect(elapsedMs(running, 60500)).toBe(60000);
  });

  it("returns to the previous phase when released before the hold is armed", () => {
    const idle = run([press(0), release(100)], noInspection);
    expect(idle.phase).toBe("idle");

    const firstSolve = run([press(0), release(400), press(10400), release(10500)], noInspection);
    expect(firstSolve.phase).toBe("stopped");
    const earlyRelease = run([press(20000), release(20050)], noInspection, firstSolve);
    expect(earlyRelease.phase).toBe("stopped");
    expect(earlyRelease.result?.rawTimeMs).toBe(10000);
  });

  it("ignores the release of the stopping press and key repeats while ready", () => {
    const stopped = run([press(0), release(400), press(5400)], noInspection);
    expect(stopped.awaitingRelease).toBe(true);
    const afterRelease = run([release(5500)], noInspection, stopped);
    expect(afterRelease.phase).toBe("stopped");
    expect(afterRelease.awaitingRelease).toBe(false);

    const ready = run([press(0)], noInspection);
    expect(run([press(50), press(100)], noInspection, ready)).toEqual(ready);
  });

  it("starts immediately with a zero hold time", () => {
    const state = run([press(0), release(1)], { inspectionMs: 0, holdToStartMs: 0 });
    expect(state.phase).toBe("running");
  });

  it("runs WCA inspection before a hold and records inspection time", () => {
    const inspecting = run([press(0), release(80)], wcaInspection);
    expect(inspecting.phase).toBe("inspection");
    const ready = run([press(8000)], wcaInspection, inspecting);
    expect(ready.phase).toBe("ready");
    const earlyRelease = run([release(8100)], wcaInspection, ready);
    expect(earlyRelease.phase).toBe("inspection");

    const solved = run([press(9000), release(9400), press(21400)], wcaInspection, earlyRelease);
    expect(solved.result).toEqual({
      rawTimeMs: 12000,
      inspectionMs: 9400,
      inspectionPenalty: "none",
    });
  });

  it("applies +2 and DNF for late starts after inspection", () => {
    const plusTwo = run(
      [press(0), release(10), press(15500), release(15900), press(25900)],
      wcaInspection,
    );
    expect(plusTwo.result?.inspectionPenalty).toBe("plus2");
    const dnf = run(
      [press(0), release(10), press(17200), release(17600), press(27600)],
      wcaInspection,
    );
    expect(dnf.result?.inspectionPenalty).toBe("dnf");

    expect(inspectionPenaltyFor(15000, 15000)).toBe("none");
    expect(inspectionPenaltyFor(15001, 15000)).toBe("plus2");
    expect(inspectionPenaltyFor(17000, 15000)).toBe("plus2");
    expect(inspectionPenaltyFor(17001, 15000)).toBe("dnf");
    expect(inspectionPenaltyFor(99999, 0)).toBe("none");
  });

  it("cancels inspection without discarding the previous result", () => {
    const solved = run(
      [press(0), release(10), press(1000), release(1400), press(11400), release(11500)],
      wcaInspection,
    );
    const inspecting = run([press(20000)], wcaInspection, solved);
    expect(inspecting.phase).toBe("inspection");
    const cancelled = transition(inspecting, { type: "cancel" }, wcaInspection);
    expect(cancelled.phase).toBe("idle");
    expect(cancelled.result?.rawTimeMs).toBe(10000);
  });

  it("does not carry stale inspection timestamps into solves without inspection", () => {
    const inspected = run(
      [press(0), release(10), press(1000), release(1400), press(2400), release(2500)],
      wcaInspection,
    );
    const next = run([press(5000), release(5400), press(6400)], noInspection, inspected);
    expect(next.result?.inspectionMs).toBeNull();
  });

  it("notifies completion listeners exactly once per solve", () => {
    const store = createTimerStore(noInspection);
    const results: number[] = [];
    store.onComplete((result) => results.push(result.rawTimeMs));
    store.dispatch(press(0));
    store.dispatch(release(400));
    store.dispatch(press(3400));
    store.dispatch(press(3500));
    store.dispatch(release(3600));
    expect(results).toEqual([3000]);
  });
});

describe("time formatting", () => {
  it("truncates singles and rounds averages to hundredths", () => {
    expect(formatTime(9999)).toBe("9.99");
    expect(formatAverage(9999)).toBe("10.00");
    expect(formatTime(62345)).toBe("1:02.34");
    expect(formatTime(3723456)).toBe("1:02:03.45");
    expect(formatTime(0)).toBe("0.00");
    expect(formatTime(null)).toBe("—");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("DNF");
    expect(formatTime(12345, "truncate", 3)).toBe("12.345");
    expect(formatTime(12345, "round", 3)).toBe("12.345");
    expect(formatAverage(12345, 3)).toBe("12.345");
    expect(formatTime(0, "truncate", 3)).toBe("0.000");
  });

  it("formats penalties without altering raw time", () => {
    expect(formatSolve(12340, "none")).toBe("12.34");
    expect(formatSolve(12340, "plus2")).toBe("14.34+");
    expect(formatSolve(12340, "dnf")).toBe("DNF");
  });
});
