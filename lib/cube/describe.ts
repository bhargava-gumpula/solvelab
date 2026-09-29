/**
 * Reading a case off the cube, so text about it can be worked out or checked
 * rather than written by hand.
 *
 * States are engine facelets in the solving hold: D is the white cross side,
 * U the yellow last layer, F green (SOLVING_VIEW). Every function reads the
 * case as it stands, with no set-up turn.
 */
import { SOLVING_VIEW } from "@/lib/config/cube";
import { CORNER_SPOTS, EDGE_SPOTS, SIDE_STRIPS, faceOf } from "./pieces";

export type Side = "front" | "right" | "back" | "left";
export type TopCorner = "front-left" | "front-right" | "back-left" | "back-right";

const SIDE_FACE: Record<Side, "F" | "R" | "B" | "L"> = {
  front: "F",
  right: "R",
  back: "B",
  left: "L",
};

/** The last layer's top stickers: each edge and corner, by where it sits. */
const TOP_EDGE_SQUARE: Record<Side, number> = { back: 1, left: 3, right: 5, front: 7 };
const TOP_CORNER_SQUARE: Record<TopCorner, number> = {
  "back-left": 0,
  "back-right": 2,
  "front-left": 6,
  "front-right": 8,
};

/** Which last-layer edges show the top colour on top. */
export function edgesFacingUp(state: string): Side[] {
  return (Object.keys(TOP_EDGE_SQUARE) as Side[]).filter(
    (side) => state[TOP_EDGE_SQUARE[side]] === "U",
  );
}

/** Which last-layer corners show the top colour on top. */
export function cornersFacingUp(state: string): TopCorner[] {
  return (Object.keys(TOP_CORNER_SQUARE) as TopCorner[]).filter(
    (corner) => state[TOP_CORNER_SQUARE[corner]] === "U",
  );
}

/** For a corner whose top colour isn't on top: the side it points to. */
export function topColourFacing(state: string, corner: TopCorner): Side | "up" {
  const spot = CORNER_SPOTS.find((piece) => piece[0] === TOP_CORNER_SQUARE[corner])!;
  const sticker = spot.find((index) => state[index] === "U");
  if (sticker === undefined) throw new Error(`${corner} holds no last-layer corner`);
  return faceName(faceOf(sticker)) as Side | "up";
}

/** The three top-row stickers of a side, left to right as seen from above. */
export function sideRow(state: string, side: Side): string {
  return SIDE_STRIPS[SIDE_FACE[side]].map((index) => state[index]!).join("");
}

/** How many of a side's top-row stickers show the top colour (OLL pictures). */
export function topColourOnSide(state: string, side: Side): number {
  return [...sideRow(state, side)].filter((sticker) => sticker === "U").length;
}

/** A solved row of three on this side (PLL). */
export function hasBar(state: string, side: Side): boolean {
  const [a, b, c] = sideRow(state, side);
  return a === b && b === c;
}

/** Matching corner stickers on this side with a different edge between (PLL). */
export function hasHeadlights(state: string, side: Side): boolean {
  const [a, b, c] = sideRow(state, side);
  return a === c && b !== a;
}

/** A corner and edge that match on this side, without the whole row matching (PLL). */
export function hasBlock(state: string, side: Side): boolean {
  const [a, b, c] = sideRow(state, side);
  return (a === b || b === c) && !(a === b && b === c);
}

/** The sides that show headlights. */
export function headlightSides(state: string): Side[] {
  return (Object.keys(SIDE_FACE) as Side[]).filter((side) => hasHeadlights(state, side));
}

const FACE_NAME: Record<string, string> = {
  U: "up",
  D: "down",
  F: "front",
  B: "back",
  R: "right",
  L: "left",
};

function faceName(face: string): string {
  return FACE_NAME[face]!;
}

/** "towards you", "up", "to the right" … for the way a sticker faces. */
function facingWords(face: string): string {
  switch (face) {
    case "U":
      return "up";
    case "D":
      return "down";
    case "F":
      return "towards you";
    case "B":
      return "to the back";
    default:
      return `to the ${faceName(face)}`;
  }
}

/** The front-right pair: the white-green-orange corner and the green-orange edge. */
function pairPieces(state: string) {
  const corner = CORNER_SPOTS.find((spot) =>
    ["D", "F", "R"].every((colour) => spot.some((index) => state[index] === colour)),
  );
  const edge = EDGE_SPOTS.find((spot) =>
    ["F", "R"].every((colour) => spot.some((index) => state[index] === colour)),
  );
  if (!corner || !edge) throw new Error("No front-right pair in this state");
  return { corner, edge };
}

export interface F2lPairReading {
  /** Where the corner sits: a top corner, or "slot" when it is in the front-right slot. */
  corner: TopCorner | "slot";
  /** Which way the corner's white (bottom-colour) sticker faces. */
  white: Side | "up" | "down";
  /** Where the edge sits: a top edge, or "slot". */
  edge: Side | "slot";
  /** Which way the edge's green (front-colour) sticker faces. */
  green: Side | "up";
}

/** Where the front-right pair's corner and edge are, and which way they face. */
export function readF2lPair(state: string): F2lPairReading {
  const { corner, edge } = pairPieces(state);
  const cornerFaces = corner.map(faceOf);
  const edgeFaces = edge.map(faceOf);
  const whiteSticker = corner.find((index) => state[index] === "D")!;
  const greenSticker = edge.find((index) => state[index] === "F")!;
  const cornerAt: F2lPairReading["corner"] = cornerFaces.includes("D")
    ? "slot"
    : (`${cornerFaces.includes("F") ? "front" : "back"}-${
        cornerFaces.includes("R") ? "right" : "left"
      }` as TopCorner);
  const edgeAt: F2lPairReading["edge"] = edgeFaces.includes("U")
    ? (faceName(edgeFaces.find((face) => face !== "U")!) as Side)
    : "slot";
  return {
    corner: cornerAt,
    white: faceName(faceOf(whiteSticker)) as F2lPairReading["white"],
    edge: edgeAt,
    green: faceName(faceOf(greenSticker)) as F2lPairReading["green"],
  };
}

/**
 * What an F2L case looks like, worked out from the cube: where the pair's
 * corner and edge are, and which way the white and green stickers face.
 */
export function f2lRecognition(state: string): string {
  const { corner, edge } = pairPieces(state);
  const reading = readF2lPair(state);
  const whiteFace = faceOf(corner.find((index) => state[index] === "D")!);
  const greenFace = faceOf(edge.find((index) => state[index] === "F")!);
  const cornerWhere =
    reading.corner === "slot"
      ? "in its slot"
      : reading.corner === "front-right"
        ? "on top, right above its slot"
        : `on top at the ${reading.corner.replace("-", " ")}`;
  const edgeWhere = reading.edge === "slot" ? "in its slot" : `on top at the ${reading.edge}`;
  return `Corner ${cornerWhere}, ${SOLVING_VIEW.D} facing ${facingWords(whiteFace)}. Edge ${edgeWhere}, ${SOLVING_VIEW.F} facing ${facingWords(greenFace)}.`;
}
