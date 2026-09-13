import { FACE_ORDER, getFace } from "@/lib/cube/cube-state";
import type { OuterFace } from "@/lib/cube/notation";
import { cn } from "@/lib/utils";

const STICKER = 10;
const GAP = 1.2;
const FACE_GAP = 3;
const FACE_SIZE = STICKER * 3 + GAP * 2;

/** Unfolded layout: U on top, L F R B across the middle, D below. */
const NET_POSITION: Record<OuterFace, [column: number, row: number]> = {
  U: [1, 0],
  L: [0, 1],
  F: [1, 1],
  R: [2, 1],
  B: [3, 1],
  D: [1, 2],
};

const COLOR_VARIABLE: Record<OuterFace, string> = {
  U: "var(--cube-u)",
  D: "var(--cube-d)",
  F: "var(--cube-f)",
  B: "var(--cube-b)",
  R: "var(--cube-r)",
  L: "var(--cube-l)",
};

interface CubeNetProps {
  facelets: string;
  className?: string;
  title?: string;
}

/** Renders a cube state (URFDLB facelets) as a flat net. Pure presentation. */
export function CubeNet({ facelets, className, title = "Scrambled cube preview" }: CubeNetProps) {
  const width = FACE_SIZE * 4 + FACE_GAP * 3;
  const height = FACE_SIZE * 3 + FACE_GAP * 2;
  return (
    <svg
      viewBox={`-1 -1 ${width + 2} ${height + 2}`}
      role="img"
      aria-label={title}
      className={cn("h-auto w-full", className)}
    >
      {FACE_ORDER.map((face) => {
        const [column, row] = NET_POSITION[face];
        const originX = column * (FACE_SIZE + FACE_GAP);
        const originY = row * (FACE_SIZE + FACE_GAP);
        return Array.from(getFace(facelets, face)).map((color, index) => (
          <rect
            key={`${face}${index}`}
            x={originX + (index % 3) * (STICKER + GAP)}
            y={originY + Math.floor(index / 3) * (STICKER + GAP)}
            width={STICKER}
            height={STICKER}
            rx={1.6}
            fill={COLOR_VARIABLE[color as OuterFace]}
            stroke="var(--cube-stroke)"
            strokeOpacity={0.35}
            strokeWidth={0.5}
          />
        ));
      })}
    </svg>
  );
}
