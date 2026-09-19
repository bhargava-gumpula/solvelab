/**
 * CFOP stage checks on a 3×3 facelet string (URFDLB, nine stickers per face).
 *
 * Cross and F2L are the D layer (yellow in the default color scheme); last
 * layer is U. Centers define the colors, so whole-cube rotations are allowed
 * as long as relative stickers still match.
 */

const U = 0;
const R = 9;
const F = 18;
const D = 27;
const L = 36;
const B = 45;

function faceUniform(facelets: string, start: number): boolean {
  const color = facelets[start + 4];
  for (let index = 0; index < 9; index++) {
    if (facelets[start + index] !== color) return false;
  }
  return true;
}

function allMatch(facelets: string, indices: readonly number[], color: string): boolean {
  return indices.every((index) => facelets[index] === color);
}

/** Four D-face cross edges, in place and oriented to their side centers. */
export function hasCrossSolved(facelets: string): boolean {
  const d = facelets[D + 4];
  const f = facelets[F + 4];
  const r = facelets[R + 4];
  const l = facelets[L + 4];
  const b = facelets[B + 4];
  return (
    facelets[D + 1] === d &&
    facelets[F + 7] === f &&
    facelets[D + 5] === d &&
    facelets[R + 7] === r &&
    facelets[D + 7] === d &&
    facelets[B + 7] === b &&
    facelets[D + 3] === d &&
    facelets[L + 7] === l
  );
}

/** First two layers: D face plus the E-slice edges, matching side centers. */
export function hasF2lSolved(facelets: string): boolean {
  if (!hasCrossSolved(facelets) || !faceUniform(facelets, D)) return false;
  const f = facelets[F + 4];
  const r = facelets[R + 4];
  const l = facelets[L + 4];
  const b = facelets[B + 4];
  return (
    allMatch(facelets, [F + 3, F + 5, F + 6, F + 7, F + 8], f) &&
    allMatch(facelets, [R + 3, R + 5, R + 6, R + 7, R + 8], r) &&
    allMatch(facelets, [L + 3, L + 5, L + 6, L + 7, L + 8], l) &&
    allMatch(facelets, [B + 3, B + 5, B + 6, B + 7, B + 8], b)
  );
}

/** F2L plus last-layer orientation (the U face is a solid color). */
export function hasOllSolved(facelets: string): boolean {
  return hasF2lSolved(facelets) && faceUniform(facelets, U);
}

/** Each F2L slot's stickers as [edge a, edge b, corner a, corner b, corner D]. */
const F2L_SLOT_STICKERS: readonly (readonly number[])[] = [
  [F + 5, R + 3, F + 8, R + 6, D + 2], // front-right
  [F + 3, L + 5, F + 6, L + 8, D + 0], // front-left
  [L + 3, B + 5, L + 6, B + 8, D + 6], // back-left
  [B + 3, R + 5, B + 6, R + 8, D + 8], // back-right
];

/** Number of solved F2L slots (0–4), assuming the cross is on D. */
export function solvedF2lSlots(facelets: string): number {
  const centerOf = (index: number) => facelets[Math.floor(index / 9) * 9 + 4];
  return F2L_SLOT_STICKERS.filter((stickers) =>
    stickers.every((index) => facelets[index] === centerOf(index)),
  ).length;
}
