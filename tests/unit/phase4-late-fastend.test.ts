import { describe, expect, it } from "vitest";
import { oll } from "@/data/algorithms/sets/oll";
import { pll } from "@/data/algorithms/sets/pll";
import { getCourse } from "@/data/hub/courses";
import { getPack, type TrainingPack } from "@/data/training";
import { algorithmsFor, caseStateFor } from "@/lib/algorithms/catalog";
import {
  AUF,
  caseStateOf,
  checkAlgorithm,
  firstTwoLayersSolved,
  orientationSignature,
} from "@/lib/cube/case-check";
import { applyAlgorithm, isSolved, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { readF2lPair, sideRow } from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS, faceOf } from "@/lib/cube/pieces";

/*
 * Audit 6.4 item 56 and the phase 4 sweep of late.ts and fast-end.ts, tied to
 * the engine. A solved engine cube is the solving hold: white cross on D,
 * yellow on U, green on F.
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

const lessonText = (packId: string, lessonId: string) => {
  const { takeaway, body, checkpoint } = lesson(packId, lessonId);
  return [takeaway, ...body, checkpoint ?? ""].join(" ");
};

function drill(packId: string, drillId: string) {
  const found = pack(packId).drills.find((entry) => entry.id === drillId);
  if (!found) throw new Error(`No drill ${packId}/${drillId}`);
  return found;
}

const invert = (moves: string) => {
  const parsed = parseAlgorithm(moves);
  if (!parsed.ok) throw new Error(moves);
  return formatAlgorithm(invertAlgorithm(parsed.moves));
};
/** The cube with `moves` undone: the position they solve. */
const undo = (moves: string, start = SOLVED_FACELETS) => applyAlgorithm(invert(moves), start);
const moveCount = (moves: string) => moves.split(" ").length;

const CORNERS: Record<string, readonly number[]> = Object.fromEntries(
  ["UFR", "UFL", "UBL", "UBR", "DFR", "DFL", "DBL", "DBR"].map((name, i) => [
    name,
    CORNER_SPOTS[i]!,
  ]),
);
const EDGES: Record<string, readonly number[]> = Object.fromEntries(
  ["UR", "UF", "UL", "UB", "DR", "DF", "DL", "DB", "FR", "FL", "BL", "BR"].map((name, i) => [
    name,
    EDGE_SPOTS[i]!,
  ]),
);
const sorted = (text: string) => [...text].sort().join("");
/** Where the piece with these colours (engine letters) sits. */
function spotOf(state: string, colours: string): { name: string; spot: readonly number[] } {
  const table = colours.length === 3 ? CORNERS : EDGES;
  const found = Object.entries(table).find(
    ([, spot]) => sorted(spot.map((index) => state[index]).join("")) === sorted(colours),
  )!;
  return { name: found[0], spot: found[1] };
}
/** Which face a piece shows one of its colours on. */
const faceShowing = (state: string, spot: readonly number[], colour: string) =>
  faceOf(spot.find((index) => state[index] === colour)!);
const atHome = (state: string, name: string) => {
  const spot = (name.length === 3 ? CORNERS : EDGES)[name]!;
  return spot.every((index) => state[index] === faceOf(index));
};
const holdsLastLayerPiece = (state: string, name: string) => {
  const spot = (name.length === 3 ? CORNERS : EDGES)[name]!;
  return spot.some((index) => state[index] === "U");
};

describe("colour neutrality: choosing between two crosses (item 56)", () => {
  it("solves the better start, not just the shorter cross", () => {
    const rules = drill("colour-neutral-plan", "cn-best-of-two").rules.join(" ");
    expect(rules).toContain("Solve the one with the better start");
    expect(rules).toContain("one a move longer if you can see it leaves an easy first pair");
    expect(rules).not.toContain("Solve the shorter one.");
    // The lesson the drill practises says the same.
    expect(lessonText("colour-neutral-plan", "cn-what-it-buys")).toContain(
      "the one that leaves an easy first pair",
    );
    // Sub-60 plans as much of the cross as it can; a blind check waits for a full plan.
    expect(rules).toContain("Once you can plan the whole cross, check it blind");
  });
});

