/**
 * An algorithm written with outer turns only: wide turns, slices and cube
 * rotations turned into the outer turns they amount to, relative to the
 * centres. The stickers end up the same relative to the centres; only which
 * way the whole cube faces can differ. Scrambles need this, because they are
 * handed out for another hold, and only outer turns can be carried across.
 */
import { applyAlgorithm, SOLVED_FACELETS } from "./cube-state";
import { formatMove, parseAlgorithm, type Move, type QuarterTurns } from "./notation";

/** Each wide turn or slice as an outer turn and a rotation. */
const AS_OUTER: Record<string, string> = {
  r: "L x",
  l: "R x'",
  u: "D y",
  d: "U y'",
  f: "B z",
  b: "F z'",
  M: "R L' x'",
  E: "U D' y'",
  S: "F' B z",
};

const OUTER = ["U", "D", "L", "R", "F", "B"] as const;

/** What each outer turn becomes when a rotation is moved past it, worked out on a cube. */
function rotationMap(rotation: string): Map<string, Move> {
  const map = new Map<string, Move>();
  const undo = parseAlgorithm(rotation);
  if (!undo.ok) throw new Error(rotation);
  const inverse = [...undo.moves]
    .reverse()
    .map((move) => formatMove({ family: move.family, turns: (4 - move.turns) as QuarterTurns }))
    .join(" ");
  for (const face of OUTER) {
    const target = applyAlgorithm(`${rotation} ${face} ${inverse}`, SOLVED_FACELETS);
    const found = OUTER.find((candidate) => applyAlgorithm(candidate) === target);
    if (!found) throw new Error(`${face} through ${rotation}`);
    map.set(face, { family: found, turns: 1 });
  }
  return map;
}

const MAPS = new Map<string, Map<string, Move>>();
function mapFor(rotation: Move): Map<string, Move> {
  const key = formatMove(rotation);
  let map = MAPS.get(key);
  if (!map) {
    map = rotationMap(key);
    MAPS.set(key, map);
  }
  return map;
}

/**
 * The same algorithm in outer turns. Every rotation, written or implied by a
 * wide turn or slice, is carried to the end and dropped.
 */
export function outerTurns(moves: readonly Move[]): Move[] {
  const expanded: Move[] = [];
  for (const move of moves) {
    const outer = AS_OUTER[move.family];
    if (!outer) {
      expanded.push(move);
      continue;
    }
    const parsed = parseAlgorithm(outer);
    if (!parsed.ok) throw new Error(outer);
    for (let turn = 0; turn < move.turns; turn++) expanded.push(...parsed.moves);
  }
  const out: Move[] = [];
  const rotations: Move[] = [];
  for (const move of expanded) {
    if (move.family === "x" || move.family === "y" || move.family === "z") {
      rotations.push(move);
      continue;
    }
    // "x y M" is "(M as seen after y, then after x) x y": undo the latest rotation first.
    let family: string = move.family;
    for (let index = rotations.length - 1; index >= 0; index--) {
      family = mapFor(rotations[index]!).get(family)!.family;
    }
    const last = out.at(-1);
    if (last && last.family === family) {
      const turns = (last.turns + move.turns) % 4;
      out.pop();
      if (turns) out.push({ family: family as Move["family"], turns: turns as QuarterTurns });
    } else out.push({ family: family as Move["family"], turns: move.turns });
  }
  return out;
}

export function outerTurnsText(algorithm: string): string {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(`Not an algorithm: ${algorithm}`);
  return outerTurns(parsed.moves).map(formatMove).join(" ");
}
