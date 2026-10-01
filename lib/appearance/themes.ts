/**
 * Theme presets (Studio direction). Surface/text tokens live in
 * app/globals.css under [data-theme="…"]; this file holds what JavaScript
 * needs: the studio light recipe for the animated background and the picker
 * swatches. The ids are unchanged so saved preferences keep working.
 */

export type ThemeId = "nebula" | "ember" | "matcha" | "carbon" | "paper";

/** Removed theme ids and what a saved one opens as now (Porcelain was too close to Linen). */
export const RETIRED_THEMES: Readonly<Record<string, ThemeId>> = { glacier: "paper" };

/**
 * The Studio background: soft skylight rays from the top edge, a slow aurora
 * wash, a dot grid that lights up around the cursor, and paper grain.
 */
export interface StudioBackground {
  kind: "studio";
  /** Colour of the light rays. */
  rays: string;
  /** Two aurora tints. */
  aurora: [string, string];
  /** Ray strength, 0–1. */
  rayStrength: number;
  /** Aurora strength, 0–1. */
  auroraStrength: number;
  /**
   * The swirl background's tints, deepest first; the theme backdrop sits
   * behind them. Kept close to the backdrop so the swirl never gets busy.
   */
  swirl: [string, string, string, string];
}

export interface SolidBackground {
  kind: "solid";
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  mode: "dark" | "light";
  /** Colors for the picker preview, backdrop first. */
  swatch: [string, string, string];
  background: StudioBackground | SolidBackground;
}

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: "paper",
    label: "Linen",
    description: "Warm paper, studio blue",
    mode: "light",
    swatch: ["#f2eee6", "#2a44e8", "#f0531c"],
    background: {
      kind: "studio",
      rays: "#ffffff",
      aurora: ["#a9b5ff", "#ffbb98"],
      rayStrength: 0.7,
      auroraStrength: 0.38,
      // Lavender and apricot strong enough to read as a moving background, still pale behind text.
      swirl: ["#cfd3fb", "#f9c3a0", "#bcc5fb", "#fbd3b6"],
    },
  },
  {
    id: "matcha",
    label: "Sage",
    description: "Deep green, after dark",
    mode: "dark",
    swatch: ["#0c120e", "#8fd3a3", "#e6a75a"],
    background: {
      kind: "studio",
      rays: "#d4f2dc",
      aurora: ["#1f6b45", "#6b5a18"],
      rayStrength: 0.16,
      auroraStrength: 0.4,
      swirl: ["#10221a", "#1f6a42", "#3d4316", "#2f7a4f"],
    },
  },
  {
    id: "carbon",
    label: "Ink",
    description: "Midnight blue, after dark",
    mode: "dark",
    swatch: ["#0a0e15", "#5aa9ff", "#ff7847"],
    background: {
      kind: "studio",
      rays: "#b5d6ff",
      aurora: ["#1c5fd0", "#8a3a22"],
      rayStrength: 0.08,
      auroraStrength: 0.24,
      swirl: ["#0f1a2b", "#143f78", "#3b2320", "#0f2d58"],
    },
  },
  {
    id: "nebula",
    label: "Nocturne",
    description: "Indigo midnight",
    mode: "dark",
    swatch: ["#0a0b1a", "#b4a6ff", "#5ce1e6"],
    background: {
      kind: "studio",
      rays: "#cdc4ff",
      aurora: ["#4b33c9", "#127a86"],
      rayStrength: 0.1,
      auroraStrength: 0.3,
      swirl: ["#141236", "#2f2380", "#0f3d48", "#3a2a9a"],
    },
  },
  {
    id: "ember",
    label: "Terracotta",
    description: "Warm clay, after hours",
    mode: "dark",
    swatch: ["#15100d", "#ff8c5a", "#e8c46a"],
    background: {
      kind: "studio",
      rays: "#ffd2b0",
      aurora: ["#9c3514", "#7a5212"],
      rayStrength: 0.2,
      auroraStrength: 0.42,
      swirl: ["#2a1710", "#6e2a13", "#4a3013", "#9a4520"],
    },
  },
];

export const DEFAULT_THEME: ThemeId = "ember";
/** Used by "Match system" when the device prefers dark. */
export const SYSTEM_DARK_THEME: ThemeId = "ember";
/** Used by "Match system" when the device prefers light. */
export const SYSTEM_LIGHT_THEME: ThemeId = "paper";
/** Themes drawn on a light surface (the boot script needs these before JS). */
export const LIGHT_THEMES: readonly ThemeId[] = THEMES.filter((t) => t.mode === "light").map(
  (t) => t.id,
);

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