describe("filler between pairs (item 56, filler-cancel)", () => {
  it("knows an insert ends on a side turn, and that late set-up turns come in pieces", () => {
    for (const insert of ["R U R'", "R U' R'", "R U2 R'", "F' U' F", "L' U' L", "R' U' R"]) {
      expect(insert.split(" ").at(-1)![0]).not.toBe("U");
    }
    // A U, then a U2 to fix it, is one U'.
    expect(applyAlgorithm("U U2")).toBe(applyAlgorithm("U'"));
    const text = lessonText("filler-moves", "filler-cancel");
    expect(text).toContain("An insert ends on a side turn, like the R' of R U R'");
    expect(text).toContain("a U, a look, then a U2 to fix it");
    expect(text).not.toContain("The last move of an F2L pair is often a top turn");
  });
});

describe("merging turns (item 56, filler-merge)", () => {
  const jb = pll.cases.find((entry) => entry.name === "Jb")!;
  const defaultJb = algorithmsFor(jb)[0]!.moves;
  const folded = "R U R' F' R U R' U' R' F R2 U' R' U";

  it("folds the default Jb's closing U' into a finishing U2", () => {
    expect(defaultJb).toBe("R U R' F' R U R' U' R' F R2 U' R' U'");
    expect(folded.split(" ").slice(0, -1)).toEqual(defaultJb.split(" ").slice(0, -1));
    expect(applyAlgorithm("U' U2")).toBe(applyAlgorithm("U"));
    // Seen from the angle where the default Jb, with no set-up turn, leaves the
    // layer a U2 from home, the folded version finishes it outright.
    const start = undo(defaultJb, applyAlgorithm("U2"));
    expect(checkAlgorithm(start, defaultJb, "pll")).toEqual({
      ok: true,
      preAuf: "",
      postAuf: "U2",
    });
    expect(isSolved(applyAlgorithm(folded, start))).toBe(true);
    const text = lessonText("filler-moves", "filler-merge");
    expect(text).toContain(`SolveLab's default Jb, ${defaultJb}, ends with a U'`);
    expect(text).toContain("If the layer would then need a U2 to finish, do a U instead of the U'");
    const example = lesson("filler-moves", "filler-merge").examples?.[0];
    expect(example?.moves).toBe(folded);
  });

  it("reads the top before an insert's last R', which moves only the right-hand column", () => {
    const top = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const rightColumn = [2, 5, 8];
    // Any state: take one with a scrambled top.
    const state = undo("R U R' U R U2 R' F R U R' U' F'");
    const after = applyAlgorithm("R'", state);
    for (const index of top) {
      if (rightColumn.includes(index)) continue;
      expect(after[index], `U${index}`).toBe(state[index]);
    }
    expect(sideRow(after, "left")).toBe(sideRow(state, "left"));
    const text = lessonText("filler-moves", "filler-merge");
    expect(text).toContain("Between the last pair and OLL there is nothing to merge");
    expect(text).toContain("moves only the right-hand column of the top");
    expect(text).not.toContain(
      "choose the insert's direction so the case comes out already aligned",
    );
  });

  it("chooses between two inserts for the OLL they leave, not for its angle", () => {
    // U R U' R' and the sledgehammer put the same joined pair in, but never
    // leave the same OLL at another angle: the choice is between cases.
    const pairCase = caseStateOf("U R U' R'", "f2l");
    expect(firstTwoLayersSolved(applyAlgorithm("R' F R F'", pairCase))).toBe(true);
    /** Which top and side-row stickers show yellow, as held: no turn allowed. */
    const mask = (state: string) =>
      [
        state.slice(0, 9),
        ...(["front", "right", "back", "left"] as const).map((side) => sideRow(state, side)),
      ]
        .join("")
        .replace(/[^U]/g, ".");
    let sameCase = 0;
    for (const entry of oll.cases) {
      for (const turn of AUF) {
        const base = caseStateFor(entry, "oll");
        const top = turn ? applyAlgorithm(turn, base) : base;
        const start = undo("U R U' R'", top);
        const a = applyAlgorithm("U R U' R'", start);
        const b = applyAlgorithm("R' F R F'", start);
        expect(firstTwoLayersSolved(b)).toBe(true);
        // Whenever both leave the same OLL case, they leave it at the same angle.
        if (orientationSignature(a) === orientationSignature(b)) {
          sameCase++;
          expect(mask(b), `${entry.name} ${turn}`).toBe(mask(a));
        }
      }
    }
    expect(sameCase).toBeGreaterThan(0);
    // The lesson it points to exists, in the same course.
    expect(pack("last-pair-into-oll").title).toBe("The last pair into OLL");
    expect(pack("last-pair-into-oll").lessons.map((item) => item.id)).toContain(
      "lastpair-edge-control",
    );
    const sub15 = getCourse("sub-15")!.units.map((unit) => unit.id);
    expect(sub15).toContain("filler-moves");
    expect(sub15).toContain("last-pair-into-oll");
    expect(lessonText("filler-moves", "filler-merge")).toContain(
      "the edge-control lesson in The last pair into OLL",
    );
  });
});

