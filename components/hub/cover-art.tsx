/*
 * Generative "album cover" art for Hub courses and units. Pure SVG from a
 * hue and an index, so every cover is deterministic, costs nothing to paint
 * and needs no images. Seven motifs rotate through a course (a cube face, an
 * orbit, bands, a time budget, a dot field, a fan of arcs and a staircase),
 * and each index shifts the course hue a little, so a course's units read as
 * one series rather than one cover repeated. The lit (white) element of every
 * motif stays out of the numeral's corner, and scrims sit under the numeral
 * and the label so text never fights the pattern.
 */
import { cn } from "@/lib/utils";

type Motif = "face" | "orbit" | "bands" | "budget" | "dots" | "arcs" | "steps";
const MOTIFS: Motif[] = ["face", "orbit", "bands", "budget", "dots", "arcs", "steps"];
/** Hue offsets per index: a series in the course colour, not one cover repeated. */
const HUE_SHIFT = [0, 22, -18, 38, -34, 12, -8];

const tint = (l: number, c: number, h: number, a = 1) => `oklch(${l} ${c} ${h} / ${a})`;

function MotifLayer({ motif, hue, seed }: { motif: Motif; hue: number; seed: number }) {
  const light = tint(0.86, 0.1, hue + 20);
  const mid = tint(0.68, 0.16, hue + 8);
  const deep = tint(0.36, 0.12, hue - 10);
  switch (motif) {
    case "face": {
      // A 3×3 face, tipped over and bleeding off the lower right; one sticker lit, never the top-left ones.
      const lit = [5, 7, 8][seed % 3]!;
      return (
        <g transform={`translate(72 66) rotate(${-14 + (seed % 3) * 7})`}>
          {Array.from({ length: 9 }, (_, index) => {
            const x = (index % 3) * 24 - 36;
            const y = Math.floor(index / 3) * 24 - 36;
            return (
              <rect
                key={index}
                x={x}
                y={y}
                width="21"
                height="21"
                rx="5"
                fill={index === lit ? "#fff" : index % 2 ? mid : light}
                fillOpacity={index === lit ? 0.95 : index % 2 ? 0.55 : 0.28}
              />
            );
          })}
        </g>
      );
    }
    case "orbit": {
      const angle = 0.25 + ((seed * 0.37) % 1.1);
      return (
        <g fill="none" stroke={light} strokeWidth="1.4">
          {[14, 26, 38, 50, 62, 74].map((r, index) => (
            <circle key={r} cx="86" cy="82" r={r} strokeOpacity={0.12 + index * 0.08} />
          ))}
          <circle
            cx={86 - 38 * Math.cos(angle)}
            cy={82 - 38 * Math.sin(angle)}
            r="5"
            fill="#fff"
            fillOpacity="0.9"
            stroke="none"
          />
        </g>
      );
    }
    case "bands":
      // Diagonal bands across the upper right, clear of the numeral and the label.
      return (
        <g transform="rotate(-32 70 40)">
          {[0, 1, 2, 3].map((index) => (
            <rect
              key={index}
              x="30"
              y={22 + index * 15 + (seed % 2) * 5}
              width="120"
              height={index === 1 ? 11 : 6}
              rx="3"
              fill={index === 1 ? "#fff" : index % 2 ? mid : light}
              fillOpacity={index === 1 ? 0.8 : 0.32}
            />
          ))}
        </g>
      );
    case "budget": {
      // Stacked bars like a time budget: cross, F2L, OLL, PLL.
      const widths = [
        [18, 44, 14, 16],
        [14, 50, 12, 12],
        [22, 38, 18, 14],
      ][seed % 3]!;
      let x = 10;
      return (
        <g>
          {[42, 56, 70].map((y, row) => {
            x = 10;
            return widths.map((width, index) => {
              const w = width - row * 2 + index;
              const rect = (
                <rect
                  key={`${row}-${index}`}
                  x={x}
                  y={y}
                  width={Math.max(4, w)}
                  height="9"
                  rx="4.5"
                  fill={index === 1 ? "#fff" : light}
                  fillOpacity={index === 1 ? 0.8 - row * 0.2 : 0.3}
                />
              );
              x += Math.max(4, w) + 2;
              return rect;
            });
          })}
        </g>
      );
    }
    case "dots": {
      const lit = 6 + (seed % 3) * 5;
      return (
        <g>
          <circle cx="74" cy="64" r="26" fill={deep} fillOpacity="0.5" />
          {Array.from({ length: 20 }, (_, index) => (
            <circle
              key={index}
              cx={40 + (index % 5) * 12}
              cy={38 + Math.floor(index / 5) * 12}
              r={index === lit ? 4.2 : 1.6}
              fill={index === lit ? "#fff" : light}
              fillOpacity={index === lit ? 0.95 : 0.42}
            />
          ))}
        </g>
      );
    }
    case "arcs":
      // A fan of quarter arcs opening from the lower-right corner.
      return (
        <g fill="none">
          {[18, 30, 42, 54, 66, 78].map((r, index) => (
            <path
              key={r}
              d={`M ${100 - r} 100 A ${r} ${r} 0 0 1 100 ${100 - r}`}
              stroke={index === 2 + (seed % 3) ? "#fff" : index % 2 ? mid : light}
              strokeOpacity={index === 2 + (seed % 3) ? 0.9 : 0.4}
              strokeWidth={index === 2 + (seed % 3) ? 5 : 3}
              strokeLinecap="round"
            />
          ))}
        </g>
      );
    case "steps":
      // A staircase climbing to the right, the top step lit.
      return (
        <g>
          {[0, 1, 2, 3, 4].map((step) => (
            <rect
              key={step}
              x={30 + step * 13}
              y={78 - step * 10 - (seed % 2) * 3}
              width="11"
              height={14 + step * 10}
              rx="3"
              fill={step === 4 ? "#fff" : step % 2 ? mid : light}
              fillOpacity={step === 4 ? 0.9 : 0.3 + step * 0.06}
            />
          ))}
        </g>
      );
  }
}

