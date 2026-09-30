/**
 * Builds the ZBLL set from algorithms gathered from several published lists.
 *
 *   IN=records.json node ml/scripts/run.mjs ml/zbll/build-zbll.ts
 *
 * `records.json` is what the extractors in this folder write: one record per
 * algorithm as a source lists it ({ source, label?, moves, votes? }). Sources
 * number their cases differently, so nothing here trusts a label to say which
 * case an algorithm is for: the cube engine works that out. Two algorithms are
 * for the same case when one solves the other's case, allowing a turn of the
 * top before and after.
 *
 * Before counting, each algorithm is normalised so the same one written two ways
 * is kept once: brackets and repeats expanded, turns cancelled, the set-up and
 * finishing turns of the top taken off, and a leading y dropped when the moves
 * still solve the case without it (the picture shows the angle instead).
 *
 * An algorithm is dropped, and counted against its source, when it can't be
 * read, disturbs the first two layers, doesn't start from oriented edges, does
 * nothing, or is listed under a SpeedCubeDB case it doesn't solve.
 *
 * Writes the set (data/algorithms/sets/zbll-data.ts), a small summary the set
 * list reads without loading the set (data/algorithms/sets/zbll-summary.ts), and
 * a report of what was kept and dropped (REPORT, default zbll-report.json).
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { algorithmsFor, getAlgorithmSet } from "@/lib/algorithms/catalog";
import {
  caseStateOf,
  checkAlgorithm,
  lastLayerEdgesOriented,
  lastLayerOriented,
  standUp,
} from "@/lib/cube/case-check";
import { applyAlgorithm, getFace, isSolved, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { canonicalKey } from "@/lib/algorithms/canonical";
import { length, readMoves, spellings, levelled, finishesUpright, text } from "./normalise";

interface SourceRecord {
  source: string;
  label?: string;
  moves: string;
  votes?: number;
}

const records: SourceRecord[] = JSON.parse(readFileSync(process.env.IN!, "utf8")).records;
console.log(`${records.length} records read`);

const AUF = ["", "U", "U2", "U'"] as const;

// ---------------------------------------------------------------- cases

/**
 * Every view of the case an algorithm solves, allowing a top turn before and
 * after. The turn after is made on a solved cube before undoing the algorithm,
 * so it is a turn of the last layer even when the algorithm finishes tipped over.
 */
function views(moves: string): string[] {
  const parsed = parseAlgorithm(moves);
  if (!parsed.ok) throw new Error(`Unreadable: ${moves}`);
  const undo = formatAlgorithm(invertAlgorithm(parsed.moves));
  const out: string[] = [];
  for (const after of AUF) {
    const start = after ? applyAlgorithm(after, SOLVED_FACELETS) : SOLVED_FACELETS;
    const state = standUp(applyAlgorithm(undo, start));
    if (!state) throw new Error(`${moves} does not leave the first two layers alone`);
    for (const before of AUF) out.push(before ? applyAlgorithm(before, state) : state);
  }
  return out;
}

const signatureOf = (moves: string) => views(moves).sort()[0]!;

/** Which corners are where and how they face, whatever the edges do. */
function cornerKey(state: string): string {
  const up = getFace(state, "U");
  const sides = (["R", "F", "L", "B"] as const)
    .map((face) => {
      const top = getFace(state, face);
      return `${top[0]}${top[2]}`;
    })
    .join("");
  return `${up[0]}${up[2]}${up[6]}${up[8]}${sides}`;
}

/** The COLL case with the same corners, found through every view of both. */
const coll = getAlgorithmSet("coll")!;
const collByCorners = new Map<string, { name: string; group: string }>();
for (const entry of coll.cases) {
  for (const view of views(algorithmsFor(entry)[0]!.moves)) {
    collByCorners.set(cornerKey(view), { name: entry.name, group: entry.group });
  }
}

function collFor(moves: string): { name: string; group: string } | null {
  for (const view of views(moves)) {
    const found = collByCorners.get(cornerKey(view));
    if (found) return found;
  }
  return null;
}

const pll = getAlgorithmSet("pll")!;
const pllBySignature = new Map<string, string>();
for (const entry of pll.cases)
  pllBySignature.set(signatureOf(entry.algorithms[0]!.moves), entry.id);

