/**
 * Reading published algorithms: the same algorithm written different ways
 * comes out as one spelling. Shared by the ZBLL builder and the report on the
 * other sets.
 */
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { formatMove, parseAlgorithm, type Move, type QuarterTurns } from "@/lib/cube/notation";

export { cancel, expand } from "@/lib/cube/written";
import { cancel, expand } from "@/lib/cube/written";

export const ROTATION = new Set(["x", "y", "z"]);

/** The top turns and rotations at the end, which only line the cube up. */
export function trimEnd(moves: Move[]): Move[] {
  const out = [...moves];
  for (;;) {
    const last = out.at(-1);
    if (!last) return out;
    if (ROTATION.has(last.family)) out.pop();
    // A last U is only a turn of the last layer when the cube is upright by then:
    // after r ... r' it is, after an r left undone it isn't.
    else if (last.family === "U" && YAW.includes(netTurn(text(out.slice(0, -1))))) out.pop();
    else return out;
  }
}

/** The top turns (and optionally y turns) at the start: which way you hold it. */
export function trimStart(moves: Move[], withY: boolean): Move[] {
  let index = 0;
  while (
    index < moves.length &&
    (moves[index]!.family === "U" || (withY && moves[index]!.family === "y"))
  )
    index++;
  return moves.slice(index);
}

export const text = (moves: Move[]) => moves.map(formatMove).join(" ");

/** How long it is: turns, not rotations. */
export function length(moves: string): number {
  return moves.split(" ").filter((token) => !ROTATION.has(token[0]!)).length;
}

/** The moves as written, readable, with turns merged; null when unreadable. */
export function readMoves(raw: string): Move[] | null {
  const expanded = expand(raw);
  const parsed = expanded === null ? null : parseAlgorithm(expanded);
  if (!parsed || !parsed.ok || parsed.moves.length === 0) return null;
  const moves = cancel(parsed.moves);
  return moves.length ? moves : null;
}

/** Shorter spellings to try, most trimmed first; the first that still solves the case is kept. */
export function spellings(full: Move[]): Move[][] {
  return [
    cancel(trimStart(trimEnd(full), true)),
    cancel(trimStart(trimEnd(full), false)),
    // A final rotation can matter on its own; keep it and still drop the set-up turn.
    cancel(trimStart(full, true)),
    cancel(trimStart(full, false)),
    cancel(trimEnd(full)),
    full,
  ].filter((moves) => moves.length > 0);
}

const YAW = ["", "y", "y2", "y'"];
/** Every whole-cube turn, the plain ones first. */
const ORIENTATIONS = [
  ...YAW,
  ...["x", "x2", "x'", "z", "z'"].flatMap((tip) => YAW.map((yaw) => (yaw ? `${tip} ${yaw}` : tip))),
];
const CENTRES = [4, 13, 22, 31, 40, 49];
const centresOf = (facelets: string) => CENTRES.map((at) => facelets[at]).join("");
const ORIENTATION_BY_CENTRES = new Map(
  ORIENTATIONS.map((turn) => [
    centresOf(turn ? applyAlgorithm(turn, SOLVED_FACELETS) : SOLVED_FACELETS),
    turn,
  ]),
);

/** Which way round the cube is left: the whole-cube turn its centres show. */
export function netTurn(moves: string): string {
  return ORIENTATION_BY_CENTRES.get(centresOf(applyAlgorithm(moves, SOLVED_FACELETS)))!;
}

/** True when the algorithm finishes with the last layer back on top (a y turn is fine). */
export function finishesUpright(moves: string): boolean {
  return YAW.includes(netTurn(moves));
}

/**
 * The algorithm with a tipped finish undone. Wide and slice turns, or an x or z
 * left in, can leave the last layer on a side at the end; sources often leave
 * off the turn back, which working out the case needs.
 */
export function levelled(moves: Move[]): Move[] {
  const turn = netTurn(text(moves));
  if (YAW.includes(turn)) return moves;
  const parsed = parseAlgorithm(turn);
  if (!parsed.ok) return moves;
  const back = [...parsed.moves]
    .reverse()
    .map((move) => ({ family: move.family, turns: (4 - move.turns) as QuarterTurns }));
  return cancel([...moves, ...back]);
}
