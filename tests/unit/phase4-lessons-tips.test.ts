import { describe, expect, it } from "vitest";
import { ASPECT_TIPS } from "@/data/coach/tips";
import { COURSES } from "@/data/hub/courses";
import { getLesson, lessons } from "@/data/learning/lessons";
import {
  algorithmsFor,
  caseStateFor,
  getAlgorithmSet,
  getCase,
  kindFor,
} from "@/lib/algorithms/catalog";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { edgesFacingUp, hasBar, readF2lPair, sideRow, type Side } from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS } from "@/lib/cube/pieces";

const AUFS = ["", "U", "U2", "U'"] as const;
const SIDES: Side[] = ["front", "right", "back", "left"];

function stepBody(lessonId: string, title: string): string {
  const step = getLesson(lessonId)?.steps.find((item) => item.title === title);
  if (!step) throw new Error(`${lessonId} has no step "${title}"`);
  return step.body;
}

/** The case a sequence solves: the sequence undone on a solved cube. */
function start(moves: string): string {
  const parsed = parseAlgorithm(moves);
  if (!parsed.ok) throw new Error(moves);
  return applyAlgorithm(formatAlgorithm(invertAlgorithm(parsed.moves)), SOLVED_FACELETS);
}

const turned = (state: string, auf: string) => (auf ? applyAlgorithm(auf, state) : state);

/** Each slot's corner and edge as sticker positions, and the four cross edges. */
const SLOTS = {
  FR: [CORNER_SPOTS[4]!, EDGE_SPOTS[8]!],
  FL: [CORNER_SPOTS[5]!, EDGE_SPOTS[9]!],
  BL: [CORNER_SPOTS[6]!, EDGE_SPOTS[10]!],
  BR: [CORNER_SPOTS[7]!, EDGE_SPOTS[11]!],
} as const;
const CROSS = EDGE_SPOTS.slice(4, 8);
const home = (spot: number) => "URFDLB"[Math.floor(spot / 9)];
const solved = (state: string, pieces: readonly (readonly number[])[]) =>
  pieces.every((piece) => piece.every((spot) => state[spot] === home(spot)));

/** Where the piece with exactly these colours sits: its sticker positions. */
function whereIs(state: string, colours: string[], spots: readonly (readonly number[])[]) {
  return spots.find(
    (spot) =>
      spot.length === colours.length && colours.every((c) => spot.some((i) => state[i] === c)),
  );
}

