import { describe, expect, it } from "vitest";
import { getPack, type TrainingPack } from "@/data/training";
import { SOURCES } from "@/data/training/sources";
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import {
  AUF,
  checkAlgorithm,
  firstTwoLayersSolved,
  lastLayerEdgesOriented,
  lastLayerOriented,
} from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { edgesFacingUp, readF2lPair, topColourFacing, type TopCorner } from "@/lib/cube/describe";
import { parseAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS, faceOf } from "@/lib/cube/pieces";

/*
 * Claims the late and extra packs make in the course-structure phase (audit
 * 6.3), checked on the engine where the cube can check them, with the text
 * tied to what the engine shows. A solved engine cube is the solving hold:
 * white cross on D, yellow on U, green on F.
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
  const { takeaway, body, checkpoint } = lesson(packId, lessonId);
  return [takeaway, ...body, checkpoint ?? ""].join(" ");
}

function drill(packId: string, drillId: string) {
  const found = pack(packId).drills.find((entry) => entry.id === drillId);
  if (!found) throw new Error(`No drill ${packId}/${drillId}`);
  return found;
}

const ALL_SPOTS: readonly (readonly number[])[] = [...CORNER_SPOTS, ...EDGE_SPOTS];
const facesAt = (spot: readonly number[]) => spot.map(faceOf).sort().join("");
const spotNamed = (faces: string) => {
  const sorted = [...faces].sort().join("");
  return ALL_SPOTS.find((spot) => facesAt(spot) === sorted)!;
};
/** The colours (engine letters) of the piece sitting at a spot, sorted. */
const pieceAt = (state: string, spot: readonly number[]) =>
  spot
    .map((index) => state[index])
    .sort()
    .join("");
/** The sticker a spot shows on one face. */
const stickerOn = (state: string, spot: readonly number[], face: string) =>
  state[spot.find((index) => faceOf(index) === face)!];
const atHome = (state: string, spot: readonly number[]) =>
  spot.every((index) => state[index] === faceOf(index));

describe("full OLL at sub-20 (audit 6.3 item 26, late.ts)", () => {
  it("says sub-20 needs no full OLL, and to start it here if the last layer is the leak", () => {
    const text = lessonText("sub-20-budget", "budget-shape");
    expect(text).toContain("so you can get to sub-20 without full OLL");
    expect(text).toContain(
      "If your measured last layer is the part over budget, though, this is a good time to start full OLL",
    );
    expect(text).not.toContain("you don't need full OLL to get here");
  });
});

describe("keyhole comes first; pseudo-slotting and multislotting later (item 37, late.ts)", () => {
  it("files keyhole under the Sub-30 course, not after lookahead", () => {
    const text = lessonText("multislotting", "multi-family");
    expect(text).toContain("you should already be using it from the Sub-30 course");
    expect(text).toContain(
      "Pseudo-slotting and multislotting both depend on seeing more of the cube than the pair in front of you",
    );
    expect(text).not.toContain("All three depend");
    expect(pack("multislotting").summary).toContain("built on the keyhole you already know");
  });
});

