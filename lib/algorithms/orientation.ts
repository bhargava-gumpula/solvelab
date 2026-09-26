import type { CaseEntry } from "@/data/algorithms/types";
import { caseStateFor } from "@/lib/algorithms/catalog";
import { AUF, CASE_KINDS, solvesFromHere, type CaseKind } from "@/lib/cube/case-check";
import { applyAlgorithm } from "@/lib/cube/cube-state";

/**
 * Which way round a case is drawn, so the picture always matches the algorithm
 * shown with it.
 *
 * Two algorithms for one case often start from different angles. Rather than
 * write a set-up turn into the chosen algorithm, the picture turns to the angle
 * it starts from. The other algorithms are then shown with whatever set-up turn
 * they need from that picture, so it is clear they start somewhere else.
 *
 * The picture itself always turns the top layer (U), so the cube underneath
 * keeps its centres where they are and every sticker reads the usual way. What
 * the turn is called depends on the kind: for a last-layer case only the top is
 * on show, so turning the top and turning the whole cube (y) look the same, and
 * y is what the solver does; a pair case keeps its slot at the front right, so
 * it really is the top layer that turns.
 */

type Quarter = 0 | 1 | 2 | 3;

const CUBE_TURNS = ["", "y", "y2", "y'"] as const;

/** What to call a set-up turn of this many quarters, for this kind of case. */
function turnName(kind: CaseKind, quarter: Quarter): string {
  return (CASE_KINDS[kind].slotCase ? AUF : CUBE_TURNS)[quarter];
}

/** Nearest first: no turn, a quarter either way, then a half. */
const BY_DISTANCE: readonly Quarter[] = [0, 1, 3, 2];

const turned = new Map<string, string>();

/** The case turned by some quarters from how it is first worked out. */
function turnedState(entry: CaseEntry, kind: CaseKind, quarter: Quarter): string {
  const key = `${entry.id}|${kind}|${quarter}`;
  const cached = turned.get(key);
  if (cached) return cached;
  const base = caseStateFor(entry, kind);
  const turn = AUF[quarter];
  const state = turn ? applyAlgorithm(turn, base) : base;
  turned.set(key, state);
  return state;
}

const starts = new Map<string, Quarter[]>();

/** Every angle this algorithm solves the case from with no set-up turn. */
function startQuarters(entry: CaseEntry, kind: CaseKind, moves: string): Quarter[] {
  const key = `${entry.id}|${kind}|${moves}`;
  const cached = starts.get(key);
  if (cached) return cached;
  const found = BY_DISTANCE.filter((quarter) =>
    solvesFromHere(turnedState(entry, kind, quarter), moves, kind),
  );
  starts.set(key, found);
  return found;
}

export interface CasePicture {
  facelets: string;
  /** How far the picture is turned from the case's first drawing. */
  quarter: Quarter;
}

/**
 * The case drawn the way `moves` starts from, so holding the cube like the
 * picture and doing the algorithm solves it. Falls back to the first drawing
 * for an algorithm that doesn't solve the case at all.
 */
const firstStarts = new Map<string, Quarter>();

export function casePicture(entry: CaseEntry, kind: CaseKind, moves: string): CasePicture {
  // The grid draws every case in a set, so stop at the first angle that works
  // rather than checking all four; the full list is only needed in the dialog.
  const key = `${entry.id}|${kind}|${moves}`;
  let quarter = firstStarts.get(key);
  if (quarter === undefined) {
    quarter =
      BY_DISTANCE.find((q) => solvesFromHere(turnedState(entry, kind, q), moves, kind)) ?? 0;
    firstStarts.set(key, quarter);
  }
  return { facelets: turnedState(entry, kind, quarter), quarter };
}

/**
 * The turn to make before `moves`, starting from a picture turned by `from`.
 * Empty when it starts from that angle already; null when it can't be reached
 * by a turn at all.
 */
export function setUpTurn(
  entry: CaseEntry,
  kind: CaseKind,
  moves: string,
  from: Quarter,
): string | null {
  const reachable = startQuarters(entry, kind, moves);
  if (reachable.length === 0) return null;
  for (const step of BY_DISTANCE) {
    const target = ((from + step) % 4) as Quarter;
    if (reachable.includes(target)) return turnName(kind, step);
  }
  return null;
}
