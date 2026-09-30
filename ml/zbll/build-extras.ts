/**
 * The extra algorithms for PLL, OLL, COLL and Winter Variation, gathered from
 * the same published lists as ZBLL. The bank's own algorithms stay as they are
 * and stay first; these come after them, most common first.
 *
 *   IN=other-records.json node ml/scripts/run.mjs ml/zbll/build-extras.ts
 *
 * Each record is { source, set, moves, votes? } with set one of pll, oll, coll,
 * wv. An algorithm is kept when it solves one of that set's cases on the cube,
 * finishes upright, can define the case on its own, and isn't already listed
 * for that case once both are written the same way (see normalise.ts). Writes
 * data/algorithms/sets/extra-data.ts (OUT) and a report (REPORT).
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { caseStateOf, checkAlgorithm, type CaseKind } from "@/lib/cube/case-check";
import { canonicalKey } from "@/lib/algorithms/canonical";
import { finishesUpright, length, levelled, readMoves, spellings, text } from "./normalise";

interface OtherRecord {
  source: string;
  set: "pll" | "oll" | "coll" | "wv";
  moves: string;
  votes?: number | null;
}

const SET_IDS = { pll: "pll", oll: "oll", coll: "coll", wv: "winter-variation" } as const;
const records: OtherRecord[] = JSON.parse(readFileSync(process.env.IN!, "utf8")).records;

/** The spelling to keep and the key it is compared by; null if it doesn't solve this case. */
function key(
  moves: string,
  state: string,
  kind: CaseKind,
): { written: string; key: string } | null {
  const read = readMoves(moves);
  if (!read) return null;
  const full = levelled(read);
  for (const candidate of spellings(full)) {
    const written = text(candidate);
    if (!finishesUpright(written) || !checkAlgorithm(state, written, kind).ok) continue;
    try {
      caseStateOf(written, kind);
    } catch {
      continue;
    }
    // Written round the cube another way is the same algorithm, except for Winter
    // Variation, where turning the cube changes which slot the pair goes into.
    return { written, key: kind === "wv" ? written : canonicalKey(written) };
  }
  return null;
}

interface Found {
  key: string;
  spellings: Map<string, Set<string>>;
  sources: Set<string>;
  votes: number;
}

/** Moves that make you reach round the cube: fewer is easier to hold. */
const awkward = (moves: string) => ({
  frontBack: moves.split(" ").filter((move) => /^[FBfb]/.test(move)).length,
  leftDown: moves.split(" ").filter((move) => /^[LDld]/.test(move)).length,
});

/** The spelling to show: the one most sources use, then the one easiest to hold. */
function spellingOf(algorithm: Found): string {
  return [...algorithm.spellings].sort(
    ([a, aSources], [b, bSources]) =>
      bSources.size - aSources.size ||
      awkward(a).frontBack - awkward(b).frontBack ||
      awkward(a).leftDown - awkward(b).leftDown ||
      a.localeCompare(b),
  )[0]![0];
}

/** An extra algorithm's id comes from its key, so it survives new sources and a new order. */
const idOf = (moves: string) =>
  `ex-${createHash("sha256").update(moves).digest("hex").slice(0, 10)}`;

