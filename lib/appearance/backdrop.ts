/**
 * Draft: the swirl backgrounds to compare, chosen with ?bg= (remembered).
 * Each one is a Paper shader (Apache-2.0) fed the theme's swirl tints; none
 * of them reacts to the pointer.
 *
 *   drift — Paper Swirl: two broad, soft bands turning around a centre off
 *           the top left, so the digits sit in the calm outer arm.
 *   silk  — Paper MeshGradient with its swirl turned up: four tints folding
 *           into each other like slow silk.
 *   eddy  — Paper Warp, stripes warped into soft eddies drifting sideways.
 *           The owner's pick (2026-09-30), sped up 12x (from 0.24) so the drift is easy to see.
 */
export type BackdropVariant = "drift" | "silk" | "eddy";

export const BACKDROP_VARIANTS: { id: BackdropVariant; label: string }[] = [
  { id: "eddy", label: "Eddy" },
  { id: "silk", label: "Silk" },
  { id: "drift", label: "Drift" },
];

export const DEFAULT_BACKDROP: BackdropVariant = "eddy";

export function isBackdropVariant(value: string | null | undefined): value is BackdropVariant {
  return value === "drift" || value === "silk" || value === "eddy";
}

/** At most DPR 2, and never more than this many backing pixels. */
export const BACKDROP_MAX_PIXELS = 1280 * 800;

export function backdropPixelCap(width: number, height: number): number {
  return Math.min(BACKDROP_MAX_PIXELS, Math.round(width * height * 4));
}
