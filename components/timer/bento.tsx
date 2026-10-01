"use client";

/*
 * Bento building blocks for the Studio timer page: a tile with a quiet label
 * that blurs in on first view and recedes while a solve is timed.
 */
import { useSyncExternalStore } from "react";
import { Tile } from "@/components/fx/tile";
import { cn } from "@/lib/utils";

interface BentoTileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  /** Small trailing text after the title (count, unit). */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  /** Entrance order for the stagger. */
  order?: number;
  bodyClassName?: string;
  /** A panel inside another surface (the insight strip): no tile, no own entrance. */
  bare?: boolean;
}

/** The quiet tile label: sentence case, muted, no tracking (Round 2). */
export const TILE_LABEL = "text-[13px] font-medium text-foreground/70";

export function BentoTile({
  title,
  meta,
  actions,
  order = 0,
  bare = false,
  className,
  bodyClassName,
  style,
  children,
  ...props
}: BentoTileProps) {
  const content = (
    <>
      {title || actions ? (
        <header className="flex min-h-10 shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-1 lg:px-5">
          {title ? (
            <h2 className={cn("flex min-w-0 items-baseline gap-2 truncate", TILE_LABEL)}>
              {title}
              {meta ? (
                <span className="font-figures text-[12px] text-foreground/55">{meta}</span>
              ) : null}
            </h2>
          ) : (
            <span />
          )}
          {actions}
        </header>
      ) : null}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </>
  );
  if (bare) {
    return (
      <section className={cn("flex min-h-0 min-w-0 flex-col", className)} style={style} {...props}>
        {content}
      </section>
    );
  }
  return (
    <Tile
      data-bento-fade
      data-focus-hide
      className={cn("bento-in flex min-h-0 flex-col", className)}
      style={{ "--d": order, ...style } as React.CSSProperties}
      {...props}
    >
      {content}
    </Tile>
  );
}

const SQUIRCLE = "(corner-shape: squircle)";

function subscribeNothing() {
  return () => {};
}

/** The tile corner radius in px, matching `.tile` (squircles use a larger radius). */
export function useTileRadius(): number {
  const squircle = useSyncExternalStore(
    subscribeNothing,
    () => typeof CSS !== "undefined" && CSS.supports(SQUIRCLE),
    () => false,
  );
  return squircle ? 41 : 25.6;
}
