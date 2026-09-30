/**
 * Which set a saved case id belongs to, read from its prefix, so a page can
 * group labels by set without loading every set's cases. Longer prefixes
 * first: "coll-" before "oll-", "2oll-" before "oll-".
 */
const PREFIXES: readonly (readonly [prefix: string, setId: string])[] = [
  ["zbll-", "zbll"],
  ["2oll-", "two-look-oll"],
  ["2pll-", "two-look-pll"],
  ["coll-", "coll"],
  ["oll-", "oll"],
  ["pll-", "pll"],
  ["f2l-", "f2l"],
  ["wv-", "winter-variation"],
];

export function setIdOfCase(caseId: string): string | null {
  return PREFIXES.find(([prefix]) => caseId.startsWith(prefix))?.[1] ?? null;
}
