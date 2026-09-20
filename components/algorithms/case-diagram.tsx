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
  kind: "oll" | "pll" | "coll";
  className?: string;
  title?: string;
}) {
  const up = getFace(facelets, "U");
  // Top rows of the sides, read left to right as seen from above.
  const strips = {
    B: getFace(facelets, "B").slice(0, 3).split("").reverse().join(""),
    L: getFace(facelets, "L").slice(0, 3),
    R: getFace(facelets, "R").slice(0, 3).split("").reverse().join(""),
    F: getFace(facelets, "F").slice(0, 3),
  };

  const cell = 16;
  const gap = 2;
  const strip = 6;
  const board = cell * 3 + gap * 2;
  const size = board + (strip + gap) * 2;

  // An orientation case cares only about what faces up; a permutation case is
  // read from the colours around the side.
  const topColour = (sticker: string) =>
    kind === "oll"
      ? sticker === "U"
        ? "var(--cube-u)"
        : "var(--cube-unsolved)"
      : faceColour(sticker);

  const sideColour = (sticker: string) =>
    kind === "oll" && sticker !== "U" ? "var(--cube-unsolved)" : faceColour(sticker);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
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
            fill={topColour(up[row * 3 + column]!)}
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
              fill={sideColour(strips.B[index]!)}
            />
            <rect
              x={offset}
              y={size - strip}
              width={cell}
              height={strip}
              rx={1.5}
              fill={sideColour(strips.F[index]!)}
            />
            <rect
              x={0}
              y={offset}
              width={strip}
              height={cell}
              rx={1.5}
              fill={sideColour(strips.L[2 - index]!)}
            />
            <rect
              x={size - strip}
              y={offset}
              width={strip}
              height={cell}
              rx={1.5}
              fill={sideColour(strips.R[2 - index]!)}
            />
          </g>
        );
      })}
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
