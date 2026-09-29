import { describe, expect, it } from "vitest";
import { oll } from "@/data/algorithms/sets/oll";
import { getExercise } from "@/data/exercises";
import { COURSES, getCourse } from "@/data/hub/courses";
import { getPack, type TrainingPack } from "@/data/training";
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { getAspect } from "@/lib/coach/aspects";
import { AUF, firstTwoLayersSolved } from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { edgesFacingUp, readF2lPair, type Side } from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS } from "@/lib/cube/pieces";
import { inspectionPenaltyFor } from "@/lib/timer/engine";

/*
 * Claims the cross, inspection, lookahead and last-pair packs make (audit 6.3
 * items 24, 25, 28, 29, 34, 35 and 42), checked on the engine or against the
 * code they describe. A solved engine cube is the solving hold: white cross on
 * D, yellow on U, green on F.
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

function drill(packId: string, drillId: string) {
  const found = pack(packId).drills.find((entry) => entry.id === drillId);
  if (!found) throw new Error(`No drill ${packId}/${drillId}`);
  return found;
}

function inverse(algorithm: string): string {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(algorithm);
  return formatAlgorithm(invertAlgorithm(parsed.moves));
}

function moveCount(algorithm: string): number {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(algorithm);
  return parsed.moves.length;
}

/** Where the piece with exactly these colours sits: its spot in CORNER_SPOTS or EDGE_SPOTS. */
function spotOf(state: string, colours: string[]): readonly number[] {
  const spots = colours.length === 3 ? CORNER_SPOTS : EDGE_SPOTS;
  const found = spots.find((spot) =>
    colours.every((colour) => spot.some((i) => state[i] === colour)),
  );
  if (!found) throw new Error(`No piece ${colours.join("")}`);
  return found;
}

describe("inspection penalties (item 42)", () => {
  const text = lessonText("inspection", "inspection-what-it-is");

  it("gives +2 after fifteen seconds and a DNF after seventeen, as the timer does", () => {
    expect(text).toContain("after fifteen seconds and two seconds are added to your time (+2)");
    expect(text).toContain("after seventeen and the solve is a DNF");
    expect(inspectionPenaltyFor(15_000, 15_000)).toBe("none");
    expect(inspectionPenaltyFor(15_001, 15_000)).toBe("plus2");
    expect(inspectionPenaltyFor(17_000, 15_000)).toBe("plus2");
    expect(inspectionPenaltyFor(17_001, 15_000)).toBe("dnf");
  });
});

describe("cross plus one in inspection (item 29)", () => {
  const text = lessonText("inspection", "inspection-cross-plus-one");

  it("tracks the first pair through the cross, takes offered x-crosses and never forces one", () => {
    expect(text).toContain("close your eyes for the cross");
    expect(text).toContain("about nine or ten moves");
    expect(text).toContain("What is not worth it is forcing one");
  });

  it("has an eyes-closed drill on the Cross + first pair test", () => {
    const entry = drill("inspection", "inspection-cross-plus-one-blind");
    expect(entry.rules.join(" ")).toContain("Close your eyes and solve the cross");
    expect(entry.exerciseId).toBe("cross_first_pair");
    expect(getExercise("cross_first_pair")?.name).toBe("Cross + first pair");
  });
});

describe("measuring the join after the cross (item 24)", () => {
  const text = lessonText("cross-into-f2l", "join-first-pair");

  it("names tests that exist and the coach reading that uses them", () => {
    for (const [id, name] of [
      ["cross_first_pair", "Cross + first pair"],
      ["cross_only", "Cross"],
      ["last_slot", "Single pair"],
      ["cross_f2l", "Cross + F2L"],
      ["f2l_only", "F2L"],
    ] as const) {
      expect(getExercise(id)?.name, id).toBe(name);
      expect(text, id).toContain(`${name} test`);
    }
    const aspect = getAspect("cross_to_f2l");
    expect(text).toContain(`shows it as ${aspect.label}`);
    expect(aspect.tests).toEqual(expect.arrayContaining(["cross_f2l", "cross_only", "f2l_only"]));
    expect(aspect.optionalTests).toContain("cross_first_pair");
  });
});

describe("x-cross framing (item 28)", () => {
  it("takes the x-cross when the scramble offers one and never forces it", () => {
    const text = lessonText("cross-into-f2l", "join-xcross");
    expect(text).toContain("When a scramble offers that, take it");
    expect(text).toContain("Don't force one when it isn't there");
    expect(text).toContain("Forcing one each time");
  });
});

