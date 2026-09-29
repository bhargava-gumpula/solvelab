import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { algorithmSets } from "@/data/algorithms/sets";
import {
  ALGORITHM_SETS,
  algorithmsFor,
  caseStateFor,
  getAlgorithmSet,
  getCase,
  kindFor,
} from "@/lib/algorithms/catalog";
import { AUF, checkAlgorithm, pairStickers, solvesFromHere } from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { cornersFacingUp, edgesFacingUp, type Side } from "@/lib/cube/describe";

/*
 * Audit 6.4 items 54 and 55: F2L cases carry the numbers the rest of the
 * cubing world uses, OLL groups use the standard shape names, and no case
 * lists the same algorithm twice with only a turn of the top added.
 */

/**
 * SpeedCubeDB's set-up for each of its F2L cases, applied to a solved cube in
 * the solving hold (white cross on D, green on F).
 */
const SPEEDCUBEDB_SETUP: Record<number, string> = {
  1: "F R' F' R",
  2: "R' F R F'",
  3: "F' U F",
  4: "R U' R'",
  5: "R U R' U2 R U' R' U",
  6: "F' U' F U2 F' U F U'",
  7: "R U R' U2 R U2 R' U",
  8: "r' U' R2 U' R2 U2 r",
  9: "F' U F U' R U R' U",
  10: "R U' R' U' R U' R' U",
  11: "F' U F U' R U2 R' U",
  12: "R U R' U2 R U R' U' R U R'",
  13: "r U2 R' U R U' R' U M",
  14: "R U' R' U' R U R' U",
  15: "R U R' U' R U R' U2 R U' R'",
  16: "F' U F U2 R U R'",
  17: "R U' R' U R U2 R'",
  18: "R U R' U' R U R' F R' F' R",
  19: "R U R' U' R U2 R' U'",
  20: "R U R' F R' F' R2 U R' U",
  21: "R U' R' U2 R U R'",
  22: "F' L' U2 L F",
  23: "R U' R' U R U' R' U2 R U' R'",
  24: "R U R' F R U R' U' F'",
  25: "F' R U R' U' R' F R",
  26: "F' U' F U R U R' U'",
  27: "R U R' U' R U R'",
  28: "R' F R F' U R U' R'",
  29: "F R' F' R F R' F' R",
  30: "R U' R' U R U' R'",
  31: "R U R' F R' F' R U",
  32: "R U' R' U R U' R' U R U' R'",
  33: "R U R' U2 R U R' U",
  34: "R U' R' U2 R U' R' U'",
  35: "F' U F U' R U' R' U",
  36: "R U' R' U2 F R' F' R U2",
  37: "R U' R U2 F R2 F' U2 R2",
  38: "R U' R' U R U2 R' U R U' R'",
  39: "R U' R' U' R U R' U2 R U' R'",
  40: "R U R' F U R U' R' F' R U R'",
  41: "R F U R U' R' F' U' R'",
};

/** Only the stickers of the front-right pair; the last layer doesn't matter yet. */
const pairOnly = (state: string) => {
  const keep = new Set(pairStickers(state));
  return [...state].map((sticker, index) => (keep.has(index) ? sticker : ".")).join("");
};
/** The pair's position, whichever way the top layer is turned. */
const pairSignature = (state: string) =>
  AUF.map((turn) => pairOnly(turn ? applyAlgorithm(turn, state) : state))
    .sort()
    .at(0)!;

