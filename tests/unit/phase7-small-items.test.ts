import { describe, expect, it } from "vitest";
import {
  getCase,
  kindFor,
  algorithmsFor,
  chosenFor,
  getAlgorithmSet,
} from "@/lib/algorithms/catalog";
import { checkCustomAlgorithm } from "@/lib/algorithms/custom";
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
    const check = checkCustomAlgorithm(t, kind, "U R U R′ U' R' F R2 U' R' U' R U R' F' U’");
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

  it("is the one shown on the case once chosen, and the bank's first one again once removed", () => {
    const own = { id: "custom-1", algorithm: "U R U R' U' R' F R2 U' R' U' R U R' F' U'" };
    const chosen = chosenFor(t, { preferredVariantId: own.id, customVariants: [own] });
    expect(chosen).toEqual({ id: own.id, moves: own.algorithm });
    const removed = chosenFor(t, { preferredVariantId: own.id, customVariants: [] });
    expect(removed.id).toBe(algorithmsFor(t)[0]!.id);
  });
});
