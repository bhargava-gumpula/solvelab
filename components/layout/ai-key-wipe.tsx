"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AI_KEYS_REMOVED_NOTE, wipeSavedAiKeys } from "@/lib/ai/legacy-keys";

/** Deletes any AI key an earlier version saved in this browser, and says so once. */
export function AiKeyWipe() {
  useEffect(() => {
    try {
      if (wipeSavedAiKeys(localStorage, sessionStorage)) {
        toast.info(AI_KEYS_REMOVED_NOTE, { duration: 20_000 });
      }
    } catch {
      // Storage blocked: no key could have been saved here.
    }
  }, []);
  return null;
}
