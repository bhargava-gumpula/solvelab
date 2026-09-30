/**
 * Practising algorithms on a real cube: a scramble sets up a case, you solve it
 * with your algorithm, and the time goes against the case. Cases you haven't
 * done yet, or that are slower than your others, come round more often.
 */
import type { AlgorithmSetData, CaseAlgorithm, CaseEntry } from "@/data/algorithms/types";
import { ALGORITHM_SETS, chosenFor, progressIdFor } from "@/lib/algorithms/catalog";
import type { CaseLabel } from "@/lib/algorithms/labels";
import type { AlgorithmAttempt, AlgorithmProgress } from "@/types/domain";

/**
 * Name shown before you solve (execution), only afterwards (recognition too),
 * or flashcards: recall the algorithm from the picture, then check.
 */
export type TrainerMode = "execution" | "combined" | "recall";

export interface TrainerChoice {
  /** Which labels to include; none means every case. */
  labels: readonly CaseLabel[];
  /** Which groups to include; none means every group. */
  groups: readonly string[];
}

export interface TrainerCase {
  entry: CaseEntry;
  /** What its label and attempts are saved against. */
  caseId: string;
  /** The algorithm you use for it: your pick, or the first one. */
  algorithm: CaseAlgorithm;
}

/** The cases a choice covers, each with the algorithm you use. */
export function trainerCases(
  set: AlgorithmSetData,
  choice: TrainerChoice,
  labels: ReadonlyMap<string, CaseLabel>,
  progress: ReadonlyMap<string, AlgorithmProgress>,
): TrainerCase[] {
  return set.cases
    .filter((entry) => choice.groups.length === 0 || choice.groups.includes(entry.group))
    .filter(
      (entry) =>
        choice.labels.length === 0 ||
        choice.labels.includes(labels.get(progressIdFor(entry)) ?? "unknown"),
    )
    .map((entry) => {
      const caseId = progressIdFor(entry);
      return { entry, caseId, algorithm: chosenFor(entry, progress.get(caseId)) };
    });
}

export interface CaseTimes {
  count: number;
  bestMs: number | null;
  medianMs: number | null;
}

const TRAINER_MODES = new Set<AlgorithmAttempt["mode"]>(["execution", "combined"]);

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/** Each case's times on the real cube, from saved trainer attempts. */
export function caseTimes(attempts: readonly AlgorithmAttempt[]): Map<string, CaseTimes> {
  const byCase = new Map<string, number[]>();
  for (const attempt of attempts) {
    if (!TRAINER_MODES.has(attempt.mode) || attempt.totalMs === undefined) continue;
    const list = byCase.get(attempt.caseId) ?? [];
    list.push(attempt.totalMs);
    byCase.set(attempt.caseId, list);
  }
  return new Map(
    [...byCase].map(([caseId, times]) => [
      caseId,
      { count: times.length, bestMs: Math.min(...times), medianMs: median(times) },
    ]),
  );
}

/** How much more often a case is dealt: new ones and slow ones come round sooner. */
export function caseWeight(caseId: string, times: ReadonlyMap<string, CaseTimes>): number {
  const own = times.get(caseId);
  if (!own || own.count === 0) return 3;
  const medians = [...times.values()]
    .map((entry) => entry.medianMs)
    .filter((value): value is number => value !== null);
  const typical = median(medians);
  return typical !== null && own.medianMs !== null && own.medianMs > typical * 1.25 ? 2 : 1;
}

/** The next case, weighted, and never the one you just did (when there's another). */
export function nextCase(
  cases: readonly TrainerCase[],
  times: ReadonlyMap<string, CaseTimes>,
  previous: string | null,
  random: () => number,
): TrainerCase | null {
  if (!cases.length) return null;
  const open = cases.filter((item) => cases.length === 1 || item.caseId !== previous);
  const weights = open.map((item) => caseWeight(item.caseId, times));
  let left = random() * weights.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < open.length; index++) {
    left -= weights[index]!;
    if (left < 0) return open[index]!;
  }
  return open.at(-1)!;
}

/** The slowest cases you've timed, slowest first. */
export function slowestCases(
  cases: readonly TrainerCase[],
  times: ReadonlyMap<string, CaseTimes>,
  count = 5,
): { item: TrainerCase; times: CaseTimes }[] {
  return cases
    .map((item) => ({ item, times: times.get(item.caseId) }))
    .filter((row): row is { item: TrainerCase; times: CaseTimes } => row.times?.medianMs != null)
    .sort((a, b) => b.times.medianMs! - a.times.medianMs!)
    .slice(0, count);
}

export interface RecallRecord {
  count: number;
  /** How the last card for it went. */
  lastKnown: boolean;
}

/** Each case's flashcard record, from saved recall attempts (oldest first). */
export function recallRecords(attempts: readonly AlgorithmAttempt[]): Map<string, RecallRecord> {
  const byCase = new Map<string, RecallRecord>();
  for (const attempt of attempts) {
    if (attempt.mode !== "recall") continue;
    const before = byCase.get(attempt.caseId);
    byCase.set(attempt.caseId, { count: (before?.count ?? 0) + 1, lastKnown: attempt.successful });
  }
  return byCase;
}

/** Flashcards: new cases and ones you missed last time come round more often. */
export function nextCard(
  cases: readonly TrainerCase[],
  records: ReadonlyMap<string, RecallRecord>,
  previous: string | null,
  random: () => number,
): TrainerCase | null {
  if (!cases.length) return null;
  const open = cases.filter((item) => cases.length === 1 || item.caseId !== previous);
  const weights = open.map((item) => {
    const record = records.get(item.caseId);
    if (!record) return 3;
    return record.lastKnown ? 1 : 4;
  });
  let left = random() * weights.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < open.length; index++) {
    left -= weights[index]!;
    if (left < 0) return open[index]!;
  }
  return open.at(-1)!;
}

/** Which set a saved case id belongs to, and what it is called there. */
export function whereCaseLives(caseId: string): { setId: string; name: string } | null {
  // ZBLL's own cases (its PLLs are saved as full PLL's).
  const zbll = /^zbll-([a-z]+)-(\d+)$/.exec(caseId);
  if (zbll) {
    const set = zbll[1] === "pi" ? "Pi" : zbll[1]!.toUpperCase();
    return { setId: "zbll", name: `ZBLL ${set} ${zbll[2]}` };
  }
  for (const set of ALGORITHM_SETS) {
    const entry = set.cases.find((item) => item.id === caseId && !item.sameAs);
    if (entry) return { setId: set.id, name: `${set.name} · ${entry.name}` };
  }
  return null;
}

/** Your slowest cases on the cube across every set, slowest first. */
export function slowestOnTheCube(
  times: ReadonlyMap<string, CaseTimes>,
  count = 5,
): { caseId: string; setId: string; name: string; times: CaseTimes }[] {
  return [...times]
    .map(([caseId, own]) => ({ caseId, where: whereCaseLives(caseId), times: own }))
    .filter(
      (row): row is { caseId: string; where: { setId: string; name: string }; times: CaseTimes } =>
        row.where !== null && row.times.medianMs !== null,
    )
    .sort((a, b) => b.times.medianMs! - a.times.medianMs!)
    .slice(0, count)
    .map(({ caseId, where, times: own }) => ({ caseId, ...where, times: own }));
}