describe("lookahead stages by course (item 25)", () => {
  it("places spotting, tracking and knowing in courses that exist", () => {
    const text = lessonText("lookahead", "lookahead-three-stages");
    expect(text).toContain("Sub-30 works on spotting");
    expect(text).toContain("Sub-20 works on tracking, and Sub-15 keeps it going");
    expect(text).toContain("Knowing starts in Sub-12");
    // Each course the lesson names shows the lookahead unit.
    for (const id of ["sub-30", "sub-20", "sub-15", "sub-12"]) {
      expect(
        getCourse(id)!.units.map((unit) => unit.id),
        id,
      ).toContain("lookahead");
    }
  });

  it("knows where R U R' puts a piece, as the knowing lesson says", () => {
    const text = lessonText("lookahead", "lookahead-knowing");
    expect(text).toContain(
      "R U R' takes the edge at the back of the top layer down into the front-right slot",
    );
    expect(text).toContain("The corner at the top front-left ends up at the top back-left");
    expect(text).toContain("seven or eight moves");
    expect(text).toContain(
      "the stage to work on once you are under about fifteen seconds and heading for twelve",
    );
    // It is taught in Sub-12, the course for people averaging twelve to fifteen seconds.
    const sub12 = COURSES.find((course) => course.id === "sub-12");
    expect(sub12?.rungs).toEqual(["sub15"]);
    expect(sub12?.units.find((unit) => unit.id === "lookahead")?.lessons).toContain(
      "lookahead-knowing",
    );

    const after = applyAlgorithm("R U R'", SOLVED_FACELETS);
    // The yellow-blue edge starts at the back of the top layer and ends in the front-right slot.
    expect(spotOf(SOLVED_FACELETS, ["U", "B"])).toBe(EDGE_SPOTS[3]);
    expect(spotOf(after, ["U", "B"])).toBe(EDGE_SPOTS[8]);
    // The U turn is what carries it to the right, and the R' what pulls it down.
    expect(spotOf(applyAlgorithm("R U", SOLVED_FACELETS), ["U", "B"])).toBe(EDGE_SPOTS[0]);
    // The yellow-green-red corner starts at the top front-left and ends at the back-left.
    expect(spotOf(SOLVED_FACELETS, ["U", "F", "L"])).toBe(CORNER_SPOTS[1]);
    expect(spotOf(after, ["U", "F", "L"])).toBe(CORNER_SPOTS[2]);
    // Neither R move touches it; the U turn alone moves it.
    expect(spotOf(applyAlgorithm("R", SOLVED_FACELETS), ["U", "F", "L"])).toBe(CORNER_SPOTS[1]);
    expect(spotOf(applyAlgorithm("R'", SOLVED_FACELETS), ["U", "F", "L"])).toBe(CORNER_SPOTS[1]);
  });

  it("has a two-pairs-blind drill", () => {
    const entry = drill("lookahead", "lookahead-two-pairs-blind");
    expect(entry.rules.join(" ")).toContain("Close your eyes and solve both pairs");
  });
});

