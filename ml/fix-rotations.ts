/**
 * Takes the leading cube rotations off last-layer algorithms.
 *
 * A y at the front of an algorithm only says "hold it round the other way",
 * which the case picture already shows, so it doesn't belong there. Each one is
 * removed in the way that still solves the pictured case: either it was
 * redundant and simply goes, or the moves after it are rewritten for the faces
 * they would have landed on. x and z stay, because they tip the cube onto
 * another layer, which is part of the algorithm.
 *
 * Every rewrite is checked against the cube engine before it is written down.
 */
import { writeFileSync } from "node:fs";
import { ALGORITHM_SETS, algorithmsFor, kindFor } from "@/lib/algorithms/catalog";
import { caseStateOf, checkAlgorithm, type CaseKind } from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { formatMove, parseAlgorithm, type Move, type QuarterTurns } from "@/lib/cube/notation";

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
];

/** What each move becomes when the whole cube is turned, worked out on a cube. */
function rotationMap(rotation: string): Map<string, Move> {
  const map = new Map<string, Move>();
  const inverse = rotation === "y" ? "y'" : rotation === "y'" ? "y" : "y2";
  for (const family of FAMILIES) {
    const target = applyAlgorithm(`${rotation} ${family} ${inverse}`, SOLVED_FACELETS);
    for (const candidate of FAMILIES) {
      for (const turns of [1, 2, 3] as QuarterTurns[]) {
        const move: Move = { family: candidate as Move["family"], turns };
        if (applyAlgorithm(formatMove(move), SOLVED_FACELETS) === target) {
          map.set(family, move);
        }
      }
      if (map.has(family)) break;
    }
  }
  return map;
}

const MAPS = new Map([
  ["y", rotationMap("y")],
  ["y'", rotationMap("y'")],
  ["y2", rotationMap("y2")],
]);

/** The same algorithm written for a cube that was never turned. */
function rewrite(rest: Move[], rotation: string): string | null {
  const map = MAPS.get(rotation);
  if (!map) return null;
  const moves: Move[] = [];
  for (const move of rest) {
    const mapped = map.get(move.family);
    if (!mapped) return null;
    const turns = ((mapped.turns * move.turns) % 4) as QuarterTurns | 0;
    if (turns === 0) return null;
    moves.push({ family: mapped.family, turns });
  }
  return moves.map(formatMove).join(" ");
}

interface Change {
  set: string;
  entry: string;
  id: string;
  from: string;
  to: string | null;
  how: string;
}

const changes: Change[] = [];
let kept = 0;

for (const set of ALGORITHM_SETS) {
  for (const entry of set.cases) {
    const own = entry.algorithms;
    if (own.length === 0) continue;
    const kind: CaseKind = kindFor(set, entry);
    const state = caseStateOf(algorithmsFor(entry)[0]!.moves, kind);
    const seen = new Set<string>();
    for (const algorithm of own) {
      const parsed = parseAlgorithm(algorithm.moves);
      if (!parsed.ok) continue;
      const lead: Move[] = [];
      let index = 0;
      while (index < parsed.moves.length && parsed.moves[index]!.family === "y") {
        lead.push(parsed.moves[index]!);
        index++;
      }
      if (lead.length === 0) {
        seen.add(algorithm.moves);
        continue;
      }
      const rest = parsed.moves.slice(index);
      const rotation = lead.length === 1 ? formatMove(lead[0]!) : null;
      const stripped = rest.map(formatMove).join(" ");
      const candidates: { moves: string; how: string }[] = [
        { moves: stripped, how: "the turn was redundant" },
      ];
      const rewritten = rotation ? rewrite(rest, rotation) : null;
      if (rewritten)
        candidates.push({ moves: rewritten, how: "rewritten for the faces it lands on" });

      let fixed: { moves: string; how: string } | null = null;
      for (const candidate of candidates) {
        if (!candidate.moves) continue;
        if (checkAlgorithm(state, candidate.moves, kind).ok) {
          fixed = candidate;
          break;
        }
      }
      if (!fixed) {
        kept++;
        console.log(`KEEP   ${set.id} ${entry.id} ${algorithm.id}: ${algorithm.moves}`);
        seen.add(algorithm.moves);
        continue;
      }
      if (seen.has(fixed.moves)) {
        changes.push({
          set: set.id,
          entry: entry.id,
          id: algorithm.id,
          from: algorithm.moves,
          to: null,
          how: "duplicate once the turn went",
        });
        continue;
      }
      seen.add(fixed.moves);
      changes.push({
        set: set.id,
        entry: entry.id,
        id: algorithm.id,
        from: algorithm.moves,
        to: fixed.moves,
        how: fixed.how,
      });
    }
  }
}

const byHow = new Map<string, number>();
for (const change of changes) byHow.set(change.how, (byHow.get(change.how) ?? 0) + 1);
console.log([...byHow].map(([how, count]) => `${count} ${how}`).join(", "));
console.log(`${changes.length} changed, ${kept} kept as they are`);
writeFileSync(process.env.OUT!, JSON.stringify(changes, null, 1));
