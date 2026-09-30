/**
 * Reading an algorithm the way people write it: brackets and repeats, set-ups
 * and commutators, typographic primes, turns run together. Used for algorithms
 * from published lists and for the ones people type in themselves.
 */
import { formatMove, parseAlgorithm, type Move, type QuarterTurns } from "./notation";

/** Expands [A: B] (A B A'), [A, B] (A B A' B') and (A)n, innermost first. */
export function expand(text: string): string | null {
  let current = text
    .replace(/[’′‘`´]/g, "'")
    .replace(/ /g, " ")
    .replace(/\*/g, "")
    // Turns written without a space between them: R'U, R2U.
    .replace(/(['2])(?=[UDLRFBudlrfbMESxyz])/g, "$1 ")
    // RUR'U' as well: a turn letter straight after another (w stays with its letter).
    .replace(/([UDLRFBudlrfbMESxyz])(?=[UDLRFBudlrfbMESxyz])/g, "$1 ");
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

function invert(text: string): string {
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
