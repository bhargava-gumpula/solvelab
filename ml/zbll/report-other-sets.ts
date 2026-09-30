/**
 * How many new algorithms the ZBLL sources would add to the sets already in the
 * bank, without changing them.
 *
 *   IN=other-records.json node ml/scripts/run.mjs ml/zbll/report-other-sets.ts
 *
 * Each record is { source, set, moves } with set one of pll, oll, coll, wv.
 * An algorithm counts when it solves one of that set's cases on the cube, can
 * define the case on its own, and isn't already listed for that case once
 * both are written the same way (see normalise.ts).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { caseStateOf, checkAlgorithm, type CaseKind } from "@/lib/cube/case-check";
import { canonicalKey } from "@/lib/algorithms/canonical";
import { readMoves, spellings, levelled, finishesUpright, text } from "./normalise";

interface OtherRecord {
  source: string;
  set: "pll" | "oll" | "coll" | "wv";
  moves: string;
}

const SET_IDS = { pll: "pll", oll: "oll", coll: "coll", wv: "winter-variation" } as const;
const records: OtherRecord[] = JSON.parse(readFileSync(process.env.IN!, "utf8")).records;

/** The spelling an algorithm is compared by: the shortest that still works alone. */
function key(moves: string, state: string, kind: CaseKind): string | null {
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
    return kind === "wv" ? written : canonicalKey(written);
  }
  return null;
}

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
          .map((algorithm) => key(algorithm.moves, state, kind))
          .filter((moves): moves is string => moves !== null),
      );
      return { entry, kind, state, known, added: new Set<string>() };
    });
  const unmatched = new Map<string, number>();
  const bySource = new Map<string, number>();
  const mine = records.filter((record) => record.set === name);
  for (const record of mine) {
    let placed = false;
    for (const known of cases) {
      const moves = key(record.moves, known.state, known.kind);
      if (moves === null) continue;
      placed = true;
      if (!known.known.has(moves) && !known.added.has(moves)) {
        known.added.add(moves);
        bySource.set(record.source, (bySource.get(record.source) ?? 0) + 1);
      }
      break;
    }
    if (!placed) {
      unmatched.set(record.source, (unmatched.get(record.source) ?? 0) + 1);
      if (process.env.VERBOSE) console.log(`UNMATCHED ${name} ${record.source}: ${record.moves}`);
    }
  }
  const existing = cases.reduce((sum, known) => sum + known.known.size, 0);
  const extra = cases.reduce((sum, known) => sum + known.added.size, 0);
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
