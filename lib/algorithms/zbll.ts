import type { AlgorithmSetData } from "@/data/algorithms/types";

export const ZBLL_SET_ID = "zbll";

/**
 * ZBLL is several hundred kilobytes of algorithms, so it is its own chunk,
 * fetched only when the set is opened. Nothing else imports the data.
 */
let loading: Promise<AlgorithmSetData> | null = null;

export function loadZbll(): Promise<AlgorithmSetData> {
  loading ??= import("@/data/algorithms/sets/zbll-data").then((module) => module.zbll);
  return loading;
}

/** How many algorithms the case dialog shows before "More algorithms". */
export const ZBLL_SHOWN = 1;
