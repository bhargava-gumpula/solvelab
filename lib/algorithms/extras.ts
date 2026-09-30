"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { CaseAlgorithm } from "@/data/algorithms/types";
import { setExtraAlgorithms } from "@/lib/algorithms/catalog";

/**
 * The extra PLL, OLL, COLL and WV algorithms gathered from published lists.
 * There are thousands, so each set's are a chunk of their own, fetched only by
 * that set's page, or anywhere once someone has picked one of them.
 */
export type ExtraChunk = "pll" | "oll" | "coll" | "wv";

type Extras = Readonly<Record<string, readonly CaseAlgorithm[]>>;

const IMPORTS: Record<ExtraChunk, () => Promise<{ EXTRAS: Extras }>> = {
  pll: () => import("@/data/algorithms/sets/extras/pll"),
  oll: () => import("@/data/algorithms/sets/extras/oll"),
  coll: () => import("@/data/algorithms/sets/extras/coll"),
  wv: () => import("@/data/algorithms/sets/extras/wv"),
};

export const ALL_EXTRA_CHUNKS: readonly ExtraChunk[] = ["pll", "oll", "coll", "wv"];

/** Which extras a set's page needs: its own, or those of the cases it stands for. */
export const EXTRA_CHUNKS_FOR_SET: Readonly<Record<string, readonly ExtraChunk[]>> = {
  pll: ["pll"],
  "two-look-pll": ["pll"],
  zbll: ["pll"],
  oll: ["oll"],
  "two-look-oll": ["oll"],
  coll: ["coll"],
  "winter-variation": ["wv"],
};

/** The chunk a set's extras are in, for counting them. */
export const EXTRA_CHUNK_OF_SET: Readonly<Record<string, ExtraChunk>> = {
  pll: "pll",
  oll: "oll",
  coll: "coll",
  "winter-variation": "wv",
};

let merged: Extras = {};
let version = 0;
const loading = new Map<ExtraChunk, Promise<void>>();
const listeners = new Set<() => void>();

export function loadExtraAlgorithms(chunks: readonly ExtraChunk[]): Promise<void> {
  return Promise.all(
    chunks.map((chunk) => {
      let pending = loading.get(chunk);
      if (!pending) {
        pending = IMPORTS[chunk]()
          .then(({ EXTRAS }) => {
            merged = { ...merged, ...EXTRAS };
            setExtraAlgorithms(merged);
            version++;
            for (const listener of listeners) listener();
          })
          .catch(() => {
            // Offline or a failed chunk: the bank's own algorithms still work.
            loading.delete(chunk);
          });
        loading.set(chunk, pending);
      }
      return pending;
    }),
  ).then(() => undefined);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Loads these chunks and re-renders as each arrives. */
export function useExtraAlgorithms(chunks: readonly ExtraChunk[]): number {
  const key = chunks.join(",");
  useEffect(() => {
    if (key) void loadExtraAlgorithms(key.split(",") as ExtraChunk[]);
  }, [key]);
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
}
