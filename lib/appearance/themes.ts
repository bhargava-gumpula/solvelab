/**
 * Theme presets. Surface/text tokens live in app/globals.css under
 * [data-theme="…"]; this file holds what JavaScript needs: the animated
 * background recipe and picker swatches.
 */

export type ThemeId = "nebula" | "ember" | "glacier" | "matcha" | "carbon" | "paper";

export interface MeshBackground {
  kind: "mesh";
  colors: string[];
  distortion: number;
  swirl: number;
  speed: number;
  grain: number;
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
  background: MeshBackground | SolidBackground;
}

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: "nebula",
    label: "Ion",
    description: "Violet and teal aurora",
    mode: "dark",
    swatch: ["#0b0a1a", "#6d4df2", "#1bb89f"],
    background: {
      kind: "mesh",
      colors: ["#0b0a1a", "#3a1e9c", "#0d6f73", "#231356", "#120d33"],
      distortion: 0.85,
      swirl: 0.35,
      speed: 0.22,
      grain: 0.06,
    },
  },
  {
    id: "ember",
    label: "Forge",
    description: "Warm orange glow",
    mode: "dark",
    swatch: ["#120806", "#d9591a", "#b3264f"],
    background: {
      kind: "mesh",
      colors: ["#120806", "#7a2208", "#c4521a", "#5a0f2b", "#1f0a06"],
      distortion: 0.8,
      swirl: 0.3,
      speed: 0.2,
      grain: 0.06,
    },
  },
  {
    id: "glacier",
    label: "Fjord",
    description: "Cold blue depths",
    mode: "dark",
    swatch: ["#06101c", "#1b7fb3", "#5b4bd6"],
    background: {
      kind: "mesh",
      colors: ["#06101c", "#0b3d6b", "#1a78ad", "#221a66", "#08182b"],
      distortion: 0.75,
      swirl: 0.4,
      speed: 0.18,
      grain: 0.05,
    },
  },
  {
    id: "matcha",
    label: "Sencha",
    description: "Terminal green",
    mode: "dark",
    swatch: ["#060c08", "#2f7a3a", "#8fb31f"],
    background: {
      kind: "mesh",
      colors: ["#050b07", "#0f3b1e", "#2a6f35", "#3b4a0c", "#07120a"],
      distortion: 0.7,
      swirl: 0.25,
      speed: 0.16,
      grain: 0.07,
    },
  },
  {
    id: "carbon",
    label: "Graphite",
    description: "Still and minimal",
    mode: "dark",
    swatch: ["#101113", "#26282d", "#e8916e"],
    background: { kind: "solid" },
  },
  {
    id: "paper",
    label: "Linen",
    description: "Light and warm",
    mode: "light",
    swatch: ["#f3efe6", "#f0cfae", "#bfe0d6"],
    background: {
      kind: "mesh",
      colors: ["#f3efe6", "#f3d7bd", "#e9e2cf", "#cfe6dc", "#f6f1e7"],
      distortion: 0.6,
      swirl: 0.2,
      speed: 0.12,
      grain: 0.03,
    },
  },
];

export const DEFAULT_THEME: ThemeId = "matcha";
/** Used by "Match system" when the device prefers light. */
export const SYSTEM_LIGHT_THEME: ThemeId = "paper";

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
