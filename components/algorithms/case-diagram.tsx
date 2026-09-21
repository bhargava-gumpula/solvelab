import { pairStickers, type CaseKind } from "@/lib/cube/case-check";
import { getFace } from "@/lib/cube/cube-state";
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
  // The pair a slot case is about; everything else around it is noise.
  const pair =
    kind === "f2l" || kind === "wv" ? new Set(pairStickers(facelets)) : new Set<number>();
  // Top rows of the sides, read left to right as seen from above, with the
  // facelet each one comes from so each sticker can be judged on its own.
  const strips = {
    B: [47, 46, 45],
    L: [36, 37, 38],
    R: [11, 10, 9],
    F: [18, 19, 20],
  } as const;

  const cell = 16;
  const gap = 2;
  const strip = 6;
  const board = cell * 3 + gap * 2;
  const size = board + (strip + gap) * 2;

  // For a pair case, the slot itself matters as much as the top: two stickers of
  // the front face and two of the right face, seen edge on.
  const slot =
    kind === "f2l" || kind === "wv"
      ? {
          front: [facelets[23]!, facelets[26]!],
          right: [facelets[12]!, facelets[15]!],
        }
      : null;
  const height = slot ? size + strip * 2 + gap * 2 : size;

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
              fill={stickerColour(strips.B[index]!, facelets[strips.B[index]!]!, kind, pair)}
            />
            <rect
              x={offset}
              y={size - strip}
              width={cell}
              height={strip}
              rx={1.5}
              fill={stickerColour(strips.F[index]!, facelets[strips.F[index]!]!, kind, pair)}
            />
            <rect
              x={0}
              y={offset}
              width={strip}
              height={cell}
              rx={1.5}
              fill={stickerColour(
                strips.L[2 - index]!,
                facelets[strips.L[2 - index]!]!,
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
                strips.R[2 - index]!,
                facelets[strips.R[2 - index]!]!,
                kind,
                pair,
              )}
            />
          </g>
        );
      })}
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

/** The last layer's edge stickers on top, plus its centre, in facelet numbers. */
const TOP_EDGES = new Set([1, 3, 4, 5, 7]);
/** The middle sticker of each side's top row: the last layer's edges, seen edge on. */
const SIDE_EDGES = new Set([10, 19, 37, 46]);

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
  const isEdge = TOP_EDGES.has(index) || SIDE_EDGES.has(index);

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