describe("the simplest multislot (item 56, multi-example)", () => {
  const multislot = "L' R U R' L";
  const before = undo(multislot);

  it("is an R U R' whose U also carries a second pair over the open front-left slot", () => {
    expect(applyAlgorithm(multislot)).toBe(applyAlgorithm("R L' U L R'"));
    const text = lessonText("multislotting", "multi-example");
    expect(text).toContain(
      "The R U R' in the middle is an ordinary insert for the front-right pair",
    );
    expect(text).toContain("The front-left slot must not be finished yet");
    expect(text).toContain("can pair or even insert a second pair");
  });

  it("describes the before position as the engine shows it", () => {
    // Front-right pair: corner above its slot, white facing right; edge at the back.
    expect(readF2lPair(before)).toEqual({
      corner: "front-right",
      white: "right",
      edge: "back",
      green: "up",
    });
    // Front-left pair: corner stuck in the front-right slot, white facing right;
    // edge at the front of the top layer, green on top.
    const flCorner = spotOf(before, "DFL");
    expect(flCorner.name).toBe("DFR");
    expect(faceShowing(before, flCorner.spot, "D")).toBe("R");
    const flEdge = spotOf(before, "FL");
    expect(flEdge.name).toBe("UF");
    expect(faceShowing(before, flEdge.spot, "F")).toBe("U");
    // The front-left slot is empty: last-layer pieces sit in it.
    expect(holdsLastLayerPiece(before, "DFL")).toBe(true);
    expect(holdsLastLayerPiece(before, "FL")).toBe(true);
    // Everything else in the first two layers is done.
    for (const name of ["DF", "DR", "DB", "DL", "BL", "BR", "DBL", "DBR"]) {
      expect(atHome(before, name), name).toBe(true);
    }
    const note = lesson("multislotting", "multi-example").examples![0]!.note;
    expect(note).toContain(
      "the front-right pair's corner is above its slot with white facing right, and its edge is at the back",
    );
    expect(note).toContain(
      "that pair's corner is stuck in the front-right slot with white facing right, and its edge is at the front of the top layer, green on top",
    );
    // After: both pairs are in.
    expect(isSolved(applyAlgorithm(multislot, before))).toBe(true);
    expect(note).toContain("After: both pairs are in.");
  });

  it("saves two moves and a look over the plain way", () => {
    const afterInsert = applyAlgorithm("R U R'", before);
    // R U R' brings the second pair out joined above its slot: green on top,
    // red on the left, for both pieces.
    const corner = spotOf(afterInsert, "DFL");
    const edge = spotOf(afterInsert, "FL");
    expect([corner.name, edge.name]).toEqual(["UFL", "UL"]);
    expect(faceShowing(afterInsert, corner.spot, "F")).toBe("U");
    expect(faceShowing(afterInsert, edge.spot, "F")).toBe("U");
    expect(faceShowing(afterInsert, corner.spot, "L")).toBe("L");
    expect(faceShowing(afterInsert, edge.spot, "L")).toBe("L");
    const plain = "R U R' U' L' U L";
    expect(firstTwoLayersSolved(applyAlgorithm(plain, before))).toBe(true);
    expect([moveCount(plain), moveCount(multislot)]).toEqual([7, 5]);
    expect(lessonText("multislotting", "multi-example")).toContain(
      "U' L' U L puts it in: seven moves and a second look, against five",
    );
  });

  it("can pair a second pair without putting it in", () => {
    // Front-left pair left joined above its slot, ready for U' L' U L.
    const joined = undo("U' L' U L");
    const joinedCorner = spotOf(joined, "DFL");
    const joinedEdge = spotOf(joined, "FL");
    expect([joinedCorner.name, joinedEdge.name]).toEqual(["UFL", "UL"]);
    for (const colour of ["F", "L"]) {
      expect(faceShowing(joined, joinedCorner.spot, colour)).toBe(
        faceShowing(joined, joinedEdge.spot, colour),
      );
    }
    const start = undo(multislot, joined);
    expect(readF2lPair(start)).toMatchObject({ corner: "front-right", edge: "back" });
    // Before, its corner sits in its own slot, twisted, so it isn't joined...
    expect(spotOf(start, "DFL").name).toBe("DFL");
    expect(atHome(start, "DFL")).toBe(false);
    // ... and a plain R U R' leaves it there.
    expect(spotOf(applyAlgorithm("R U R'", start), "DFL").name).toBe("DFL");
    // The multislot brings it out joined to its edge, and U' L' U L finishes.
    const after = applyAlgorithm(multislot, start);
    expect(after).toBe(joined);
    expect(isSolved(applyAlgorithm("U' L' U L", after))).toBe(true);
    expect(lessonText("multislotting", "multi-example")).toContain(
      "the left turns can pair a second pair without putting it in",
    );
  });
});

