import type { AlgorithmProgress } from "@/types/domain";

/**
 * Where a person stands with a case. Three labels, because that is what people
 * actually track: you know it, you are working on it, or you don't know it yet.
 */
export type CaseLabel = "unknown" | "learning" | "known";

export const CASE_LABELS: { id: CaseLabel; short: string; long: string }[] = [
  { id: "unknown", short: "Don't know", long: "I don't know this one" },
  { id: "learning", short: "Learning", long: "I'm learning this one" },
  { id: "known", short: "Know it", long: "I know this one" },
];

/** The stored state for a label. */
export function stateForLabel(label: CaseLabel): AlgorithmProgress["state"] {
  if (label === "known") return "known";
  return label === "learning" ? "learning" : "not_started";
}

/** The label for a stored state, including the two older names for it. */
export function labelForState(state: AlgorithmProgress["state"] | undefined): CaseLabel {
  if (state === "known" || state === "mastered") return "known";
  if (state === "learning" || state === "practicing") return "learning";
  return "unknown";
}

export function labelOf(progress: Pick<AlgorithmProgress, "state"> | undefined | null): CaseLabel {
  return labelForState(progress?.state);
}

export interface LabelCounts {
  known: number;
  learning: number;
  unknown: number;
  total: number;
}

/** How a set stands: the counts behind "18 of 21 known". */
export function countLabels(
  caseIds: readonly string[],
  progress: ReadonlyMap<string, CaseLabel>,
): LabelCounts {
  const counts: LabelCounts = { known: 0, learning: 0, unknown: 0, total: caseIds.length };
  for (const caseId of caseIds) counts[progress.get(caseId) ?? "unknown"]++;
  return counts;
}
