/** Local cache while IndexedDB/settings load; also used when signed out. */
export const PANEL_OFFSETS_STORAGE_KEY = "solvelab.panels.v4";

export type PanelOffset = { x: number; y: number };
export type PanelOffsets = Record<string, PanelOffset>;

/** Drop leftover offsets from older layouts that would shove panels off-screen. */
export function usableOffset(saved: PanelOffset | undefined): PanelOffset | null {
  if (!saved) return null;
  if (!Number.isFinite(saved.x) || !Number.isFinite(saved.y)) return null;
  if (Math.abs(saved.x) > 240 || Math.abs(saved.y) > 64) return null;
  return { x: saved.x, y: saved.y };
}

export function sanitizePanelOffsets(raw: PanelOffsets | undefined): PanelOffsets {
  if (!raw) return {};
  const next: PanelOffsets = {};
  for (const [id, offset] of Object.entries(raw)) {
    const usable = usableOffset(offset);
    if (usable) next[id] = usable;
  }
  return next;
}

export function readLocalPanelOffsets(): PanelOffsets {
  if (typeof localStorage === "undefined") return {};
  try {
    return sanitizePanelOffsets(
      JSON.parse(localStorage.getItem(PANEL_OFFSETS_STORAGE_KEY) ?? "{}"),
    );
  } catch {
    return {};
  }
}

export function writeLocalPanelOffsets(offsets: PanelOffsets): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PANEL_OFFSETS_STORAGE_KEY, JSON.stringify(sanitizePanelOffsets(offsets)));
  } catch {
    // Position is a convenience; ignore storage failures.
  }
}
