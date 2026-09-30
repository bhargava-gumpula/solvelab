/**
 * Your own algorithm for a case. It is checked on SolveLab's cube before it is
 * kept, the same way every algorithm in the bank is: it has to solve the case
 * from its picture, with a turn of the top allowed before or after.
 *
 * It is read the way people write algorithms: brackets, repeats like
 * (R U R' U')2, set-ups and commutators like [R: U] and [R, U], wide turns as
 * r or Rw, and turns run together (RUR'U').
 */
import type { CaseEntry } from "@/data/algorithms/types";
import { checkAlgorithm, CASE_KINDS, type CaseKind } from "@/lib/cube/case-check";
import { formatAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { cancel, expand } from "@/lib/cube/written";
import { algorithmsFor, caseStateFor } from "./catalog";

export type CustomCheck = { ok: true; moves: string } | { ok: false; error: string };

export function checkCustomAlgorithm(
  entry: CaseEntry,
  kind: CaseKind,
  text: string,
  /** Algorithms the case already lists, yours included, so none is added twice. */
  existing: readonly string[] = algorithmsFor(entry).map((algorithm) => algorithm.moves),
): CustomCheck {
  if (!text.trim()) return { ok: false, error: "Type an algorithm first." };
  const expanded = expand(text);
  if (expanded === null) {
    return { ok: false, error: "Brackets like [R: U] or [R, U] need both parts; check them." };
  }
  const parsed = parseAlgorithm(expanded);
  if (!parsed.ok) return { ok: false, error: parsed.error.message };
  const moves = formatAlgorithm(cancel(parsed.moves));
  if (!moves) return { ok: false, error: "Those turns cancel out to nothing." };

  // The same moves with a turn of the top added count as the same. A left-hand
  // version, or the idea done from another face, is a different algorithm to
  // perform, so it can be added.
  const keyOf = (written: string) =>
    CASE_KINDS[kind].slotCase ? written : withoutTopTurns(written);
  const key = keyOf(moves);
  const same = existing.find((written) => keyOf(written) === key);
  if (same !== undefined) {
    return {
      ok: false,
      error:
        same === moves
          ? "That one is already in the list."
          : `That one is already in the list, written as ${same}.`,
    };
  }
  if (!checkAlgorithm(caseStateFor(entry, kind), moves, kind).ok) {
    return {
      ok: false,
      error:
        "On SolveLab's cube that doesn't solve this case from its picture. A turn of the top before or after is allowed; check the moves, and which way you hold the cube.",
    };
  }
  return { ok: true, moves };
}

/** Moves that tip the last layer off the top, after which a U isn't a turn of it. */
const TIPS = /^[xzrlfbMS]/;

/**
 * The algorithm without the turns of the top before and after it: those only
 * say where to start and finish, so they don't make it a different algorithm.
 */
function withoutTopTurns(written: string): string {
  const moves = written.split(" ");
  while (moves.length > 1 && /^U/.test(moves[0]!)) moves.shift();
  if (!moves.some((move) => TIPS.test(move))) {
    while (moves.length > 1 && /^U/.test(moves.at(-1)!)) moves.pop();
  }
  return moves.join(" ");
}
