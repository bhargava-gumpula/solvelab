import { coll } from "@/data/algorithms/sets/coll";
import { f2l } from "@/data/algorithms/sets/f2l";
import { oll } from "@/data/algorithms/sets/oll";
import { pll } from "@/data/algorithms/sets/pll";
import { twoLookOll, twoLookPll } from "@/data/algorithms/sets/two-look";
import { wv } from "@/data/algorithms/sets/wv";
import type { AlgorithmSetData, CaseAlgorithm, CaseEntry } from "@/data/algorithms/types";
import { caseStateOf, type CaseKind } from "@/lib/cube/case-check";

/** Every set with cases behind it. Others are still to come. */
export const ALGORITHM_SETS: AlgorithmSetData[] = [twoLookOll, twoLookPll, pll, oll, f2l, coll, wv];

export function getAlgorithmSet(setId: string): AlgorithmSetData | null {
  return ALGORITHM_SETS.find((set) => set.id === setId) ?? null;
}

export function getCase(setId: string, caseId: string): CaseEntry | null {
  return getAlgorithmSet(setId)?.cases.find((entry) => entry.id === caseId) ?? null;
}

/** A case this one stands in for, when a two-look step is a case in its own right. */
function referenced(entry: CaseEntry): CaseEntry | null {
  if (!entry.sameAs) return null;
  for (const set of ALGORITHM_SETS) {
    const found = set.cases.find((other) => other.id === entry.sameAs);
    if (found) return found;
  }
  return null;
}

/** The algorithms to show, following a reference to another set when there is one. */
export function algorithmsFor(entry: CaseEntry): CaseAlgorithm[] {
  if (entry.algorithms.length > 0) return entry.algorithms;
  return referenced(entry)?.algorithms ?? [];
}

/** What a label is saved against: one case, however many sets it appears in. */
export function progressIdFor(entry: CaseEntry): string {
  return entry.sameAs ?? entry.id;
}

/** How this case is finished, which a two-look step can differ on. */
export function kindFor(set: AlgorithmSetData, entry: CaseEntry): CaseKind {
  return entry.kind ?? set.kind;
}

/** The cube as this case leaves it, worked out once per case. */
const states = new Map<string, string>();

export function caseStateFor(entry: CaseEntry, kind: CaseKind = "pll"): string {
  const cached = states.get(entry.id);
  if (cached) return cached;
  const state = caseStateOf(algorithmsFor(entry)[0]!.moves, kind);
  states.set(entry.id, state);
  return state;
}

/** The algorithm to show first: the person's pick, else the case's own first. */
export function chosenAlgorithm(
  entry: CaseEntry,
  preferredId: string | undefined,
  custom: readonly CaseAlgorithm[] = [],
): CaseAlgorithm {
  const own = algorithmsFor(entry);
  const all = [...own, ...custom];
  return all.find((algorithm) => algorithm.id === preferredId) ?? own[0]!;
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
