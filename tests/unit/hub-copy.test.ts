import { describe, expect, it } from "vitest";
import { movesInText } from "@/components/hub/lesson-preview";
import { plainReason } from "@/components/hub/reason";

describe("plainReason", () => {
  it("turns the model's certainty into words", () => {
    expect(plainReason("Likely holding you back: Turning speed (100% sure).")).toBe(
      "Almost certainly holding you back: Turning speed.",
    );
    expect(plainReason("Likely holding you back: Pair speed (64% sure).")).toBe(
      "Likely holding you back: Pair speed.",
    );
    expect(plainReason("Likely holding you back: F2L (59% sure).")).toBe(
      "Possibly holding you back: F2L.",
    );
  });

  it("leaves other reasons alone", () => {
    expect(plainReason("Your times vary more than is usual at your goal.")).toBe(
      "Your times vary more than is usual at your goal.",
    );
  });
});

describe("movesInText", () => {
  it("plays a run of moves as written", () => {
    expect(
      movesInText("Execute R U R′ U′ slowly three times.", "method-beginner", "x")?.moves,
    ).toBe("R U R' U'");
    expect(
      movesInText(
        "Use the insert (U R U′ R′ U′ F′ U F / mirror).",
        "method-beginner",
        "beginner-first-solve",
      ),
    ).toMatchObject({ moves: "U R U' R' U' F' U F", own: true });
  });

  it("ignores a lone letter or a shape", () => {
    expect(movesInText("Prefer U moves and an L-shape.", "method-cfop", "cfop-f2l")).toBeNull();
    expect(movesInText("Use the D layer.", "cross-efficiency", "x")).toBeNull();
  });

  it("uses the unit's own sequence when prose names several moves", () => {
    const found = movesInText(
      "U and U' with the index fingers, R and R' with the ring finger.",
      "turning-technique",
      "turning-what-a-fingertrick-is",
    );
    expect(found?.own).toBe(false);
    expect(found?.moves.length).toBeGreaterThan(0);
  });
});
