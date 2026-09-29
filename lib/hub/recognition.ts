/**
 * On-screen recognition drills: a case from the bank, turned to a random
 * angle and shown only from the sides you'd see holding the cube, with four
 * names to choose from. The wrong names come from the same group where they
 * can, because telling look-alikes apart is the hard part.
 */
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { AUF, type CaseKind } from "@/lib/cube/case-check";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import type { CaseEntry } from "@/data/algorithms/types";
import type { RecognitionSet } from "./units";

/** What is known about each case so far, for dealing the ones that need work more often. */
export interface DeckHistory {
  cases: ReadonlyMap<string, { seen: number; missed: boolean; medianMs: number | null }>;
  medianMs: number | null;
}

/** How much more often a case is dealt than one that is known and quick. */
function weight(caseId: string, history: DeckHistory): number {
  const entry = history.cases.get(caseId);
  if (!entry || entry.seen === 0) return 3;
  if (entry.missed) return 4;
  const slow =
    entry.medianMs !== null &&
    history.medianMs !== null &&
    entry.medianMs > history.medianMs * 1.25;
  return slow ? 2 : 1;
}

export interface RecognitionCard {
  caseId: string;
  /** The algorithm the case is shown with: its first one. */
  variantId: string;
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

/**
 * How a case is named in the drill: its name, and its nickname when it has one.
 * F2L cases have only numbers, which nobody recognises, so a pair case is
 * named by its first algorithm and the drill asks which one solves it.
 */
export function caseLabel(entry: CaseEntry, set?: RecognitionSet): string {
  if (set === "f2l") return algorithmsFor(entry)[0]!.moves;
  const alias = entry.aliases?.[0];
  return alias ? `${entry.name} (${alias})` : entry.name;
}

/**
 * The cases a drill draws from. A two-look case borrows its algorithms from
 * the full set it points at, so it counts as having them. The 2-look PLL drill
 * keeps to the default route (T and Y, then the edges): the A and E route
 * solves the same corner states, so offering it as a wrong answer would mark
 * a right one wrong.
 */
export function drillCases(set: RecognitionSet): CaseEntry[] {
  return (
    getAlgorithmSet(set)?.cases.filter(
      (entry) =>
        algorithmsFor(entry).length > 0 &&
        (set !== "two-look-pll" || /^Step \d:/.test(entry.group)),
    ) ?? []
  );
}

/**
 * A deck of cards. With the history of earlier answers, cases never seen,
 * missed last time or slower than the rest are dealt more often, and no case
 * comes up twice in a row; without it, every case is as likely as the next.
 */
export function recognitionDeck(
  set: RecognitionSet,
  count: number,
  random: () => number,
  history?: DeckHistory,
): RecognitionCard[] {
  const data = getAlgorithmSet(set);
  const cases = drillCases(set);
  if (!data || cases.length < 4) return [];
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
  const weights = history ? cases.map((entry) => weight(entry.id, history)) : null;
  const deal = (previous: string | null): CaseEntry => {
    if (!weights) return pick(cases);
    const open = cases.map((entry, index) => (entry.id === previous ? 0 : weights[index]!));
    let left = random() * open.reduce((sum, value) => sum + value, 0);
    for (let index = 0; index < cases.length; index++) {
      left -= open[index]!;
      if (left < 0) return cases[index]!;
    }
    return cases.at(-1)!;
  };
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
    const entry = deal(deck.at(-1)?.caseId ?? null);
    const kind = kindFor(data, entry);
    // A pair case is shown exactly as its algorithm starts, so "which algorithm
    // solves this" needs no set-up turn; a last-layer case turns to any angle.
    const turn = set === "f2l" ? "" : pick(AUF);
    const state = caseStateFor(entry, kind);
    const facelets = turn ? applyAlgorithm(turn, state) : state;
    const sameGroup = shuffle(cases.filter((item) => item !== entry && item.group === entry.group));
    const rest = shuffle(cases.filter((item) => item !== entry && item.group !== entry.group));
    const wrong = [...sameGroup, ...rest].slice(0, 3).map((item) => caseLabel(item, set));
    const answer = Math.floor(random() * 4);
    const options = [...wrong];
    options.splice(answer, 0, caseLabel(entry, set));
    deck.push({
      caseId: entry.id,
      variantId: algorithmsFor(entry)[0]!.id,
      facelets,
      kind,
      options,
      answer,
    });
  }
  return deck;
}
