/**
 * Builds `data/algorithms/sets/f2l.ts` from the cube itself.
 *
 * An F2L case is any position where the front-right slot is the only thing
 * missing from the first two layers. Two positions are the same case when they
 * differ only by a turn of the top layer, because that turn is the solver's own
 * move. The cases are found by trying every sequence of R, U and F turns from a
 * solved cube, and each one is then solved by the same search, shortest first,
 * so the algorithms are the shortest that exist in those three faces.
 *
 * Run with `npm run ml:f2l`. It takes a few minutes.
 */
import { writeFileSync } from "node:fs";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { caseStateOf, firstTwoLayersSolved, otherSlotsSolved } from "@/lib/cube/case-check";

const MOVES = ["R", "U", "F"].flatMap((face) => ["", "'", "2"].map((turn) => `${face}${turn}`));

const CORNERS: Record<string, [number, number, number]> = {
  DFR: [29, 26, 15],
  UBR: [2, 45, 11],
  UFL: [6, 18, 38],
  ULB: [0, 36, 47],
  URF: [8, 9, 20],
};
const EDGES: Record<string, [number, number]> = {
  FR: [23, 12],
  UB: [1, 46],
  UF: [7, 19],
  UL: [3, 37],
  UR: [5, 10],
};

function rawSignature(facelets: string): string | null {
  let corner = "";
  for (const [name, spots] of Object.entries(CORNERS)) {
    const stickers = spots.map((spot) => facelets[spot]!);
    if (new Set(stickers).size !== 3) continue;
    if (!stickers.includes("D") || !stickers.includes("F") || !stickers.includes("R")) continue;
    corner = `${name}${stickers.indexOf("D")}`;
    break;
  }
  let edge = "";
  for (const [name, spots] of Object.entries(EDGES)) {
    const stickers = spots.map((spot) => facelets[spot]!);
    if (stickers.includes("F") && stickers.includes("R")) {
      edge = `${name}${stickers.indexOf("F")}`;
      break;
    }
  }
  return corner && edge ? `${corner}|${edge}` : null;
}

/** The case as seen from the alignment that reads smallest. */
function signature(facelets: string): string | null {
  const views = ["", "U", "U2", "U'"].map((turn) =>
    rawSignature(turn ? applyAlgorithm(turn, facelets) : facelets),
  );
  if (views.some((view) => view === null)) return null;
  return (views as string[]).sort()[0]!;
}

const isCase = (state: string) => otherSlotsSolved(state) && !firstTwoLayersSolved(state);

/** Every case within `limit` turns of the given position. */
function collect(from: string, limit: number, into: Map<string, string>, wanted?: Set<string>) {
  const path: string[] = [];
  const walk = (state: string, depth: number): void => {
    if (wanted && wanted.size === 0) return;
    if (depth > 0 && isCase(state)) {
      const key = signature(state);
      if (key && !into.has(key) && (!wanted || wanted.has(key))) {
        into.set(key, state);
        wanted?.delete(key);
      }
    }
    if (depth === limit) return;
    for (const move of MOVES) {
      if (path.length > 0 && path.at(-1)![0] === move[0]) continue;
      path.push(move);
      walk(applyAlgorithm(move, state), depth + 1);
      path.pop();
      if (wanted && wanted.size === 0) return;
    }
  };
  walk(from, 0);
}

const cases = new Map<string, string>();
collect(SOLVED_FACELETS, Number(process.env.DEPTH ?? 8), cases);
console.log(`search found ${cases.size}`);

/** Classic algorithms reach the cases that a short search doesn't. */
const CLASSIC = [
  "R U' R' U' R U R' U2 R U' R'",
  "R U R' U' R U R' U' R U R'",
  "F' U F U F' U' F U2 F' U F",
  "R U2 R' U' R U R' U' R U R'",
  "R U' R' U R U' R' U2 R U' R'",
];
for (const moves of CLASSIC) {
  const state = caseStateOf(moves, "f2l");
  const key = signature(state);
  if (key && !cases.has(key)) cases.set(key, state);
}

/** The stragglers: both pieces stuck in the slot. Walk out from what is known. */
const placements: string[] = [];
for (const corner of Object.keys(CORNERS)) {
  for (let cornerTwist = 0; cornerTwist < 3; cornerTwist++) {
    for (const edge of Object.keys(EDGES)) {
      for (let edgeFlip = 0; edgeFlip < 2; edgeFlip++) {
        placements.push(`${corner}${cornerTwist}|${edge}${edgeFlip}`);
      }
    }
  }
}
const covered = new Set<string>(["DFR0|FR0"]);
for (const [, state] of cases) {
  for (const turn of ["", "U", "U2", "U'"]) {
    const raw = rawSignature(turn ? applyAlgorithm(turn, state) : state);
    if (raw) covered.add(raw);
  }
}
const missing = new Set(placements.filter((key) => !covered.has(key)));
if (missing.size > 0) {
  console.log(`walking out for ${[...missing].join(" ")}`);
  for (const [, state] of [...cases]) {
    if (missing.size === 0) break;
    collect(state, 6, cases, missing);
  }
}
console.log(`${cases.size} cases in all`);

