/**
 * Your own algorithm for a case. It is checked on SolveLab's cube before it is
 * kept, the same way every algorithm in the bank is: it has to solve the case
 * from its picture, with a turn of the top allowed before or after.
 */
import type { CaseEntry } from "@/data/algorithms/types";
import { checkAlgorithm, type CaseKind } from "@/lib/cube/case-check";
import { formatAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { algorithmsFor, caseStateFor } from "./catalog";

export type CustomCheck = { ok: true; moves: string } | { ok: false; error: string };

export function checkCustomAlgorithm(
  entry: CaseEntry,
  kind: CaseKind,
  text: string,
  /** Algorithms the case already lists, yours included, so none is added twice. */
  existing: readonly string[] = algorithmsFor(entry).map((algorithm) => algorithm.moves),
): CustomCheck {
  const parsed = parseAlgorithm(text);
  if (!parsed.ok) return { ok: false, error: parsed.error.message };
  if (!parsed.moves.length) return { ok: false, error: "Type an algorithm first." };
  const moves = formatAlgorithm(parsed.moves);
  if (existing.includes(moves)) return { ok: false, error: "That one is already in the list." };
  if (!checkAlgorithm(caseStateFor(entry, kind), moves, kind).ok) {
    return {
      ok: false,
      error:
        "On SolveLab's cube that doesn't solve this case from its picture. A turn of the top before or after is allowed; check the moves, and which way you hold the cube.",
    };
  }
  return { ok: true, moves };
}
