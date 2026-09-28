/**
 * On-screen recognition drills: a case from the bank, turned to a random
 * angle and shown only from the sides you'd see holding the cube, with four
 * names to choose from. The wrong names come from the same group where they
 * can, because telling look-alikes apart is the hard part.
 */
import { caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { AUF, type CaseKind } from "@/lib/cube/case-check";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import type { CaseEntry } from "@/data/algorithms/types";
import type { RecognitionSet } from "./units";

export interface RecognitionCard {
  caseId: string;
  facelets: string;
  kind: CaseKind;
  options: string[];
  answer: number;
}

/** A small seeded random source, so a deck can be replayed in tests. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** How a case is named in the drill: its name, and its nickname when it has one. */
export function caseLabel(entry: CaseEntry): string {
  const alias = entry.aliases?.[0];
  return alias ? `${entry.name} (${alias})` : entry.name;
}

/** The cases a drill draws from. */
export function drillCases(set: RecognitionSet): CaseEntry[] {
  return getAlgorithmSet(set)?.cases.filter((entry) => entry.algorithms.length > 0) ?? [];
}

export function recognitionDeck(
  set: RecognitionSet,
  count: number,
  random: () => number,
): RecognitionCard[] {
  const data = getAlgorithmSet(set);
  const cases = drillCases(set);
  if (!data || cases.length < 4) return [];
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
  const shuffle = <T>(items: T[]): T[] => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [copy[index], copy[other]] = [copy[other]!, copy[index]!];
    }
    return copy;
  };

  const deck: RecognitionCard[] = [];
  for (let index = 0; index < count; index++) {
    const entry = pick(cases);
    const kind = kindFor(data, entry);
    const turn = pick(AUF);
    const state = caseStateFor(entry, kind);
    const facelets = turn ? applyAlgorithm(turn, state) : state;
    const sameGroup = shuffle(cases.filter((item) => item !== entry && item.group === entry.group));
    const rest = shuffle(cases.filter((item) => item !== entry && item.group !== entry.group));
    const wrong = [...sameGroup, ...rest].slice(0, 3).map(caseLabel);
    const answer = Math.floor(random() * 4);
    const options = [...wrong];
    options.splice(answer, 0, caseLabel(entry));
    deck.push({ caseId: entry.id, facelets, kind, options, answer });
  }
  return deck;
}
