"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_APPEARANCE,
  resolveTheme,
  type AppearancePreferences,
} from "@/lib/appearance/preferences";
import { appearanceStore } from "@/lib/appearance/store";
import { getTheme, type ThemeDefinition } from "@/lib/appearance/themes";

interface AppearanceContextValue {
  preferences: AppearancePreferences;
  theme: ThemeDefinition;
  update: (patch: Partial<AppearancePreferences>) => void;
  reducedMotion: boolean;
  /** False during server rendering and hydration, before stored preferences are read. */
  ready: boolean;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function mediaStore(query: string, serverValue: boolean) {
  return {
    subscribe: (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    getSnapshot: () => window.matchMedia(query).matches,
    getServerSnapshot: () => serverValue,
  };
}

const darkQuery = mediaStore("(prefers-color-scheme: dark)", true);
const motionQuery = mediaStore("(prefers-reduced-motion: reduce)", false);
const noopSubscribe = () => () => {};

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const preferences = useSyncExternalStore(
    appearanceStore.subscribe,
    appearanceStore.getSnapshot,
    () => DEFAULT_APPEARANCE,
  );
  const prefersDark = useSyncExternalStore(
    darkQuery.subscribe,
    darkQuery.getSnapshot,
    darkQuery.getServerSnapshot,
  );
  const reducedMotion = useSyncExternalStore(
    motionQuery.subscribe,
    motionQuery.getSnapshot,
    motionQuery.getServerSnapshot,
  );

  const theme = getTheme(resolveTheme(preferences.theme, prefersDark));

  // The boot script set these before first paint; keep them in sync with later changes.
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.dataset.digits = preferences.digitFont;
    root.classList.toggle("dark", theme.mode === "dark");
    root.classList.toggle("light", theme.mode === "light");
  }, [ready, theme, preferences.digitFont]);

  const value = useMemo(
    () => ({ preferences, theme, update: appearanceStore.update, reducedMotion, ready }),
    [preferences, theme, reducedMotion, ready],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance must be used inside AppearanceProvider");
  return context;
}
