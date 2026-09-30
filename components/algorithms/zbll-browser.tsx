"use client";

import { useEffect, useState } from "react";
import { CaseBrowser } from "@/components/algorithms/case-browser";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlgorithmSetData } from "@/data/algorithms/types";
import { loadZbll, ZBLL_SHOWN } from "@/lib/algorithms/zbll";

/** The ZBLL cases, loaded when the page opens rather than with the rest of the bank. */
export function ZbllBrowser() {
  const [set, setSet] = useState<AlgorithmSetData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadZbll()
      .then((loaded) => live && setSet(loaded))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  if (failed) {
    return (
      <p className="rounded-2xl px-4 py-8 text-center text-sm text-muted-foreground glass">
        Couldn&apos;t load the ZBLL cases. Check your connection and reload the page.
      </p>
    );
  }
  if (!set) return <Skeleton className="h-64" data-testid="zbll-loading" />;
  return <CaseBrowser set={set} collapseAfter={ZBLL_SHOWN} />;
}