describe("F2L numbers (audit 6.4 item 54)", () => {
  const f2l = getAlgorithmSet("f2l")!;
  const numberOf = (id: string) => {
    const aliases = getCase("f2l", id)!.aliases ?? [];
    expect(aliases, id).toHaveLength(1);
    const match = /^SpeedCubeDB (\d+)$/.exec(aliases[0]!);
    expect(match, id).not.toBeNull();
    return Number(match![1]);
  };

  it("gives every case its SpeedCubeDB number, each number once", () => {
    const numbers = f2l.cases.map((entry) => numberOf(entry.id));
    expect([...numbers].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 41 }, (_, index) => index + 1),
    );
  });

  it("matches each number to the same pair on the engine", () => {
    for (const entry of f2l.cases) {
      const number = numberOf(entry.id);
      const theirs = applyAlgorithm(SPEEDCUBEDB_SETUP[number]!, SOLVED_FACELETS);
      const ours = caseStateFor(entry, "f2l");
      expect(pairSignature(ours), `${entry.name} = SpeedCubeDB ${number}`).toBe(
        pairSignature(theirs),
      );
      // And the default solves their set-up, allowing a turn of the top.
      expect(checkAlgorithm(theirs, algorithmsFor(entry)[0]!.moves, "f2l").ok, entry.id).toBe(true);
    }
    // The check can fail: two different cases never share a pair signature.
    const signatures = new Set(f2l.cases.map((entry) => pairSignature(caseStateFor(entry, "f2l"))));
    expect(signatures.size).toBe(41);
  });

  it("agrees with every number pair the fast-end pack quotes", () => {
    const pack = readFileSync(join(process.cwd(), "data/training/packs/fast-end.ts"), "utf8");
    const quoted = [...pack.matchAll(/SolveLab's F2L (\d+) \(SpeedCubeDB (\d+)\)/g)];
    expect(quoted.length).toBeGreaterThan(5);
    for (const [, ours, theirs] of quoted) {
      expect(numberOf(`f2l-${ours}`), `F2L ${ours}`).toBe(Number(theirs));
    }
    expect(pack).toContain("SpeedCubeDB's 39 is SolveLab's F2L 40");
    expect(numberOf("f2l-40")).toBe(39);
  });

  it("says the cases are for every pair and slot, and shows both numbers", () => {
    const description = algorithmSets.find((set) => set.id === "f2l")!.description;
    expect(description).toContain("A reference for after intuitive F2L");
    expect(description).toContain("The same cases come up for every pair and every slot");
    expect(description).toContain("each is shown at the front-right slot");
    expect(description).toContain("each also shows its SpeedCubeDB number");
    const header = readFileSync(join(process.cwd(), "data/algorithms/sets/f2l.ts"), "utf8");
    expect(header).not.toContain("The 41 ways the last pair can sit");
    expect(header).toContain("The same\n * cases come up for every pair in every slot");
  });
});

describe("OLL groups (audit 6.4 item 55)", () => {
  const oll = getAlgorithmSet("oll")!;
  const members = (group: string) =>
    oll.cases
      .filter((entry) => entry.group === group)
      .map((entry) => Number(entry.id.replace("oll-", "")));
  const OPPOSITE: Record<Side, Side> = {
    front: "back",
    back: "front",
    left: "right",
    right: "left",
  };
  const diagonal = (corners: string[]) =>
    corners.length === 2 && corners[0]!.split("-").every((part) => !corners[1]!.includes(part));
  const view = (number: number) => {
    const entry = getCase("oll", `oll-${number}`)!;
    return caseStateFor(entry, "oll");
  };

  it("uses the standard names for the groups the audit named", () => {
    expect(members("T shapes")).toEqual([33, 45]);
    expect(members("Small lightning")).toEqual([7, 8, 11, 12]);
    expect(members("Big lightning")).toEqual([39, 40]);
    expect(members("Corners oriented")).toEqual([28, 57]);
    expect(members("I shapes")).toEqual([51, 52, 55, 56]);
    for (const old of ["Cross and T", "Lightning", "Other", "Line"]) {
      expect(members(old), old).toEqual([]);
    }
  });

  it("puts only cases of that shape in each renamed group", () => {
    for (const number of members("I shapes")) {
      const edges = edgesFacingUp(view(number));
      expect(edges, `OLL ${number}`).toHaveLength(2);
      expect(OPPOSITE[edges[0]!], `OLL ${number}`).toBe(edges[1]);
      expect(cornersFacingUp(view(number)), `OLL ${number}`).toEqual([]);
    }
    for (const number of members("Corners oriented")) {
      expect(cornersFacingUp(view(number)), `OLL ${number}`).toHaveLength(4);
      expect(edgesFacingUp(view(number)), `OLL ${number}`).toHaveLength(2);
    }
    for (const number of members("Small lightning")) {
      const edges = edgesFacingUp(view(number));
      expect(edges, `OLL ${number}`).toHaveLength(2);
      expect(OPPOSITE[edges[0]!], `OLL ${number}`).not.toBe(edges[1]);
      expect(cornersFacingUp(view(number)), `OLL ${number}`).toHaveLength(1);
    }
    for (const number of members("Big lightning")) {
      const edges = edgesFacingUp(view(number));
      expect(OPPOSITE[edges[0]!], `OLL ${number}`).toBe(edges[1]);
      expect(diagonal(cornersFacingUp(view(number))), `OLL ${number}`).toBe(true);
    }
    for (const number of members("T shapes")) {
      const state = view(number);
      const edges = edgesFacingUp(state);
      expect(OPPOSITE[edges[0]!], `OLL ${number}`).toBe(edges[1]);
      const corners = cornersFacingUp(state);
      expect(corners, `OLL ${number}`).toHaveLength(2);
      expect(diagonal(corners), `OLL ${number}`).toBe(false);
      // The up corners sit at one end of the line, making the T's bar.
      const shared = corners[0]!.split("-").find((part) => corners[1]!.includes(part));
      expect(edges, `OLL ${number}`).toContain(shared);
    }
  });
});