// ---------------------------------------------------------------- gather

/**
 * Why an algorithm was left out. The first three aren't mistakes: some sources
 * are whole method documents, with last-slot algorithms and last layers whose
 * edges aren't oriented next to their ZBLL. The rest are errors in the source.
 */
type Drop =
  | "not ZBLL: an F2L or last-slot algorithm"
  | "not ZBLL: edges not oriented"
  | "does nothing"
  | "unreadable"
  | "breaks F2L"
  | "wrong case";
const drops = new Map<string, Map<Drop, number>>();
const drop = (source: string, why: Drop, moves: string) => {
  const bySource = drops.get(source) ?? new Map<Drop, number>();
  bySource.set(why, (bySource.get(why) ?? 0) + 1);
  drops.set(source, bySource);
  if (process.env.VERBOSE) console.log(`DROP ${source} ${why}: ${moves}`);
};

interface Found {
  /** The key every spelling of this algorithm round the cube shares. */
  key: string;
  /** Each spelling seen, and which sources wrote it that way. */
  spellings: Map<string, Set<string>>;
  sources: Set<string>;
  votes: number;
}
interface CaseFound {
  signature: string;
  pll?: string;
  names: Map<string, number>;
  algorithms: Map<string, Found>;
}
const cases = new Map<string, CaseFound>();
const scdbCase = new Map<string, string>();
const signatureCache = new Map<string, string>();
const read = { kept: 0, records: 0 };

function normalise(raw: string, source: string): { moves: string; signature: string } | null {
  const read = readMoves(raw);
  if (!read) {
    drop(source, "unreadable", raw);
    return null;
  }
  const full = levelled(read);
  let signature = signatureCache.get(text(full));
  if (signature === undefined) {
    try {
      signature = signatureOf(text(full));
    } catch {
      // One pair short, in any of the four slots, makes it an F2L or last-slot algorithm.
      const slotAlgorithm = [
        ["", ""],
        ["y", "y'"],
        ["y2", "y2"],
        ["y'", "y"],
      ].some(([turn, back]) => {
        try {
          caseStateOf(turn ? `${turn} ${text(full)} ${back}` : text(full), "f2l");
          return true;
        } catch {
          return false;
        }
      });
      drop(source, slotAlgorithm ? "not ZBLL: an F2L or last-slot algorithm" : "breaks F2L", raw);
      return null;
    }
    signatureCache.set(text(full), signature);
  }
  const state = caseStateOf(text(full), "pll");
  if (isSolved(state)) {
    drop(source, "does nothing", raw);
    return null;
  }
  if (!lastLayerEdgesOriented(state)) {
    drop(source, "not ZBLL: edges not oriented", raw);
    return null;
  }
  // The shortest spelling that still solves this case.
  for (const candidate of spellings(full)) {
    const moves = text(candidate);
    // It must also stand alone, since any algorithm may become a case's first.
    if (!finishesUpright(moves) || !checkAlgorithm(state, moves, "pll").ok) continue;
    try {
      caseStateOf(moves, "pll");
    } catch {
      continue;
    }
    return { moves, signature };
  }
  return { moves: text(full), signature };
}

for (const record of records) {
  read.records++;
  const found = normalise(record.moves, record.source);
  if (!found) continue;
  const known = cases.get(found.signature) ?? {
    signature: found.signature,
    names: new Map<string, number>(),
    algorithms: new Map<string, Found>(),
  };
  if (record.source === "speedcubedb" && record.label) {
    known.names.set(record.label, (known.names.get(record.label) ?? 0) + 1);
  }
  cases.set(found.signature, known);
  const key = canonicalKey(found.moves);
  const algorithm = known.algorithms.get(key) ?? {
    key,
    spellings: new Map<string, Set<string>>(),
    sources: new Set<string>(),
    votes: 0,
  };
  algorithm.sources.add(record.source);
  const spelledBy = algorithm.spellings.get(found.moves) ?? new Set<string>();
  spelledBy.add(record.source);
  algorithm.spellings.set(found.moves, spelledBy);
  algorithm.votes = Math.max(algorithm.votes, record.votes ?? 0);
  known.algorithms.set(key, algorithm);
  read.kept++;
}

