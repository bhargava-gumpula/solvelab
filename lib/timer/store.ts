import {
  initialTimerState,
  transition,
  type TimerConfig,
  type TimerEvent,
  type TimerResult,
  type TimerState,
} from "./engine";

export type CompletionListener = (result: TimerResult) => void;

export interface TimerStore {
  getState(): TimerState;
  getConfig(): TimerConfig;
  setConfig(config: TimerConfig): void;
  dispatch(event: TimerEvent): void;
  subscribe(listener: () => void): () => void;
  onComplete(listener: CompletionListener): () => void;
}

/**
 * A tiny observable wrapper around the pure engine, suitable for
 * useSyncExternalStore. It holds no timers of its own; the UI decides how
 * often to read the clock.
 */
export function createTimerStore(initialConfig: TimerConfig): TimerStore {
  let state = initialTimerState;
  let config = initialConfig;
  const listeners = new Set<() => void>();
  const completionListeners = new Set<CompletionListener>();

  return {
    getState: () => state,
    getConfig: () => config,
    setConfig(next) {
      config = next;
    },
    dispatch(event) {
      const previous = state;
      state = transition(state, event, config);
      if (state === previous) return;
      listeners.forEach((listener) => listener());
      if (previous.phase === "running" && state.phase === "stopped" && state.result) {
        const result = state.result;
        completionListeners.forEach((listener) => listener(result));
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onComplete(listener) {
      completionListeners.add(listener);
      return () => completionListeners.delete(listener);
    },
  };
}
