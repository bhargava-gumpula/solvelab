import { z } from "zod";
import { DEFAULT_THEME, SYSTEM_LIGHT_THEME, type ThemeId } from "./themes";

/**
 * Appearance is a per-device preference (like a wallpaper), so it lives in
 * localStorage rather than the solve database and is not part of backups.
 */
export const APPEARANCE_STORAGE_KEY = "solvelab.appearance.v1";

export const DIGIT_FONTS = [
  { id: "clean", label: "Clean" },
  { id: "lcd", label: "LCD" },
  { id: "dot", label: "Dot" },
] as const;

export type DigitFont = (typeof DIGIT_FONTS)[number]["id"];

export const TIME_DECIMALS = [
  { id: 2, label: "2 decimals", sample: "12.34" },
  { id: 3, label: "3 decimals", sample: "12.345" },
] as const;

export type TimeDecimalsPreference = (typeof TIME_DECIMALS)[number]["id"];

const themeIds = ["nebula", "ember", "glacier", "matcha", "carbon", "paper"] as const;

export const appearanceSchema = z.object({
  theme: z.enum([...themeIds, "system"]),
  digitFont: z.enum(["clean", "lcd", "dot"]),
  timerScale: z.number().min(0.7).max(1.4),
  timeDecimals: z.union([z.literal(2), z.literal(3)]),
  animatedBackground: z.boolean(),
  pauseBackgroundWhileSolving: z.boolean(),
  cubePreview: z.enum(["3d", "2d", "off"]),
  celebrations: z.boolean(),
  liveAverages: z.boolean(),
});

export type AppearancePreferences = z.infer<typeof appearanceSchema>;

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  theme: DEFAULT_THEME,
  digitFont: "clean",
  timerScale: 1,
  timeDecimals: 2,
  animatedBackground: true,
  pauseBackgroundWhileSolving: true,
  cubePreview: "3d",
  celebrations: true,
  liveAverages: true,
};

export function parseAppearance(raw: string | null): AppearancePreferences {
  if (!raw) return DEFAULT_APPEARANCE;
  try {
    const parsed = appearanceSchema.safeParse({ ...DEFAULT_APPEARANCE, ...JSON.parse(raw) });
    return parsed.success ? parsed.data : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function resolveTheme(theme: AppearancePreferences["theme"], prefersDark: boolean): ThemeId {
  if (theme !== "system") return theme;
  return prefersDark ? DEFAULT_THEME : SYSTEM_LIGHT_THEME;
}

/**
 * Runs in <head> before first paint so the page never flashes the wrong
 * theme. Kept dependency-free and tiny; mirrors resolveTheme above.
 */
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  APPEARANCE_STORAGE_KEY,
)})||"{}");var t=p.theme||${JSON.stringify(DEFAULT_THEME)};if(t==="system"){t=matchMedia("(prefers-color-scheme: dark)").matches?${JSON.stringify(
  DEFAULT_THEME,
)}:${JSON.stringify(SYSTEM_LIGHT_THEME)}}var d=document.documentElement;d.dataset.theme=t;d.classList.add(t==="paper"?"light":"dark");d.dataset.digits=p.digitFont||"clean"}catch(e){document.documentElement.classList.add("dark")}})();`;
