"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { TRAINING_PACKS } from "@/data/training";
import type { TrainingPack } from "@/data/training/types";
import { getRepositories } from "@/lib/storage";
import type { PackItemKind } from "@/lib/storage/training-repository";
import { packProgress, progressByPack, type PackProgress } from "@/lib/training/progress";

/** Progress across every pack, for the list. */
export function useTrainingProgress() {
  const ready = useStorageStatus().status === "ready";
  const records = useLiveQuery(
    async () => (ready ? await getRepositories().training.list() : undefined),
    [ready],
  );
  const byPack = useMemo(() => progressByPack(TRAINING_PACKS, records ?? []), [records]);
  return { loaded: ready && records !== undefined, byPack };
}

/** Progress for one pack, with the tick handler. */
export function usePackProgress(pack: TrainingPack): {
  loaded: boolean;
  progress: PackProgress;
  setDone: (kind: PackItemKind, itemId: string, done: boolean) => void;
} {
  const ready = useStorageStatus().status === "ready";
  const record = useLiveQuery(
    async () => (ready ? ((await getRepositories().training.get(pack.id)) ?? null) : undefined),
    [ready, pack.id],
  );
  const progress = useMemo(() => packProgress(pack, record ?? undefined), [pack, record]);

  const setDone = (kind: PackItemKind, itemId: string, done: boolean) =>
    setPackItemDone(pack.id, kind, itemId, done);

  return { loaded: ready && record !== undefined, progress, setDone };
}

/** Ticks or unticks one lesson or drill, from anywhere it is shown. */
export function setPackItemDone(packId: string, kind: PackItemKind, itemId: string, done: boolean) {
  void getRepositories()
    .training.setDone(packId, kind, itemId, done)
    .catch(() => toast.error("Couldn’t save your progress."));
}
