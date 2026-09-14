import { z } from "zod";
import type { CubeEvent } from "@/types/domain";
import { isValidAlgorithm, normalizeNotation } from "./notation";

export interface CubeEventInfo {
  id: CubeEvent;
  label: string;
  /** Short label for tight UI (the event picker). */
  shortLabel: string;
  group: "NxN" | "3×3" | "CFOP" | "Other";
}

export const CUBE_EVENTS: readonly CubeEventInfo[] = [
  { id: "222", label: "2×2", shortLabel: "2×2", group: "NxN" },
  { id: "333", label: "3×3", shortLabel: "3×3", group: "NxN" },
  { id: "444", label: "4×4", shortLabel: "4×4", group: "NxN" },
  { id: "555", label: "5×5", shortLabel: "5×5", group: "NxN" },
  { id: "666", label: "6×6", shortLabel: "6×6", group: "NxN" },
  { id: "777", label: "7×7", shortLabel: "7×7", group: "NxN" },
  { id: "333oh", label: "3×3 One-Handed", shortLabel: "OH", group: "3×3" },
  { id: "333bf", label: "3×3 Blindfolded", shortLabel: "BLD", group: "3×3" },
  { id: "333f2l", label: "F2L — cross solved", shortLabel: "F2L", group: "CFOP" },
  { id: "333oll", label: "OLL — F2L solved", shortLabel: "OLL", group: "CFOP" },
  { id: "333pll", label: "PLL — OLL solved", shortLabel: "PLL", group: "CFOP" },
  { id: "pyram", label: "Pyraminx", shortLabel: "Pyra", group: "Other" },
  { id: "minx", label: "Megaminx", shortLabel: "Minx", group: "Other" },
  { id: "skewb", label: "Skewb", shortLabel: "Skewb", group: "Other" },
  { id: "sq1", label: "Square-1", shortLabel: "Sq-1", group: "Other" },
  { id: "clock", label: "Clock", shortLabel: "Clock", group: "Other" },
];

export const CUBE_EVENT_IDS = CUBE_EVENTS.map((event) => event.id) as [CubeEvent, ...CubeEvent[]];

export const cubeEventSchema = z.enum(CUBE_EVENT_IDS);

export const EVENT_GROUPS: CubeEventInfo["group"][] = ["NxN", "3×3", "CFOP", "Other"];

export function eventInfo(id: CubeEvent): CubeEventInfo {
  return CUBE_EVENTS.find((event) => event.id === id) ?? CUBE_EVENTS[1];
}

export function eventLabel(id: CubeEvent): string {
  return eventInfo(id).label;
}

export function is3x3Event(id: CubeEvent): boolean {
  return (
    id === "333" ||
    id === "333oh" ||
    id === "333bf" ||
    id === "333f2l" ||
    id === "333oll" ||
    id === "333pll"
  );
}

/** 3×3 net/3D preview is only meaningful for 3×3-shaped events. */
export function has3x3Preview(id: CubeEvent): boolean {
  return is3x3Event(id);
}

/** Outer-face WCA notation (U, R, F, …) — not wide-turn big cubes or other puzzles. */
export function usesOuterTurnNotation(id: CubeEvent): boolean {
  return id === "222" || is3x3Event(id);
}

/** Random-move fallback is only honest for a full 3×3, not subsets or other puzzles. */
export function allowsRandomMoveFallback(id: CubeEvent): boolean {
  return id === "333" || id === "333oh" || id === "333bf";
}

export function isValidScramble(event: CubeEvent, text: string): boolean {
  const scramble = normalizeNotation(text);
  if (!scramble || scramble.length > 2000) return false;
  if (usesOuterTurnNotation(event)) return isValidAlgorithm(scramble);
  return true;
}