describe("pseudo-slotting (multi-pseudo, late.ts)", () => {
  const text = lessonText("multislotting", "multi-pseudo");
  const MIDDLE_EDGES = ["FR", "FL", "BR", "BL"].map(spotNamed);
  const BOTTOM_CORNERS = ["DFR", "DFL", "DBR", "DBL"].map(spotNamed);

  it("sits between the family lesson and the first multislot", () => {
    expect(pack("multislotting").lessons.map((entry) => entry.id)).toEqual([
      "multi-family",
      "multi-pseudo",
      "multi-example",
      "multi-limits",
    ]);
  });

  it("relies on a bottom turn moving the corners but not the middle-layer edges", () => {
    for (const turn of ["D", "D2", "D'"]) {
      const state = applyAlgorithm(turn);
      for (const edge of MIDDLE_EDGES) expect(atHome(state, edge), turn).toBe(true);
      for (const corner of BOTTOM_CORNERS) expect(atHome(state, corner), turn).toBe(false);
    }
    expect(text).toContain(
      "A turn of the bottom layer carries its corners round with it, but the middle-layer edges stay where they are.",
    );
  });

  it("brings the front-left corner's home under the front-right slot with D", () => {
    const turned = applyAlgorithm("D");
    const underFrontRight = spotNamed("DFR");
    expect(pieceAt(turned, underFrontRight)).toBe("DFL");
    expect(stickerOn(turned, underFrontRight, "D")).toBe("D");
    expect(atHome(turned, spotNamed("FR"))).toBe(true);
    expect(text).toContain(
      "Turn the bottom a quarter with D and the front-left corner's home moves round to sit under the front-right slot, while the front-right edge's home stays put.",
    );
  });

  it("puts the front-left corner and front-right edge in together, and D' sends both home", () => {
    // Lift the pseudo-pair out of the turned cube: both pieces end up in the top layer.
    const lifted = applyAlgorithm("D R U' R'");
    const top = ALL_SPOTS.filter((spot) => spot.some((index) => faceOf(index) === "U"));
    const whereIs = (colours: string) =>
      ALL_SPOTS.find((spot) => pieceAt(lifted, spot) === [...colours].sort().join(""))!;
    expect(top).toContain(whereIs("DFL"));
    expect(top).toContain(whereIs("FR"));
    // One insert puts them in together, and turning the bottom back finishes both.
    const inserted = applyAlgorithm("R U R'", lifted);
    expect(atHome(inserted, spotNamed("FR"))).toBe(true);
    expect(pieceAt(inserted, spotNamed("DFR"))).toBe("DFL");
    expect(applyAlgorithm("D'", inserted)).toBe(SOLVED_FACELETS);
    // The other way round works too: D' brings the back-right corner's home under the slot.
    const turnedBack = applyAlgorithm("D'");
    expect(pieceAt(turnedBack, spotNamed("DFR"))).toBe("BDR");
    const liftedBack = applyAlgorithm("D' R U' R'");
    const insertedBack = applyAlgorithm("R U R'", liftedBack);
    expect(atHome(insertedBack, spotNamed("FR"))).toBe(true);
    expect(pieceAt(insertedBack, spotNamed("DFR"))).toBe("BDR");
    expect(applyAlgorithm("D", insertedBack)).toBe(SOLVED_FACELETS);
    expect(text).toContain(
      "Turn the bottom back with D' and the corner rides home to the front-left, while the edge is already where it belongs.",
    );
  });

  it("never has the two pieces' colours matching, whichever way the bottom is turned", () => {
    for (const turn of ["D", "D2", "D'"]) {
      const state = applyAlgorithm(turn);
      const corner = spotNamed("DFR");
      const edge = spotNamed("FR");
      for (const face of ["F", "R"]) {
        expect(stickerOn(state, corner, face), `${turn} ${face}`).not.toBe(
          stickerOn(state, edge, face),
        );
      }
    }
    expect(text).toContain("the two pieces' colours don't match on either face");
    expect(pack("multislotting").mistakes.join(" ")).toContain(
      "Checking a pseudo-pair by matching its stickers, which never match",
    );
  });

  it("says when it pays, why it's easy to misread, and to drill it", () => {
    expect(text).toContain("does the work of two separate keyholes in fewer moves");
    expect(text).toContain("it needs only two open slots");
    expect(text).toContain("put in with its edge flipped");
    expect(text).toContain("drill it on purpose");
    expect(text).toContain("with the bottom turned a quarter either way");
    expect(drill("multislotting", "multi-spot").rules[0]).toContain(
      "would turning the bottom let a corner and an edge from different pairs go in together",
    );
  });
});