describe("the reference sticker for the last turn (auf-both-ends)", () => {
  // A sticker the algorithm leaves where it is: its colour says the final turn.
  const cases = [
    // T perm keeps the headlights on the left: the front face's left sticker stays.
    { name: "T", sticker: 18, below: "F", opposite: "B" },
    // A U perm keeps every corner: the right face's front sticker stays.
    { name: "Ua", sticker: 9, below: "R", opposite: "L" },
  ];
  it("needs no last turn when it matches the centre below it, and a U2 for the opposite one", () => {
    for (const { name, sticker, below, opposite } of cases) {
      const entry = pll.cases.find((item) => item.name === name)!;
      const moves = algorithmsFor(entry)[0]!.moves;
      const seen = new Set<string>();
      for (const offset of AUF) {
        const start = undo(moves, offset ? applyAlgorithm(offset) : SOLVED_FACELETS);
        const result = checkAlgorithm(start, moves, "pll");
        expect(result.preAuf, `${name} ${offset}`).toBe("");
        // The sticker doesn't move during the algorithm.
        expect(applyAlgorithm(moves, start)[sticker]).toBe(start[sticker]);
        const colour = start[sticker]!;
        seen.add(colour);
        if (colour === below) expect(result.postAuf, name).toBe("");
        if (colour === opposite) expect(result.postAuf, name).toBe("U2");
      }
      expect(seen.size, name).toBe(4);
    }
    const text = lessonText("auf-both-ends", "auf-after");
    expect(text).toContain(
      "one sticker on the front or right face that the algorithm leaves where it is",
    );
    expect(text).toContain(
      "If it matches the centre below it now, there will be no final turn; if it matches the opposite centre, it will be a U2",
    );
    expect(text).not.toContain("matches the front centre now");
  });

  it("describes the higher-level trick as a second algorithm a turn away", () => {
    const text = lessonText("auf-both-ends", "auf-before");
    expect(text).toContain(
      "a second algorithm for the same case that starts or finishes a turn away from the one you know",
    );
    expect(text).not.toContain("starting the algorithm with a slightly different move");
  });
});

