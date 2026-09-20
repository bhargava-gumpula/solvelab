/**
 * Checks last-layer algorithms against the cube engine.
 *
 * A case is defined by one of its own algorithms: undoing that algorithm on a
 * solved cube produces the case. Every other algorithm offered for the case
 * must solve it again. Both sides allow a U turn (AUF), because which face you
 * hold the case on is the solver's choice, not the algorithm's.
 */
import { applyAlgorithm, getFace, isSolved, SOLVED_FACELETS } from "./cube-state";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "./notation";

/** What has to be true once the algorithm has run. */
export type CaseKind =
  /** Every piece home: the whole last layer is solved. */
  | "pll"
  /** The last layer's top stickers all face up; where its pieces sit is free. */
  | "oll"
  /** Corners home and oriented, edges oriented but free to sit anywhere. */
  | "coll"
  /** The first two layers finished; the last layer is left as it is. */
  | "f2l"
  /** The last layer's edges facing up; its corners are the next step's problem. */
  | "eoll"
  /** The last pair going in and the last layer coming up oriented, in one go. */
  | "wv";

export const AUF = ["", "U", "U2", "U'"] as const;

/**
 * Published algorithms often end with the cube turned round, because the
 * rotation was free during the fingers' work. A finished cube is a finished
 * cube whichever way it faces, so every check looks past these.
 */
const TURNS = ["", "y", "y2", "y'"] as const;

/** The same state with the cube stood back up in the usual orientation. */
function upright(facelets: string, test = firstTwoLayersSolved): string | null {
  for (const turn of TURNS) {
    const candidate = turn ? applyAlgorithm(turn, facelets) : facelets;
    if (test(candidate)) return candidate;
  }
  return null;
}

/**
 * The front-right slot: the corner between D, F and R, and the edge between F
 * and R. Every F2L case is written for this slot, and the solver turns the cube
 * to bring their slot here.
 */
const SLOT = { corner: [26, 15, 29], edge: [23, 12] } as const;

/** Everything in the first two layers except the front-right slot. */
export function otherSlotsSolved(facelets: string): boolean {
  const spare = new Set<number>([...SLOT.corner, ...SLOT.edge]);
  const faces = { R: 9, F: 18, D: 27, L: 36, B: 45 } as const;
  for (const [face, start] of Object.entries(faces)) {
    // The bottom two rows of each side, and all of D.
    const from = face === "D" ? 0 : 3;
    for (let index = from; index < 9; index++) {
      const at = start + index;
      if (spare.has(at)) continue;
      if (facelets[at] !== face) return false;
    }
  }
  return true;
}

/**
 * The state this algorithm leaves behind when it is undone on a solved cube,
 * stood upright. Throws when the algorithm isn't a last-layer one at all.
 */
export function caseStateOf(algorithm: string, kind: CaseKind = "pll"): string {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(`Not an algorithm: ${algorithm} (${parsed.error.message})`);
  const state = applyAlgorithm(formatAlgorithm(invertAlgorithm(parsed.moves)), SOLVED_FACELETS);
  // An F2L case is one pair short by definition; the rest must still be there.
  const missingSlot = kind === "f2l" || kind === "wv";
  const stood = missingSlot ? upright(state, otherSlotsSolved) : upright(state);
  if (!stood) {
    throw new Error(
      missingSlot
        ? `${algorithm} disturbs more than the front-right slot`
        : `${algorithm} does not leave the first two layers alone`,
    );
  }
  return stood;
}

/** True when the bottom two layers are untouched. */
export function firstTwoLayersSolved(facelets: string): boolean {
  if (getFace(facelets, "D") !== "D".repeat(9)) return false;
  return (["R", "F", "L", "B"] as const).every((face) =>
    getFace(facelets, face)
      .slice(3)
      .split("")
      .every((sticker) => sticker === face),
  );
}

/** True when every last-layer sticker on top shows the up colour. */
export function lastLayerOriented(facelets: string): boolean {
  return getFace(facelets, "U") === "U".repeat(9);
}