describe("Winter Variation and COLL timing (item 35, late.ts)", () => {
  const text = lessonText("alg-sets-worth-it", "sets-small");
  const wv = getAlgorithmSet("winter-variation")!;

  it("places both around fifteen seconds, once full OLL and PLL are solid", () => {
    expect(text).toContain("once full OLL and PLL are solid, around fifteen seconds");
    expect(text).not.toContain("this ladder puts it around fifteen seconds");
    expect(text).not.toContain("twelve seconds");
  });

  it("states WV's preconditions, and every bank case starts from them", () => {
    expect(wv.cases).toHaveLength(27);
    expect(text).toContain("Winter Variation is 27 cases");
    expect(text).toContain(
      "the last pair already joined in the top layer, ready for a U R U' R' insert",
    );
    expect(text).toContain("with the last layer's edges already facing up");
    expect(text).toContain(
      "It inserts the last pair and turns the last-layer corners yellow side up in the same algorithm, so PLL comes next.",
    );
    for (const entry of wv.cases) {
      const state = caseStateFor(entry, kindFor(wv, entry));
      expect(readF2lPair(state), entry.id).toMatchObject({ corner: "front-right", edge: "right" });
      // Joined: the corner and edge match on top and on the right side.
      expect(state[8], entry.id).toBe(state[5]);
      expect(state[9], entry.id).toBe(state[10]);
      expect(edgesFacingUp(state).sort(), entry.id).toEqual(["back", "front", "left"]);
      const inserted = applyAlgorithm("U R U' R'", state);
      expect(firstTwoLayersSolved(inserted), entry.id).toBe(true);
      expect(lastLayerEdgesOriented(inserted), entry.id).toBe(true);
      // The algorithm itself puts the pair in and turns every top corner yellow side up.
      const moves = algorithmsFor(entry)[0]!.moves;
      const result = checkAlgorithm(state, moves, "wv");
      expect(result.ok, entry.id).toBe(true);
      const after = applyAlgorithm(`${result.preAuf ?? ""} ${moves}`, state);
      expect(firstTwoLayersSolved(after), entry.id).toBe(true);
      expect(lastLayerOriented(after), entry.id).toBe(true);
    }
  });

  it("has short R and U cases to learn first", () => {
    const short = wv.cases.filter((entry) =>
      algorithmsFor(entry).some((algorithm) => {
        const parsed = parseAlgorithm(algorithm.moves);
        return (
          parsed.ok &&
          parsed.moves.length <= 8 &&
          parsed.moves.every((move) => move.family === "R" || move.family === "U")
        );
      }),
    );
    expect(short.length).toBeGreaterThanOrEqual(5);
    expect(text).toContain("the short R and U cases are the ones to learn first");
  });

  it("orders COLL with H and Pi first and Sune and Antisune last", () => {
    expect(text).toContain(
      "For COLL, start with the H and Pi groups and leave Sune and Antisune for last",
    );
  });
});

describe("learning from fast reconstructions (recon-fast-solvers, late.ts)", () => {
  it("follows how-to-look and names where to find them and what to compare", () => {
    const ids = pack("reconstruct-your-solves").lessons.map((entry) => entry.id);
    expect(ids.indexOf("recon-fast-solvers")).toBe(ids.indexOf("recon-what-to-look-for") + 1);
    const text = lessonText("reconstruct-your-solves", "recon-fast-solvers");
    for (const phrase of [
      "SpeedSolving forum has a long-running reconstruction thread",
      "reco.nz",
      "How many moves does each of their pairs take",
      "Where do they pause",
      "How often do they rotate",
      "x-cross",
      "Which insert did they choose for the last pair",
      "the start that could have been cleaner, the small pause before a pair, the regrip that cost a tenth",
    ]) {
      expect(text, phrase).toContain(phrase);
    }
    expect(pack("reconstruct-your-solves").sources).toContain(SOURCES.feliksCommentary);
  });
});

describe("competition procedure (item 42, late.ts)", () => {
  it("lets go of the cube before stopping the timer, and names the right classic mistake", () => {
    const text = lessonText("competing", "comp-procedure");
    expect(text).toContain("let go of the cube, then stop the timer with both palms");
    expect(text).toContain(
      "Stopping it while your hand is still on the cube is the classic first-timer mistake",
    );
    expect(text).toContain(
      "Starting between fifteen and seventeen seconds costs two seconds; after seventeen, the attempt is a DNF.",
    );
    expect(pack("competing").mistakes).toContain(
      "Stopping the timer while still touching the cube.",
    );
    const everything = JSON.stringify(pack("competing"));
    expect(everything).not.toContain("timer's face");
    expect(everything).not.toContain("stackmat's face");
  });
});

describe("y rotations counted on film (item 24, extra.ts)", () => {
  it("asks you to film solves and count your y rotations, y2 included", () => {
    const text = lessonText("f2l-from-the-front", "front-rotation-cost");
    expect(text).toContain("Film a few ordinary solves and count every y, y' and y2 during F2L");
    expect(text).toContain("a y2 is the first to cut");
    expect(text).toContain("counted your y rotations");
  });
});