describe("advanced F2L cases, sweep", () => {
  it("names the wide-r part the two flipped-edge cases share", () => {
    const wide = "r U' r' U2 r U r'";
    const examples = lesson("advanced-f2l-cases", "adv-stuck-in-slot").examples!;
    const f39 = examples.find((item) => item.caseId === "f2l-39")!.moves!;
    const f41 = examples.find((item) => item.caseId === "f2l-41")!.moves!;
    expect(f39).toBe(`${wide} R U R'`);
    expect(f41).toBe(`R U' R' ${wide}`);
    expect(lessonText("advanced-f2l-cases", "adv-stuck-in-slot")).toContain(
      `Those last two share the same wide-r part, ${wide}, with a short R trigger at opposite ends.`,
    );
  });

  it("does the U2 in F2L 38 as a double flick, as the rest of the courses teach", () => {
    const example = lesson("advanced-f2l-cases", "adv-stuck-in-slot").examples!.find(
      (item) => item.caseId === "f2l-38",
    )!;
    expect(example.moves).toContain("U2");
    expect(example.note).toContain("index-then-middle double flick");
    expect(example.note).not.toContain("with one finger");
    expect(lessonText("auf-both-ends", "auf-fingers")).toContain("index-then-middle double flick");
  });

  it("says which course covers which group, as the course map has it", () => {
    const lessonsIn = (courseId: string) =>
      getCourse(courseId)!.units.find((unit) => unit.id === "advanced-f2l-cases")!.lessons ?? [];
    expect(lessonsIn("sub-20")).toEqual(["adv-why-algorithms", "adv-stuck-in-slot"]);
    expect(lessonsIn("sub-15")).toEqual([
      "adv-edge-in-slot",
      "adv-corner-in-slot",
      "adv-white-up",
      "adv-back-slots",
    ]);
    expect(lessonText("advanced-f2l-cases", "adv-why-algorithms")).toContain(
      "The Sub-20 course covers the first group; the Sub-15 course picks up the rest.",
    );
  });
});

describe("predict-pll, sweep", () => {
  it("adds the G and R angles after the U, J and T ones, in the order the examples show", () => {
    const labels = lesson("predict-pll", "ppll-second-angles").examples!.map((item) => item.label);
    const at = (start: string) => labels.findIndex((label) => label.startsWith(start));
    for (const late of ["Rb", "Gb"]) {
      for (const early of ["Ua", "Ub", "Jb", "T perm"]) expect(at(late)).toBeGreaterThan(at(early));
    }
    const text = lessonText("predict-pll", "ppll-second-angles");
    expect(text).toContain("Add them after the U perm, J perm and T perm ones");
    expect(text).not.toContain("so learn them last");
  });
});

describe("late packs, sweep", () => {
  it("puts multislotting faster than fifteen seconds, not 'past' it", () => {
    const why = pack("multislotting").why;
    expect(why).toContain("Down to about fifteen seconds");
    expect(why).toContain("Faster than that");
    expect(why).not.toContain("Past about fifteen");
  });

  it("uses one pair benchmark and names the move metric", () => {
    expect(lessonText("reconstruct-your-solves", "recon-what-to-look-for")).toContain(
      "A good pair averages about seven moves and most take eight or fewer",
    );
    expect(lessonText("reconstruct-your-solves", "recon-how")).toContain("The common one, STM,");
  });

  it("plans the cross inside the fifteen seconds before a competition", () => {
    const text = lessonText("competing", "comp-prepare");
    expect(text).toContain("practise with the full fifteen-second limit every solve");
    expect(text).not.toContain("before looking up");
  });
});
