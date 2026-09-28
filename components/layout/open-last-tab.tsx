"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LAST_TAB_KEY, TABS } from "@/lib/config/navigation";

export function OpenLastTab() {
  const router = useRouter();
  useEffect(() => {
    let last: string | null = null;
    try {
      last = localStorage.getItem(LAST_TAB_KEY);
    } catch {
      // No storage: open on the timer.
    }
    const tab = TABS.find((item) => item.id === last) ?? TABS[0]!;
    router.replace(`${tab.href}/`);
  }, [router]);
  return null;
}
