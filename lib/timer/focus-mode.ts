/**
 * Global "a solve is in progress" signal. The timer page writes it; the
 * shell and animated background read it to recede and pause.
 */
let focused = false;
const listeners = new Set<() => void>();

export const focusMode = {
  get: () => focused,
  set(next: boolean) {
    if (next === focused) return;
    focused = next;
    if (typeof document !== "undefined") {
      if (next) document.documentElement.dataset.timerFocus = "true";
      else delete document.documentElement.dataset.timerFocus;
    }
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