describe("method lesson examples", () => {
  it("quote a verified algorithm for their case and touch only the slot they name", () => {
    let checked = 0;
    for (const lesson of lessons) {
      for (const example of lesson.examples ?? []) {
        if (!example.moves) continue;
        if (example.caseId) {
          const entry = ["f2l", "two-look-oll", "two-look-pll", "oll", "pll"]
            .map((setId) => getCase(setId, example.caseId!))
            .find(Boolean);
          expect(entry, `${lesson.id}: no case ${example.caseId}`).toBeTruthy();
          expect(
            algorithmsFor(entry!).map((algorithm) => algorithm.moves),
            `${lesson.id}: ${example.label}`,
          ).toContain(example.moves);
          checked++;
        }
        if (example.slot) {
          const state = start(example.moves);
          const label = `${lesson.id}: ${example.moves}`;
          expect(solved(state, CROSS), label).toBe(true);
          for (const [slot, pieces] of Object.entries(SLOTS)) {
            expect(solved(state, pieces), `${label} (${slot})`).toBe(slot !== example.slot);
          }
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });
});

describe("cfop-f2l: most cases are free, pair, insert", () => {
  const text = stepBody("cfop-f2l", "Pair then insert");

  it("says most cases, not every case, and names the exceptions and the count", () => {
    expect(text).toContain("most of them come down to three ideas");
    expect(text).not.toContain("is really three ideas");
    expect(text).toContain("some join as they go in");
    expect(text).toContain("keyhole drops a single piece in through an empty slot");
    expect(text).toContain("forty-one cases");
    expect(getAlgorithmSet("f2l")!.cases).toHaveLength(41);
  });

  it("puts keyhole in the Sub-30 course", () => {
    expect(text).toContain("in the Sub-30 course keyhole");
    const sub30 = COURSES.find((course) => course.title === "Sub-30")!;
    const unit = sub30.units.find((item) => item.id === "f2l-efficiency")!;
    expect(unit.lessons).toContain("f2l-empty-slots");
    expect(unit.drills).toContain("f2l-keyhole-hunt");
  });

  it("shows the joined pair R U' R' inserts, and the split pair R U R' joins on the way in", () => {
    expect(readF2lPair(start("R U' R'"))).toMatchObject({ corner: "front-left", edge: "front" });
    expect(text).toContain(
      "with the corner at the front left and its edge beside it at the front, R U' R' drops it in",
    );
    const split = readF2lPair(start("R U R'"));
    expect(split.corner).toBe("front-right");
    expect(split.edge).toBe("back");
    const examples = getLesson("cfop-f2l")!.examples!;
    expect(examples.map((example) => example.moves)).toEqual(["R U' R'", "R U R'"]);
    expect(caseStateFor(getCase("f2l", "f2l-3")!, "f2l")).toBe(start("R U' R'"));
    expect(caseStateFor(getCase("f2l", "f2l-1")!, "f2l")).toBe(start("R U R'"));
  });
});

describe("cfop-cross: colour neutrality is this course's optional unit", () => {
  it("points at the optional unit in Sub-60, where the cfop path is", () => {
    expect(stepBody("cfop-cross", "Inspection goal")).toContain(
      "Colour neutrality is an optional extra with its own unit in this course",
    );
    const sub60 = COURSES.find((course) => course.title === "Sub-60")!;
    expect(sub60.units.map((unit) => unit.id)).toContain("method-cfop");
    expect(sub60.units.find((unit) => unit.id === "colour-neutral-plan")?.optional).toBe(true);
  });
});

describe("cfop-2look-oll: holds for the edge step", () => {
  const text = stepBody("cfop-2look-oll", "Edges first");
  const state = (id: string) => caseStateFor(getCase("two-look-oll", id)!, "eoll");

  it("holds the line left to right and the L at the front right", () => {
    expect(edgesFacingUp(state("2oll-line")).sort()).toEqual(["left", "right"]);
    expect(edgesFacingUp(state("2oll-l")).sort()).toEqual(["front", "right"]);
    expect(text).toContain("Hold the line left to right and do F R U R′ U′ F′");
    expect(text).toContain("Hold the L at the front right");
    expect(text).toContain("f R U R′ U′ f′");
  });

  it("turns a dot held any way into an L at the front right, then the cross", () => {
    for (const auf of AUFS) {
      const afterLine = applyAlgorithm("F R U R' U' F'", turned(state("2oll-dot"), auf));
      expect(edgesFacingUp(afterLine).sort(), auf).toEqual(["front", "right"]);
      expect(edgesFacingUp(applyAlgorithm("f R U R' U' f'", afterLine)), auf).toHaveLength(4);
    }
    expect(text).toContain("do the line algorithm holding the cube any way");
    expect(text).toContain("it leaves an L at the front right");
  });
});

describe("cfop-2look-pll: edges and the AUF habit", () => {
  const pll = getAlgorithmSet("pll")!;
  const state = (id: string) => {
    const entry = pll.cases.find((item) => item.id === id)!;
    return caseStateFor(entry, kindFor(pll, entry));
  };
  /** The centre the front edge's side sticker belongs to. */
  const frontEdgeBelongs = (s: string) => sideRow(s, "front")[1];

  it("reads the U perms from a bar at the back and the front edge", () => {
    for (const [id, belongs] of [
      ["pll-ua", "R"],
      ["pll-ub", "L"],
    ] as const) {
      expect(
        SIDES.filter((side) => hasBar(state(id), side)),
        id,
      ).toEqual(["back"]);
      expect(frontEdgeBelongs(state(id)), id).toBe(belongs);
    }
    const text = stepBody("cfop-2look-pll", "Edge permutation");
    expect(text).toContain("hold it at the back and look at the front edge");
    expect(text).toContain("If it belongs on the right, do the Ua perm");
    expect(text).toContain("if it belongs on the left, the Ub perm");
  });

  it("tells H from Z when there is no bar", () => {
    const opposite: Record<string, string> = { F: "B", B: "F", R: "L", L: "R" };
    for (const auf of AUFS) {
      const h = turned(state("pll-h"), auf);
      const z = turned(state("pll-z"), auf);
      for (const s of [h, z]) expect(SIDES.some((side) => hasBar(s, side))).toBe(false);
      // Every H edge belongs on the opposite side, every Z edge on a neighbouring one.
      for (const side of SIDES) {
        const own = sideRow(h, side)[0]!; // the corners are home, so they name the side
        expect(sideRow(h, side)[1]).toBe(opposite[own]);
        const zOwn = sideRow(z, side)[0]!;
        expect([zOwn, opposite[zOwn]]).not.toContain(sideRow(z, side)[1]);
      }
    }
    const text = stepBody("cfop-2look-pll", "Edge permutation");
    expect(text).toContain("H if each belongs on the opposite side");
    expect(text).toContain("Z if each belongs on a neighbouring one");
  });

  it("recognises first, turns the top on purpose and calls the last turn", () => {
    const text = stepBody("cfop-2look-pll", "AUF habit");
    expect(text).toContain("Recognise the case first");
    expect(text).toContain("the angle the algorithm starts from");
    expect(text).toContain("Don't turn it while you are still looking");
    expect(text).toContain("turn the top, not the whole cube");
    expect(text).toContain("already know which last turn lines the layer up");
  });
});

describe("advanced-rotations: back slots without rotating", () => {
  const text = stepBody("advanced-rotations", "Back slots without rotating");
  const TOP_CORNER = { backLeft: CORNER_SPOTS[2]!, backRight: CORNER_SPOTS[3]! };
  const TOP_EDGE = { front: EDGE_SPOTS[1]!, back: EDGE_SPOTS[3]! };

  it("gives inserts that fill only the back slot they name", () => {
    for (const [moves, slot] of [
      ["R' U R", "BR"],
      ["R' U' R", "BR"],
      ["L U' L'", "BL"],
      ["L U L'", "BL"],
    ] as const) {
      const state = start(moves);
      expect(solved(state, CROSS), moves).toBe(true);
      for (const [name, pieces] of Object.entries(SLOTS)) {
        expect(solved(state, pieces), `${moves} (${name})`).toBe(name !== slot);
      }
      expect(text).toContain(moves.replaceAll("'", "′"));
    }
  });

  it("puts each pair where the text says", () => {
    const br = (moves: string) => ({
      corner: whereIs(start(moves), ["D", "B", "R"], CORNER_SPOTS),
      edge: whereIs(start(moves), ["B", "R"], EDGE_SPOTS),
    });
    const bl = (moves: string) => ({
      corner: whereIs(start(moves), ["D", "B", "L"], CORNER_SPOTS),
      edge: whereIs(start(moves), ["B", "L"], EDGE_SPOTS),
    });
    // Joined at the back: R' U R with the corner back-left, L U' L' with it back-right.
    expect(br("R' U R")).toEqual({ corner: TOP_CORNER.backLeft, edge: TOP_EDGE.back });
    expect(bl("L U' L'")).toEqual({ corner: TOP_CORNER.backRight, edge: TOP_EDGE.back });
    // Corner above the slot, edge at the front.
    expect(br("R' U' R")).toEqual({ corner: TOP_CORNER.backRight, edge: TOP_EDGE.front });
    expect(bl("L U L'")).toEqual({ corner: TOP_CORNER.backLeft, edge: TOP_EDGE.front });
    expect(text).toContain("R′ U R for a pair joined at the back");
    expect(text).toContain(
      "R′ U′ R when the corner sits above the slot with its edge at the front",
    );
    expect(text).toContain("L U′ L′ and L U L′ in the same way");
    const notes = getLesson("advanced-rotations")!.examples!.map((example) => example.note);
    expect(notes[0]).toContain("its corner at the back left");
    expect(notes[1]).toContain("its corner at the back right");
  });

  it("says a d is a y′ and a U, and a d′ a y and a U′", () => {
    expect(applyAlgorithm("d")).toBe(applyAlgorithm("y' U"));
    expect(applyAlgorithm("d'")).toBe(applyAlgorithm("y U'"));
    expect(applyAlgorithm("d")).not.toBe(applyAlgorithm("y"));
    expect(text).toContain("d is a y′ and a U, d′ a y and a U′");
    expect(text).toContain("practise slowly until solving from the front beats rotating");
  });
});

describe("coach tips", () => {
  it("reads the OLL while the last pair goes in", () => {
    expect(ASPECT_TIPS.f2l_to_oll.tips[0]).toContain(
      "while the last pair is still going in, so the algorithm starts without a pause",
    );
  });

  it("keeps the cross and first-pair facts exact", () => {
    expect(ASPECT_TIPS.cross.tips[0]).toContain("every cross can be solved in 8 moves or fewer");
    expect(ASPECT_TIPS.cross.tips[0]).not.toContain("almost every");
    expect(ASPECT_TIPS.cross_to_f2l.tips[0]).not.toContain("often don't move");
    expect(ASPECT_TIPS.cross_to_f2l.keep).toContain("when the scramble offers an easy one");
  });

  it("stages full OLL the same way in the tip and the drill", () => {
    expect(ASPECT_TIPS.oll_algorithms.tips[0]).toContain("near sub-20");
    expect(ASPECT_TIPS.oll_algorithms.drill).toContain("near sub-20");
  });
});

describe("house spelling", () => {
  it("writes the method lessons in British English", () => {
    const text = lessons
      .flatMap((lesson) => [
        lesson.title,
        lesson.summary,
        ...lesson.steps.flatMap((step) => [step.title, step.body]),
        ...(lesson.examples ?? []).map((example) => example.note),
      ])
      .join(" ");
    expect(text).not.toMatch(/\bcolors?\b|\bcenters?\b/i);
  });
});
