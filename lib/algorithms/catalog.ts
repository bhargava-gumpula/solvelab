import { oll } from "@/data/algorithms/sets/oll";
import { pll } from "@/data/algorithms/sets/pll";
import type { AlgorithmSetData, CaseAlgorithm, CaseEntry } from "@/data/algorithms/types";
import { caseStateOf } from "@/lib/cube/case-check";

/** Every set with cases behind it. Others are still to come. */
export const ALGORITHM_SETS: AlgorithmSetData[] = [pll, oll];

export function getAlgorithmSet(setId: string): AlgorithmSetData | null {
  return ALGORITHM_SETS.find((set) => set.id === setId) ?? null;
}

export function getCase(setId: string, caseId: string): CaseEntry | null {
  return getAlgorithmSet(setId)?.cases.find((entry) => entry.id === caseId) ?? null;
}

/** The cube as this case leaves it, worked out once per case. */
const states = new Map<string, string>();

export function caseStateFor(entry: CaseEntry): string {
  const cached = states.get(entry.id);
  if (cached) return cached;
  const state = caseStateOf(entry.algorithms[0]!.moves);
  states.set(entry.id, state);
  return state;
}

/** The algorithm to show first: the person's pick, else the case's own first. */
export function chosenAlgorithm(
  entry: CaseEntry,
  preferredId: string | undefined,
  custom: readonly CaseAlgorithm[] = [],
): CaseAlgorithm {
  const all = [...entry.algorithms, ...custom];
  return all.find((algorithm) => algorithm.id === preferredId) ?? entry.algorithms[0]!;
}

/** Cases whose name, alias, number or group matches what was typed. */
export function searchCases(set: AlgorithmSetData, query: string): CaseEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return set.cases;
  return set.cases.filter((entry) =>
    [entry.name, entry.group, ...(entry.aliases ?? [])].join(" ").toLowerCase().includes(needle),
  );
}

/** The set's cases in the order they are shown, grouped by shape. */
export function groupCases(cases: readonly CaseEntry[]): { group: string; cases: CaseEntry[] }[] {
  const groups = new Map<string, CaseEntry[]>();
  for (const entry of cases) {
    const list = groups.get(entry.group) ?? [];
    list.push(entry);
    groups.set(entry.group, list);
  }
  return [...groups].map(([group, entries]) => ({ group, cases: entries }));
}