// Each case is named after the SpeedCubeDB case most of its algorithms were listed under.
for (const known of cases.values()) {
  const best = [...known.names].sort((a, b) => b[1] - a[1])[0];
  if (best) scdbCase.set(known.signature, best[0]);
}

// A SpeedCubeDB algorithm listed under a different case than the one it solves.
for (const record of records) {
  if (record.source !== "speedcubedb" || !record.label) continue;
  const again = normalise(record.moves, "__recheck");
  if (!again) continue;
  const signature = again.signature;
  if (scdbCase.get(signature) !== record.label) {
    const known = cases.get(signature)!;
    const moves = again.moves;
    const key = moves ? canonicalKey(moves) : undefined;
    const algorithm = key ? known.algorithms.get(key) : undefined;
    if (algorithm) {
      algorithm.sources.delete("speedcubedb");
      algorithm.spellings.get(moves!)?.delete("speedcubedb");
      if (algorithm.sources.size === 0) known.algorithms.delete(key!);
    }
    drop("speedcubedb", "wrong case", record.moves);
  }
}
drops.delete("__recheck");

// ---------------------------------------------------------------- write

const SET_ORDER = ["T", "U", "L", "Pi", "H", "Sune", "Antisune"];
interface OutCase {
  id: string;
  name: string;
  group: string;
  order: [number, number, number];
  sameAs?: string;
  algorithms: { id: string; moves: string }[];
}

/** Moves that make you reach round the cube: fewer is easier to hold. */
const awkward = (moves: string) => ({
  frontBack: moves.split(" ").filter((move) => /^[FBfb]/.test(move)).length,
  leftDown: moves.split(" ").filter((move) => /^[LDld]/.test(move)).length,
});

/** The spelling to show: the one most sources use, then the one easiest to hold. */
function spellingOf(algorithm: Found): string {
  return [...algorithm.spellings]
    .filter(([, sources]) => sources.size > 0)
    .sort(
      ([a, aSources], [b, bSources]) =>
        bSources.size - aSources.size ||
        awkward(a).frontBack - awkward(b).frontBack ||
        awkward(a).leftDown - awkward(b).leftDown ||
        a.localeCompare(b),
    )[0]![0];
}

/** An algorithm's id comes from its key, so it survives a change of spelling or order. */
const idOf = (moves: string) =>
  `zb-${createHash("sha256").update(moves).digest("hex").slice(0, 10)}`;

const out: OutCase[] = [];
const unnamed: string[] = [];
for (const known of cases.values()) {
  if (known.algorithms.size === 0) continue;
  const first = spellingOf([...known.algorithms.values()][0]!);
  const state = caseStateOf(first, "pll");
  if (lastLayerOriented(state)) {
    const sameAs = pllBySignature.get(known.signature);
    if (!sameAs) throw new Error(`An oriented case that isn't a PLL: ${first}`);
    const entry = pll.cases.find((pllCase) => pllCase.id === sameAs)!;
    out.push({
      id: `zbll-${sameAs}`,
      name: entry.name,
      group: "PLL",
      order: [SET_ORDER.length, 0, pll.cases.indexOf(entry)],
      sameAs,
      algorithms: [],
    });
    continue;
  }
  const name = scdbCase.get(known.signature);
  const collCase = collFor(first);
  if (!name || !collCase) {
    unnamed.push(first);
    continue;
  }
  const [, setShort, number] = /^ZBLL (\w+) (\d+)$/.exec(name)!;
  const ranked = [...known.algorithms.values()]
    .map((algorithm) => ({ ...algorithm, moves: spellingOf(algorithm) }))
    .sort(
      (a, b) =>
        b.sources.size - a.sources.size ||
        b.votes - a.votes ||
        length(a.moves) - length(b.moves) ||
        a.moves.localeCompare(b.moves),
    );
  const collNumber = Number(/(\d+)$/.exec(collCase.name)![1]);
  // COLL marks two of its groups optional; in ZBLL they are just the set's names.
  const setName = collCase.group.replace(/ \(optional\)$/, "");
  out.push({
    id: `zbll-${setShort!.toLowerCase()}-${number}`,
    name: `${setShort} ${number}`,
    group: `${setName} · COLL ${collCase.name}`,
    order: [SET_ORDER.indexOf(setName), collNumber, Number(number)],
    algorithms: ranked.map((algorithm) => ({ id: idOf(algorithm.key), moves: algorithm.moves })),
  });
}
// The PLLs are the edges-oriented cases with nothing to orient: the full PLL set's own.
const pllCovered = new Set(out.filter((entry) => entry.sameAs).map((entry) => entry.sameAs));
for (const [index, entry] of pll.cases.entries()) {
  if (pllCovered.has(entry.id)) continue;
  out.push({
    id: `zbll-${entry.id}`,
    name: entry.name,
    group: "PLL",
    order: [SET_ORDER.length, 0, index],
    sameAs: entry.id,
    algorithms: [],
  });
}

