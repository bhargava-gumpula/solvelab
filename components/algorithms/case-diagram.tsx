import { caseArrows, type PieceArrow } from "@/lib/cube/case-arrows";
import { CASE_KINDS, pairStickers, type CaseKind } from "@/lib/cube/case-check";
import { getFace } from "@/lib/cube/cube-state";
import { FRONT_RIGHT_SLOT, SIDE_STRIPS, TOP_EDGES, stickerOn } from "@/lib/cube/pieces";
import { cn } from "@/lib/utils";

/**
 * The last layer seen from above, with the strip of side stickers around it —
 * the view people recognise a case from.
 *
 * Both views come from the same cube state. For an orientation case the top
 * shows which stickers already face up; for a permutation case the top is all
 * one colour and the side strips show where the pieces belong.
 */
export function CaseDiagram({
  facelets,
  kind,
  className,
  title,
}: {
  facelets: string;
  kind: CaseKind;
  className?: string;
  title?: string;
}) {
  const up = getFace(facelets, "U");
  const { slotCase, arrows: arrowPieces } = CASE_KINDS[kind];
  // The pair a slot case is about; everything else around it is noise.
  const pair = slotCase ? new Set(pairStickers(facelets)) : new Set<number>();

  const cell = 16;
  const gap = 2;
  const strip = 6;
  const board = cell * 3 + gap * 2;
  const size = board + (strip + gap) * 2;

  // For a pair case, the slot itself matters as much as the top: two stickers of
  // the front face and two of the right face, seen edge on.
  const slot = slotCase
    ? {
        front: [SLOT_EDGE, SLOT_CORNER].map((piece) => facelets[piece.front]!),
        right: [SLOT_EDGE, SLOT_CORNER].map((piece) => facelets[piece.right]!),
      }
    : null;
  const height = slot ? size + strip * 2 + gap * 2 : size;

  // Cases that move pieces get arrows showing where each one goes. COLL only
  // places the corners, so its edges get none.
  const arrows =
    arrowPieces === "none" ? [] : caseArrows(facelets, { edges: arrowPieces === "all" });
  const centre = (index: number) => ({
    x: strip + gap + (index % 3) * (cell + gap) + cell / 2,
    y: strip + gap + Math.floor(index / 3) * (cell + gap) + cell / 2,
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${height}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={title ?? "The case seen from above"}
    >
      {[0, 1, 2].map((column) =>
        [0, 1, 2].map((row) => (
          <rect
            key={`u${column}${row}`}
            x={strip + gap + column * (cell + gap)}
            y={strip + gap + row * (cell + gap)}
            width={cell}
            height={cell}
            rx={3}
            fill={stickerColour(row * 3 + column, up[row * 3 + column]!, kind, pair)}
            stroke="var(--cube-stroke)"
            strokeWidth={0.75}
          />
        )),
      )}
      {[0, 1, 2].map((index) => {
        const offset = strip + gap + index * (cell + gap);
        return (
          <g key={`s${index}`}>
            <rect
              x={offset}
              y={0}
              width={cell}
              height={strip}
              rx={1.5}
              fill={stickerColour(
                SIDE_STRIPS.B[index]!,
                facelets[SIDE_STRIPS.B[index]!]!,
                kind,
                pair,
              )}
            />
            <rect
              x={offset}
              y={size - strip}
              width={cell}
              height={strip}
              rx={1.5}
              fill={stickerColour(
                SIDE_STRIPS.F[index]!,
                facelets[SIDE_STRIPS.F[index]!]!,
                kind,
                pair,
              )}
            />
            <rect
              x={0}
              y={offset}
              width={strip}
              height={cell}
              rx={1.5}
              fill={stickerColour(
                SIDE_STRIPS.L[index]!,
                facelets[SIDE_STRIPS.L[index]!]!,
                kind,
                pair,
              )}
            />
            <rect
              x={size - strip}
              y={offset}
              width={strip}
              height={cell}
              rx={1.5}
              fill={stickerColour(
                SIDE_STRIPS.R[index]!,
                facelets[SIDE_STRIPS.R[index]!]!,
                kind,
                pair,
              )}
            />
          </g>
        );
      })}
      {arrows.length ? (
        <g data-testid="case-arrows">
          <title>Arrows show where each piece goes</title>
          {arrows.map((arrow) => (
            <Arrow
              key={`${arrow.piece}${arrow.from}-${arrow.to}`}
              arrow={arrow}
              from={centre(arrow.from)}
              to={centre(arrow.to)}
            />
          ))}
        </g>
      ) : null}
      {slot ? (
        <g>
          <title>The front-right slot</title>
          {slot.front.map((sticker, index) => (
            <rect
              key={`sf${index}`}
              x={size - strip - cell * 2 - gap}
              y={size + gap + index * (strip + gap)}
              width={cell}
              height={strip}
              rx={1.5}
              fill={faceColour(sticker)}
              opacity={0.95}
            />
          ))}
          {slot.right.map((sticker, index) => (
            <rect
              key={`sr${index}`}
              x={size - strip - cell}
              y={size + gap + index * (strip + gap)}
              width={cell}
              height={strip}
              rx={1.5}
              fill={faceColour(sticker)}
              opacity={0.95}
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
}

interface Point {
  x: number;
  y: number;
}

/** How far an arrow stops short of a sticker's centre, and its head's size. */
const ARROW_INSET = 4.5;
const HEAD_LENGTH = 4.2;
const HEAD_WIDTH = 4.2;

/**
 * One arrow between two stickers: dark, with a light edge so it reads on
 * yellow and on the darker side colours alike. A swap gets a head at each end.
 */
function Arrow({ arrow, from, to }: { arrow: PieceArrow; from: Point; to: Point }) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const ux = (to.x - from.x) / length;
  const uy = (to.y - from.y) / length;
  /** A point `distance` along the arrow's direction from `point`. */
  const along = (point: Point, distance: number) => ({
    x: point.x + ux * distance,
    y: point.y + uy * distance,
  });
  const start = along(from, ARROW_INSET);
  const end = along(to, -ARROW_INSET);
  // The shaft stops where each head begins, so no line pokes through a tip.
  const shaftStart = arrow.swap ? along(start, HEAD_LENGTH * 0.8) : start;
  const shaftEnd = along(end, -HEAD_LENGTH * 0.8);

  const head = (tip: Point, dirX: number, dirY: number) => {
    const baseX = tip.x - dirX * HEAD_LENGTH;
    const baseY = tip.y - dirY * HEAD_LENGTH;
    const px = -dirY * (HEAD_WIDTH / 2);
    const py = dirX * (HEAD_WIDTH / 2);
    return `${tip.x},${tip.y} ${baseX + px},${baseY + py} ${baseX - px},${baseY - py}`;
  };

  return (
    <g data-piece={arrow.piece} data-swap={arrow.swap || undefined}>
      {/* A light edge under a dark shaft, so it reads on any sticker. */}
      {(
        [
          ["var(--cube-arrow-edge)", 3],
          ["var(--cube-arrow)", 1.3],
        ] as const
      ).map(([stroke, width]) => (
        <line
          key={stroke}
          x1={shaftStart.x}
          y1={shaftStart.y}
          x2={shaftEnd.x}
          y2={shaftEnd.y}
          stroke={stroke}
          strokeWidth={width}
          strokeLinecap="round"
        />
      ))}
      {[head(end, ux, uy), ...(arrow.swap ? [head(start, -ux, -uy)] : [])].map((points) => (
        <polygon
          key={points}
          points={points}
          fill="var(--cube-arrow)"
          stroke="var(--cube-arrow-edge)"
          strokeWidth={0.8}
          strokeLinejoin="round"
          paintOrder="stroke"
        />
      ))}
    </g>
  );
}

/** The front-right slot's edge and corner, by the sticker each shows on the front and right. */
const SLOT_EDGE = {
  front: stickerOn(FRONT_RIGHT_SLOT.edge, "F")!,
  right: stickerOn(FRONT_RIGHT_SLOT.edge, "R")!,
};
const SLOT_CORNER = {
  front: stickerOn(FRONT_RIGHT_SLOT.corner, "F")!,
  right: stickerOn(FRONT_RIGHT_SLOT.corner, "R")!,
};

/** The last layer's edge stickers on top, plus its centre. */
const TOP_EDGE_STICKERS = new Set([4, ...TOP_EDGES.map((edge) => edge[0])]);
/** The middle sticker of each side's top row: the last layer's edges, seen edge on. */
const SIDE_EDGE_STICKERS = new Set(TOP_EDGES.map((edge) => edge[1]));

/** A colour the case doesn't pin down: on the cube it could be any of them. */
const ANY = "var(--cube-unsolved)";

/**
 * What colour a sticker should be drawn.
 *
 * A picture should only claim what the case actually fixes. An orientation case
 * says nothing about where the pieces go, so its side colours could be anything
 * and are left grey; a permutation case is read from exactly those colours, so
 * they are drawn. Between the two, COLL pins the corners down but lets the
 * edges sit anywhere, and a pair case pins down the pair alone.
 */
function stickerColour(
  index: number,
  sticker: string,
  kind: CaseKind,
  pair: ReadonlySet<number>,
): string {
  const facingUp = sticker === "U";
  const isEdge = TOP_EDGE_STICKERS.has(index) || SIDE_EDGE_STICKERS.has(index);

  switch (kind) {
    case "f2l":
      // Only the pair is the case; the last layer above it is still scrambled.
      return pair.has(index) ? faceColour(sticker) : ANY;
    case "wv":
      // The pair's colours are the case; the corners above it only have to come up.
      return pair.has(index) ? faceColour(sticker) : facingUp ? faceColour("U") : ANY;
    case "oll":
      // Which stickers face up, and nothing else.
      return facingUp ? faceColour("U") : ANY;
    case "eoll":
      // Only the edges are being oriented; the corners are the next step's problem.
      return isEdge && facingUp ? faceColour("U") : ANY;
    case "coll":
      // The corners have to land home the right way up; the edges may sit anywhere.
      return isEdge ? (facingUp ? faceColour("U") : ANY) : faceColour(sticker);
    default:
      // A permutation case: every colour on show is part of it.
      return faceColour(sticker);
  }
}

/*
 * Cubers solve with the cross on the bottom, so the last layer they are looking
 * at is the yellow one. The engine calls that face U, and these pictures follow
 * the hands rather than the engine: up is yellow, down is white.
 */
function faceColour(sticker: string): string {
  switch (sticker) {
    case "U":
      return "var(--cube-d)";
    case "F":
      return "var(--cube-f)";
    case "R":
      return "var(--cube-r)";
    case "B":
      return "var(--cube-b)";
    case "L":
      return "var(--cube-l)";
    default:
      return "var(--cube-u)";
  }
}
