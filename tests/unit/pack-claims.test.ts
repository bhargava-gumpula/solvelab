import { describe, expect, it } from "vitest";
import { getPack, type TrainingPack } from "@/data/training";
import { SOLVING_VIEW } from "@/lib/config/cube";
import { AUF } from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { edgesFacingUp } from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS, faceOf } from "@/lib/cube/pieces";

/*
 * Claims the cross, late and extra packs make about the cube, checked on the
 * engine, with the text tied to what the engine shows. A solved engine cube is
 * the solving hold: white cross on D, yellow on U, green on F.
 */

function pack(id: string): TrainingPack {
  const found = getPack(id);
  if (!found) throw new Error(`No pack ${id}`);
  return found;
}

function lesson(packId: string, lessonId: string) {
  const found = pack(packId).lessons.find((entry) => entry.id === lessonId);
  if (!found) throw new Error(`No lesson ${packId}/${lessonId}`);
  return found;
}

function lessonText(packId: string, lessonId: string): string {
  const { takeaway, body } = lesson(packId, lessonId);
  return [takeaway, ...body].join(" ");
}

function inverse(algorithm: string): string {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(algorithm);
  return formatAlgorithm(invertAlgorithm(parsed.moves));
}

/** The case an algorithm solves: the algorithm undone on a solved cube. */
const caseOf = (algorithm: string) => applyAlgorithm(inverse(algorithm), SOLVED_FACELETS);

const ALL_SPOTS: readonly (readonly number[])[] = [...CORNER_SPOTS, ...EDGE_SPOTS];

/** Where the piece with these colours (engine letters) sits. */
function spotOf(state: string, colours: string): readonly number[] {
  const spot = ALL_SPOTS.find(
    (candidate) =>
      candidate.length === colours.length &&
      [...colours].every((colour) => candidate.some((index) => state[index] === colour)),
  );
  if (!spot) throw new Error(`No piece ${colours}`);
  return spot;
}

const facesAt = (spot: readonly number[]) => spot.map(faceOf).sort().join("");
const home = (spot: readonly number[]) => spot.map(faceOf).join("");
const holds = (state: string, spot: readonly number[]) =>
  spot.map((index) => state[index]).join("");
const atHome = (state: string, spots: readonly (readonly number[])[]) =>
  spots.every((spot) => holds(state, spot) === home(spot));

const spotNamed = (faces: string) => {
  const sorted = [...faces].sort().join("");
  return ALL_SPOTS.find((spot) => facesAt(spot) === sorted)!;
};

/** A slot's pair: where its corner and edge sit, and which way white and the F/B colour face. */
function readPair(state: string, slot: "FR" | "BR") {
  const corner = spotOf(state, `D${slot}`);
  const edge = spotOf(state, slot);
  return {
    corner: facesAt(corner),
    white: faceOf(corner.find((index) => state[index] === "D")!),
    edge: facesAt(edge),
    side: faceOf(edge.find((index) => state[index] === slot[0])!),
  };
}

/** The same reading seen in a mirror between the front and the back. */
function mirrorFrontBack(reading: ReturnType<typeof readPair>) {
  const swap = (face: string) => (face === "F" ? "B" : face === "B" ? "F" : face);
  const faces = (value: string) => [...value].map(swap).sort().join("");
  return {
    corner: faces(reading.corner),
    white: swap(reading.white),
    edge: faces(reading.edge),
    side: swap(reading.side),
  };
}

/** Corner and edge side by side, their stickers matching on both shared faces. */
function joined(state: string, cornerColours: string, edgeColours: string): boolean {
  const corner = spotOf(state, cornerColours);
  const edge = spotOf(state, edgeColours);
  const shared = edge.filter((index) => corner.some((other) => faceOf(other) === faceOf(index)));
  return (
    shared.length === 2 &&
    shared.every(
      (index) => state[index] === state[corner.find((other) => faceOf(other) === faceOf(index))!],
    )
  );
}

