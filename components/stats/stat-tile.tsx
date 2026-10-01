"use client";

import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  className?: string;
  /** Set the value in the display serif (headline numbers) instead of the kinetic sans. */
  tone?: "default" | "gold" | "accent";
}

/**
 * Label · value · context, set like a magazine figure. Round 2: a cell of one
 * ruled figure panel (StatFigures) rather than a card of its own.
 */
export function StatTile({ label, value, detail, className, tone = "default" }: StatTileProps) {
  return (
    <div className={cn("flex min-w-0 flex-col px-5 py-4 md:px-6 md:py-5", className)}>
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-figures text-[1.8rem] leading-none tracking-[-0.015em] md:text-[2.1rem]",
          tone === "accent" && "text-primary",
        )}
      >
        {value}
      </p>
      {detail && <p className="mt-2 truncate text-[13px] text-foreground/65">{detail}</p>}
    </div>
  );
}

/** One quiet surface holding the stat figures, ruled by hairlines (2 × n on phones, 4 × n above). */
export function StatFigures({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "tile grid grid-cols-2 overflow-hidden md:grid-cols-4",
        "[&>*]:border-[var(--hairline)] md:[&>*:not(:nth-child(4n+1))]:border-l max-md:[&>*:nth-child(even)]:border-l max-md:[&>*:nth-child(n+3)]:border-t md:[&>*:nth-child(n+5)]:border-t",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
