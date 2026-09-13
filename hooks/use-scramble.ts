"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CubeEvent } from "@/types/domain";
import { isValidAlgorithm, normalizeNotation } from "@/lib/cube/notation";
import { getScrambleService, type GeneratedScramble } from "@/lib/scramble";

const HISTORY_LIMIT = 50;

interface ScrambleHistory {
  entries: GeneratedScramble[];
  index: number;
}

const EMPTY_HISTORY: ScrambleHistory = { entries: [], index: -1 };

/**
 * Scramble history for the timer: step back to earlier scrambles, forward
 * again, or type in your own. After a solve, `fresh()` always generates a new
 * scramble so a solved scramble is never served twice by accident.
 */
export function useScramble(event: CubeEvent) {
  // The ref is the source of truth so navigation decisions never read stale state.
  const history = useRef<ScrambleHistory>(EMPTY_HISTORY);
  const [snapshot, setSnapshot] = useState<ScrambleHistory>(EMPTY_HISTORY);
  const request = useRef(0);

  const commit = useCallback((next: ScrambleHistory) => {
    history.current = next;
    setSnapshot(next);
  }, []);

  const append = useCallback(
    (entry: GeneratedScramble) => {
      const entries = [...history.current.entries, entry].slice(-HISTORY_LIMIT);
      commit({ entries, index: entries.length - 1 });
    },
    [commit],
  );

  const fresh = useCallback(async () => {
    const id = ++request.current;
    const generated = await getScrambleService().next(event);
    if (id === request.current) append(generated);
    return generated;
  }, [event, append]);

  const next = useCallback(() => {
    const { entries, index } = history.current;
    if (index < entries.length - 1) commit({ entries, index: index + 1 });
    else void fresh();
  }, [commit, fresh]);

  const previous = useCallback(() => {
    const { entries, index } = history.current;
    if (index > 0) commit({ entries, index: index - 1 });
  }, [commit]);

  const setCustom = useCallback(
    (text: string): boolean => {
      const scramble = normalizeNotation(text);
      if (!scramble || !isValidAlgorithm(scramble)) return false;
      request.current++;
      append({ event, scramble, providerId: "custom", randomState: false });
      return true;
    },
    [event, append],
  );

  useEffect(() => {
    void fresh();
  }, [fresh]);

  const { entries, index } = snapshot;
  return {
    scramble: entries[index] ?? null,
    canGoBack: index > 0,
    next,
    previous,
    fresh,
    setCustom,
  };
}
