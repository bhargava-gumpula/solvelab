"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CubeEvent } from "@/types/domain";
import { getScrambleService, type GeneratedScramble } from "@/lib/scramble";

export function useScramble(event: CubeEvent) {
  const [scramble, setScramble] = useState<GeneratedScramble | null>(null);
  const request = useRef(0);

  const next = useCallback(async () => {
    const id = ++request.current;
    const generated = await getScrambleService().next(event);
    // Ignore results that arrive after a newer request.
    if (id === request.current) setScramble(generated);
    return generated;
  }, [event]);

  useEffect(() => {
    void next();
  }, [next]);

  return { scramble, next };
}
