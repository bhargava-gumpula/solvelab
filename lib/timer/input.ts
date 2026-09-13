/**
 * Decides whether a keyboard event belongs to the timer. The timer must never
 * steal input from text fields, dialogs, menus or keyboard users operating a
 * focused control.
 */
import type { TimerPhase } from "./engine";

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable=''], [contenteditable='true']";
const OVERLAY_SELECTOR =
  "[role='dialog'], [role='alertdialog'], [role='menu'], [role='listbox'], [data-timer-ignore]";
const OPEN_MODAL_SELECTOR =
  "[role='dialog'][data-state='open'], [role='alertdialog'][data-state='open'], [role='menu'][data-state='open']";
// Controls that Space activates. Links are excluded: they activate with Enter,
// and a link left focused by navigation must not swallow the timer's Space.
const CONTROL_SELECTOR =
  "button, summary, [role='button'], [role='tab'], [role='switch'], [role='checkbox'], [role='radio'], [role='menuitem'], [role='option']";

export function isSpaceKey(event: Pick<KeyboardEvent, "code" | "key">): boolean {
  return event.code === "Space" || event.key === " ";
}

export function shouldTimerHandleKey(event: KeyboardEvent, phase: TimerPhase): boolean {
  // While a solve is being timed, the timer owns the keyboard.
  if (phase === "running") return true;
  if (event.defaultPrevented) return false;
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (typeof document !== "undefined" && document.querySelector(OPEN_MODAL_SELECTOR)) return false;

  const target = event.target;
  if (target instanceof Element) {
    if (target.closest("[data-timer-surface]")) return true;
    if (target.closest(EDITABLE_SELECTOR) || target.closest(OVERLAY_SELECTOR)) return false;
    // A keyboard user who tabbed to a button expects Space to activate it.
    const control = target.closest(CONTROL_SELECTOR);
    if (
      control &&
      (phase === "idle" || phase === "stopped") &&
      safeMatches(control, ":focus-visible")
    ) {
      return false;
    }
  }
  return true;
}

function safeMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return true;
  }
}

/**
 * Input events carry a high-resolution timestamp on the same clock as
 * performance.now(), captured when the event happened rather than when the
 * handler ran. Fall back to performance.now() if it looks unreliable.
 */
export function eventTimestamp(event: Event): number {
  const now = performance.now();
  const stamp = event.timeStamp;
  if (Number.isFinite(stamp) && stamp > 0 && stamp <= now && now - stamp < 1000) return stamp;
  return now;
}
