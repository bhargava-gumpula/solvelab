/**
 * Checks Winter Variation algorithms against the cube and writes the set.
 *
 * A WV case has the last pair joined on top with the last layer's edges already
 * facing up; the algorithm puts the pair in and brings the corners up at the
 * same time, leaving only a PLL.
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  caseStateOf,
  checkAlgorithm,
  lastLayerOriented,
  pairStickers,
} from "@/lib/cube/case-check";

/**
 * The last layer's own edges face up. The pair's edge is waiting up there too,
 * and it isn't one of them, so it doesn't count.
 */
function layerEdgesOriented(state: string): boolean {
  const pair = new Set(pairStickers(state));
  return [1, 3, 5, 7].every((spot) => pair.has(spot) || state[spot] === "U");
}

const entries = new Map<string, string[]>();
for (const line of readFileSync(process.env.IN!, "utf8").split("\n")) {
  const match = /^WV (\d+): (.+)$/.exec(line.trim());
  if (!match) continue;
  const [, number, moves] = match as unknown as [string, string, string];
  entries.set(number, [...(entries.get(number) ?? []), moves.trim()]);
}

const cases: { number: number; moves: string[]; oriented: boolean }[] = [];
let dropped = 0;
for (const [number, algorithms] of entries) {
  let state: string | null = null;
  const kept: string[] = [];
  for (const moves of algorithms) {
    if (state === null) {
      try {
        state = caseStateOf(moves, "wv");
        if (lastLayerOriented(state)) {
          console.log(`SOLVED  WV ${number}: ${moves}`);
          state = null;
          dropped++;
          continue;
        }
        kept.push(moves);
      } catch (error) {
        console.log(`BAD     WV ${number}: ${moves} (${String(error).slice(0, 60)})`);
        dropped++;
      }
      continue;
    }
    if (checkAlgorithm(state, moves, "wv").ok) kept.push(moves);
    else {
      console.log(`FAIL    WV ${number}: ${moves}`);
      dropped++;
    }
  }
  if (state === null || kept.length === 0) continue;
  // The edges should already be up: that is the whole premise of the set.
  const oriented = layerEdgesOriented(state);
  if (!oriented) console.log(`EDGES   WV ${number}: the edges aren't oriented in this case`);
  cases.push({ number: Number(number), moves: kept, oriented });
}
cases.sort((a, b) => a.number - b.number);

const lines = [
  'import type { AlgorithmSetData } from "../types";',
  "",
  "/**",
  " * Winter Variation: the last pair goes in and the last layer's corners come",
  " * up in the same algorithm, for when the edges are already facing up. What's",
  " * left is a PLL.",
  " *",
  " * The algorithms are the community's, collected by SpeedCubeDB, and every one",
  " * is checked against the cube engine by `tests/unit/algorithms.test.ts`.",
  " */",
  "export const wv: AlgorithmSetData = {",
  '  id: "wv",',
  '  name: "Winter Variation",',
  '  kind: "wv",',
  "  cases: [",
];
for (const entry of cases) {
  lines.push("    {");
  lines.push(`      id: "wv-${entry.number}",`);
  lines.push(`      name: "WV ${entry.number}",`);
  lines.push('      group: "Insert and orient",');
  lines.push("      algorithms: [");
  entry.moves.forEach((moves, index) => {
    lines.push(`        { id: "wv${entry.number}-${index + 1}", moves: "${moves}" },`);
  });
  lines.push("      ],");
  lines.push("    },");
}
lines.push("  ],", "};", "");
writeFileSync(process.env.OUT ?? "data/algorithms/sets/wv.ts", lines.join("\n"));
console.log(
  `${cases.length} cases, ${cases.reduce((n, c) => n + c.moves.length, 0)} algorithms, ${dropped} dropped`,
);
