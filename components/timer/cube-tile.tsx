"use client";

/*
 * The scrambled cube staged like a product shot: it floats over a soft
 * contact shadow on a lit paper sweep. Drag to turn it (three.js scene in
 * components/cube/cube-3d.tsx); 3D / 2D toggle in the corner.
 */
import { useAppearance } from "@/components/appearance/appearance-provider";
import { Cube3D } from "@/components/cube/cube-3d";
import { CubeNet } from "@/components/cube/cube-net";
import { cn } from "@/lib/utils";
import { BentoTile } from "./bento";
import { CubeModeToggle } from "./cube-preview";

export function CubeTile({
  facelets,
  size,
  inline = false,
  className,
  style,
}: {
  facelets: string | null;
  /** Approximate cube width in px. */
  size: number;
  /** Title beside the cube instead of above it (a short top row on desktops). */
  inline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { preferences } = useAppearance();
  const preview = !facelets ? (
    <p className="px-3 py-4 text-xs text-muted-foreground">Waiting for a scramble…</p>
  ) : preferences.cubePreview === "2d" ? (
    <CubeNet
      facelets={facelets}
      className={cn("h-auto", inline ? "w-[8.5rem] py-2" : "w-full max-w-[11rem] px-3 pb-3")}
    />
  ) : (
    <div data-fx className="cube-float">
      <Cube3D facelets={facelets} size={size} />
    </div>
  );

  if (inline) {
    return (
      <BentoTile
        order={1}
        className={cn("overflow-hidden", className)}
        style={style}
        bodyClassName="relative flex h-full items-center justify-between gap-2 py-1 pr-3 pl-4"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(55%_60%_at_60%_78%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]"
        />
        <div className="relative flex flex-col items-start gap-2 self-stretch py-3">
          <h2 className="text-[12px] leading-snug font-medium text-muted-foreground">
            Scramble preview
          </h2>
          <p className="font-display text-[13px] leading-tight text-muted-foreground italic">
            Drag to turn
          </p>
          <div className="mt-auto">
            <CubeModeToggle />
          </div>
        </div>
        <div className="relative grid place-items-center">{preview}</div>
      </BentoTile>
    );
  }

  return (
    <BentoTile
      order={1}
      title="Scramble preview"
      actions={<CubeModeToggle />}
      className={cn("overflow-hidden", className)}
      style={style}
      bodyClassName="relative grid place-items-center"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 bottom-0 h-2/3 rounded-t-[50%] bg-[radial-gradient(60%_80%_at_50%_100%,color-mix(in_oklab,var(--primary)_9%,transparent),transparent)]"
      />
      <div className="relative -mt-1 pb-1">{preview}</div>
    </BentoTile>
  );
}

/** The cube beside the scramble headline, like a sticker on a magazine cover. */
export function CubeSticker({ facelets, size }: { facelets: string | null; size: number }) {
  const { preferences } = useAppearance();
  return (
    <div
      role="group"
      className="relative flex flex-col items-center gap-1.5"
      aria-label="Scramble preview"
      data-reveal-scope="cube"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[-18%] bottom-3 h-2/3 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--foreground)_6%,transparent),transparent)]"
      />
      <div className="relative grid place-items-center" style={{ minHeight: size * 0.92 }}>
        {!facelets ? (
          <span className="size-10 rounded-xl bg-foreground/[0.05]" />
        ) : preferences.cubePreview === "2d" ? (
          <div style={{ width: size * 1.6 }}>
            <CubeNet facelets={facelets} />
          </div>
        ) : (
          <div data-fx className="cube-float">
            <Cube3D facelets={facelets} size={size} />
          </div>
        )}
      </div>
      <div data-reveal="cube">
        <CubeModeToggle />
      </div>
    </div>
  );
}
