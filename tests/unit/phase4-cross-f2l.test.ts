import { describe, expect, it } from "vitest";
import { f2l } from "@/data/algorithms/sets/f2l";
import { oll } from "@/data/algorithms/sets/oll";
import { getPack, type TrainingPack } from "@/data/training";
import { algorithmsFor, caseStateFor } from "@/lib/algorithms/catalog";
import { AUF, firstTwoLayersSolved, otherSlotsSolved } from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { edgesFacingUp, readF2lPair } from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS, faceOf } from "@/lib/cube/pieces";

/*
 * Claims the cross and F2L packs make (audit 6.4 items 50, 51 and 52, and the
 * phase 4 sweep), checked on the engine. A solved engine cube is the solving
 * hold: white cross on D, yellow on U, green on F, orange on R.
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

const after = (algorithm: string, state = SOLVED_FACELETS) =>
  algorithm.trim() ? applyAlgorithm(algorithm, state) : state;

function inverse(algorithm: string): string {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(algorithm);
  return formatAlgorithm(invertAlgorithm(parsed.moves));
}

function moveCount(algorithm: string): number {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(algorithm);
  return parsed.moves.filter((move) => !["x", "y", "z"].includes(move.family)).length;
}

const ALL_SPOTS: readonly (readonly number[])[] = [...CORNER_SPOTS, ...EDGE_SPOTS];
const facesAt = (spot: readonly number[]) => spot.map(faceOf).sort().join("");
const spotNamed = (faces: string) => {
  const sorted = [...faces].sort().join("");
  return ALL_SPOTS.find((spot) => facesAt(spot) === sorted)!;
};

/** Where the piece with these colours (engine letters) sits, and which face its first colour is on. */
function find(state: string, colours: string) {
  const spot = ALL_SPOTS.find(
    (candidate) =>
      candidate.length === colours.length &&
      [...colours].every((colour) => candidate.some((index) => state[index] === colour)),
  );
  if (!spot) throw new Error(`No piece ${colours}`);
  return { at: facesAt(spot), facing: faceOf(spot.find((index) => state[index] === colours[0])!) };
}

/** A piece sits at home, the right way round. */
const isHome = (state: string, faces: string) =>
  spotNamed(faces).every((index) => state[index] === faceOf(index));
const slotSolved = (state: string, slot: "FR" | "FL" | "BR" | "BL") =>
  isHome(state, slot) && isHome(state, `D${slot}`);

/* ---------- The cross: every placement of the four white edges ---------- */

const TURNS = ["U", "D", "R", "L", "F", "B"].flatMap((face) => [face, `${face}'`, `${face}2`]);
/** Where each sticker goes under each turn. */
const MOVED = (() => {
  const ids = Array.from({ length: 54 }, (_, index) => String.fromCharCode(0x100 + index)).join("");
  return TURNS.map((turn) => {
    const state = after(turn, ids);
    const to = new Array<number>(54);
    for (let spot = 0; spot < 54; spot++) to[state.charCodeAt(spot) - 0x100] = spot;
    return to;
  });
})();
/** The white sticker of each cross edge at home, in the order white-orange, -green, -red, -blue. */
const CROSS = ["DR", "DF", "DL", "DB"] as const;
const WHITE_HOME = CROSS.map((faces) => spotNamed(faces).find((index) => faceOf(index) === "D")!);

/** Fewest turns to put the chosen cross edges home, for every placement of them. */
function crossTable(edges: readonly number[]) {
  const key = (spots: readonly number[]) => spots.reduce((total, spot) => total * 54 + spot, 0);
  const distance = new Int8Array(54 ** edges.length).fill(-1);
  const home = edges.map((edge) => WHITE_HOME[edge]!);
  distance[key(home)] = 0;
  const counts = [1];
  let frontier = [home];
  while (frontier.length) {
    const next: number[][] = [];
    for (const spots of frontier) {
      for (const to of MOVED) {
        const moved = spots.map((spot) => to[spot]!);
        if (distance[key(moved)] === -1) {
          distance[key(moved)] = counts.length;
          next.push(moved);
        }
      }
    }
    if (next.length) counts.push(next.length);
    frontier = next;
  }
  /** Turns needed, given where every cross edge's white sticker is. */
  const turns = (whites: readonly number[]) => distance[key(edges.map((edge) => whites[edge]!))]!;
  return { counts, turns };
}

/** Where each cross edge's white sticker is in a state. */
const whitesOf = (state: string) =>
  CROSS.map((faces) => {
    const spot = EDGE_SPOTS.find((edge) =>
      [...faces].every((colour) => edge.some((index) => state[index] === colour)),
    )!;
    return spot.find((index) => state[index] === "D")!;
  });

