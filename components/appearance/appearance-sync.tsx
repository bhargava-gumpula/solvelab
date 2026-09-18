"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/hooks/use-local-data";
import { sameAppearance } from "@/lib/appearance/preferences";
import { appearanceStore } from "@/lib/appearance/store";
import { getRepositories } from "@/lib/storage";

/**
 * Keeps appearance in the settings record, which is backed up and synced:
 * a change made here is saved to settings, and appearance that arrives in
 * settings (from another device or a restored backup) is applied here.
 */
export function AppearanceSync() {
  const settings = useSettings();
  const pendingWrites = useRef(0);

  useEffect(
    () =>
      appearanceStore.onUserChange((next) => {
        pendingWrites.current++;
        void getRepositories()
          .settings.update({ appearance: next })
          .catch((error: unknown) => console.error("Couldn’t save appearance.", error))
          .finally(() => {
            pendingWrites.current--;
          });
      }),
    [],
  );

  const loaded = settings !== undefined;
  const saved = settings?.appearance;
  useEffect(() => {
    if (!loaded) return;
    if (!saved) {
      // Settings from before 3.1 carry no appearance: keep this device's choice.
      if (appearanceStore.hasLocalRecord()) {
        void getRepositories()
          .settings.adoptAppearance(appearanceStore.getSnapshot())
          .catch((error: unknown) => console.error("Couldn’t save appearance.", error));
      }
      return;
    }
    // A save from this device is still in flight; its own result will arrive next.
    if (pendingWrites.current > 0) return;
    if (!sameAppearance(saved, appearanceStore.getSnapshot())) appearanceStore.replace(saved);
  }, [loaded, saved]);

  return null;
}
