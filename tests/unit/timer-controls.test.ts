// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { useTimerControls } from "@/hooks/use-timer-controls";
import { createTimerStore, type TimerStore } from "@/lib/timer/store";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The keyboard controls on a page, with no touch surface. */
const noSurface = { current: null };

function Controls({ store, enabled }: { store: TimerStore; enabled: boolean }) {
  useTimerControls(store, { enabled, surfaceRef: noSurface });
  return null;
}

const key = (type: "keydown" | "keyup") =>
  window.dispatchEvent(new KeyboardEvent(type, { key: " ", code: "Space", bubbles: true }));

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
});

describe("the timer's keyboard controls", () => {
  it("don't swallow the next start when switched off between the stopping press and its release", async () => {
    const store = createTimerStore({ inspectionMs: 0, holdToStartMs: 0 });
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    const render = (enabled: boolean) =>
      act(() => root!.render(createElement(Controls, { store, enabled })));

    render(true);
    // Start a solve.
    act(() => key("keydown"));
    act(() => key("keyup"));
    expect(store.getState().phase).toBe("running");

    // Stop it; before the key comes up, the page switches the timer off (as the
    // algorithm trainer does while it makes the next scramble), then back on.
    act(() => key("keydown"));
    expect(store.getState().phase).toBe("stopped");
    render(false);
    act(() => key("keyup"));
    render(true);

    // The next press starts a new hold rather than being taken for the old release.
    act(() => key("keydown"));
    expect(store.getState().phase).toBe("ready");
  });
});