out.sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1] || a.order[2] - b.order[2]);

const ids = new Set(out.map((entry) => entry.id));
if (ids.size !== out.length) throw new Error("Two cases share an id");
for (const entry of out) {
  const algIds = new Set(entry.algorithms.map((algorithm) => algorithm.id));
  if (algIds.size !== entry.algorithms.length) throw new Error(`Id collision in ${entry.id}`);
}

const zbllCases = out.filter((entry) => !entry.sameAs);
const total = zbllCases.reduce((sum, entry) => sum + entry.algorithms.length, 0);

const lines = [
  "// Generated by ml/zbll/build-zbll.ts. Edit the builder, not this file.",
  'import type { AlgorithmSetData } from "../types";',
  "",
  "export const zbll: AlgorithmSetData = {",
  '  id: "zbll",',
  '  name: "ZBLL",',
  '  kind: "pll",',
  "  cases: [",
];
for (const entry of out) {
  const sameAs = entry.sameAs ? `, sameAs: ${JSON.stringify(entry.sameAs)}` : "";
  const algorithms = entry.algorithms
    .map(
      (algorithm) =>
        `{ id: ${JSON.stringify(algorithm.id)}, moves: ${JSON.stringify(algorithm.moves)} }`,
    )
    .join(", ");
  lines.push(
    `    { id: ${JSON.stringify(entry.id)}, name: ${JSON.stringify(entry.name)}, group: ${JSON.stringify(entry.group)}${sameAs}, algorithms: [${algorithms}] },`,
  );
}
lines.push("  ],", "};", "");
writeFileSync(process.env.OUT ?? "data/algorithms/sets/zbll-data.ts", lines.join("\n"));

writeFileSync(
  process.env.SUMMARY ?? "data/algorithms/sets/zbll-summary.ts",
  [
    "// Generated by ml/zbll/build-zbll.ts: what the set list shows without loading the set.",
    `export const ZBLL_SUMMARY = { cases: ${out.length}, algorithms: ${total} } as const;`,
    "",
    "/** What each case's label is saved against: a PLL case shares its label with full PLL. */",
    `export const ZBLL_PROGRESS_IDS: readonly string[] = ${JSON.stringify(out.map((entry) => entry.sameAs ?? entry.id))};`,
    "",
  ].join("\n"),
);

const report = {
  records: read.records,
  kept: read.kept,
  cases: out.length,
  zbllCases: zbllCases.length,
  pllCases: out.length - zbllCases.length,
  algorithms: total,
  average: Number((total / zbllCases.length).toFixed(1)),
  fewest: Math.min(...zbllCases.map((entry) => entry.algorithms.length)),
  most: Math.max(...zbllCases.map((entry) => entry.algorithms.length)),
  unnamed: unnamed.length,
  drops: Object.fromEntries([...drops].map(([source, why]) => [source, Object.fromEntries(why)])),
  bySource: Object.fromEntries(
    [...new Set(records.map((record) => record.source))].map((source) => [
      source,
      [...cases.values()].reduce(
        (sum, known) =>
          sum + [...known.algorithms.values()].filter((found) => found.sources.has(source)).length,
        0,
      ),
    ]),
  ),
};
writeFileSync(process.env.REPORT ?? "zbll-report.json", JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
if (unnamed.length) console.log("UNNAMED", unnamed.slice(0, 10));