const SLOT_NAMES: Record<string, string> = {
  FR: "front-right",
  FL: "front-left",
  BR: "back-right",
  BL: "back-left",
};

describe("colour neutrality (cross.ts and late.ts)", () => {
  // Yellow cross on the bottom, green still in front: the solving hold turned over.
  const yellowDown = applyAlgorithm("z2", SOLVED_FACELETS);
  const centre = (state: string, face: "U" | "R" | "F" | "D" | "L" | "B") =>
    SOLVING_VIEW[state["URFDLB".indexOf(face) * 9 + 4] as keyof typeof SOLVING_VIEW];
  const onTheRight = centre(yellowDown, "R");

  it("runs the side colours in mirrored order around a yellow cross", () => {
    expect(centre(yellowDown, "D")).toBe("yellow");
    expect(centre(yellowDown, "F")).toBe(SOLVING_VIEW.F);
    expect(onTheRight).toBe(SOLVING_VIEW.L);
    const sides = (state: string) => (["F", "R", "B", "L"] as const).map((f) => centre(state, f));
    const [front, right, back, left] = sides(SOLVED_FACELETS);
    expect(sides(yellowDown)).toEqual([front, left, back, right]);

    const pairs = lessonText("colour-neutral-plan", "cn-pairs");
    expect(pairs).toContain(`${onTheRight} is on the right, where ${SOLVING_VIEW.R} sits`);
    expect(lessonText("colour-neutral-plan", "cn-dual-first")).toContain("mirrored order");
  });

  it("puts every pair in the slot on the opposite side in a yellow cross", () => {
    const flip = (face: string) => (face === "R" ? "L" : face === "L" ? "R" : face);
    for (const slot of ["FR", "FL", "BR", "BL"]) {
      const mirrored = [...slot].map(flip).sort().join("");
      // The slot's edge, and the corner that pairs with it around a yellow cross.
      expect(facesAt(spotOf(yellowDown, slot)), slot).toBe(mirrored);
      expect(facesAt(spotOf(yellowDown, `U${slot}`)), slot).toBe(
        ["D", ...mirrored].sort().join(""),
      );
    }
    const greenOrange = SLOT_NAMES[facesAt(spotOf(yellowDown, "FR"))];
    expect(lessonText("colour-neutral-plan", "cn-pairs")).toContain(
      `${SOLVING_VIEW.F}-${SOLVING_VIEW.R} pair now goes in the ${greenOrange} slot instead of the front-right`,
    );
    expect(lessonText("colour-neutral-plan", "cn-dual-first")).toContain(
      "every pair belongs in the slot on the opposite side",
    );
    expect(lesson("colour-neutral-plan", "cn-pairs").takeaway).toContain("mirrored slots");
  });

  it("tells one story about the gain, the cost and when to switch", () => {
    const plan = pack("colour-neutral-plan");
    const buys = lessonText("colour-neutral-plan", "cn-what-it-buys");
    expect(plan.why).toContain("optional");
    expect(plan.why).toContain("staying on the white cross is a sound choice");
    for (const text of [buys]) {
      expect(text).toContain("5.8");
      expect(text).toContain("4.8");
      expect(text).toContain("about half of that");
      expect(text).toContain("0.25 seconds");
      expect(text).toContain("four moves or fewer come up about five times as often");
      expect(text).toContain("full switch can take months");
      expect(text).toContain("easiest soon after you can solve and gets harder the faster you are");
    }
    expect(lesson("colour-neutral-plan", "cn-dual-first").takeaway).toContain(
      "a week or two of practice, sometimes a few weeks",
    );
    expect(plan.why).toContain("about one move");

    const everything = JSON.stringify([pack("cross-efficiency"), plan]);
    for (const dropped of [
      "decision rather than a skill",
      "decision, not a skill",
      "a move or two",
      "same arrangement",
      "cheap below",
      "days rather than weeks",
      "a week of ordinary solving",
      "over a week",
      "colour a day",
    ]) {
      expect(everything, dropped).not.toContain(dropped);
    }
  });
});

