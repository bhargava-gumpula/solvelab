import type { CubeEvent } from "@/types/domain";
import {
  formatAlgorithm,
  normalizeNotation,
  OUTER_FACES,
  parseAlgorithm,
  type OuterFace,
} from "@/lib/cube/notation";
import { is333SubsetEvent, randomSubset333Pattern, type CubiePatternData } from "./subset-333";
import type { ScrambleProvider } from "./types";

export interface CubingScrambleModule {
  randomScrambleForEvent(event: string): Promise<{ toString(): string }>;
  scrambleFrom333Pattern?: (patternData: CubiePatternData) => Promise<string>;
}

/**
 * Random-state scrambles from cubing.js (maintained by the cubing community and
 * used across WCA tooling). The solver runs in a web worker; `load` decides
 * where the library comes from (the pre-bundled static copy in browsers, the
 * npm package in Node tests).
 */
export function createCubingProvider(load: () => Promise<CubingScrambleModule>): ScrambleProvider {
  return {
    id: "cubing.js",
    randomState: true,
    async generate(event: CubeEvent) {
      const api = await load();
      if (is333SubsetEvent(event)) {
        if (!api.scrambleFrom333Pattern) {
          throw new Error("Subset scramble solver is not available.");
        }
        for (let attempt = 0; attempt < 8; attempt++) {
          const raw = await api.scrambleFrom333Pattern(randomSubset333Pattern(event));
          const parsed = parseAlgorithm(normalizeNotation(raw));
          if (!parsed.ok) {
            throw new Error(`cubing.js returned invalid subset notation: ${raw}`);
          }
          const scramble = formatAlgorithm(parsed.moves);
          if (scramble) return scramble;
        }
        throw new Error("Could not generate a subset scramble.");
      }
      const alg = await api.randomScrambleForEvent(event);
      return alg.toString();
    },
  };
}

const AXIS: Record<OuterFace, number> = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
const SUFFIXES = ["", "'", "2"] as const;
export const RANDOM_MOVE_LENGTH = 25;

function randomInt(maxExclusive: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % maxExclusive;
}

/**
 * Offline fallback only. Random-move scrambles are not uniformly random, so
 * the UI labels them. Avoids repeating a face and three turns on one axis.
 */
export const randomMoveProvider: ScrambleProvider = {
  id: "random-moves",
  randomState: false,
  async generate() {
    const moves: string[] = [];
    let previous: OuterFace | null = null;
    let beforePrevious: OuterFace | null = null;
    while (moves.length < RANDOM_MOVE_LENGTH) {
      const face = OUTER_FACES[randomInt(OUTER_FACES.length)];
      if (face === previous) continue;
      if (
        previous &&
        beforePrevious &&
        AXIS[face] === AXIS[previous] &&
        AXIS[previous] === AXIS[beforePrevious]
      ) {
        continue;
      }
      if (previous && AXIS[face] === AXIS[previous] && face === beforePrevious) continue;
      moves.push(face + SUFFIXES[randomInt(SUFFIXES.length)]);
      beforePrevious = previous;
      previous = face;
    }
    return moves.join(" ");
  },
};
