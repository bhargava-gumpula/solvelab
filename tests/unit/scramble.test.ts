import { describe, expect, it, vi } from "vitest";
import { applyAlgorithm, isSolved, parseAlgorithm } from "@/lib/cube";
import {
  createCubingProvider,
  randomMoveProvider,
  ScrambleService,
  type ScrambleProvider,
} from "@/lib/scramble";
import { RANDOM_MOVE_LENGTH } from "@/lib/scramble/providers";

const cubingJsProvider = createCubingProvider(() => import("cubing/scramble"));

const failing: ScrambleProvider = {
  id: "failing",
  randomState: true,
  generate: () => Promise.reject(new Error("worker unavailable")),
};

describe("scramble providers", () => {
  it("generates random-state 3x3 scrambles with cubing.js", async () => {
    const scramble = await cubingJsProvider.generate("333");
    const parsed = parseAlgorithm(scramble);
    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.moves.length).toBeGreaterThan(10);
    expect(isSolved(applyAlgorithm(scramble))).toBe(false);
  }, 20000);

  it("fallback random-move scrambles avoid redundant turns", async () => {
    for (let run = 0; run < 50; run++) {
      const moves = (await randomMoveProvider.generate("333")).split(" ");
      expect(moves).toHaveLength(RANDOM_MOVE_LENGTH);
      for (let index = 1; index < moves.length; index++) {
        expect(moves[index][0]).not.toBe(moves[index - 1][0]);
      }
    }
  });
});

describe("scramble service", () => {
  it("falls back when the primary provider fails and labels the result", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const service = new ScrambleService({ primary: failing, fallback: randomMoveProvider });
    const result = await service.next("333");
    expect(result.providerId).toBe("random-moves");
    expect(result.randomState).toBe(false);
  });

  it("keeps the next scramble prepared and never repeats a prepared one", async () => {
    let count = 0;
    const counting: ScrambleProvider = {
      id: "counting",
      randomState: true,
      generate: async () => ["R", "U", "F", "L", "D"][count++ % 5],
    };
    const service = new ScrambleService({ primary: counting, fallback: randomMoveProvider });
    const first = await service.next("333");
    const second = await service.next("333");
    expect(first.scramble).toBe("R");
    expect(second.scramble).toBe("U");
    expect(count).toBe(3);
  });
});
