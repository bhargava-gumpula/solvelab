"use client";

import { useCallback, useState } from "react";
import { useSettings } from "@/hooks/use-local-data";
import { getRepositories } from "@/lib/storage";
import { DEFAULT_VIEW } from "@/lib/storage/schemas";
import type { ViewPreferences } from "@/types/domain";

/**
 * A view choice (chart range, sort order, …) saved in settings, so it
 * survives reloads and follows the account. The change shows immediately and
 * is saved in the background.
 */
export function useViewPreference<K extends keyof ViewPreferences>(
  key: K,
): [ViewPreferences[K], (value: ViewPreferences[K]) => void] {
  const settings = useSettings();
  const [local, setLocal] = useState<{ value: ViewPreferences[K] } | null>(null);
  const value = local ? local.value : (settings?.view[key] ?? DEFAULT_VIEW[key]);

  const set = useCallback(
    (next: ViewPreferences[K]) => {
      setLocal({ value: next });
      void getRepositories()
        .settings.updateView({ [key]: next } as Partial<ViewPreferences>)
        .catch((error: unknown) => console.error("Couldn’t save that choice.", error));
    },
    [key],
  );

  return [value, set];
}
