"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}

/**
 * Label · value · optional context. Pattern adapted from the 21st.dev stats
 * card collection; values use the sans face at display size.
 */
export function StatTile({ label, value, detail, className }: StatTileProps) {
  return (
    <div className={cn("relative rounded-2xl px-4 py-3.5 glass", className)}>
      <GlowingEffect spread={24} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
