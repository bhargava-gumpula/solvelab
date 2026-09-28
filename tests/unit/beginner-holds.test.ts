import { describe, expect, it } from "vitest";
import { SOLVED_FACELETS, applyAlgorithm } from "@/lib/cube/cube-state";
import { hasCrossSolved } from "@/lib/cube/stages";

/**
 * The beginner lesson inserts first-layer corners with the cross on the
 * bottom: the white corner waits in the top layer above its slot, and the
 * trigger repeats until the corner drops in white side down. A solved engine
 * cube is the solving hold, so D is the white side and U the yellow top.
 */

const U = 0;
const R = 9;
const F = 18;
const D = 27;
const L = 36;
const B = 45;

type Twist = "up" | "front" | "side";

interface Slot {
  name: string;
  trigger: string;
  /** Setup moves searched to build start states. */
  moves: readonly string[];
  /** The slot's stickers: [D, F, side]. */
  home: readonly [number, number, number];
  /** The top-layer spot above it, in the same order: [U, F, side]. */
  above: readonly [number, number, number];
  sideFace: "R" | "L";
}

const SLOTS: readonly Slot[] = [
  {
    name: "front-right",
    trigger: "R U R′ U′",
    moves: ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2"],
    home: [D + 2, F + 8, R + 6],
    above: [U + 8, F + 2, R + 0],
    sideFace: "R",
  },
  {
    name: "front-left",
    trigger: "L′ U′ L U",
    moves: ["L", "L'", "L2", "U", "U'", "U2", "F", "F'", "F2"],
    home: [D + 0, F + 6, L + 8],
    above: [U + 6, F + 0, L + 2],
    sideFace: "L",
  },
];

/** The D face plus the bottom row of each side face. */
const FIRST_LAYER: readonly number[] = [
  ...Array.from({ length: 9 }, (_, index) => D + index),
  ...[F, R, B, L].flatMap((face) => [face + 6, face + 7, face + 8]),
];

function home(index: number): string {
  return SOLVED_FACELETS[index];
}

function firstLayerSolved(state: string, except: readonly number[] = []): boolean {
  return FIRST_LAYER.every((index) => except.includes(index) || state[index] === home(index));
}

/** Where the slot's corner sits in the top layer above it, and which way white faces. */
function twistAbove(state: string, slot: Slot): Twist | null {
  const stickers = slot.above.map((index) => state[index]);
  if ([...stickers].sort().join("") !== ["D", "F", slot.sideFace].sort().join("")) return null;
  return (["up", "front", "side"] as const)[stickers.indexOf("D")];
}

/** Every state within `depth` setup moves with the cross and the other three corners solved. */
function startStates(slot: Slot, depth: number): Map<Twist, string[]> {
  const found = new Map<Twist, Set<string>>();
  const search = (state: string, lastFace: string, left: number) => {
    const twist = twistAbove(state, slot);
    if (twist && hasCrossSolved(state) && firstLayerSolved(state, slot.home)) {
      if (!found.has(twist)) found.set(twist, new Set());
      found.get(twist)!.add(state);
    }
    if (left === 0) return;
    for (const move of slot.moves) {
      if (move[0] === lastFace) continue;
      search(applyAlgorithm(move, state), move[0], left - 1);
    }
  };
  search(SOLVED_FACELETS, "", depth);
  return new Map([...found].map(([twist, states]) => [twist, [...states]]));
}

describe("beginner first-layer corners", () => {
  for (const slot of SLOTS) {
    describe(`${slot.name} with ${slot.trigger}`, () => {
      const starts = startStates(slot, 6);

      it("has start states for all three twists, with varied top and middle layers", () => {
        expect([...starts.keys()].sort()).toEqual(["front", "side", "up"]);
        for (const states of starts.values()) expect(states.length).toBeGreaterThanOrEqual(10);
      });

      it("drops the corner in white side down within five repeats, never breaking the cross", () => {
        const repeatsByTwist = new Map<Twist, Set<number>>();
        for (const [twist, states] of starts) {
          for (const start of states) {
            let state = start;
            let repeats = 0;
            while (!firstLayerSolved(state) && repeats < 6) {
              state = applyAlgorithm(slot.trigger, state);
              repeats += 1;
              expect(hasCrossSolved(state), `${twist} after ${repeats}`).toBe(true);
              expect(firstLayerSolved(state, slot.home), `${twist} after ${repeats}`).toBe(true);
            }
            expect(firstLayerSolved(state), `${twist} from ${start}`).toBe(true);
            expect(repeats).toBeLessThanOrEqual(5);
            if (!repeatsByTwist.has(twist)) repeatsByTwist.set(twist, new Set());
            repeatsByTwist.get(twist)!.add(repeats);
          }
        }
        // Set only by which way white faces: once to the side, three times up, five to the front.
        const counts = Object.fromEntries(
          [...repeatsByTwist].map(([twist, set]) => [twist, [...set]]),
        );
        expect(counts).toEqual({ side: [1], up: [3], front: [5] });
      });
    });
  }
});
