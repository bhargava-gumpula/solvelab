"use client";

import { useEffect, useState } from "react";
import { AlgorithmTrainer } from "@/components/algorithms/algorithm-trainer";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlgorithmSetData } from "@/data/algorithms/types";
import { getAlgorithmSet } from "@/lib/algorithms/catalog";
import { loadZbll, ZBLL_SET_ID } from "@/lib/algorithms/zbll";

/** The trainer for one set; ZBLL's cases load when the page opens. */
export function TrainerPage({ setId }: { setId: string }) {
  const [set, setSet] = useState<AlgorithmSetData | null>(() =>
    setId === ZBLL_SET_ID ? null : getAlgorithmSet(setId),
  );
  useEffect(() => {
    if (setId !== ZBLL_SET_ID) return;
    let live = true;
    void loadZbll().then((loaded) => live && setSet(loaded));
    return () => {
      live = false;
    };
  }, [setId]);
  if (!set) return <Skeleton className="h-72" />;
  return <AlgorithmTrainer set={set} backHref={`/algorithms/${setId}/`} />;
}