/** The shortest algorithms for a case, in R, U and F. */
const PER_CASE = 4;
function solve(start: string): { depth: number; solutions: string[] } {
  for (let limit = 1; limit <= Number(process.env.MAX_DEPTH ?? 11); limit++) {
    const solutions: string[] = [];
    const moves: string[] = [];
    const search = (state: string, depth: number): void => {
      if (solutions.length >= PER_CASE) return;
      if (depth === limit) {
        if (firstTwoLayersSolved(state)) solutions.push(moves.join(" "));
        return;
      }
      for (const move of MOVES) {
        if (moves.length > 0 && moves.at(-1)![0] === move[0]) continue;
        moves.push(move);
        search(applyAlgorithm(move, state), depth + 1);
        moves.pop();
        if (solutions.length >= PER_CASE) return;
      }
    };
    search(start, 0);
    if (solutions.length > 0) return { depth: limit, solutions };
  }
  return { depth: 0, solutions: [] };
}

const rows = [...cases]
  .filter(([key]) => key !== "DFR0|FR0")
  .map(([key, state]) => {
    const solved = solve(state);
    console.log(`${key.padEnd(16)} ${String(solved.depth).padStart(2)}  ${solved.solutions[0]}`);
    return { key, state, ...solved };
  });

const CORNER_WHERE: Record<string, string> = {
  URF: "above the slot, at the front right",
  UFL: "at the front left",
  ULB: "at the back left",
  UBR: "at the back right",
  DFR: "already in the slot",
};
const CORNER_FACE: Record<string, [string, string]> = {
  URF: ["facing you", "facing right"],
  UFL: ["facing left", "facing you"],
  ULB: ["facing back", "facing left"],
  UBR: ["facing right", "facing back"],
  DFR: ["facing you", "facing right"],
};
const EDGE_WHERE: Record<string, string> = {
  UR: "on the right",
  UF: "at the front",
  UL: "on the left",
  UB: "at the back",
  FR: "already in the slot",
};

function describe(state: string): { group: string; text: string } {
  const [cornerPart, edgePart] = (rawSignature(state) ?? "").split("|") as [string, string];
  const cornerAt = cornerPart.slice(0, 3);
  const cornerOri = Number(cornerPart.slice(3));
  const edgeAt = edgePart.slice(0, 2);
  const edgeOri = Number(edgePart.slice(2));
  const cornerInSlot = cornerAt === "DFR";
  const edgeInSlot = edgeAt === "FR";

  const cornerSide =
    cornerOri === 0
      ? cornerInSlot
        ? "the right way round"
        : "its bottom colour pointing up"
      : `its bottom colour ${CORNER_FACE[cornerAt]![cornerOri - 1]}`;
  const edgeSide = edgeInSlot
    ? edgeOri === 0
      ? "the right way round"
      : "flipped"
    : edgeOri === 0
      ? "its front colour pointing up"
      : "its front colour facing out";

  const group = cornerInSlot
    ? edgeInSlot
      ? "Both stuck in the slot"
      : "Corner in the slot, edge on top"
    : edgeInSlot
      ? "Edge in the slot, corner on top"
      : "Both on top";
  return {
    group,
    text: `Corner ${CORNER_WHERE[cornerAt]}, ${cornerSide}. Edge ${EDGE_WHERE[edgeAt]}, ${edgeSide}.`,
  };
}

const GROUP_ORDER = [
  "Both on top",
  "Corner in the slot, edge on top",
  "Edge in the slot, corner on top",
  "Both stuck in the slot",
];

const cases2 = rows
  .filter((row) => row.solutions.length > 0)
  .map((row) => ({ ...row, ...describe(row.state) }))
  .sort((a, b) => {
    const byGroup = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
    if (byGroup !== 0) return byGroup;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.key.localeCompare(b.key);
  });

const lines = [
  'import type { AlgorithmSetData } from "../types";',
  "",
  "/**",
  " * The 41 ways the last pair can sit before it goes in.",
  " *",
  " * The cases were worked out from the cube itself rather than copied: every",
  " * position where the front-right slot is the only thing missing, counted once",
  " * per way the pair can sit, since turning the top layer first is the solver's",
  " * own move. The algorithms are the shortest there are in R, U and F turns, so",
  " * they stay on the right-hand side and keep the rest of the first two layers.",
  " */",
  "export const f2l: AlgorithmSetData = {",
  '  id: "f2l",',
  '  name: "F2L",',
  '  kind: "f2l",',
  "  cases: [",
];
cases2.forEach((entry, index) => {
  const number = index + 1;
  lines.push("    {");
  lines.push(`      id: "f2l-${number}",`);
  lines.push(`      name: "F2L ${number}",`);
  lines.push(`      group: "${entry.group}",`);
  lines.push(`      recognition: "${entry.text}",`);
  lines.push("      algorithms: [");
  entry.solutions.forEach((moves, position) => {
    lines.push(`        { id: "f${number}-${position + 1}", moves: "${moves}" },`);
  });
  lines.push("      ],");
  lines.push("    },");
});
lines.push("  ],", "};", "");
writeFileSync(process.env.OUT ?? "data/algorithms/sets/f2l.ts", lines.join("\n"));
console.log(
  `${cases2.length} cases, ${cases2.reduce((n, c) => n + c.solutions.length, 0)} algorithms`,
);
