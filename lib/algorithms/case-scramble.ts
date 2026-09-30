/**
 * A scramble that sets up one case, for practising its algorithm on a real
 * cube. The case is the algorithm undone, with a random turn of the top on
 * either side, so it comes at a random angle and the last turn varies. The
 * solver then finds an ordinary-looking scramble for that state, so the
 * scramble doesn't give the algorithm away. Like every scramble in SolveLab it
 * is for the scrambling hold: scramble, turn the cube over, and the case is on
 * top.
 */
import { SOLVING_ROTATION } from "@/lib/config/cube";
import { AUF } from "@/lib/cube/case-check";
import { movesBeforeRotation } from "@/lib/cube/cube-state";
import {
  formatAlgorithm,
  invertAlgorithm,
  normalizeNotation,
  parseAlgorithm,
  type Move,
} from "@/lib/cube/notation";
import { outerTurns } from "@/lib/cube/outer-turns";
import type { CubingScrambleModule } from "@/lib/scramble";

export interface CaseScramble {
  scramble: string;
  /** True when the solver found it; false when it is the set-up itself. */
  fromSolver: boolean;
}

/** The case in outer turns, from solved, in the solving hold (last layer on top). */
export function caseSetup(algorithm: string, random: () => number = Math.random): Move[] {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(`Not an algorithm: ${algorithm}`);
  const before = AUF[Math.floor(random() * 4)]!;
  const after = AUF[Math.floor(random() * 4)]!;
  const text = [after, formatAlgorithm(invertAlgorithm(parsed.moves)), before]
    .filter(Boolean)
    .join(" ");
  const setup = parseAlgorithm(text);
  if (!setup.ok) throw new Error(`Not an algorithm: ${text}`);
  return outerTurns(setup.moves);
}

/** Turns worked out in the solving hold, written for the scrambling hold. */
function forScramblingHold(moves: readonly Move[]): string {
  return formatAlgorithm(movesBeforeRotation(moves, SOLVING_ROTATION));
}

export async function caseScramble(
  algorithm: string,
  load: () => Promise<Pick<CubingScrambleModule, "scrambleFor333Alg">>,
  random: () => number = Math.random,
): Promise<CaseScramble> {
  const setup = caseSetup(algorithm, random);
  try {
    const api = await load();
    if (api.scrambleFor333Alg) {
      const raw = await api.scrambleFor333Alg(formatAlgorithm(setup));
      const parsed = parseAlgorithm(normalizeNotation(raw));
      if (parsed.ok && parsed.moves.length > 0) {
        return { scramble: forScramblingHold(parsed.moves), fromSolver: true };
      }
    }
  } catch {
    // No solver (offline, or it failed): the set-up itself still works.
  }
  return { scramble: forScramblingHold(setup), fromSolver: false };
}
