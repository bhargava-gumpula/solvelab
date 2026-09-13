/**
 * A 3×3 cube modeled as 54 stickers.
 *
 * Every sticker has a cubie position (x, y, z ∈ {-1, 0, 1}) and an outward
 * normal. Axes: +x points to R, +y to U, +z to F. A move rotates every sticker
 * in the affected layers by a quarter turn, so outer turns, wide turns, slices
 * and rotations all share one implementation.
 *
 * States are serialized as facelet strings in the conventional URFDLB order,
 * nine stickers per face, reading each face row by row as seen when looking
 * directly at it (U with B at the top, D with F at the top, side faces with U
 * at the top). A solved cube is "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB".
 */
import type { Move, MoveFamily, OuterFace } from "./notation";
import { parseAlgorithm } from "./notation";

type Vector = readonly [number, number, number];
type Axis = 0 | 1 | 2;

export const FACE_ORDER: readonly OuterFace[] = ["U", "R", "F", "D", "L", "B"];
export const SOLVED_FACELETS = FACE_ORDER.map((face) => face.repeat(9)).join("");

interface FaceLayout {
  normal: Vector;
  origin: Vector;
  column: Vector;
  row: Vector;
}

const FACE_LAYOUTS: Record<OuterFace, FaceLayout> = {
  U: { normal: [0, 1, 0], origin: [-1, 1, -1], column: [1, 0, 0], row: [0, 0, 1] },
  R: { normal: [1, 0, 0], origin: [1, 1, 1], column: [0, 0, -1], row: [0, -1, 0] },
  F: { normal: [0, 0, 1], origin: [-1, 1, 1], column: [1, 0, 0], row: [0, -1, 0] },
  D: { normal: [0, -1, 0], origin: [-1, -1, 1], column: [1, 0, 0], row: [0, 0, -1] },
  L: { normal: [-1, 0, 0], origin: [-1, 1, -1], column: [0, 0, 1], row: [0, -1, 0] },
  B: { normal: [0, 0, -1], origin: [1, 1, -1], column: [-1, 0, 0], row: [0, -1, 0] },
};

interface Sticker {
  position: Vector;
  normal: Vector;
}

const add = (a: Vector, b: Vector, scale = 1): Vector => [
  a[0] + b[0] * scale,
  a[1] + b[1] * scale,
  a[2] + b[2] * scale,
];

const stickerKey = ({ position, normal }: Sticker) => `${position.join(",")}|${normal.join(",")}`;

const STICKERS: Sticker[] = FACE_ORDER.flatMap((face) => {
  const layout = FACE_LAYOUTS[face];
  return Array.from({ length: 9 }, (_, index) => ({
    position: add(add(layout.origin, layout.column, index % 3), layout.row, Math.floor(index / 3)),
    normal: layout.normal,
  }));
});

const STICKER_INDEX = new Map(STICKERS.map((sticker, index) => [stickerKey(sticker), index]));

/**
 * Rotates a vector a quarter turn about an axis. direction +1 is
 * counter-clockwise when looking from the positive end of the axis.
 */
function rotate(vector: Vector, axis: Axis, direction: 1 | -1): Vector {
  const [x, y, z] = vector;
  if (axis === 0) return direction === 1 ? [x, -z, y] : [x, z, -y];
  if (axis === 1) return direction === 1 ? [z, y, -x] : [-z, y, x];
  return direction === 1 ? [-y, x, z] : [y, -x, z];
}

interface MoveGeometry {
  axis: Axis;
  /** Rotation direction for one clockwise quarter turn of this move. */
  direction: 1 | -1;
  layers: readonly number[];
}

/*
 * Clockwise is defined looking at the named face. R turns like -90° about +x,
 * L like +90°. Slices follow their conventional reference face: M follows L,
 * E follows D, S follows F. Rotations follow R (x), U (y) and F (z).
 */
const MOVE_GEOMETRY: Record<MoveFamily, MoveGeometry> = {
  R: { axis: 0, direction: -1, layers: [1] },
  L: { axis: 0, direction: 1, layers: [-1] },
  U: { axis: 1, direction: -1, layers: [1] },
  D: { axis: 1, direction: 1, layers: [-1] },
  F: { axis: 2, direction: -1, layers: [1] },
  B: { axis: 2, direction: 1, layers: [-1] },
  r: { axis: 0, direction: -1, layers: [0, 1] },
  l: { axis: 0, direction: 1, layers: [-1, 0] },
  u: { axis: 1, direction: -1, layers: [0, 1] },
  d: { axis: 1, direction: 1, layers: [-1, 0] },
  f: { axis: 2, direction: -1, layers: [0, 1] },
  b: { axis: 2, direction: 1, layers: [-1, 0] },
  M: { axis: 0, direction: 1, layers: [0] },
  E: { axis: 1, direction: 1, layers: [0] },
  S: { axis: 2, direction: -1, layers: [0] },
  x: { axis: 0, direction: -1, layers: [-1, 0, 1] },
  y: { axis: 1, direction: -1, layers: [-1, 0, 1] },
  z: { axis: 2, direction: -1, layers: [-1, 0, 1] },
};

/** permutation[i] is the facelet index that sticker i moves to. */
function quarterTurnPermutation(family: MoveFamily): number[] {
  const { axis, direction, layers } = MOVE_GEOMETRY[family];
  return STICKERS.map((sticker, index) => {
    if (!layers.includes(sticker.position[axis])) return index;
    const moved: Sticker = {
      position: rotate(sticker.position, axis, direction),
      normal: rotate(sticker.normal, axis, direction),
    };
    const destination = STICKER_INDEX.get(stickerKey(moved));
    if (destination === undefined) throw new Error(`Invalid cube geometry for ${family}`);
    return destination;
  });
}

const permutationCache = new Map<string, number[]>();

function permutationFor(move: Move): number[] {
  const key = `${move.family}${move.turns}`;
  const cached = permutationCache.get(key);
  if (cached) return cached;
  const quarter = quarterTurnPermutation(move.family);
  let permutation = quarter;
  for (let turn = 1; turn < move.turns; turn++) {
    permutation = permutation.map((destination) => quarter[destination]);
  }
  permutationCache.set(key, permutation);
  return permutation;
}

export function applyMove(facelets: string, move: Move): string {
  const permutation = permutationFor(move);
  const next = new Array<string>(54);
  for (let index = 0; index < 54; index++) next[permutation[index]] = facelets[index];
  return next.join("");
}

export function applyMoves(facelets: string, moves: readonly Move[]): string {
  return moves.reduce(applyMove, facelets);
}

/** Applies algorithm text to a state. Throws if the notation is invalid. */
export function applyAlgorithm(algorithm: string, facelets: string = SOLVED_FACELETS): string {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(parsed.error.message);
  return applyMoves(facelets, parsed.moves);
}

export function isSolved(facelets: string): boolean {
  for (let face = 0; face < 6; face++) {
    const start = face * 9;
    const color = facelets[start];
    for (let index = 1; index < 9; index++) {
      if (facelets[start + index] !== color) return false;
    }
  }
  return true;
}

export function getFace(facelets: string, face: OuterFace): string {
  const start = FACE_ORDER.indexOf(face) * 9;
  return facelets.slice(start, start + 9);
}
