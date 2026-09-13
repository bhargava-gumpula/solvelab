"use client";

import { useMemo } from "react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { Cube3D } from "@/components/cube/cube-3d";
import { CubeNet } from "@/components/cube/cube-net";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import { cn } from "@/lib/utils";

export function useScrambledFacelets(scramble: string | undefined): string | null {
  return useMemo(() => {
    if (!scramble) return null;
    try {
      return applyAlgorithm(scramble);
    } catch {
      return null;
    }
  }, [scramble]);
}

export function CubeModeToggle() {
  const { preferences, update } = useAppearance();
  return (
    <div
      role="group"
      aria-label="Preview style"
      className="flex rounded-full bg-muted p-0.5 text-[11px]"
    >
      {(["3d", "2d"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={preferences.cubePreview === mode}
          onClick={() => update({ cubePreview: mode })}
          className={cn(
            "rounded-full px-2 py-0.5 uppercase transition-colors",
            preferences.cubePreview === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

export function CubePreviewBody({ facelets }: { facelets: string | null }) {
  const { preferences } = useAppearance();
  if (!facelets)
    return (
      <div className="grid h-40 place-items-center text-xs text-muted-foreground">
        Waiting for a scramble…
      </div>
    );
  return (
    <div className="grid place-items-center p-2">
      {preferences.cubePreview === "2d" ? (
        <CubeNet facelets={facelets} className="w-full max-w-60" />
      ) : (
        <Cube3D facelets={facelets} size={96} />
      )}
    </div>
  );
}
