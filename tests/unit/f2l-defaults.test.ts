import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { algorithmsFor, caseStateFor, getAlgorithmSet } from "@/lib/algorithms/catalog";
import {
  caseStateOf,
  checkAlgorithm,
  otherSlotsSolved,
  solvesFromHere,
} from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import {
  formatAlgorithm,
  invertAlgorithm,
  parseAlgorithm,
  type Move,
  type MoveFamily,
} from "@/lib/cube/notation";

/*
 * The F2L bank's defaults (audit item 20): the widely used algorithm first,
 * the move-optimal ones kept behind it. Everything here is checked on the
 * engine, whose solved cube is the solving hold (white cross on D, green on F).
 */

const set = getAlgorithmSet("f2l")!;
const entry = (id: string) => set.cases.find((item) => item.id === id)!;
const first = (id: string) => algorithmsFor(entry(id))[0]!;
const state = (id: string) => caseStateFor(entry(id), "f2l");
const fTurns = (moves: string) => moves.split(" ").filter((token) => /^F/.test(token)).length;
const withoutSetUp = (moves: string) => moves.replace(/^(U2?'?\s)+/, "");

/** Each case's first algorithm before this change, which must stay in the list. */
const OLD_FIRST: Record<string, [string, string]> = {
  "f2l-1": ["f1-1", "R U R'"],
  "f2l-2": ["f2-1", "F' U F"],
  "f2l-3": ["f3-1", "R U' R'"],
  "f2l-4": ["f4-1", "F' U' F"],
  "f2l-5": ["f5-1", "R U R2 F R F'"],
  "f2l-6": ["f6-1", "F' U2 F2 R' F' R"],
  "f2l-7": ["f7-1", "R U2 R2 F R F'"],
  "f2l-8": ["f8-1", "R U2 R' U' R U R'"],
  "f2l-9": ["f9-1", "F2 U2 F U F' U F2"],
  "f2l-10": ["f10-1", "U R U R' F' U' F"],
  "f2l-11": ["f11-1", "F' U2 F U F' U' F"],
  "f2l-12": ["f12-1", "R U' R' U R U R'"],
  "f2l-13": ["f13-1", "F' U F U' R U R'"],
  "f2l-14": ["f14-1", "F' U2 F U F' U2 F"],
  "f2l-15": ["f15-1", "F' U2 F U' R U R'"],
  "f2l-16": ["f16-1", "F U2 F2 U' F2 U' F'"],
  "f2l-17": ["f17-1", "R U2 R' U' R U2 R'"],
  "f2l-18": ["f18-1", "R U R' U' R U2 R'"],
  "f2l-19": ["f19-1", "R U R' U2 F' U' F"],
  "f2l-20": ["f20-1", "F' U F U' F' U' F"],
  "f2l-21": ["f21-1", "U R2 U2 R' U' R U' R2"],
  "f2l-22": ["f22-1", "R F R U R' U' F' R'"],
  "f2l-23": ["f23-1", "R' F' U' F U R2 U' R'"],
  "f2l-24": ["f24-1", "R' F R F' U R U R'"],
  "f2l-25": ["f25-1", "R U' R2 F R F'"],
  "f2l-26": ["f26-1", "R U2 R' F' U2 F"],
  "f2l-27": ["f27-1", "R' F R F' R U R'"],
  "f2l-28": ["f28-1", "U R' F R F2 U' F"],
  "f2l-29": ["f29-1", "R U R' U' R U R'"],
  "f2l-30": ["f30-1", "R' U' R F' R' U R F"],
  "f2l-31": ["f31-1", "R U' R' F' U2 F"],
  "f2l-32": ["f32-1", "R U2 R' U R U R'"],
  "f2l-33": ["f33-1", "F' U F U R U R'"],
  "f2l-34": ["f34-1", "R U' R' U' R U2 R'"],
  "f2l-35": ["f35-1", "R U R' U' F' U F"],
  "f2l-36": ["f36-1", "U R2 U R2 U R2 U2 R2"],
  "f2l-37": ["f37-1", "R U' R U2 F R2 F' U2 R2"],
  "f2l-38": ["f38-1", "R U2 R U2 F R F' U2 R2"],
  "f2l-39": ["f39-1", "R F U R U' R' F' U' R'"],
  "f2l-40": ["f40-1", "R U2 R U R' U R U2 R2"],
  "f2l-41": ["f41-1", "R U F R U R' U' F' R'"],
};

/**
 * Where each default comes from, as published: SpeedCubeDB's front-right list
 * (https://speedcubedb.com/a/3x3/F2L, fetched 2026-09-28; its case numbers
 * differ from SolveLab's) and the research notes' section 4.5. A published
 * algorithm's leading U turns are its set-up; the default folds them into the
 * angle the case is drawn at, so only what follows them has to match.
 */
const SOURCED: Record<string, string> = {
  // Top votes (SpeedCubeDB number in brackets).
  "f2l-1": "R U R'", // [4]
  "f2l-3": "U R U' R'", // [1]
  "f2l-4": "F' U' F", // [3]
  "f2l-5": "U2 R U R' U R U' R'", // [21]
  "f2l-7": "U R U2 R' U R U' R'", // [19]
  "f2l-8": "R U2 R' U' R U R'", // [17]
  "f2l-9": "F U R U' R' F' R U' R'", // [24], notes 4.5
  "f2l-10": "r U' r' U2 r U r'", // [22]
  "f2l-12": "U' R U' R' U R U R'", // [14]
  "f2l-13": "U' R U R' U R U R'", // [10]
  "f2l-14": "r' U2 R2 U R2 U r", // [8]
  "f2l-15": "R U' R' U R U' R' U2 R U' R'", // [12]
  "f2l-16": "U' R U2 R' U F' U' F", // [11]
  "f2l-17": "U' R U2 R' U' R U2 R'", // [7]
  "f2l-18": "U' R U R' U2 R U' R'", // [5]
  "f2l-19": "U' R U' R' U F' U' F", // [9]
  "f2l-21": "U R U' R' U' R U' R' U R U' R'", // [23]
  "f2l-22": "R U' R' U2 F' U' F", // [16]
  "f2l-23": "U' r U' R' U R U r'", // [6]
  "f2l-24": "M U r U' r' U' M'", // [15], notes 4.5
  "f2l-25": "R U' R' U R U' R'", // [27]
  "f2l-26": "R U R' U' F R' F' R", // [28]
  "f2l-27": "U' R' F R F' R U R'", // [25], notes 4.5
  "f2l-28": "R' F R F' U R U' R'", // [29], notes 4.5
  "f2l-29": "R U R' U' R U R'", // [30]
  "f2l-30": "U R U' R' F R' F' R", // [26], notes 4.5
  "f2l-31": "U' R' F R F' R U' R'", // [31], notes 4.5
  "f2l-32": "U R U R' U2 R U R'", // [34]
  "f2l-33": "U F' U' F U' R U R'", // [36]
  "f2l-34": "U' R U' R' U2 R U' R'", // [33]
  "f2l-35": "U' R U R' U F' U' F", // [35]
  "f2l-36": "U R U' R' U R U' R' U R U' R'", // [32], notes 4.5
  "f2l-37": "R2 U2 F R2 F' U2 R' U R'", // [37], notes 4.5
  "f2l-38": "R U' R' U' R U R' U2 R U' R'", // [38], notes 4.5
  "f2l-39": "r U' r' U2 r U r' R U R'", // [40], notes 4.5
  "f2l-40": "R U' R' U R U2 R' U R U' R'", // [39], notes 4.5
  "f2l-41": "R U' R' r U' r' U2 r U r'", // [41], notes 4.5
  // The top vote starts with y', so the best-voted one without a rotation.
  "f2l-6": "U' R U' R2 F R F' R U' R'", // [20], second
};

/** The popular versions that start with a rotation; the default is their F-turn form. */
const ROTATED: Record<string, string> = {
  "f2l-11": "y' R' U2 R U R' U' R",
  "f2l-20": "y' R' U R U' R' U' R",
};

describe("the F2L bank's defaults", () => {
  it("keeps every algorithm it had, under the same id", () => {
    for (const [caseId, [id, moves]] of Object.entries(OLD_FIRST)) {
      const kept = algorithmsFor(entry(caseId)).find((algorithm) => algorithm.id === id);
      expect(kept?.moves, `${caseId} ${id}`).toBe(moves);
    }
  });

  it("gives every case a default with no more F turns than the old one", () => {
    for (const [caseId, [, old]] of Object.entries(OLD_FIRST)) {
      expect(fTurns(first(caseId).moves), caseId).toBeLessThanOrEqual(fTurns(old));
    }
  });

  it("draws every case at the same angle as before", () => {
    // The old first algorithm still solves the case as drawn, with no set-up turn.
    for (const [caseId, [, old]] of Object.entries(OLD_FIRST)) {
      expect(solvesFromHere(state(caseId), old, "f2l"), caseId).toBe(true);
    }
  });

  it("solves every case with every algorithm, touching only the front-right slot", () => {
    for (const item of set.cases) {
      // The default defines the case, so it must turn nothing but that slot and the top.
      expect(otherSlotsSolved(caseStateOf(first(item.id).moves, "f2l")), item.id).toBe(true);
      expect(first(item.id).moves, item.id).not.toMatch(/[dyxz]/);
      // Every one finishes all four slots from the case as drawn, with no extra set-up turn.
      for (const algorithm of algorithmsFor(item)) {
        expect(solvesFromHere(state(item.id), algorithm.moves, "f2l"), algorithm.id).toBe(true);
      }
    }
  });

  it("never starts an algorithm with a cube rotation", () => {
    for (const item of set.cases) {
      for (const algorithm of algorithmsFor(item)) {
        expect(algorithm.moves, algorithm.id).not.toMatch(/^[xyz]/);
      }
    }
  });

  it("uses the published algorithm as the default, set-up turn folded in", () => {
    for (const [caseId, published] of Object.entries(SOURCED)) {
      const moves = first(caseId).moves;
      expect(checkAlgorithm(state(caseId), published, "f2l").ok, caseId).toBe(true);
      expect(solvesFromHere(state(caseId), moves, "f2l"), caseId).toBe(true);
      expect(withoutSetUp(moves), caseId).toBe(withoutSetUp(published));
    }
    // Every case is either sourced or one of the explained exceptions.
    const explained = new Set([...Object.keys(SOURCED), ...Object.keys(ROTATED), "f2l-2"]);
    expect(set.cases.filter((item) => !explained.has(item.id))).toEqual([]);
  });

  it("writes the rotation versions with F turns in place of the rotation", () => {
    for (const [caseId, rotated] of Object.entries(ROTATED)) {
      const moves = first(caseId).moves;
      // Exactly the same turns: the rotation and its undoing leave the cube as F turns do.
      expect(applyAlgorithm(`${rotated} y`, SOLVED_FACELETS), caseId).toBe(
        applyAlgorithm(moves, SOLVED_FACELETS),
      );
      expect(solvesFromHere(state(caseId), rotated, "f2l"), caseId).toBe(true);
    }
    // F2L 6's top vote rotates too; its default is the best-voted one that doesn't.
    expect(checkAlgorithm(state("f2l-6"), "y' U' R' U2 R U' R' U R", "f2l").ok).toBe(true);
    const header = readFileSync(join(process.cwd(), "data/algorithms/sets/f2l.ts"), "utf8");
    expect(header).toContain("(F2L 11 and 20)");
    expect(header).toContain("(F2L 6)");
    // F2L 20's popular form starts with U after the rotation; from this angle it goes.
    const popular20 = checkAlgorithm(state("f2l-20"), "y' U R' U R U' R' U' R", "f2l");
    expect(popular20).toMatchObject({ ok: true, preAuf: "U'" });
  });

  it("leads F2L 36 with the twelve-move R and U version the fast-end pack teaches", () => {
    const moves = algorithmsFor(entry("f2l-36")).map((algorithm) => algorithm.moves);
    expect(withoutSetUp(moves[0]!).split(" ")).toHaveLength(11);
    expect(fTurns(moves[0]!)).toBe(0);
    // The seven-move R2 one stays right behind it.
    expect(moves[1]).toBe("U R2 U R2 U R2 U2 R2");
    // The pack shows it from its own angle, U R U' R' three times.
    const taught = "U R U' R' U R U' R' U R U' R'";
    const pack = readFileSync(join(process.cwd(), "data/training/packs/fast-end.ts"), "utf8");
    expect(pack).toContain(`moves: "${taught}"`);
    expect(withoutSetUp(taught)).toBe(withoutSetUp(moves[0]!));
    expect(checkAlgorithm(state("f2l-36"), taught, "f2l")).toMatchObject({ ok: true, preAuf: "U" });
  });

  it("leads F2L 24 with the M-slice version the fast-end pack teaches", () => {
    const moves = algorithmsFor(entry("f2l-24")).map((algorithm) => algorithm.moves);
    const taught = "M U r U' r' U' M'";
    expect(withoutSetUp(moves[0]!)).toBe(taught);
    // The R and U version, nearly as popular, comes right after it.
    expect(withoutSetUp(moves[1]!)).toBe("R U R' U2 R U' R' U R U' R'");
    expect(solvesFromHere(state("f2l-24"), moves[1]!, "f2l")).toBe(true);
    // The pack names this case and shows the same seven moves from its own angle.
    const pack = readFileSync(join(process.cwd(), "data/training/packs/fast-end.ts"), "utf8");
    expect(pack).toContain(`moves: "${taught}"`);
    expect(pack).toContain("SolveLab's F2L 24 (SpeedCubeDB 15)");
    expect(checkAlgorithm(state("f2l-24"), taught, "f2l")).toMatchObject({
      ok: true,
      preAuf: "U'",
    });
    const header = readFileSync(join(process.cwd(), "data/algorithms/sets/f2l.ts"), "utf8");
    expect(header).toContain("F2L 24 leads with");
    expect(header).toContain("an M-slice version");
  });

  it("keeps F' U F for F2L 2, since F R' F' R needs a set-up turn from its angle", () => {
    expect(first("f2l-2").moves).toBe("F' U F");
    expect(solvesFromHere(state("f2l-2"), "F R' F' R", "f2l")).toBe(false);
    expect(checkAlgorithm(state("f2l-2"), "F R' F' R", "f2l").ok).toBe(true);
    expect(algorithmsFor(entry("f2l-2")).map((algorithm) => algorithm.moves)).toContain(
      "U F R' F' R",
    );
  });
});

/** The move mirrored left to right: R and L swap, and every turn reverses but M's and x's. */
function mirrorMove(move: Move): Move {
  const swap: Partial<Record<MoveFamily, MoveFamily>> = { R: "L", L: "R", r: "l", l: "r" };
  const family = swap[move.family] ?? move.family;
  const keepsDirection = move.family === "M" || move.family === "x";
  const turns = keepsDirection ? move.turns : (((4 - move.turns) % 4) as Move["turns"]);
  return { family, turns };
}

function mirror(moves: string): Move[] {
  const parsed = parseAlgorithm(moves);
  if (!parsed.ok) throw new Error(moves);
  return parsed.moves.map(mirrorMove);
}

describe("the set header", () => {
  const header = readFileSync(join(process.cwd(), "data/algorithms/sets/f2l.ts"), "utf8");

  it("says how to use a case at the front-left, and the mirror does it", () => {
    expect(header).toContain("mirror the moves");
    expect(header).toContain(
      "R becomes L', R' becomes L, and every U and F turn goes the other way",
    );
    expect(header).toContain("r and d turns mirror the same way as R and U; M stays as it is");
    for (const item of set.cases) {
      // The mirrored case: the default mirrored, undone on a solved cube.
      const leftCase = applyAlgorithm(
        formatAlgorithm(invertAlgorithm(mirror(first(item.id).moves))),
        SOLVED_FACELETS,
      );
      // Seen with the front-left slot turned to the front right, only that slot is missing.
      const turned = applyAlgorithm(
        `y ${formatAlgorithm(invertAlgorithm(mirror(first(item.id).moves)))} y'`,
        SOLVED_FACELETS,
      );
      expect(otherSlotsSolved(turned), item.id).toBe(true);
      // And every algorithm, mirrored, solves it.
      for (const algorithm of algorithmsFor(item)) {
        const mirrored = formatAlgorithm(mirror(algorithm.moves));
        expect(checkAlgorithm(leftCase, mirrored, "f2l").ok, `${algorithm.id} mirrored`).toBe(true);
      }
    }
    // The check itself can fail: an unmirrored algorithm leaves the wrong slot.
    expect(otherSlotsSolved(applyAlgorithm("y R U' R' y'", SOLVED_FACELETS))).toBe(false);
  });

  it("frames the list as a reference after intuitive F2L, chosen for how it turns", () => {
    expect(header).toContain("after intuitive F2L");
    expect(header).toContain("how it turns");
    expect(header).toContain("rather than how few moves");
    // Running the solver script over this file would drop the hand-picked defaults.
    expect(header).toContain("point its OUT somewhere else rather than at this file");
  });
});
