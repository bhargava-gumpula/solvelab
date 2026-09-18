import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  parseAppearance,
  type AppearancePreferences,
} from "./preferences";

/**
 * External store over localStorage so React reads appearance with
 * useSyncExternalStore (no effect-driven state copies) and stays in sync
 * across tabs. localStorage is the fast copy used before first paint; the
 * saved copy lives in the synced settings record (see AppearanceSync).
 */
const listeners = new Set<() => void>();
const userChangeListeners = new Set<(next: AppearancePreferences) => void>();
let cachedRaw: string | null | undefined;
let cachedValue: AppearancePreferences = DEFAULT_APPEARANCE;

function read(): string | null {
  try {
    return localStorage.getItem(APPEARANCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function write(next: AppearancePreferences) {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode): keep the change for this page view.
    cachedRaw = JSON.stringify(next);
    cachedValue = next;
  }
  listeners.forEach((listener) => listener());
}

export const appearanceStore = {
  getSnapshot(): AppearancePreferences {
    const raw = read();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = parseAppearance(raw);
    }
    return cachedValue;
  },
  /** True once this browser has stored a choice (not just the defaults). */
  hasLocalRecord(): boolean {
    return read() !== null;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === APPEARANCE_STORAGE_KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  /** A change the person made here. It is also saved to their settings. */
  update(patch: Partial<AppearancePreferences>) {
    const next = { ...appearanceStore.getSnapshot(), ...patch };
    write(next);
    userChangeListeners.forEach((listener) => listener(next));
  },
  /** Applies appearance that arrived from saved or synced settings. */
  replace(next: AppearancePreferences) {
    write(next);
  },
  onUserChange(listener: (next: AppearancePreferences) => void) {
    userChangeListeners.add(listener);
    return () => {
      userChangeListeners.delete(listener);
    };
  },
};