describe("full OLL at 15-16 seconds (item 26, extra.ts)", () => {
  it("names full OLL as the standard fix for a slow last layer", () => {
    const text = lessonText("stuck-at-fifteen", "fifteen-whats-left");
    expect(text).toContain(
      "If you're at 15 or 16 seconds and your last layer still takes about six seconds, usually because OLL is still two-look, full OLL is the standard fix, together with R and U turning drills and practice on the last slot.",
    );
    expect(text).not.toContain("into and out of the last layer");
    expect(text).not.toContain("rarely breaks a plateau on its own");
  });
});

describe("the sub-10 cross target (item 29, extra.ts)", () => {
  /** Optimal move counts for every cross, by breadth-first search over the four cross edges. */
  function crossDistances(): number[] {
    // Where each sticker goes under each face turn, read off the engine.
    const labels = Array.from({ length: 54 }, (_, index) => String.fromCharCode(48 + index)).join(
      "",
    );
    const turns = ["U", "D", "R", "L", "F", "B"].flatMap((face) => [face, `${face}2`, `${face}'`]);
    const destinations = turns.map((turn) => {
      const moved = applyAlgorithm(turn, labels);
      const to = new Array<number>(54);
      for (let index = 0; index < 54; index++) to[moved.charCodeAt(index) - 48] = index;
      return to;
    });
    // Each cross edge is tracked by its white sticker, which fixes both place and flip.
    const start = ["DF", "DR", "DB", "DL"].map((name) =>
      spotNamed(name).find((index) => faceOf(index) === "D")!,
    );
    const encode = (spots: number[]) =>
      ((spots[0]! * 54 + spots[1]!) * 54 + spots[2]!) * 54 + spots[3]!;
    const decode = (key: number) => [
      Math.floor(key / 54 ** 3),
      Math.floor(key / 54 ** 2) % 54,
      Math.floor(key / 54) % 54,
      key % 54,
    ];
    const depth = new Int8Array(54 ** 4).fill(-1);
    let frontier = [encode(start)];
    depth[frontier[0]!] = 0;
    const found = [1];
    for (let level = 1; frontier.length > 0; level++) {
      const next: number[] = [];
      for (const key of frontier) {
        const spots = decode(key);
        for (const to of destinations) {
          const moved = encode(spots.map((spot) => to[spot]!));
          if (depth[moved] === -1) {
            depth[moved] = level;
            next.push(moved);
          }
        }
      }
      if (next.length > 0) found.push(next.length);
      frontier = next;
    }
    return found;
  }

  it("fits every cross in eight moves, most in about six", () => {
    const counts = crossDistances();
    const total = counts.reduce((sum, count) => sum + count, 0);
    // 12 × 11 × 10 × 9 places for the four edges, each either way round.
    expect(total).toBe(12 * 11 * 10 * 9 * 16);
    expect(counts.length - 1).toBe(8);
    const mean = counts.reduce((sum, count, moves) => sum + count * moves, 0) / total;
    expect(mean).toBeGreaterThan(5.5);
    expect(mean).toBeLessThan(6.1);
    expect(counts.indexOf(Math.max(...counts))).toBe(6);

    const text = lessonText("past-the-first-pair", "past-why");
    expect(text).toContain(
      "an efficient cross, usually about six moves, planned together with your first pair, taking an x-cross when the scramble offers one",
    );
    expect(text).toContain("every cross can be solved in eight or fewer");
    expect(text).not.toContain("planning the cross in eight moves or fewer");
  });
});

