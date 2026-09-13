// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { shouldTimerHandleKey } from "@/lib/timer/input";

function keydown(target: Element, init: KeyboardEventInit = { code: "Space", key: " " }) {
  const event = new KeyboardEvent("keydown", { ...init, bubbles: true, cancelable: true });
  Object.defineProperty(event, "target", { value: target });
  return event;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("timer keyboard guard", () => {
  it("handles space on the page body and on the timer surface", () => {
    document.body.innerHTML = `<div data-timer-surface><span id="digits">0.00</span></div>`;
    expect(shouldTimerHandleKey(keydown(document.body), "idle")).toBe(true);
    expect(shouldTimerHandleKey(keydown(document.getElementById("digits")!), "idle")).toBe(true);
  });

  it("never steals typing from inputs, textareas or editable content", () => {
    document.body.innerHTML = `<input id="a" /><textarea id="b"></textarea><div id="c" contenteditable="true"></div>`;
    for (const id of ["a", "b", "c"]) {
      expect(shouldTimerHandleKey(keydown(document.getElementById(id)!), "idle")).toBe(false);
    }
  });

  it("ignores keys while a dialog or menu is open and ignores modifier shortcuts", () => {
    document.body.innerHTML = `<div role="dialog" data-state="open"><button id="x">Close</button></div>`;
    expect(shouldTimerHandleKey(keydown(document.body), "idle")).toBe(false);
    document.body.innerHTML = "";
    expect(
      shouldTimerHandleKey(
        keydown(document.body, { code: "Space", key: " ", metaKey: true }),
        "idle",
      ),
    ).toBe(false);
  });

  it("owns every key while a solve is running", () => {
    document.body.innerHTML = `<input id="a" />`;
    expect(shouldTimerHandleKey(keydown(document.getElementById("a")!), "running")).toBe(true);
  });

  it("does not let a focused link swallow space", () => {
    document.body.innerHTML = `<a id="nav" href="/timer">Timer</a>`;
    expect(shouldTimerHandleKey(keydown(document.getElementById("nav")!), "idle")).toBe(true);
  });
});
