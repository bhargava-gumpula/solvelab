/**
 * What the saved answers of a recognition drill say about each case: whether
 * you know it on sight, and how long it takes you to say so.
 */
import type { AlgorithmAttempt } from "@/types/domain";
import { drillCases } from "./recognition";
import type { RecognitionSet } from "./units";

/** An answer slower than this means the person walked away; it isn't saved. */
export const MAX_RECOGNITION_MS = 30_000;
/** A case is known once this many answers in a row, up to the latest, were right. */
export const KNOWN_AFTER = 2;
/** A case's time is the median of its right answers among this many latest ones. */
const RECENT = 5;

export interface CaseRecognition {
  caseId: string;
  /** Answers saved for the case. */
  seen: number;
  known: boolean;
  /** The latest answer was wrong. */
  missed: boolean;
  medianMs: number | null;
}

export interface RecognitionStats {
  set: RecognitionSet;
  /** Cases the drill deals. */
  total: number;
  known: number;
  /** The median of the known cases' times. */
  medianMs: number | null;
  cases: ReadonlyMap<string, CaseRecognition>;
  /** Known cases that take the longest, slowest first. */
  slowest: string[];
  /** Cases whose latest answer was wrong. */
  missed: string[];
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function recognitionStats(
  attempts: readonly AlgorithmAttempt[],
  set: RecognitionSet,
): RecognitionStats {
  const ids = drillCases(set).map((entry) => entry.id);
  const wanted = new Set(ids);
  const byCase = new Map<string, AlgorithmAttempt[]>();
  for (const attempt of attempts) {
    if (attempt.mode !== "recognition" || !wanted.has(attempt.caseId)) continue;
    const list = byCase.get(attempt.caseId) ?? [];
    list.push(attempt);
    byCase.set(attempt.caseId, list);
  }

  const cases = new Map<string, CaseRecognition>();
  for (const caseId of ids) {
    const answers = (byCase.get(caseId) ?? []).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    const latest = answers.slice(-KNOWN_AFTER);
    const right = answers
      .slice(-RECENT)
      .filter((answer) => answer.successful && answer.recognitionMs !== undefined)
      .map((answer) => answer.recognitionMs!);
    cases.set(caseId, {
      caseId,
      seen: answers.length,
      known: latest.length === KNOWN_AFTER && latest.every((answer) => answer.successful),
      missed: answers.length > 0 && !answers.at(-1)!.successful,
      medianMs: median(right),
    });
  }

  const known = [...cases.values()].filter((entry) => entry.known);
  const timed = known.filter((entry) => entry.medianMs !== null);
  return {
    set,
    total: ids.length,
    known: known.length,
    medianMs: median(timed.map((entry) => entry.medianMs!)),
    cases,
    slowest: [...timed]
      .sort((a, b) => b.medianMs! - a.medianMs!)
      .slice(0, 3)
      .map((entry) => entry.caseId),
    missed: [...cases.values()].filter((entry) => entry.missed).map((entry) => entry.caseId),
  };
}
