import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { formatMove, parseAlgorithm, type Move, type QuarterTurns } from "@/lib/cube/notation";

/**
 * One key for every way of writing the same algorithm round the cube: the
 * moves rewritten as if the whole cube had been turned y, y2 or y' first, and
 * the smallest spelling kept. `R U R'` held one way and `F U F'` held another
 * are the same algorithm; which way round to hold it is what the picture shows.
 */

const FAMILIES = [
  "U",
  "D",
  "L",
  "R",
  "F",
  "B",
  "u",
  "d",
  "l",
  "r",
  "f",
  "b",
  "M",
  "E",
  "S",
  "x",
  "y",
  "z",
] as const;

/** What each move becomes once the cube has been turned, worked out on a cube. */
function rotationMap(rotation: string, inverse: string): Map<string, Move> {
  const map = new Map<string, Move>();
  for (const family of FAMILIES) {
    const target = applyAlgorithm(`${rotation} ${family} ${inverse}`, SOLVED_FACELETS);
    search: for (const candidate of FAMILIES) {
      for (const turns of [1, 2, 3] as QuarterTurns[]) {
        const move: Move = { family: candidate, turns };
        if (applyAlgorithm(formatMove(move), SOLVED_FACELETS) === target) {
          map.set(family, move);
          break search;
        }
      }
    }
  }
  return map;
}

const MAPS = [rotationMap("y", "y'"), rotationMap("y2", "y2"), rotationMap("y'", "y")];

/** The moves as they would be written after turning the cube; null if one has no equal. */
function rewrite(moves: readonly Move[], map: Map<string, Move>): string | null {
  const out: string[] = [];
  for (const move of moves) {
    const mapped = map.get(move.family);
    if (!mapped) return null;
    const turns = ((mapped.turns * move.turns) % 4) as QuarterTurns | 0;
    if (turns === 0) return null;
    out.push(formatMove({ family: mapped.family, turns }));
  }
  return out.join(" ");
}

/** Every spelling of this algorithm round the cube, itself first. */
export function roundTheCube(moves: string): string[] {
  const parsed = parseAlgorithm(moves);
  if (!parsed.ok) return [moves];
  const written = parsed.moves.map(formatMove).join(" ");
  const others = MAPS.map((map) => rewrite(parsed.moves, map)).filter(
    (spelling): spelling is string => spelling !== null,
  );
  return [written, ...others];
}

/** The key two spellings of one algorithm share. */
export function canonicalKey(moves: string): string {
  return roundTheCube(moves).sort()[0]!;
}
