/**
 * Settings that make cubing.js's 3D player show the solving hold.
 *
 * cubing.js colours its 3×3 in the scrambling orientation (white on top, green
 * in front), and its stickerings (OLL, PLL, F2L…) treat the white U layer as
 * the last layer. Lessons play in the solving hold, so the player gets
 * SOLVING_ROTATION as a setup and each stickering is carried through the same
 * rotation: whatever the stickering says about the piece that belongs at a
 * spot applies to the piece the rotation brings there.
 */
import { SOLVING_ROTATION } from "@/lib/config/cube";

/** The shape of cubing.js's `StickeringMask`, as far as this file needs it. */
export interface StickeringMaskLike {
  name?: string;
  orbits: Record<string, { pieces: (unknown | null)[] }>;
}

/** The shape of cubing.js's `KPatternData`, as far as this file needs it. */
export type PatternDataLike = Record<string, { pieces: number[]; orientation: number[] }>;

/** What the player needs from cubing.js's `cube3x3x3` puzzle loader. */
export interface CubePuzzleLike {
  kpuzzle(): Promise<{
    defaultPattern(): { applyAlg(alg: string): { patternData: PatternDataLike } };
  }>;
  stickeringMask(stickering: string): Promise<StickeringMaskLike>;
}

/** The setup that ends every lesson demo in the solving hold. */
export const PLAYER_SETUP = SOLVING_ROTATION;

/**
 * Moves a stickering mask with the cube. `turned` is the solved pattern after
 * the rotation: `turned[orbit].pieces[spot]` is the piece now at `spot`, and
 * it takes the mask the stickering gave that spot's own piece.
 */
export function rotateStickeringMask(
  mask: StickeringMaskLike,
  turned: PatternDataLike,
): StickeringMaskLike {
  const orbits: StickeringMaskLike["orbits"] = {};
  for (const [name, orbit] of Object.entries(mask.orbits)) {
    const pattern = turned[name];
    if (!pattern) throw new Error(`No ${name} orbit in the rotated pattern`);
    if (pattern.orientation.some((twist) => twist !== 0)) {
      // A rotation that twists pieces would also need their facelets reordered.
      throw new Error(`${PLAYER_SETUP} twists ${name}; the mask can't simply be moved`);
    }
    const pieces = new Array<unknown | null>(orbit.pieces.length).fill(null);
    pattern.pieces.forEach((piece, spot) => {
      pieces[piece] = orbit.pieces[spot] ?? null;
    });
    orbits[name] = { pieces };
  }
  return { ...mask, orbits };
}

/** A cubing.js stickering, moved so it greys the right pieces in the solving hold. */
export async function solvingStickeringMask(
  puzzle: CubePuzzleLike,
  stickering: string,
): Promise<StickeringMaskLike> {
  const [kpuzzle, mask] = await Promise.all([puzzle.kpuzzle(), puzzle.stickeringMask(stickering)]);
  return rotateStickeringMask(mask, kpuzzle.defaultPattern().applyAlg(PLAYER_SETUP).patternData);
}
