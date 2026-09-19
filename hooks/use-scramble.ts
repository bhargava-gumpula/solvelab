"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CubeEvent } from "@/types/domain";
import { isValidScramble } from "@/lib/cube/events";
import { normalizeNotation } from "@/lib/cube/notation";
import { getScrambleService, type GeneratedScramble } from "@/lib/scramble";

const HISTORY_LIMIT = 50;

interface ScrambleHistory {
  entries: GeneratedScramble[];
  index: number;
}

const EMPTY_HISTORY: ScrambleHistory = { entries: [], index: -1 };

/**
 * Scramble history for the timer, kept per puzzle type. Step back, forward, or
 * type in your own. After a solve, `fresh()` always generates a new scramble.
 * With `enabled` false (a test with no scramble) nothing is generated.
 */
export function useScramble(event: CubeEvent, enabled = true) {
  const [histories, setHistories] = useState<Partial<Record<CubeEvent, ScrambleHistory>>>({});
  const request = useRef(0);
  const snapshot = histories[event] ?? EMPTY_HISTORY;
  const hasEntries = snapshot.entries.length > 0;

  const append = useCallback((entry: GeneratedScramble) => {
    setHistories((current) => {
      const hist = current[entry.event] ?? EMPTY_HISTORY;
      const entries = [...hist.entries, entry].slice(-HISTORY_LIMIT);
      return { ...current, [entry.event]: { entries, index: entries.length - 1 } };
    });
  }, []);

  const fresh = useCallback(async () => {
    if (!enabled) return null;
    const id = ++request.current;
    const generated = await getScrambleService().next(event);
    if (id === request.current) append(generated);
    return generated;
  }, [event, append, enabled]);

  const next = useCallback(() => {
    if (snapshot.index < snapshot.entries.length - 1) {
      setHistories((current) => {
        const hist = current[event] ?? EMPTY_HISTORY;
        if (hist.index >= hist.entries.length - 1) return current;
        return { ...current, [event]: { ...hist, index: hist.index + 1 } };
      });
    } else {
      void fresh();
    }
  }, [snapshot.index, snapshot.entries.length, event, fresh]);

  const previous = useCallback(() => {
    setHistories((current) => {
      const hist = current[event] ?? EMPTY_HISTORY;
      if (hist.index <= 0) return current;
      return { ...current, [event]: { ...hist, index: hist.index - 1 } };
    });
  }, [event]);

  const setCustom = useCallback(
    (text: string): boolean => {
      const scramble = normalizeNotation(text);
      if (!scramble || !isValidScramble(event, scramble)) return false;
      request.current++;
      append({ event, scramble, providerId: "custom", randomState: false });
      return true;
    },
    [event, append],
  );

  useEffect(() => {
    if (!enabled || hasEntries) return;
    const id = ++request.current;
    void getScrambleService()
      .next(event)
      .then((generated) => {
        if (id === request.current) append(generated);
      });
  }, [event, append, hasEntries, enabled]);

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
