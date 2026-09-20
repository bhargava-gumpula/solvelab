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
  // In a pair case only the pair matters; the last layer around it is noise.
  // A pair case is only about the pair; Winter Variation also shows the
  // corners it is about to bring up, so nothing is greyed there.
  const pair = kind === "f2l" ? new Set(pairStickers(facelets)) : null;
  // Top rows of the sides, read left to right as seen from above, with the
  // facelet each one comes from so the pair can be picked out.
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

  // An orientation case cares only about what faces up; a permutation case is
  // read from the colours around the side.
  const topColour = (sticker: string, index: number) =>
    kind === "oll"
      ? sticker === "U"
        ? "var(--cube-u)"
        : "var(--cube-unsolved)"
      : pair && !pair.has(index)
        ? "var(--cube-unsolved)"
        : faceColour(sticker);

  const sideColour = (sticker: string, index: number) => {
    if (kind === "oll") return sticker === "U" ? faceColour(sticker) : "var(--cube-unsolved)";
    if (pair && !pair.has(index)) return "var(--cube-unsolved)";
    return faceColour(sticker);
  };

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
            fill={topColour(up[row * 3 + column]!, row * 3 + column)}
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
              fill={sideColour(facelets[strips.B[index]!]!, strips.B[index]!)}
            />
            <rect
              x={offset}
              y={size - strip}
              width={cell}
              height={strip}
              rx={1.5}
              fill={sideColour(facelets[strips.F[index]!]!, strips.F[index]!)}
            />
            <rect
              x={0}
              y={offset}
              width={strip}
              height={cell}
              rx={1.5}
              fill={sideColour(facelets[strips.L[2 - index]!]!, strips.L[2 - index]!)}
            />
            <rect
              x={size - strip}
              y={offset}
              width={strip}
              height={cell}
              rx={1.5}
              fill={sideColour(facelets[strips.R[2 - index]!]!, strips.R[2 - index]!)}
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

function faceColour(sticker: string): string {
  switch (sticker) {
    case "U":
      return "var(--cube-u)";
    case "F":
      return "var(--cube-f)";
    case "R":
      return "var(--cube-r)";
    case "B":
      return "var(--cube-b)";
    case "L":
      return "var(--cube-l)";
    default:
      return "var(--cube-d)";
  }
}
