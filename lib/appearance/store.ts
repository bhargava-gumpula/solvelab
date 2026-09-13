import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  parseAppearance,
  type AppearancePreferences,
} from "./preferences";

/**
 * External store over localStorage so React reads appearance with
 * useSyncExternalStore (no effect-driven state copies) and stays in sync
 * across tabs.
 */
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: AppearancePreferences = DEFAULT_APPEARANCE;

function read(): string | null {
  try {
    return localStorage.getItem(APPEARANCE_STORAGE_KEY);
  } catch {
    return null;
  }
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
  update(patch: Partial<AppearancePreferences>) {
    const next = { ...appearanceStore.getSnapshot(), ...patch };
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode): keep the change for this page view.
      cachedRaw = JSON.stringify(next);
      cachedValue = next;
    }
    listeners.forEach((listener) => listener());
  },
};