describe("the final U2 (late.ts)", () => {
  it("is a double flick of two fingers or one flick from each hand", () => {
    expect(applyAlgorithm("U U")).toBe(applyAlgorithm("U2"));
    const text = lessonText("auf-both-ends", "auf-fingers");
    expect(text).toContain(
      "index-then-middle double flick with either hand, or one flick from each hand",
    );
    expect(text).not.toContain("two flicks with one index finger");
  });
});

describe("COLL (late.ts)", () => {
  it("only applies with the top edges oriented, about one solve in eight", () => {
    const patterns = new Set([edgesFacingUp(SOLVED_FACELETS).join()]);
    for (const algorithm of ["F R U R' U' F'", "f R U R' U' f'", "F R U R' U' F' f R U R' U' f'"]) {
      for (const turn of AUF) {
        patterns.add(edgesFacingUp(applyAlgorithm(turn, caseOf(algorithm))).join());
      }
    }
    expect(patterns.size).toBe(8);
    expect([...patterns].filter((pattern) => pattern.split(",").length === 4)).toHaveLength(1);
    expect(lessonText("alg-sets-worth-it", "sets-small")).toContain(
      "only applies when the last-layer edges are already oriented after F2L, which happens about one solve in eight",
    );
  });

  it("always leaves an edges-only PLL, skipped one time in twelve", () => {
    // Everything U, H and Z perms can reach: corners home up to a top turn.
    const moves = [
      "U",
      "R U' R U R U R U' R' U' R2",
      "M2 U M2 U2 M2 U M2",
      "M' U M2 U M2 U M' U2 M2",
    ];
    const seen = new Set([SOLVED_FACELETS]);
    const queue = [SOLVED_FACELETS];
    while (queue.length > 0) {
      const state = queue.pop()!;
      for (const move of moves) {
        const next = applyAlgorithm(move, state);
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    const upToFinalTurn = (state: string) =>
      AUF.map((turn) => applyAlgorithm(turn, state))
        .sort()
        .at(0)!;
    const arrangements = new Set([...seen].map(upToFinalTurn));
    expect(arrangements.size).toBe(12);
    expect(
      [...arrangements].filter((state) => upToFinalTurn(SOLVED_FACELETS) === state),
    ).toHaveLength(1);
    const text = lessonText("alg-sets-worth-it", "sets-small");
    expect(text).toContain(
      "always an edges-only one (U, H or Z), skipped about one time in twelve",
    );
    expect(text).not.toContain("a lot of PLL skips");
  });
});

describe("VHLS (extra.ts)", () => {
  it("covers a last pair that is already joined", () => {
    const text = lessonText("last-layer-at-the-top", "top-edge-control");
    expect(text).toContain(
      "VHLS handles the cases where the last pair is already joined and ready to insert",
    );
    expect(text).not.toContain("one move from");
  });
});

describe("back-slot mirrors (extra.ts)", () => {
  const backSlots = lesson("f2l-from-the-front", "front-back-slots");

  it("mirrors R U R' to R' U' R and R U' R' to R' U R", () => {
    const pairs = [
      ["R U R'", "R' U' R"],
      ["R U' R'", "R' U R"],
    ] as const;
    for (const [front, back] of pairs) {
      expect(readPair(caseOf(back), "BR"), back).toEqual(
        mirrorFrontBack(readPair(caseOf(front), "FR")),
      );
    }
    // The old answer solves a different case.
    expect(readPair(caseOf("R' U R"), "BR")).not.toEqual(
      mirrorFrontBack(readPair(caseOf("R U R'"), "FR")),
    );
    const text = lessonText("f2l-from-the-front", "front-back-slots");
    expect(text).toContain("mirroring front to back reverses every turn");
    expect(text).toContain(
      "R U R' at the front becomes R' U' R at the back, and R U' R' becomes R' U R",
    );
    expect(backSlots.takeaway).toContain("every turn reversed");
  });

  it("sets the case up by undoing the insert", () => {
    expect(inverse("R' U' R")).toBe("R' U R");
    expect(backSlots.body.join(" ")).toContain(
      "undo it with R' U R, and look at where the pieces end up. That's the case R' U' R solves.",
    );
  });

  it("labels each back-right example with the front insert it mirrors", () => {
    const examples = (backSlots.examples ?? []).filter((example) =>
      example.note?.includes("back-right mirror of"),
    );
    expect(examples.map((example) => example.moves)).toEqual(["R' U' R", "R' U R"]);
    for (const example of examples) {
      const front = example.note!.match(/mirror of (R U'? R')/)![1]!;
      expect(readPair(caseOf(example.moves!), "BR"), example.moves).toEqual(
        mirrorFrontBack(readPair(caseOf(front), "FR")),
      );
    }
  });

  it("describes the moves of R' U' R as they happen", () => {
    const start = caseOf("R' U' R");
    // R' brings the corner beside its edge…
    expect(joined(start, "DBR", "BR")).toBe(false);
    const afterLift = applyAlgorithm("R'", start);
    expect(joined(afterLift, "DBR", "BR")).toBe(true);
    // …U' swings the pair over the lifted slot, and R puts it down.
    const afterSwing = applyAlgorithm("U'", afterLift);
    expect(facesAt(spotOf(afterSwing, "DBR"))).toBe("BRU");
    expect(facesAt(spotOf(afterSwing, "BR"))).toBe("RU");
    expect(applyAlgorithm("R", afterSwing)).toBe(SOLVED_FACELETS);
    const note = backSlots.examples!.find((example) => example.moves === "R' U' R")!.note!;
    expect(note).toContain(
      "R' lifts the slot and brings the corner beside its edge, U' swings the pair over the slot, R puts it down",
    );
  });
});

describe("across the cube (extra.ts)", () => {
  const moves = "R2 u R2 u' R2";
  const example = lesson("f2l-from-the-front", "front-f-moves").examples!.find(
    (entry) => entry.moves === moves,
  )!;
  const after = applyAlgorithm(moves, SOLVED_FACELETS);

  it("swaps the front-right and back-left edges and leaves the other slots alone", () => {
    expect(holds(after, spotNamed("FR"))).toBe(home(spotNamed("BL")));
    expect(holds(after, spotNamed("BL"))).toBe(home(spotNamed("FR")));
    const otherSlots = ["FL", "BR"].flatMap((slot) => [spotNamed(slot), spotNamed(`D${slot}`)]);
    const cross = ["DF", "DR", "DB", "DL"].map(spotNamed);
    expect(atHome(after, [...otherSlots, ...cross])).toBe(true);
    expect(example.note).toContain(
      "Swaps the edges of the front-right and back-left slots and leaves the other two slots alone",
    );
  });

  it("leaves the corners behind", () => {
    // The back-left corner stays put; the front-right one swaps with the top corner above it.
    expect(atHome(after, [spotNamed("BDL")])).toBe(true);
    expect(facesAt(spotOf(after, "DFR"))).toBe("FRU");
    expect(facesAt(spotOf(after, "UFR"))).toBe("DFR");
    expect(example.note).toContain("The corners don't travel with them");
    expect(example.note).toContain("the back-left corner stays put");
    expect(example.note).toContain("trades places with the top corner above it");
  });

  it("solves the pair it names from where it names it", () => {
    // The moves undo themselves, so the case they solve is the state they make.
    expect(applyAlgorithm(moves, after)).toBe(SOLVED_FACELETS);
    const edge = spotOf(after, "FR");
    const corner = spotOf(after, "DFR");
    expect(facesAt(edge)).toBe("BL");
    expect(faceOf(edge.find((index) => after[index] === "F")!)).toBe("B");
    expect(facesAt(corner)).toBe("FRU");
    expect(faceOf(corner.find((index) => after[index] === "D")!)).toBe("U");
    expect(example.note).toContain(
      `front-right edge is stuck back-left with ${SOLVING_VIEW.F} facing the back, and its corner waits above the slot with ${SOLVING_VIEW.D} facing up`,
    );
  });
});
