import { describe, expect, it } from "vitest";
import {
  getCase,
  kindFor,
  algorithmsFor,
  chosenFor,
  getAlgorithmSet,
} from "@/lib/algorithms/catalog";
import { checkCustomAlgorithm } from "@/lib/algorithms/custom";
import { zbll } from "@/data/algorithms/sets/zbll-data";
import { attemptFrom, INSPECTION_PLUS_TWO_MS } from "@/lib/coach/test-attempt";
import { checkAlgorithm } from "@/lib/cube/case-check";
import { caseStateFor } from "@/lib/algorithms/catalog";

describe("timed attempts and inspection (4.3)", () => {
  it("counts an attempt as it would be counted in competition", () => {
    expect(
      attemptFrom({ rawTimeMs: 8500, inspectionMs: 12000, inspectionPenalty: "none" }),
    ).toEqual({ timeMs: 8500, note: null });
    const late = attemptFrom({ rawTimeMs: 8500, inspectionMs: 16000, inspectionPenalty: "plus2" });
    expect(late.timeMs).toBe(8500 + INSPECTION_PLUS_TWO_MS);
    expect(late.note).toContain("two seconds added");
    const gone = attemptFrom({ rawTimeMs: 8500, inspectionMs: 18000, inspectionPenalty: "dnf" });
    expect(gone.timeMs).toBeNull();
    expect(gone.note).toContain("doesn't count");
  });
});

describe("your own algorithm for a case (4.3)", () => {
  const set = getAlgorithmSet("pll")!;
  const t = getCase("pll", "pll-t")!;
  const kind = kindFor(set, t);

  it("keeps one that solves the case, written plainly", () => {
    // The T perm with a turn of the top before and after: allowed, like the bank's own.
    // (Against an empty list: with the bank's T perm there, it would be the same one.)
    const check = checkCustomAlgorithm(t, kind, "U R U R′ U' R' F R2 U' R' U' R U R' F' U’", []);
    expect(check).toEqual({ ok: true, moves: "U R U R' U' R' F R2 U' R' U' R U R' F' U'" });
    // Like the bank's own algorithms, it may start a turn of the top away from the picture.
    if (check.ok) expect(checkAlgorithm(caseStateFor(t, kind), check.moves, kind).ok).toBe(true);
  });

  it("refuses what it can't read, what's already there, and what doesn't solve the case", () => {
    expect(checkCustomAlgorithm(t, kind, "R U Q")).toMatchObject({ ok: false });
    expect(checkCustomAlgorithm(t, kind, "   ")).toEqual({
      ok: false,
      error: "Type an algorithm first.",
    });
    const first = algorithmsFor(t)[0]!.moves;
    expect(checkCustomAlgorithm(t, kind, first)).toEqual({
      ok: false,
      error: "That one is already in the list.",
    });
    // A Y perm doesn't solve a T perm.
    const y = algorithmsFor(getCase("pll", "pll-y")!)[0]!.moves;
    const wrong = checkCustomAlgorithm(t, kind, y);
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.error).toContain("doesn't solve this case");
  });

  it("reads algorithms the way people write them", () => {
    const tPerm = "R U R' U' R' F R2 U' R' U' R U R' F'";
    const existing: string[] = [];
    expect(checkCustomAlgorithm(t, kind, "RUR'U'R'FR2U'R'U'RUR'F'", existing)).toEqual({
      ok: true,
      moves: tPerm,
    });
    expect(
      checkCustomAlgorithm(t, kind, "(R U R' U') R' F R2 U' R' U' R U R' F'", existing),
    ).toEqual({ ok: true, moves: tPerm });
    // A set-up that doesn't solve the case is still refused.
    expect(checkCustomAlgorithm(t, kind, "[R: U] R'", [])).toMatchObject({ ok: false });
    expect(checkCustomAlgorithm(t, kind, "[R U", [])).toMatchObject({ ok: false });
  });

  it("lets you add the same algorithm for the other hand", () => {
    // The Sune for the left hand solves the Antisune case from the other side.
    const oll = getAlgorithmSet("oll")!;
    const antisune = getCase("oll", "oll-26")!;
    const check = checkCustomAlgorithm(antisune, kindFor(oll, antisune), "L' U' L U' L' U2 L", [
      "R U2 R' U' R U' R'",
    ]);
    expect(check).toEqual({ ok: true, moves: "L' U' L U' L' U2 L" });
  });

  it("knows a set-up or finishing turn of the top doesn't make a new algorithm", () => {
    const first = algorithmsFor(t)[0]!.moves;
    expect(checkCustomAlgorithm(t, kind, `U2 ${first} U`)).toEqual({
      ok: false,
      error: `That one is already in the list, written as ${first}.`,
    });
  });

  it("takes a wide-turn start on a ZBLL case", () => {
    const entry = zbll.cases.find((candidate) =>
      candidate.algorithms.some((algorithm) => /^[rl]'? /.test(algorithm.moves)),
    )!;
    const wide = entry.algorithms.find((algorithm) => /^[rl]'? /.test(algorithm.moves))!.moves;
    const typed = wide.replace(/^r/, "Rw").replace(/^l/, "Lw");
    expect(checkCustomAlgorithm(entry, "pll", typed, [])).toEqual({ ok: true, moves: wide });
  });

  it("is the one shown on the case once chosen, and the bank's first one again once removed", () => {
    const own = { id: "custom-1", algorithm: "U R U R' U' R' F R2 U' R' U' R U R' F' U'" };
    const chosen = chosenFor(t, { preferredVariantId: own.id, customVariants: [own] });
    expect(chosen).toEqual({ id: own.id, moves: own.algorithm });
    const removed = chosenFor(t, { preferredVariantId: own.id, customVariants: [] });
    expect(removed.id).toBe(algorithmsFor(t)[0]!.id);
  });
});

describe("drills with nothing to time", () => {
  it("borrow no test's timer, and their words don't ask for one", async () => {
    const { TRAINING_PACKS } = await import("@/data/training");
    const untimed = TRAINING_PACKS.flatMap((pack) => pack.drills.filter((drill) => drill.untimed));
    expect(untimed.length).toBeGreaterThan(20);
    for (const drill of untimed) {
      expect(drill.exerciseId, drill.id).toBeUndefined();
      // "Untimed" in a title is fine; a rule that talks about the timer here isn't.
      for (const rule of drill.rules)
        expect(rule, drill.id).not.toMatch(/timer here|only records/i);
    }
  });

  it("summarise counts rounds when a session had no times", async () => {
    const { summarise, summariseRun } = await import("@/lib/hub/drills");
    expect(summarise([], 7)).toEqual({ count: 7, meanMs: null, bestMs: null });
    expect(summarise([1200, 1400])).toEqual({ count: 2, meanMs: 1300, bestMs: 1200 });
    expect(
      summariseRun({
        id: "r",
        packId: "p",
        drillId: "d",
        timesMs: [],
        rounds: 3,
        createdAt: "2026-09-29T09:00:00.000Z",
        updatedAt: "2026-09-29T09:00:00.000Z",
      }).count,
    ).toBe(3);
  });
});
