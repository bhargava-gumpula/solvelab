/**
 * Ties the phase 4 fixes in the overall and extra packs (audit 6.4 items 48
 * and 49, and the sweep after them) to the cube engine and the app's own
 * data. A solved engine cube is the solving hold: white cross on D, yellow on
 * U, green on F, orange on R.
 */
import { describe, expect, it } from "vitest";
import { getCourse } from "@/data/hub/courses";
import { aspectTargetsFor } from "@/data/milestones/aspect-targets";
import { getPack, type TrainingPack } from "@/data/training";
import { caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { CORNER_SPOTS, EDGE_SPOTS, faceOf } from "@/lib/cube/pieces";

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

/** A small seeded generator, so the sampled checks give the same answer every run. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(items: readonly T[], random: () => number) =>
  items[Math.floor(random() * items.length)]!;

const isUD = (face: string) => face === "U" || face === "D";
const isFB = (face: string) => face === "F" || face === "B";
const ALL_SPOTS: readonly (readonly number[])[] = [...CORNER_SPOTS, ...EDGE_SPOTS];
const sortedColours = (colours: string) => [...colours].sort().join("");

/** A cube whose stickers are all different, so single pieces can be followed. */
const LABELS = Array.from({ length: 54 }, (_, index) => String.fromCharCode(48 + index)).join("");

/**
 * Edge orientation as defined, read off the labelled cube: follow the edge's
 * reference sticker (its U/D sticker, or its F/B sticker if it has none). The
 * edge is good when that sticker faces U or D in the top and bottom layers, or
 * faces F or B in the middle layer. R, L, U and D keep this; F and B quarter
 * turns flip four edges.
 */
function trulyGood(labelled: string, spot: readonly number[]): boolean {
  const homeFaces = spot.map((index) => faceOf(labelled.charCodeAt(index) - 48));
  const reference = homeFaces.some(isUD) ? homeFaces.findIndex(isUD) : homeFaces.findIndex(isFB);
  const facing = faceOf(spot[reference]!);
  return spot.map(faceOf).some(isUD) ? isUD(facing) : isFB(facing);
}

/**
 * The pack's rules, read off the colours alone: an F2L edge on top is good
 * when its top sticker is the front or back colour; one in the middle layer
 * when its front- or back-facing sticker is; a last-layer edge when its yellow
 * is on top.
 */
function packSays(coloured: string, spot: readonly number[]): { rule: string; good: boolean } {
  const colours = spot.map((index) => coloured[index]!);
  const faces = spot.map(faceOf);
  const top = faces.indexOf("U");
  if (colours.includes("U") && top >= 0) return { rule: "last layer", good: colours[top] === "U" };
  if (colours.some(isUD)) return { rule: "other", good: false };
  if (top >= 0) return { rule: "F2L on top", good: isFB(colours[top]!) };
  if (!faces.some(isUD)) {
    return { rule: "F2L in the middle", good: isFB(colours[faces.findIndex(isFB)]!) };
  }
  return { rule: "other", good: false };
}

describe("slower than about a minute (item 48, overall.ts)", () => {
  it("says slower and faster instead of 'below a minute'", () => {
    const turning = pack("turning-technique");
    expect(turning.why).toMatch(/^While you are slower than about a minute, /);
    expect(turning.why).toContain("Once you are faster than that, the problem changes");
    expect(lessonText("practice-plan", "practice-session-shape")).toContain(
      "While you are slower than about a minute, simply solving a lot",
    );
    for (const id of ["turning-technique", "practice-plan", "consistency"]) {
      expect(JSON.stringify(pack(id)), id).not.toMatch(/Below (about )?a minute/);
    }
  });

  it("no longer calls the hands the bottleneck next to a pack that says stops are", () => {
    // Both packs are in the Sub-60 course.
    const units = getCourse("sub-60")!.units.map((unit) => unit.id);
    expect(units).toContain("turning-technique");
    expect(units).toContain("first-lookahead");
    expect(pack("first-lookahead").why).toContain("Nobody fixes that by turning faster.");
    expect(pack("turning-technique").why).not.toContain("bottleneck");
  });
});

describe("the last layer's share near twelve seconds (item 49, extra.ts)", () => {
  it("is about a third of the solve in the app's own split model", () => {
    for (const level of ["sub15", "sub12", "sub10"]) {
      const goals = aspectTargetsFor(level)!;
      const lastLayer = goals.f2lToOllMs + goals.ollMs + goals.ollToPllMs + goals.pllMs;
      const share = lastLayer / goals.fullSolveMs;
      expect(share, level).toBeGreaterThan(0.3);
      expect(share, level).toBeLessThan(0.4);
    }
    const why = pack("last-layer-at-the-top").why;
    expect(why).toContain("Around 12 seconds the last layer is about a third of the solve");
    expect(why).not.toContain("quarter");
  });
});

describe("where the knowledge gains end (item 49, extra.ts)", () => {
  it("puts learning before twenty and lookahead and F2L efficiency from twenty to fifteen", () => {
    const why = pack("stuck-at-fifteen").why;
    expect(why).toContain("Getting to about 20 seconds is mostly learning things");
    expect(why).toContain("From 20 to 15 it's mostly lookahead and more efficient F2L");
    expect(why).not.toContain("Getting to 15 seconds is mostly learning things");
    const text = lessonText("stuck-at-fifteen", "fifteen-whats-left");
    expect(text).toContain("On the way down to about 20 seconds, most people improve by adding");
    expect(text).toContain("From there to 15 the gains come mostly from lookahead and more");
    expect(text).not.toContain("By 15, those are done");
  });
});

describe("good and bad edges (extra.ts)", () => {
  it("reads edge orientation right from the colours, for F2L and last-layer edges", () => {
    const random = seeded(4);
    const faces = ["R", "L", "U", "D", "F", "B"];
    const tally: Record<string, number> = {};
    for (let sample = 0; sample < 400; sample++) {
      const scramble = Array.from(
        { length: 25 },
        () => pick(faces, random) + pick(["", "'", "2"], random),
      ).join(" ");
      const labelled = applyAlgorithm(scramble, LABELS);
      const coloured = applyAlgorithm(scramble);
      for (const spot of EDGE_SPOTS) {
        const { rule, good } = packSays(coloured, spot);
        if (rule === "other") continue;
        tally[rule] = (tally[rule] ?? 0) + 1;
        expect(good, `${rule} after ${scramble}`).toBe(trulyGood(labelled, spot));
      }
    }
    expect(Object.keys(tally).sort()).toEqual(["F2L in the middle", "F2L on top", "last layer"]);
  });

  it("does not stretch the F2L top-sticker rule to last-layer edges", () => {
    // Yellow on the front with green on top: front colour on top, but a bad edge.
    const state = applyAlgorithm("F R U R' U' F'");
    const flipped = EDGE_SPOTS.slice(0, 4).find((spot) => {
      const top = spot.find((index) => faceOf(index) === "U")!;
      return isFB(state[top]!) && spot.some((index) => state[index] === "U");
    });
    expect(flipped).toBeDefined();
    const labelled = applyAlgorithm("F R U R' U' F'", LABELS);
    expect(trulyGood(labelled, flipped!)).toBe(false);
    const text = lessonText("good-and-bad-edges", "edges-spotting");
    expect(text).toContain("Last-layer edges carry yellow");
    expect(text).toContain("yellow on top is good, yellow on a side is bad");
    expect(text).not.toContain("follow the same rule");
  });

  it("calls a pair's edge good exactly when R and U alone can solve it", () => {
    // Every place R and U can take the pieces R turns, starting solved.
    const turns = ["R", "R'", "R2", "U", "U'", "U2"].map((turn) => {
      const moved = applyAlgorithm(turn, LABELS);
      const to = new Array<number>(54);
      for (let index = 0; index < 54; index++) to[moved.charCodeAt(index) - 48] = index;
      return to;
    });
    const spot = (faces: string) =>
      ALL_SPOTS.find(
        (entry) => sortedColours(entry.map(faceOf).join("")) === sortedColours(faces),
      )!;
    const TRACKED = [
      ["DFR", "D"],
      ["DBR", "D"],
      ["DR", "D"],
      ["FR", "F"],
      ["BR", "B"],
    ] as const;
    const start = TRACKED.map(([piece, face]) => spot(piece).find((i) => faceOf(i) === face)!);
    const reachable = new Set([start.join()]);
    let frontier = [start];
    while (frontier.length > 0) {
      const next: number[][] = [];
      for (const places of frontier) {
        for (const to of turns) {
          const moved = places.map((place) => to[place]!);
          if (!reachable.has(moved.join())) {
            reachable.add(moved.join());
            next.push(moved);
          }
        }
      }
      frontier = next;
    }
    /** Where a coloured cube has the given sticker of the piece with these colours. */
    const find = (state: string, colours: string, colour: string) => {
      const home = ALL_SPOTS.find(
        (entry) =>
          sortedColours(entry.map((index) => state[index]).join("")) === sortedColours(colours),
      )!;
      return home.find((index) => state[index] === colour)!;
    };

    const f2l = getAlgorithmSet("f2l")!;
    let good = 0;
    for (const entry of f2l.cases) {
      const state = caseStateFor(entry, kindFor(f2l, entry));
      const places = TRACKED.map(([piece, face]) => find(state, piece, face));
      const edge = EDGE_SPOTS.find((candidate) => candidate.includes(find(state, "FR", "F")))!;
      const verdict = packSays(state, edge);
      expect(verdict.rule, entry.id).not.toBe("other");
      expect(reachable.has(places.join()), entry.id).toBe(verdict.good);
      if (verdict.good) good++;
    }
    // Both kinds are common: about half the 41 cases.
    expect(good).toBeGreaterThan(15);
    expect(good).toBeLessThan(26);
    expect(drill("good-and-bad-edges", "edges-call-it").rules).toContain(
      "Check yourself by trying the pair with R, L and U only.",
    );
  });

  it("points edge control at the pack in the same course that teaches it", () => {
    const text = lessonText("good-and-bad-edges", "edges-using-it");
    expect(text).toContain("The pack on the last pair into OLL starts that with one common case");
    expect(text).not.toContain("covered in the last-layer pack");
    expect(pack("last-pair-into-oll").title).toBe("The last pair into OLL");
    const units = getCourse("sub-15")!.units;
    expect(units.map((unit) => unit.id)).toContain("good-and-bad-edges");
    const lastPair = units.find((unit) => unit.id === "last-pair-into-oll")!;
    expect(lastPair.lessons).toContain("lastpair-edge-control");
  });
});

describe("where the next pair's pieces are (first-lookahead, extra.ts)", () => {
  it("finds about half the F2L pieces in the slots, and usually one pair on top", () => {
    // Moves that never disturb the white cross: U turns, and slot triggers.
    const moves = [
      "U",
      "U'",
      "U2",
      "R U R'",
      "R U' R'",
      "R' U R",
      "R' U' R",
      "L' U L",
      "L' U' L",
      "L U L'",
      "L U' L'",
      "F' U F",
      "F U F'",
      "B U B'",
      "B' U B",
    ];
    const random = seeded(7);
    const corners = ["DFR", "DRB", "DBL", "DLF"];
    const edges = ["FR", "RB", "BL", "LF"];
    const findPiece = (state: string, colours: string) =>
      ALL_SPOTS.find(
        (entry) =>
          sortedColours(entry.map((index) => state[index]).join("")) === sortedColours(colours),
      )!;
    const onTop = (state: string, colours: string) =>
      findPiece(state, colours).some((index) => faceOf(index) === "U");
    const samples = 800;
    let piecesOnTop = 0;
    let withTopPair = 0;
    for (let sample = 0; sample < samples; sample++) {
      const sequence = Array.from({ length: 60 }, () => pick(moves, random)).join(" ");
      const state = applyAlgorithm(sequence);
      // The cross is still solved.
      for (const cross of ["DF", "DR", "DB", "DL"]) {
        const home = findPiece(SOLVED_FACELETS, cross);
        expect(home.map((index) => state[index]).join("")).toBe(
          home.map((index) => SOLVED_FACELETS[index]).join(""),
        );
      }
      const cornerTop = corners.map((piece) => onTop(state, piece));
      const edgeTop = edges.map((piece) => onTop(state, piece));
      piecesOnTop += [...cornerTop, ...edgeTop].filter(Boolean).length;
      if (cornerTop.some((top, index) => top && edgeTop[index])) withTopPair++;
    }
    const shareOnTop = piecesOnTop / (samples * 8);
    expect(shareOnTop).toBeGreaterThan(0.4);
    expect(shareOnTop).toBeLessThan(0.6);
    expect(withTopPair / samples).toBeGreaterThan(0.6);
    expect(withTopPair / samples).toBeLessThan(0.9);

    const text = lessonText("first-lookahead", "first-look-where");
    expect(text).toContain(
      "when F2L begins, about half of the corners and edges you need sit in the slots",
    );
    expect(text).toContain("there usually is at least one");
    expect(text).not.toContain("almost always in the top layer");
    expect(text).not.toContain("it's the exception");
  });
});

describe("the rest of the sweep (extra.ts)", () => {
  it("leaves room for an OLL skip when the edges come out oriented", () => {
    expect(lessonText("last-layer-at-the-top", "top-coll")).toContain(
      "the ones like Sune and Antisune, unless the corners happen to be oriented as well",
    );
  });

  it("says a full second-pair plan rarely fits, as the lesson's check question does", () => {
    const text = lessonText("past-the-first-pair", "past-why");
    expect(text).toContain("A full second-pair plan rarely fits in fifteen seconds");
    expect(text).toContain("for friendly scrambles only");
  });
});
