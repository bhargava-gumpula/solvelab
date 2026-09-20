/**
 * Checks a list of COLL algorithms against the cube and writes the set.
 *
 * Reads "Name: algorithm" lines. The first algorithm of a case that forms a
 * proper COLL case defines it; the rest have to solve that same case, or they
 * are dropped. Nothing is published that the engine can't confirm.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { applyAlgorithm, getFace } from "@/lib/cube/cube-state";
import { caseStateOf, checkAlgorithm, cornersSolved } from "@/lib/cube/case-check";

const GROUPS: Record<string, string> = {
  AS: "Antisune",
  S: "Sune",
  L: "L",
  U: "U",
  T: "T",
  Pi: "Pi",
  H: "H",
};

const entries = new Map<string, string[]>();
for (const line of readFileSync(process.env.IN!, "utf8").split("\n")) {
  const match = /^([A-Za-z]+) (\d+): (.+)$/.exec(line.trim());
  if (!match) continue;
  const [, group, number, moves] = match as unknown as [string, string, string, string];
  const key = `${group} ${number}`;
  entries.set(key, [...(entries.get(key) ?? []), moves.trim()]);
}
console.log(`${entries.size} cases read`);

/** Which corners sit where, ignoring the edges, as seen from the best angle. */
function cornerSignature(state: string): string {
  return ["", "U", "U2", "U'"]
    .map((turn) => {
      const view = turn ? applyAlgorithm(turn, state) : state;
      const up = getFace(view, "U");
      const sides = (["R", "F", "L", "B"] as const)
        .map((face) => {
          const top = getFace(view, face);
          return `${top[0]}${top[2]}`;
        })
        .join("");
      return `${up[0]}${up[2]}${up[6]}${up[8]}${sides}`;
    })
    .sort()[0]!;
}

const cases: { key: string; group: string; number: number; moves: string[] }[] = [];
const signatures = new Map<string, string>();
let dropped = 0;

for (const [key, algorithms] of entries) {
  const [group, number] = key.split(" ") as [string, string];
  let state: string | null = null;
  const kept: string[] = [];
  for (const moves of algorithms) {
    if (state === null) {
      try {
        const candidate = caseStateOf(moves, "coll");
        // A COLL case has its corners unsolved and its edges already oriented.
        if (cornersSolved(candidate)) {
          console.log(`SOLVED   ${key}: ${moves}`);
          dropped++;
          continue;
        }
        state = candidate;
        kept.push(moves);
      } catch {
        console.log(`BAD      ${key}: ${moves}`);
        dropped++;
      }
      continue;
    }
    if (checkAlgorithm(state, moves, "coll").ok) kept.push(moves);
    else {
      console.log(`FAIL     ${key}: ${moves}`);
      dropped++;
    }
  }
  if (state === null || kept.length === 0) {
    console.log(`NO CASE  ${key}`);
    continue;
  }
  const signature = cornerSignature(state);
  const seen = signatures.get(signature);
  if (seen) console.log(`DUPE     ${key} matches ${seen}`);
  signatures.set(signature, key);
  cases.push({ key, group, number: Number(number), moves: kept });
}

const order = Object.keys(GROUPS);
cases.sort((a, b) =>
  a.group === b.group ? a.number - b.number : order.indexOf(a.group) - order.indexOf(b.group),
);

const lines = [
  'import type { AlgorithmSetData } from "../types";',
  "",
  "/**",
  " * COLL: the last layer's corners solved in one look, while the edges stay",
  " * oriented. Used after the edges are already facing up, so only a PLL of the",
  " * edges is left.",
  " *",
  " * The algorithms are the community's, collected by SpeedCubeDB, and every one",
  " * is checked against the cube engine by `tests/unit/algorithms.test.ts`: it",
  " * must solve the case it is listed under, allowing a U turn either side. Any",
  " * that didn't were dropped rather than published.",
  " */",
  "export const coll: AlgorithmSetData = {",
  '  id: "coll",',
  '  name: "COLL",',
  '  kind: "coll",',
  "  cases: [",
];
for (const entry of cases) {
  const id = `coll-${entry.group.toLowerCase()}${entry.number}`;
  lines.push("    {");
  lines.push(`      id: "${id}",`);
  lines.push(`      name: "${entry.key}",`);
  lines.push(`      group: "${GROUPS[entry.group]}",`);
  lines.push("      algorithms: [");
  entry.moves.forEach((moves, index) => {
    lines.push(`        { id: "${id}-${index + 1}", moves: "${moves}" },`);
  });
  lines.push("      ],");
  lines.push("    },");
}
lines.push("  ],", "};", "");
writeFileSync(process.env.OUT ?? "data/algorithms/sets/coll.ts", lines.join("\n"));
console.log(
  `${cases.length} cases, ${cases.reduce((n, c) => n + c.moves.length, 0)} algorithms, ${dropped} dropped`,
);
