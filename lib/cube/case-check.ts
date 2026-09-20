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
  | "coll";

export const AUF = ["", "U", "U2", "U'"] as const;

/**
 * Published algorithms often end with the cube turned round, because the
 * rotation was free during the fingers' work. A finished cube is a finished
 * cube whichever way it faces, so every check looks past these.
 */
const TURNS = ["", "y", "y2", "y'"] as const;

/** The same state with the cube stood back up in the usual orientation. */
function upright(facelets: string): string | null {
  for (const turn of TURNS) {
    const candidate = turn ? applyAlgorithm(turn, facelets) : facelets;
    if (firstTwoLayersSolved(candidate)) return candidate;
  }
  return null;
}

/**
 * The state this algorithm leaves behind when it is undone on a solved cube,
 * stood upright. Throws when the algorithm isn't a last-layer one at all.
 */
export function caseStateOf(algorithm: string): string {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(`Not an algorithm: ${algorithm} (${parsed.error.message})`);
  const state = applyAlgorithm(formatAlgorithm(invertAlgorithm(parsed.moves)), SOLVED_FACELETS);
  const stood = upright(state);
  if (!stood) throw new Error(`${algorithm} does not leave the first two layers alone`);
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
