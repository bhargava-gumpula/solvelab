"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isTestId, TEST_ORDER, testHref } from "@/data/exercises";
import { useSolveProfile } from "@/hooks/use-solve-profile";

/** Old diagnostic links: open the matching test, or the next one to take. */
export function TestRedirect({ testId }: { testId?: string }) {
  const router = useRouter();
  const { loaded, profile } = useSolveProfile();
  const direct = testId && isTestId(testId) ? testId : null;
  const target = direct ?? (loaded ? (profile?.nextTest ?? TEST_ORDER[0]) : null);

  useEffect(() => {
    if (target) router.replace(testHref(target));
  }, [router, target]);

  return (
    <p className="text-sm text-muted-foreground" role="status">
      Opening your test…
    </p>
  );
}