describe("cross move counts (item 50)", () => {
  const full = crossTable([0, 1, 2, 3]);
  const total = full.counts.reduce((sum, count) => sum + count, 0);

  it("every cross fits in eight, nearly all in five to seven, just under six on average", () => {
    const text = lessonText("cross-efficiency", "cross-move-count");
    expect(text).toContain("eight moves or fewer, nearly all in five to seven");
    expect(text).toContain("the average is just under six");
    expect(total).toBe(12 * 11 * 10 * 9 * 16);
    expect(full.counts.length - 1).toBe(8);
    const average = full.counts.reduce((sum, count, turns) => sum + count * turns, 0) / total;
    expect(average).toBeGreaterThan(5.7);
    expect(average).toBeLessThan(6);
    const fiveToSeven = (full.counts[5]! + full.counts[6]! + full.counts[7]!) / total;
    expect(fiveToSeven).toBeGreaterThan(0.9);
  });

  it("solving one edge at a time costs about eight and a half, the later edges three or four", () => {
    const text = lessonText("cross-efficiency", "cross-pairing-edges");
    expect(text).toContain("the first usually takes one move, the last three or four");
    expect(text).toContain("one at a time averages about eight and a half moves");
    expect(text).toContain("the same crosses average under six");
    expect(text).not.toContain("twelve to sixteen");

    const tables = new Map<number, ReturnType<typeof crossTable>>();
    for (let mask = 1; mask < 16; mask++) {
      tables.set(mask, crossTable([0, 1, 2, 3].filter((edge) => mask & (1 << edge))));
    }
    // A fixed, well-mixed sample of crosses.
    let seed = 20260929;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const samples = 600;
    let oneAtATime = 0;
    let planned = 0;
    const firstSteps: number[] = [];
    const lastSteps: number[] = [];
    for (let sample = 0; sample < samples; sample++) {
      const places = [...EDGE_SPOTS.keys()];
      for (let i = places.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [places[i], places[j]] = [places[j]!, places[i]!];
      }
      let whites = [0, 1, 2, 3].map((edge) => EDGE_SPOTS[places[edge]!]![random() < 0.5 ? 0 : 1]!);
      planned += tables.get(15)!.turns(whites);
      let placed = 0;
      for (let step = 0; step < 4; step++) {
        // The easiest next edge, with the best moves for it, keeping the placed ones home.
        let best = { mask: 0, turns: 99 };
        for (let edge = 0; edge < 4; edge++) {
          if (placed & (1 << edge)) continue;
          const mask = placed | (1 << edge);
          const turns = tables.get(mask)!.turns(whites);
          if (turns < best.turns) best = { mask, turns };
        }
        for (let left = best.turns; left > 0; left--) {
          whites = MOVED.map((to) => whites.map((spot) => to[spot]!)).find(
            (moved) => tables.get(best.mask)!.turns(moved) === left - 1,
          )!;
        }
        if (step === 0) firstSteps.push(best.turns);
        if (step === 3) lastSteps.push(best.turns);
        oneAtATime += best.turns;
        placed = best.mask;
      }
      expect(tables.get(15)!.turns(whites)).toBe(0);
    }
    expect(oneAtATime / samples).toBeGreaterThan(8.2);
    expect(oneAtATime / samples).toBeLessThan(8.8);
    expect(planned / samples).toBeLessThan(6);
    const share = (list: number[], test: (turns: number) => boolean) =>
      list.filter(test).length / list.length;
    expect(share(firstSteps, (turns) => turns === 1)).toBeGreaterThan(0.5);
    expect(share(lastSteps, (turns) => turns >= 3)).toBeGreaterThan(0.75);
  });

  it("one edge on its own never needs more than three moves", () => {
    const text = lessonText("inspection", "inspection-ladder");
    expect(text).toContain("no single edge needs more than three");
    expect(text).not.toContain("two to four moves");
    expect(crossTable([1]).counts.length - 1).toBe(3);
  });

  it("names two as the rung that stops people, in the takeaway and the tracking lesson", () => {
    expect(lesson("inspection", "inspection-ladder").takeaway).toContain(
      "most people stall at two",
    );
    expect(lessonText("inspection", "inspection-tracking")).toContain(
      "planning the second edge is the rung that stops people",
    );
  });

  const examples = lesson("cross-efficiency", "cross-pairing-edges").examples!;

  it("R' D' R parks white-orange, drops white-green, lines up with D' and brings it back", () => {
    const example = examples.find((entry) => entry.moves === "R' D' R")!;
    expect(example.note).toContain("R' parks white-orange in the back-right slot");
    expect(example.note).toContain("drops white-green into the bottom layer");
    const start = after(inverse(example.moves!));
    // White-orange home; red and blue a D' from theirs; green in the front-right slot, white facing you.
    expect(isHome(start, "DR")).toBe(true);
    expect(find(start, "DL")).toEqual({ at: facesAt(spotNamed("DF")), facing: "D" });
    expect(find(start, "DB")).toEqual({ at: facesAt(spotNamed("DL")), facing: "D" });
    expect(find(start, "DF")).toEqual({ at: facesAt(spotNamed("FR")), facing: "F" });
    const parked = after("R'", start);
    expect(find(parked, "DR").at).toBe(facesAt(spotNamed("BR")));
    expect(find(parked, "DF")).toEqual({ at: facesAt(spotNamed("DR")), facing: "D" });
    const lined = after("D'", parked);
    for (const faces of ["DF", "DL", "DB"]) expect(isHome(lined, faces), faces).toBe(true);
    const done = after("R", lined);
    for (const faces of CROSS) expect(isHome(done, faces), faces).toBe(true);
    // Nothing goes to the top, and three moves is the shortest.
    for (const state of [start, parked, lined, done]) {
      for (const faces of CROSS) expect(find(state, faces).at).not.toContain("U");
    }
    const table = crossTable([0, 1, 2, 3]);
    expect(table.turns(whitesOf(start))).toBe(3);
  });

  it("F' D R' D' fixes a flipped edge in four; any route through the top takes five", () => {
    const example = examples.find((entry) => entry.moves === "F' D R' D'")!;
    expect(example.note).toContain("any route through the top takes at least five");
    const start = after(inverse(example.moves!));
    expect(find(start, "DF")).toEqual({ at: facesAt(spotNamed("DF")), facing: "F" });
    for (const faces of ["DR", "DL", "DB"]) expect(isHome(start, faces), faces).toBe(true);
    const lifted = after("F'", start);
    expect(find(lifted, "DF")).toEqual({ at: facesAt(spotNamed("FR")), facing: "F" });
    const turned = after("D", lifted);
    expect(find(turned, "DR").at).toBe(facesAt(spotNamed("DB")));
    const dropped = after("R'", turned);
    expect(find(dropped, "DF")).toEqual({ at: facesAt(spotNamed("DR")), facing: "D" });
    const done = after("D'", dropped);
    for (const faces of CROSS) expect(isHome(done, faces), faces).toBe(true);

    const table = crossTable([0, 1, 2, 3]);
    expect(table.turns(whitesOf(start))).toBe(4);
    // Search every sequence of up to five turns; the top layer is where no white sticker's
    // edge touches U. Record the shortest that solves the cross, with and without a visit there.
    const onTop = (spot: number) => EDGE_SPOTS.slice(0, 4).some((edge) => edge.includes(spot));
    const shortest = { top: 99, bottom: 99 };
    const search = (whites: number[], depth: number, last: number, top: boolean) => {
      if (table.turns(whites) === 0) {
        const kind = top ? "top" : "bottom";
        shortest[kind] = Math.min(shortest[kind], depth);
        return;
      }
      if (depth === 5) return;
      MOVED.forEach((to, turn) => {
        if (Math.floor(turn / 3) === last) return;
        const moved = whites.map((spot) => to[spot]!);
        search(moved, depth + 1, Math.floor(turn / 3), top || onTop(moved[1]!));
      });
    };
    search(whitesOf(start), 0, -1, false);
    expect(shortest).toEqual({ top: 5, bottom: 4 });
  });

  it("says a flipped edge takes four and an out-of-place one three", () => {
    const text = lessonText("cross-efficiency", "cross-pairing-edges");
    expect(text).toContain("three moves, and the same face turn can drop another edge in");
    expect(text).toContain("Flipped, it takes four");
  });
});