describe("COLL order and odds (item 36, extra.ts)", () => {
  const coll = getAlgorithmSet("coll")!;
  const oll = getAlgorithmSet("oll")!;
  const CORNERS: TopCorner[] = ["front-left", "front-right", "back-right", "back-left"];
  /** Which way each top corner's yellow faces: the corner orientation, and nothing else. */
  const twist = (state: string) => CORNERS.map((corner) => topColourFacing(state, corner)).join();
  const views = (state: string) => AUF.map((turn) => (turn ? applyAlgorithm(turn, state) : state));
  /** The group's corner label, without the bank's "(optional)" tag. */
  const groupOf = (entry: { group?: string }) => entry.group!.replace(/ \(optional\)$/, "");
  const groups = [...new Set(coll.cases.map(groupOf))];
  const casesIn = (group: string) => coll.cases.filter((entry) => groupOf(entry) === group);
  const twistsOf = (group: string) =>
    new Set(
      casesIn(group).flatMap((entry) =>
        views(caseStateFor(entry, kindFor(coll, entry))).map(twist),
      ),
    );

  it("makes every corner group except H equally likely, and H half as likely", () => {
    expect(groups.sort()).toEqual(["Antisune", "H", "L", "Pi", "Sune", "T", "U"]);
    const counts = Object.fromEntries(groups.map((group) => [group, twistsOf(group).size]));
    expect(counts).toEqual({ Antisune: 4, H: 2, L: 4, Pi: 4, Sune: 4, T: 4, U: 4 });
    // With the solved one, that is all 27 ways the four top corners can be twisted.
    const all = new Set(groups.flatMap((group) => [...twistsOf(group)]));
    all.add(twist(SOLVED_FACELETS));
    expect(all.size).toBe(27);
    const text = lessonText("last-layer-at-the-top", "top-coll");
    expect(text).toContain(
      "every corner group except H is equally likely, and H comes up half as often",
    );
    expect(text).not.toContain("since it comes up most");
  });

  it("already knows one H and one Pi case through the OLL algorithms", () => {
    const olls = { H: "oll-21", Pi: "oll-22" } as const;
    for (const [group, ollId] of Object.entries(olls)) {
      const entry = oll.cases.find((candidate) => candidate.id === ollId)!;
      // It is that group's OLL: its twist is one of the group's.
      expect(twistsOf(group).has(twist(caseStateFor(entry, kindFor(oll, entry)))), group).toBe(
        true,
      );
      for (const algorithm of algorithmsFor(entry)) {
        const solved = casesIn(group).filter(
          (collCase) =>
            checkAlgorithm(caseStateFor(collCase, kindFor(coll, collCase)), algorithm.moves, "coll")
              .ok,
        );
        expect(solved, `${group}: ${algorithm.moves}`).toHaveLength(1);
      }
    }
    const text = lessonText("last-layer-at-the-top", "top-coll");
    expect(text).toContain(
      "starting with H and Pi: you already know one case of each, because the H and Pi OLL algorithms each solve one COLL case",
    );
    expect(text).toContain("Then add U, T and L.");
    expect(text).toContain("Leave Sune and Antisune for last and treat them as optional");
  });

  it("renames the drill and starts it with H and Pi", () => {
    const first = drill("last-layer-at-the-top", "top-coll-sune");
    expect(first.title).toBe("Your first COLL groups");
    expect(first.rules[0]).toMatch(/^Learn the H and Pi COLL cases/);
    expect(first.rules[1]).toContain("Leave Sune and Antisune for last");
    expect(JSON.stringify(first)).not.toContain("comes up most");
  });
});

describe("near sub-10 (near-targets, near-efficiency-or-tps; extra.ts)", () => {
  it("opens the pack with the two new lessons", () => {
    expect(pack("practising-near-ten").lessons.map((entry) => entry.id)).toEqual([
      "near-targets",
      "near-efficiency-or-tps",
      "near-measure",
      "near-structure",
      "near-warm-up",
    ]);
  });

  it("gives the sub-10 shape as examples, and hands over to reconstructions below eight", () => {
    const text = lessonText("practising-near-ten", "near-targets");
    for (const phrase of [
      "about six seconds for the cross and F2L together, and under four for the last layer",
      "the cross is planned fully in inspection and done in about a second",
      "most F2L pairs take eight moves or fewer, turned as short bursts of two or three moves",
      "about four in five OLLs and PLLs take under a second each",
      "Treat these as examples from people who got there, not as rules.",
      "Below about eight seconds, x-crosses and last-slot tricks",
      "That's where reconstructions take over",
    ]) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it("sets the two styles side by side, with both inside the same move band", () => {
    const text = lessonText("practising-near-ten", "near-efficiency-or-tps");
    for (const phrase of [
      "around 12.8 turns a second over roughly 59 moves",
      "around 9.6 turns a second, and find shorter solutions, roughly 53 or 54 moves",
      "These are examples from a few players' reconstructions, not targets",
      "about 53 to 59 moves",
      "his two fastest solves were also his two shortest",
      "raise your turning speed only once you already know your next moves",
    ]) {
      expect(text, phrase).toContain(phrase);
    }
    expect(pack("practising-near-ten").sources).toContain(SOURCES.feliksCommentary);
  });
});