const extras = new Map<string, { id: string; moves: string }[]>();
const report: Record<string, unknown> = {};
for (const [name, setId] of Object.entries(SET_IDS)) {
  const set = getAlgorithmSet(setId)!;
  const cases = set.cases
    .filter((entry) => !entry.sameAs)
    .map((entry) => {
      const kind = kindFor(set, entry);
      const state = caseStateFor(entry, kind);
      const known = new Set(
        algorithmsFor(entry)
          .map((algorithm) => key(algorithm.moves, state, kind)?.key)
          .filter((moves): moves is string => moves !== undefined),
      );
      return { entry, kind, state, known, added: new Map<string, Found>() };
    });
  const unmatched = new Map<string, number>();
  const bySource = new Map<string, number>();
  const mine = records.filter((record) => record.set === name);
  for (const record of mine) {
    let placed = false;
    for (const known of cases) {
      const found = key(record.moves, known.state, known.kind);
      if (found === null) continue;
      placed = true;
      if (known.known.has(found.key)) break;
      const algorithm = known.added.get(found.key) ?? {
        key: found.key,
        spellings: new Map<string, Set<string>>(),
        sources: new Set<string>(),
        votes: 0,
      };
      if (!known.added.has(found.key)) {
        bySource.set(record.source, (bySource.get(record.source) ?? 0) + 1);
      }
      algorithm.sources.add(record.source);
      const spelledBy = algorithm.spellings.get(found.written) ?? new Set<string>();
      spelledBy.add(record.source);
      algorithm.spellings.set(found.written, spelledBy);
      algorithm.votes = Math.max(algorithm.votes, record.votes ?? 0);
      known.added.set(found.key, algorithm);
      break;
    }
    if (!placed) {
      unmatched.set(record.source, (unmatched.get(record.source) ?? 0) + 1);
      if (process.env.VERBOSE) console.log(`UNMATCHED ${name} ${record.source}: ${record.moves}`);
    }
  }
  const existing = cases.reduce((sum, known) => sum + known.known.size, 0);
  const extra = cases.reduce((sum, known) => sum + known.added.size, 0);
  for (const known of cases) {
    const ranked = [...known.added.values()]
      .map((algorithm) => ({ ...algorithm, moves: spellingOf(algorithm) }))
      .sort(
        (a, b) =>
          b.sources.size - a.sources.size ||
          b.votes - a.votes ||
          length(a.moves) - length(b.moves) ||
          a.moves.localeCompare(b.moves),
      );
    if (ranked.length) {
      extras.set(
        known.entry.id,
        ranked.map((algorithm) => ({ id: idOf(algorithm.key), moves: algorithm.moves })),
      );
    }
  }
  report[name] = {
    cases: cases.length,
    records: mine.length,
    existing,
    extra,
    firstFoundIn: Object.fromEntries(bySource),
    dropped: Object.fromEntries(unmatched),
  };
  console.log(name, JSON.stringify(report[name]));
}
writeFileSync(process.env.REPORT ?? "other-sets-report.json", JSON.stringify(report, null, 1));

// One file per set, so a page loads only the set it shows.
const CHUNK: Record<string, string> = {
  pll: "pll",
  oll: "oll",
  coll: "coll",
  "winter-variation": "wv",
};
const counts: Record<string, number> = {};
for (const [setId, chunk] of Object.entries(CHUNK)) {
  const set = getAlgorithmSet(setId)!;
  const lines = [
    "// Generated by ml/zbll/build-extras.ts. Edit the builder, not this file.",
    'import type { CaseAlgorithm } from "../../types";',
    "",
    `/** More ${set.name} algorithms, after the bank's own, most common first. */`,
    "export const EXTRAS: Readonly<Record<string, readonly CaseAlgorithm[]>> = {",
  ];
  let count = 0;
  for (const entry of set.cases) {
    const algorithms = extras.get(entry.id);
    if (!algorithms?.length) continue;
    count += algorithms.length;
    const list = algorithms
      .map(
        (algorithm) =>
          `{ id: ${JSON.stringify(algorithm.id)}, moves: ${JSON.stringify(algorithm.moves)} }`,
      )
      .join(", ");
    lines.push(`  ${JSON.stringify(entry.id)}: [${list}],`);
  }
  lines.push("};", "");
  counts[chunk] = count;
  writeFileSync(
    `${process.env.OUT_DIR ?? "data/algorithms/sets/extras"}/${chunk}.ts`,
    lines.join("\n"),
  );
}
writeFileSync(
  `${process.env.OUT_DIR ?? "data/algorithms/sets/extras"}/summary.ts`,
  [
    "// Generated by ml/zbll/build-extras.ts: how many extras each set has, without loading them.",
    `export const EXTRA_COUNTS = ${JSON.stringify(counts)} as const;`,
    "",
  ].join("\n"),
);