/* ---------- F2L ---------- */

describe("F2L pairs (item 52)", () => {
  const text = lessonText("f2l-efficiency", "f2l-what-a-pair-is");

  /** Corner and edge side by side on top, matching on both faces they share. */
  function joinedOnTop(state: string): boolean {
    const reading = readF2lPair(state);
    if (reading.corner === "slot" || reading.edge === "slot") return false;
    const corner = CORNER_SPOTS.find((spot) =>
      ["D", "F", "R"].every((colour) => spot.some((index) => state[index] === colour)),
    )!;
    const edge = EDGE_SPOTS.find((spot) =>
      ["F", "R"].every((colour) => spot.some((index) => state[index] === colour)),
    )!;
    const shared = edge.filter((index) => corner.some((other) => faceOf(other) === faceOf(index)));
    return (
      shared.length === 2 &&
      shared.every(
        (index) => state[index] === state[corner.find((other) => faceOf(other) === faceOf(index))!],
      )
    );
  }

  it("R takes the edge out of the way, U brings the corner round, R' brings it back joined", () => {
    expect(text).toContain(
      "a move takes one of them out of the way, a U turn brings the other round, and undoing that move brings it back joined: R, a U turn, then R'",
    );
    const solution = "R U R' U R U' R'";
    const start = after(inverse(solution));
    expect(otherSlotsSolved(start)).toBe(true);
    expect(readF2lPair(start)).toMatchObject({ corner: "back-left", edge: "right" });
    expect(joinedOnTop(start)).toBe(false);
    const out = after("R", start);
    expect(readF2lPair(out)).toMatchObject({ corner: "back-left", edge: "slot" });
    const round = after("U", out);
    expect(readF2lPair(round).corner).toBe("back-right");
    const joined = after("R'", round);
    expect(joinedOnTop(joined)).toBe(true);
    expect(firstTwoLayersSolved(after("U R U' R'", joined))).toBe(true);
  });

  it("a pair joined on top needs at most a top turn and a three-move trigger", () => {
    expect(text).toContain("already joined in the top layer, one top turn from its slot");
    let joinedConfigurations = 0;
    for (const entry of f2l.cases) {
      for (const turn of AUF) {
        const state = after(turn, caseStateFor(entry, "f2l"));
        if (!joinedOnTop(state)) continue;
        joinedConfigurations++;
        const quickest = Math.min(
          ...algorithmsFor(entry).map((algorithm) => {
            const undo = turn ? `${inverse(turn)} ` : "";
            return moveCount(`${undo}${algorithm.moves}`);
          }),
        );
        expect(quickest, entry.id).toBeLessThanOrEqual(4);
      }
    }
    expect(joinedConfigurations).toBe(8);
  });

  it("some cases join as they go in: R U R' with the corner above its slot and the edge at the back", () => {
    expect(text).toContain(
      "R U R', when the corner is above its slot with white facing right and the edge is at the back",
    );
    const start = after(inverse("R U R'"));
    expect(readF2lPair(start)).toEqual({
      corner: "front-right",
      white: "right",
      edge: "back",
      green: "up",
    });
    expect(joinedOnTop(start)).toBe(false);
    expect(firstTwoLayersSolved(after("R U R'", start))).toBe(true);
  });

  it("the move-count lesson's numbers match the case list", () => {
    const counts = lessonText("f2l-efficiency", "f2l-move-count");
    expect(counts).toContain("Most F2L cases have a solution in seven or eight moves");
    expect(counts).toContain("The easiest take three");
    expect(counts).toContain("both pieces stuck in the slot, take nine to eleven");
    expect(counts).toContain("now and then the longer one is the one that turns best");
    const shortest = f2l.cases.map((entry) =>
      Math.min(...algorithmsFor(entry).map((algorithm) => moveCount(algorithm.moves))),
    );
    expect(Math.min(...shortest)).toBe(3);
    expect(shortest.filter((moves) => moves === 7 || moves === 8).length).toBeGreaterThan(
      f2l.cases.length / 2,
    );
    const stuck = f2l.cases.filter((entry) => {
      const reading = readF2lPair(caseStateFor(entry, "f2l"));
      return reading.corner === "slot" && reading.edge === "slot";
    });
    expect(stuck).toHaveLength(5);
    for (const entry of stuck) {
      const lengths = algorithmsFor(entry).map((algorithm) => moveCount(algorithm.moves));
      expect(Math.min(...lengths), entry.id).toBe(9);
      expect(lengths[0], entry.id).toBeLessThanOrEqual(11);
    }
    // Some top-layer cases' usual algorithms are longer than their shortest, for how they turn.
    const longDefaults = f2l.cases.filter((entry) => {
      const lengths = algorithmsFor(entry).map((algorithm) => moveCount(algorithm.moves));
      return lengths[0]! >= 11 && Math.min(...lengths) <= 8;
    });
    expect(longDefaults.length).toBeGreaterThan(0);
  });

  it("an empty front-right slot lets R U R' L U' L' do the eight-move back-left case in six", () => {
    const slots = lessonText("f2l-efficiency", "f2l-empty-slots");
    expect(slots).toContain(
      "with the front-right slot still empty, R U R' L U' L' puts in a back-left pair in six moves that would otherwise take eight, U2 L U L' U2 L U' L'",
    );
    expect(slots).toContain("the same R U R' would knock that pair out");
    expect(slots).not.toContain("nine-move");
    const [six, eight] = ["R U R' L U' L'", "U2 L U L' U2 L U' L'"];
    expect(moveCount(six)).toBe(6);
    expect(moveCount(eight)).toBe(8);
    const others = ["FL", "BR"] as const;
    const crossHome = (state: string) => CROSS.every((faces) => isHome(state, faces));

    // Front-right filled: the eight-move one works, the six-move one knocks the pair out.
    const filled = after(inverse(eight));
    expect(slotSolved(filled, "BL")).toBe(false);
    expect(slotSolved(filled, "FR")).toBe(true);
    expect(slotSolved(after(eight, filled), "BL")).toBe(true);
    expect(slotSolved(after(six, filled), "BL")).toBe(true);
    expect(slotSolved(after(six, filled), "FR")).toBe(false);

    // Front-right empty: both put the back-left pair in and keep everything else.
    const empty = after(inverse(eight), after("R U R'"));
    expect(slotSolved(empty, "FR")).toBe(false);
    for (const solution of [six, eight]) {
      const done = after(solution, empty);
      expect(slotSolved(done, "BL"), solution).toBe(true);
      for (const slot of others) expect(slotSolved(done, slot), `${solution} ${slot}`).toBe(true);
      expect(crossHome(done), solution).toBe(true);
    }
  });

  it("pseudo-slotting puts each piece home rather than finishing two pairs", () => {
    const slots = lessonText("f2l-efficiency", "f2l-empty-slots");
    expect(slots).toContain("turning the bottom back puts each one home");
  });
});

