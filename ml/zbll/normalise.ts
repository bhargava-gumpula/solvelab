/**
 * Reading published algorithms: the same algorithm written different ways
 * comes out as one spelling. Shared by the ZBLL builder and the report on the
 * other sets.
 */
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { formatMove, parseAlgorithm, type Move, type QuarterTurns } from "@/lib/cube/notation";

/** Expands [A: B] (A B A'), [A, B] (A B A' B') and (A)n, innermost first. */
export function expand(text: string): string | null {
  let current = text
    .replace(/[’′‘`´]/g, "'")
    .replace(/ /g, " ")
    .replace(/\*/g, "")
    // Turns written without a space between them: R'U, R2U.
    .replace(/(['2])(?=[UDLRFBudlrfbMESxyz])/g, "$1 ");
  for (let round = 0; round < 20; round++) {
    const before = current;
    current = current.replace(/\(([^()[\]]*)\)\s*(\d)(?!['w])/g, (_, inner: string, n: string) =>
      Array.from({ length: Number(n) }, () => inner).join(" "),
    );
    current = current.replace(/\[([^[\]]*)\]/g, (_, inner: string) => {
      const conj = inner.split(":");
      const comm = inner.split(",");
      if (conj.length === 2) return ` ${conj[0]} ${conj[1]} ${invert(conj[0]!)} `;
      if (comm.length === 2)
        return ` ${comm[0]} ${comm[1]} ${invert(comm[0]!)} ${invert(comm[1]!)} `;
      return ` ${inner} `;
    });
    if (current === before) break;
  }
  return /[[\]:,]/.test(current) ? null : current;
}

export function invert(text: string): string {
  const parsed = parseAlgorithm(text);
  if (!parsed.ok) return "#";
  return [...parsed.moves]
    .reverse()
    .map((move) => formatMove({ family: move.family, turns: (4 - move.turns) as QuarterTurns }))
    .join(" ");
}

/** Adjacent turns of the same layer merged, repeatedly. */
export function cancel(moves: Move[]): Move[] {
  const out: Move[] = [];
  for (const move of moves) {
    const last = out.at(-1);
    if (last && last.family === move.family) {
      const turns = (last.turns + move.turns) % 4;
      out.pop();
      if (turns !== 0) out.push({ family: move.family, turns: turns as QuarterTurns });
    } else out.push({ ...move });
  }
  return out.length === moves.length ? out : cancel(out);
}

export const ROTATION = new Set(["x", "y", "z"]);
/** Moves after which the layer on top is no longer the last layer. */
export const TIPS_UP = new Set(["x", "z", "r", "l", "f", "b", "M", "S"]);

/** The top turns and rotations at the end, which only line the cube up. */
export function trimEnd(moves: Move[]): Move[] {
  const out = [...moves];
  for (;;) {
    const last = out.at(-1);
    if (!last) return out;
    if (ROTATION.has(last.family)) out.pop();
    else if (last.family === "U" && !out.some((move) => TIPS_UP.has(move.family))) out.pop();
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
