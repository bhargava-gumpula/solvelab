import type { OuterFace } from "@/lib/cube/notation";

/**
 * How the cube is held, in one place.
 *
 * Scrambles are applied in the WCA scrambling orientation: white on top, green
 * in front. Solvers then turn the cube over with a z2, which keeps green in
 * front, and solve with the white cross on the bottom and yellow on top. Every
 * teaching picture, practice scramble, lesson and AI prompt uses the solving
 * view; only the timer's scramble previews use the scramble view.
 *
 * The engine's face letters name positions (U is whatever is on top), so a
 * view is just which colour sits at each position of a solved cube.
 */

export type StickerColour = "white" | "yellow" | "green" | "blue" | "red" | "orange";

export type CubeView = Readonly<Record<OuterFace, StickerColour>>;

/** The WCA scrambling orientation: white on top, green in front, red on the right. */
export const SCRAMBLE_VIEW: CubeView = {
  U: "white",
  D: "yellow",
  F: "green",
  B: "blue",
  R: "red",
  L: "orange",
};

/** The whole-cube turn from the scrambling orientation to the solving one. */
export const SOLVING_ROTATION = "z2";

/**
 * The solving orientation: SCRAMBLE_VIEW after SOLVING_ROTATION. Green stays in
 * front, so the right face becomes orange and the left red (a unit test checks
 * this against the cube engine).
 */
export const SOLVING_VIEW: CubeView = {
  U: "yellow",
  D: "white",
  F: "green",
  B: "blue",
  R: "orange",
  L: "red",
};

export const CUBE_VIEWS = { scramble: SCRAMBLE_VIEW, solving: SOLVING_VIEW } as const;
export type CubeViewName = keyof typeof CUBE_VIEWS;

/** Sticker colours, used when a CSS variable can't be read (see app/globals.css). */
export const STICKER_HEX: Readonly<Record<StickerColour, string>> = {
  white: "#ffffff",
  yellow: "#ffe100",
  green: "#14c83f",
  blue: "#1466ff",
  red: "#f0162f",
  orange: "#ff7f00",
};

/** The CSS custom property holding a sticker colour. */
export function stickerVariable(colour: StickerColour): string {
  return `--sticker-${colour}`;
}

/** The fill for a sticker whose home is `face`, drawn in `view`. */
export function stickerFill(face: OuterFace, view: CubeView): string {
  return `var(${stickerVariable(view[face])})`;
}

/** "white on top and green in front": how a scramble is applied. */
export const SCRAMBLE_HOLD = `${SCRAMBLE_VIEW.U} on top and ${SCRAMBLE_VIEW.F} in front`;

/** "white cross on the bottom, yellow on top and green in front": how a solve is held. */
export const SOLVING_HOLD = `${SOLVING_VIEW.D} cross on the bottom, ${SOLVING_VIEW.U} on top and ${SOLVING_VIEW.F} in front`;

/** The whole rule as one sentence, for prompts and exercise text. */
export const HOLD_RULE = `Apply scrambles with ${SCRAMBLE_HOLD}, then turn the cube over with ${SOLVING_ROTATION} (${SOLVING_VIEW.F} stays in front) and solve with the ${SOLVING_HOLD}.`;