/** True when the four last-layer edges face up, whatever the corners do. */
export function lastLayerEdgesOriented(facelets: string): boolean {
  const up = getFace(facelets, "U");
  return [1, 3, 5, 7].every((spot) => up[spot] === "U");
}

/** True when the last-layer corners are home, with the edges free to be anywhere. */
export function cornersSolved(facelets: string): boolean {
  if (!lastLayerOriented(facelets)) return false;
  return (["R", "F", "L", "B"] as const).every((face) => {
    const top = getFace(facelets, face).slice(0, 3);
    return top[0] === face && top[2] === face;
  });
}

function satisfies(facelets: string, kind: CaseKind): boolean {
  const stood = upright(facelets);
  if (!stood) return false;
  if (kind === "pll") return isSolved(stood);
  if (kind === "oll") return lastLayerOriented(stood);
  if (kind === "eoll") return lastLayerEdgesOriented(stood);
  // Winter Variation puts the pair in and brings the corners up at the same time.
  if (kind === "wv") return lastLayerOriented(stood);
  // The pair is in and the rest of the first two layers is untouched; what the
  // last layer looks like is the next step's problem.
  if (kind === "f2l") return true;
  return cornersSolved(stood);
}

export interface CheckResult {
  ok: boolean;
  /** The U turn needed before the algorithm, when one is. */
  preAuf?: string;
  /** The U turn needed after it, when one is. */
  postAuf?: string;
}

/** Does this algorithm solve this case, allowing a U turn on either side? */
export function checkAlgorithm(caseState: string, algorithm: string, kind: CaseKind): CheckResult {
  for (const pre of AUF) {
    const before = pre ? applyAlgorithm(pre, caseState) : caseState;
    let after: string;
    try {
      after = applyAlgorithm(algorithm, before);
    } catch {
      return { ok: false };
    }
    for (const post of AUF) {
      const result = post ? applyAlgorithm(post, after) : after;
      if (satisfies(result, kind)) return { ok: true, preAuf: pre, postAuf: post };
    }
  }
  return { ok: false };
}

/**
 * A case's fingerprint, so two cases that look different but are the same one
 * turned round can be spotted. It is the smallest of the four AUF views.
 */
export function caseSignature(caseState: string): string {
  return AUF.map((turn) => (turn ? applyAlgorithm(turn, caseState) : caseState))
    .sort()
    .at(0)!;
}

/**
 * Which last-layer stickers face up, as a pattern. Two orientations that only
 * differ by how the cube is held count as the same one.
 */
export function orientationSignature(facelets: string): string {
  return AUF.map((turn) => {
    const view = turn ? applyAlgorithm(turn, facelets) : facelets;
    const top = getFace(view, "U");
    const sides = (["R", "F", "L", "B"] as const)
      .map((face) => getFace(view, face).slice(0, 3))
      .join("");
    return `${top}${sides}`.replace(/U/g, "1").replace(/[^1]/g, "0");
  })
    .sort()
    .at(0)!;
}

/** Where each corner and edge's stickers sit, in the usual facelet order. */
const CORNER_SPOTS: readonly (readonly [number, number, number])[] = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 42, 53],
  [35, 51, 17],
];
const EDGE_SPOTS: readonly (readonly [number, number])[] = [
  [5, 10],
  [7, 19],
  [3, 37],
  [1, 46],
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
  [23, 12],
  [21, 41],
  [50, 39],
  [48, 14],
];

/**
 * The stickers of the pair that belongs in the front-right slot: the corner
 * carrying the down, front and right colours, and the edge carrying front and
 * right. Everything else in an F2L case is the last layer, which doesn't matter
 * yet, so a diagram can leave it grey.
 */
export function pairStickers(facelets: string): number[] {
  const spots: number[] = [];
  for (const corner of CORNER_SPOTS) {
    const stickers = corner.map((spot) => facelets[spot]!);
    if (["D", "F", "R"].every((colour) => stickers.includes(colour))) {
      spots.push(...corner);
      break;
    }
  }
  for (const edge of EDGE_SPOTS) {
    const stickers = edge.map((spot) => facelets[spot]!);
    if (stickers.includes("F") && stickers.includes("R")) {
      spots.push(...edge);
      break;
    }
  }
  return spots;
}