export function CoverArt({
  hue,
  index,
  number,
  label,
  className,
  children,
}: {
  hue: number;
  /** Picks the motif and its variation. */
  index: number;
  /** Big numeral in the corner ("01"). */
  number?: string;
  /** Tiny label along the bottom edge. */
  label?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const motif = MOTIFS[index % MOTIFS.length]!;
  const shade = hue + HUE_SHIFT[index % HUE_SHIFT.length]!;
  const id = `cover-${hue}-${index}`;
  return (
    <div
      className={cn("cover-art relative isolate overflow-hidden text-white", className)}
      style={{
        background: `radial-gradient(130% 110% at 0% 0%, ${tint(0.58, 0.17, shade)}, ${tint(0.34, 0.12, shade + 36)} 70%, ${tint(0.24, 0.08, shade + 50)})`,
      }}
    >
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        <defs>
          <radialGradient id={`${id}-sheen`} cx="0.2" cy="0.1" r="0.9">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <MotifLayer motif={motif} hue={shade} seed={index} />
        <rect width="100" height="100" fill={`url(#${id}-sheen)`} />
      </svg>
      {number || label ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0",
            number && "bg-[radial-gradient(75%_60%_at_0%_0%,rgb(0_0_0/0.26),transparent_72%)]",
          )}
        >
          {label ? (
            <span className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(to_top,rgb(0_0_0/0.42),transparent)]" />
          ) : null}
        </span>
      ) : null}
      {number ? (
        <span className="absolute top-[7%] left-[8%] font-display text-[clamp(1.6rem,28cqi,4.6rem)] leading-none italic opacity-95 [text-shadow:0_2px_22px_rgb(0_0_0/0.35)]">
          {number}
        </span>
      ) : null}
      {label ? (
        // On a small dark pill, so a lit arc or band behind it never eats the words.
        <span className="cover-label absolute bottom-[6%] left-[6%] max-w-[88%] truncate rounded-full bg-black/35 px-2 py-[3px] text-[10.5px] leading-none font-medium tracking-[0.02em] text-white/95">
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}
