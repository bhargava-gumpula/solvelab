/**
 * Where every piece's stickers sit in the 54-sticker facelet string (faces
 * U R F D L B, nine each), written down once. Everything that reads pieces
 * or draws them works from these lists, so a sticker can't end up drawn next
 * to the wrong piece.
 */

const FACES = "URFDLB";

/** The face a sticker is on. */
export function faceOf(sticker: number): string {
  return FACES[Math.floor(sticker / 9)]!;
}

/** Every corner, its U or D sticker first. The first four are the top layer. */
export const CORNER_SPOTS: readonly (readonly [number, number, number])[] = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 42, 53],
  [35, 51, 17],
];

/** Every edge; the first four are the top layer, the ninth the front-right slot's. */
export const EDGE_SPOTS: readonly (readonly [number, number])[] = [
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
 * The last layer's pieces, top sticker first, in the order a U turn moves
 * them: front → left → back → right. Shifting an index by k is k quarter turns.
 */
export const TOP_CORNERS = CORNER_SPOTS.slice(0, 4);
export const TOP_EDGES = [EDGE_SPOTS[1]!, EDGE_SPOTS[2]!, EDGE_SPOTS[3]!, EDGE_SPOTS[0]!];

/** The front-right slot: the corner and edge a pair case is about. */
export const FRONT_RIGHT_SLOT = { corner: CORNER_SPOTS[4]!, edge: EDGE_SPOTS[8]! } as const;

/** The sticker a piece shows on a face, if it has one there. */
export function stickerOn(piece: readonly number[], face: string): number | undefined {
  return piece.find((sticker) => faceOf(sticker) === face);
}

/** The top-layer piece whose top sticker is this square of the U face. */
function topPieceAt(square: number): readonly number[] {
  return [...TOP_CORNERS, ...TOP_EDGES].find((piece) => piece[0] === square)!;
}

/**
 * The top row of each side, in the order it is drawn around the U face: left
 * to right along the back and front, back to front down the left and right.
 * Worked out from the pieces, so each sticker sits against its own piece.
 */
export const SIDE_STRIPS = {
  B: [0, 1, 2].map((square) => stickerOn(topPieceAt(square), "B")!),
  F: [6, 7, 8].map((square) => stickerOn(topPieceAt(square), "F")!),
  L: [0, 3, 6].map((square) => stickerOn(topPieceAt(square), "L")!),
  R: [2, 5, 8].map((square) => stickerOn(topPieceAt(square), "R")!),
} as const;