describe("no algorithm listed twice (audit 6.4 item 55)", () => {
  const TOP_TURN = /^U2?'?$/;
  const core = (moves: string) => {
    const tokens = moves.split(" ");
    while (tokens.length && TOP_TURN.test(tokens[0]!)) tokens.shift();
    while (tokens.length && TOP_TURN.test(tokens.at(-1)!)) tokens.pop();
    return tokens.join(" ");
  };

  it("never lists one algorithm again with only a turn of the top added", () => {
    const repeats: string[] = [];
    for (const set of ALGORITHM_SETS) {
      for (const entry of set.cases) {
        const seen = new Map<string, string>();
        for (const algorithm of entry.algorithms) {
          const key = core(algorithm.moves);
          if (seen.has(key)) repeats.push(`${entry.id}: ${seen.get(key)} and ${algorithm.id}`);
          else seen.set(key, algorithm.id);
        }
      }
    }
    expect(repeats).toEqual([]);
    const pll = getAlgorithmSet("pll")!;
    const ids = pll.cases.flatMap((entry) => entry.algorithms.map((algorithm) => algorithm.id));
    for (const gone of ["t-5", "ra-4", "jb-3"]) expect(ids, gone).not.toContain(gone);
  });

  it("keeps one Jb, whose note explains the U' on its end", () => {
    const jb = getCase("pll", "pll-jb")!;
    const withTurn = jb.algorithms.filter((algorithm) =>
      algorithm.moves.startsWith("R U R' F' R U R' U' R' F R2 U' R'"),
    );
    expect(withTurn).toHaveLength(1);
    const kept = withTurn[0]!;
    expect(kept.moves).toBe("R U R' F' R U R' U' R' F R2 U' R' U'");
    expect(kept.note).toContain("Most sheets stop before the last U'");
    expect(kept.note).toContain("only lines the top up with the sides");
    // As drawn, the U' is the turn that finishes it; without it, U' is still needed.
    const state = caseStateFor(jb, "pll");
    expect(checkAlgorithm(state, kept.moves, "pll")).toEqual({ ok: true, preAuf: "", postAuf: "" });
    expect(checkAlgorithm(state, "R U R' F' R U R' U' R' F R2 U' R'", "pll")).toEqual({
      ok: true,
      preAuf: "",
      postAuf: "U'",
    });
    // The other Jb still solves the drawn angle without a set-up turn.
    expect(solvesFromHere(state, "R U2 R' U' R U2 L' U R' U' L", "pll")).toBe(true);
  });
});

describe("every case's picture", () => {
  it("is the case as its first algorithm starts, in every set", () => {
    for (const set of ALGORITHM_SETS) {
      for (const entry of set.cases) {
        const first = algorithmsFor(entry)[0];
        if (!first) continue;
        const kind = kindFor(set, entry);
        expect(solvesFromHere(caseStateFor(entry, kind), first.moves, kind), entry.id).toBe(true);
      }
    }
  });
});
