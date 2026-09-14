import { describe, expect, it } from "vitest";
import { getTimerDisplay } from "@/lib/timer/display";
import {
  initialTimerState,
  transition,
  type TimerConfig,
  type TimerEvent,
} from "@/lib/timer/engine";

const noInspection: TimerConfig = { inspectionMs: 0, holdToStartMs: 300 };

function run(events: TimerEvent[], from = initialTimerState) {
  return events.reduce((state, event) => transition(state, event, noInspection), from);
}

const options = (resting: { rawTimeMs: number; penalty: "none" | "plus2" | "dnf" } | null) => ({
  hideWhileRunning: false,
  resting,
});

describe("timer display", () => {
  it("shows the just-stopped time even if resting is still the previous solve", () => {
    const stopped = run([
      { type: "press", at: 0 },
      { type: "release", at: 400 },
      { type: "press", at: 5400 },
    ]);
    const display = getTimerDisplay(
      stopped,
      5400,
      noInspection,
      options({ rawTimeMs: 8500, penalty: "none" }),
    );
    expect(display.text).toBe("5.00");
    expect(display.tone).toBe("result");
  });

  it("uses resting so a +2 on the current solve shows immediately", () => {
    const stopped = run([
      { type: "press", at: 0 },
      { type: "release", at: 400 },
      { type: "press", at: 5400 },
    ]);
    const display = getTimerDisplay(
      stopped,
      5400,
      noInspection,
      options({ rawTimeMs: 5000, penalty: "plus2" }),
    );
    expect(display.text).toBe("7.00+");
  });

  it("shows 0.00 when idle with no saved solve", () => {
    const display = getTimerDisplay(initialTimerState, 0, noInspection, options(null));
    expect(display.text).toBe("0.00");
    expect(display.tone).toBe("idle");
  });
});