describe("reading the edges during the last pair (item 51)", () => {
  /** Every F2L-solved state with a different last layer: each OLL case at each U turn. */
  const lastLayers = [
    SOLVED_FACELETS,
    ...oll.cases.flatMap((entry) =>
      AUF.map((turn) => after(`${inverse(algorithmsFor(entry)[0]!.moves)} ${turn}`)),
    ),
  ];
  /** Yellow edges that will face up after R and U moves (edge orientation on the F/B axis). */
  function goodYellowEdges(state: string): number {
    return EDGE_SPOTS.filter((spot) => {
      const yellow = spot.find((index) => state[index] === "U");
      if (yellow === undefined) return false;
      const face = faceOf(yellow);
      const middle = !spot.some((index) => ["U", "D"].includes(faceOf(index)));
      return face === "U" || face === "D" || (middle && (face === "F" || face === "B"));
    }).length;
  }
  const RU_INSERTS = ["R U R'", "U R U' R'", "R U' R' U R U R'", "R U2 R' U' R U R'"];

  it("an R and U insert leaves the edge count decided and still changes the corners", () => {
    const free = lessonText("last-pair-into-oll", "lastpair-free-attention");
    expect(free).toContain(
      "with a plain R and U insert the edge pattern on top (a dot, a line or L, or all four up) is already decided before the pair goes in",
    );
    expect(free).toContain("Only the corners still change");
    expect(free).not.toContain("most of the last-layer orientation");
    let cornersMoved = 0;
    for (const finished of lastLayers) {
      for (const insert of RU_INSERTS) {
        const before = after(inverse(insert), finished);
        expect(goodYellowEdges(before)).toBe(edgesFacingUp(finished).length);
        if (
          !before
            .slice(0, 9)
            .split("")
            .every((sticker, i) => (sticker === "U") === (finished[i] === "U"))
        )
          cornersMoved++;
      }
    }
    expect(cornersMoved).toBeGreaterThan(0);
    // A sledgehammer insert is not an R and U insert: it can change the count.
    expect(
      lastLayers.some(
        (finished) =>
          goodYellowEdges(after(inverse("R' F R F'"), finished)) !== edgesFacingUp(finished).length,
      ),
    ).toBe(true);
  });

  it("counts the top edges, none, two or four, and a split-second glance", () => {
    const partial = lessonText("last-pair-into-oll", "lastpair-partial-read");
    expect(partial).toContain(
      "How many of the four top edges show yellow on top — none, two or four — gives the family",
    );
    expect(partial).toContain("split-second glance");
    expect(partial).not.toContain("two-second glance");
    expect(partial).not.toContain("top-face stickers");
    const seen = new Set(lastLayers.map((state) => edgesFacingUp(state).length));
    expect([...seen].sort()).toEqual([0, 2, 4]);
  });
});