describe("last-pair edge control (item 34)", () => {
  const text = lessonText("last-pair-into-oll", "lastpair-edge-control");
  const PLAIN = "U R U' R'";
  const SLEDGE = "R' F R F'";

  /** Every F2L-solved state with a different last layer: each OLL case at each U turn. */
  const lastLayers = [
    SOLVED_FACELETS,
    ...oll.cases.flatMap((entry) =>
      AUF.map((auf) => applyAlgorithm(`${inverse(algorithmsFor(entry)[0]!.moves)} ${auf}`.trim())),
    ),
  ];
  /** The case: the last pair joined on the right, ready for either insert. */
  const cases = lastLayers.map((finished) => applyAlgorithm(inverse(PLAIN), finished));

  it("names the case as the engine reads it: joined on the right, white facing you, green up", () => {
    expect(text).toContain(
      "the corner right above its slot with white facing you, and the edge beside it on the right with green on top",
    );
    for (const state of cases) {
      expect(readF2lPair(state)).toEqual({
        corner: "front-right",
        white: "front",
        edge: "right",
        green: "up",
      });
      // Joined: the corner's top and right stickers match the edge's.
      const [corner, edge] = [CORNER_SPOTS[0]!, EDGE_SPOTS[0]!];
      expect(state[corner[1]]).toBe(state[edge[1]]);
      expect(state[corner[0]]).toBe(state[edge[0]]);
    }
  });

  it("inserts it with either four-move insert, which differ by two flipped edges", () => {
    expect(text).toContain(`${PLAIN} puts it in. So does the sledgehammer, ${SLEDGE}`);
    expect(text).toContain("Both are four moves");
    expect(moveCount(PLAIN)).toBe(4);
    expect(moveCount(SLEDGE)).toBe(4);
    for (const state of cases) {
      const plain = edgesFacingUp(applyAlgorithm(PLAIN, state)).length;
      const sledge = edgesFacingUp(applyAlgorithm(SLEDGE, state)).length;
      expect(firstTwoLayersSolved(applyAlgorithm(PLAIN, state))).toBe(true);
      expect(firstTwoLayersSolved(applyAlgorithm(SLEDGE, state))).toBe(true);
      // A dot or all four up from one insert means two up from the other.
      if (plain === 0 || plain === 4) expect(sledge).toBe(2);
      if (sledge === 0 || sledge === 4) expect(plain).toBe(2);
      // Piece by piece, exactly two of the four yellow edges face differently.
      const upAfter = (insert: string) => {
        const after = applyAlgorithm(insert, state);
        return new Map(
          EDGE_SPOTS.slice(0, 4).map(([top, side]) => [
            `${after[top]}${after[side]}`.replace("U", ""),
            after[top] === "U",
          ]),
        );
      };
      const [afterPlain, afterSledge] = [upAfter(PLAIN), upAfter(SLEDGE)];
      expect(afterPlain.size).toBe(4);
      const flipped = [...afterPlain].filter(([piece, up]) => afterSledge.get(piece) !== up);
      expect(flipped).toHaveLength(2);
    }
  });

  it("chooses by the front edge alone, never leaving a dot and taking all four when possible", () => {
    expect(text).toContain("Look at the top edge at the front");
    expect(text).toContain(
      `If it shows yellow on top, do ${PLAIN}; if it does not, do the sledgehammer`,
    );
    const patterns = new Set<string>();
    for (const state of cases) {
      // The three last-layer edges on top: the pair's edge holds the right.
      const visible = (["back", "left", "front"] as Side[]).map((side) =>
        edgesFacingUp(state).includes(side),
      );
      patterns.add(visible.join());
      const plain = edgesFacingUp(applyAlgorithm(PLAIN, state)).length;
      const sledge = edgesFacingUp(applyAlgorithm(SLEDGE, state)).length;
      const chosen = edgesFacingUp(state).includes("front") ? plain : sledge;
      expect(chosen).toBeGreaterThan(0);
      expect(chosen).toBe(Math.max(plain, sledge));
    }
    // Every way the three visible edges can face was tried.
    expect(patterns.size).toBe(8);
  });

  it("gives all four edges up about one solve in eight without control", () => {
    expect(text).toContain("about one solve in eight");
    // Edge orientation after F2L has eight equally likely patterns; one has all four up.
    const patterns = new Set(lastLayers.map((state) => edgesFacingUp(state).join()));
    expect(patterns.size).toBe(8);
    expect([...patterns].filter((pattern) => pattern.split(",").length === 4)).toHaveLength(1);
  });

  it("doubles that to one in four on this case by choosing from the front edge", () => {
    expect(text).toContain("all four top edges face up after F2L");
    expect(text).toContain(
      "Winter Variation only when the three top edges you can see already face up before the last insert",
    );
    expect(text).toContain("doubles that to one in four");
    // Group the case by how its three visible top edges face: eight equally likely patterns.
    const byPattern = new Map<
      string,
      { plain: Set<number>; sledge: Set<number>; rule: Set<number> }
    >();
    for (const state of cases) {
      const up = edgesFacingUp(state);
      const key = (["back", "left", "front"] as Side[]).map((side) => up.includes(side)).join();
      const plain = edgesFacingUp(applyAlgorithm(PLAIN, state)).length;
      const sledge = edgesFacingUp(applyAlgorithm(SLEDGE, state)).length;
      const entry = byPattern.get(key) ?? { plain: new Set(), sledge: new Set(), rule: new Set() };
      entry.plain.add(plain);
      entry.sledge.add(sledge);
      entry.rule.add(up.includes("front") ? plain : sledge);
      byPattern.set(key, entry);
    }
    expect(byPattern.size).toBe(8);
    const allUp = (pick: "plain" | "sledge" | "rule") =>
      [...byPattern.values()].filter((entry) => {
        // Each pattern always gives the same result.
        expect(entry[pick].size).toBe(1);
        return entry[pick].has(4);
      }).length;
    expect(allUp("plain")).toBe(1);
    expect(allUp("sledge")).toBe(1);
    expect(allUp("rule")).toBe(2);
    // Winter Variation's cases are this joined case with all three visible edges up: one
    // pattern of the eight, fixed before the insert, so the choice of insert can't add to it.
    const wv = getAlgorithmSet("winter-variation")!;
    expect(wv.cases.length).toBeGreaterThan(0);
    for (const entry of wv.cases) {
      const state = caseStateFor(entry, kindFor(wv, entry));
      expect(readF2lPair(state), entry.id).toMatchObject({ corner: "front-right", edge: "right" });
      expect(edgesFacingUp(state), entry.id).toEqual(["back", "left", "front"]);
    }
    expect(byPattern.get("true,true,true")?.plain).toEqual(new Set([4]));
  });

  it("names VHLS and ZBLS as the full versions", () => {
    expect(text).toContain("The full versions are VHLS");
    expect(text).toContain("ZBLS");
  });
});

describe("last-slot systems timing (item 35)", () => {
  it("places them once full OLL and PLL are solid, around fifteen seconds, with WV's preconditions", () => {
    const text = lessonText("last-pair-into-oll", "lastpair-influence");
    expect(text).toContain("once full OLL and PLL are solid, around fifteen seconds");
    expect(text).toContain("Once full OLL and PLL are solid, around fifteen seconds");
    expect(text).not.toMatch(/sub-12|twelve seconds/);
    expect(text).toContain("joined in the top layer, ready for a U R U' R' insert");
    expect(text).toContain("top edges already oriented");
  });
});
