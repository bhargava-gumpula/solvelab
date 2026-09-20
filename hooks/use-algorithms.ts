"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { labelOf, type CaseLabel } from "@/lib/algorithms/labels";
import { getRepositories } from "@/lib/storage";
import type { AlgorithmProgress } from "@/types/domain";

export interface AlgorithmBankState {
  loaded: boolean;
  progress: Map<string, AlgorithmProgress>;
  labels: Map<string, CaseLabel>;
}

/** Everything the bank knows about this person, keyed by case. */
export function useAlgorithmProgress(): AlgorithmBankState {
  const ready = useStorageStatus().status === "ready";
  const rows = useLiveQuery(
    async () => (ready ? await getRepositories().algorithms.list() : undefined),
    [ready],
  );
  const progress = new Map((rows ?? []).map((row) => [row.caseId, row]));
  const labels = new Map([...progress].map(([caseId, row]) => [caseId, labelOf(row)]));
  return { loaded: rows !== undefined, progress, labels };
}

export const algorithmActions = {
  setLabel: (caseId: string, label: CaseLabel) =>
    getRepositories().algorithms.setLabel(caseId, label),
  setPreferred: (caseId: string, variantId: string | null) =>
    getRepositories().algorithms.setPreferred(caseId, variantId),
  setNotes: (caseId: string, notes: string) => getRepositories().algorithms.setNotes(caseId, notes),
};
