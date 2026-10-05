import { describe, expect, it } from "vitest";
import { TRAINING_PACKS } from "@/data/training";
import { bandsForPack } from "@/data/training/bands";
import { LESSON_QUIZZES } from "@/data/training/quizzes";
import { packMinutes } from "@/data/training/types";
import {
  lastLayerWithoutGaps as pack,
  lastLayerWithoutGapsQuizzes as quizzes,
} from "@/data/training/packs/night-last-layer-fast";
import { isTestId } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { ALGORITHM_SETS, algorithmsFor, getAlgorithmSet } from "@/lib/algorithms/catalog";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { firstTwoLayersSolved, lastLayerOriented } from "@/lib/cube/case-check";
import { sideRow, type Side } from "@/lib/cube/describe";
import { CORNER_SPOTS } from "@/lib/cube/pieces";
import {
  formatAlgorithm,
  invertAlgorithm,
  isValidAlgorithm,
  parseAlgorithm,
} from "@/lib/cube/notation";

/*
 * "The last layer without gaps" (data/training/packs/night-last-layer-fast.ts)
 * before it is wired into TRAINING_PACKS: the shape rules the shared pack tests
 * apply, then every claim the lessons make about the cube, checked on
 * SolveLab's engine. States are in the solving hold: U is yellow, F green, R
 * orange, B blue, L red.
 */

const text = (id: string) => pack.lessons.find((item) => item.id === id)!.body.join(" ");
const example = (lessonId: string, label: string) =>
  pack.lessons.find((item) => item.id === lessonId)!.examples!.find((ex) => ex.label === label)!;

const parse = (alg: string) => {
  const parsed = parseAlgorithm(alg);
  if (!parsed.ok) throw new Error(alg);
  return parsed.moves;
};
const inv = (alg: string) => formatAlgorithm(invertAlgorithm(parse(alg)));
const moveCount = (alg: string) => parse(alg).length;
const AUF = ["", "U", "U2", "U'"] as const;
const apply = (alg: string, state = SOLVED_FACELETS) =>
  alg.trim() ? applyAlgorithm(alg, state) : state;
const first = (setId: string, caseId: string) =>
  algorithmsFor(getAlgorithmSet(setId)!.cases.find((c) => c.id === caseId)!)[0]!.moves;

const PLL = getAlgorithmSet("pll")!;
/** Every oriented last layer: each PLL at each angle and final offset, and the solved ones. */
const PLL_STATES = (() => {
  const states = new Set<string>();
  for (const entry of PLL.cases) {
    const moves = algorithmsFor(entry)[0]!.moves;
    for (const pre of AUF)
      for (const post of AUF) states.add(apply(inv(`${pre} ${moves} ${post}`.trim())));
  }
  for (const turn of AUF) states.add(apply(turn));
  return [...states];
})();

const OPPOSITE: Record<string, string> = { F: "B", B: "F", R: "L", L: "R" };
const SIDES: Side[] = ["left", "front", "right", "back"];

/** Same colour, opposite colours, neighbours, or a yellow sticker in the way. */
function relation(a: string, b: string): "same" | "opp" | "adj" | "yellow" {
  if (a === "U" || b === "U") return "yellow";
  if (a === b) return "same";
  return OPPOSITE[a] === b ? "opp" : "adj";
}
const cornerPair = (state: string, side: Side) => {
  const row = sideRow(state, side);
  return [row[0]!, row[2]!] as const;
};
const cornerRelation = (state: string, side: Side) => relation(...cornerPair(state, side));

/** The PLL's corner group: all corners right, no side matching, or the one matching side. */
function cornerGroup(state: string): "solved" | "none" | Side {
  const matching = SIDES.filter((side) => cornerRelation(state, side) === "same");
  if (matching.length === 4) return "solved";
  if (matching.length === 0) return "none";
  if (matching.length !== 1) throw new Error(`${matching.length} matching sides`);
  return matching[0]!;
}

/** The six stickers of two-sided recognition, left to right: front row, then right row. */
const six = (state: string) =>
  sideRow(state, "front") + [...sideRow(state, "right")].reverse().join("");
const RING = ["F", "R", "B", "L"];
/** A row with its colours turned round so the first is F: the same pattern in other colours. */
const pattern = (row: string) =>
  [...row].map((x) => (RING.indexOf(x) - RING.indexOf(row[0]!) + 4) % 4).join("");
/** Which stickers match, and nothing about the colours. */
const shape = (row: string) => {
  const names = new Map<string, string>();
  return [...row]
    .map((x) => {
      if (!names.has(x)) names.set(x, "abcdef"[names.size]!);
      return names.get(x)!;
    })
    .join("");
};
const VIEWS = PLL.cases.flatMap((entry) => {
  const moves = algorithmsFor(entry)[0]!.moves;
  return AUF.flatMap((pre) =>
    AUF.map((post) => ({ id: entry.id, row: six(apply(inv(`${pre} ${moves} ${post}`.trim()))) })),
  );
});
const COLOUR: Record<string, string> = {
  F: "green",
  R: "orange",
  B: "blue",
  L: "red",
  U: "yellow",
};
const words = (stickers: string) => [...stickers].map((x) => COLOUR[x]).join(", ");

describe("The last layer without gaps: shape", () => {
  it("follows the pack rules the shared tests apply", () => {
    expect(pack.lessons.length).toBeGreaterThanOrEqual(2);
    expect(pack.drills.length).toBeGreaterThanOrEqual(2);
    expect(pack.mistakes.length).toBeGreaterThanOrEqual(3);
    expect(packMinutes(pack)).toBeGreaterThan(0);
    for (const lesson of pack.lessons) {
      expect(lesson.body.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.body.join(" ").split(/\s+/).length, lesson.id).toBeGreaterThan(80);
      expect(lesson.takeaway.length).toBeGreaterThan(20);
      expect(lesson.minutes).toBeGreaterThan(0);
    }
    for (const drill of pack.drills) {
      expect(drill.rules.length, drill.id).toBeGreaterThanOrEqual(2);
      expect(drill.dose.length).toBeGreaterThan(5);
      expect(drill.signal.length).toBeGreaterThan(15);
      expect(drill.purpose.length).toBeGreaterThan(20);
      // Timed on a test's scrambles, or counted in rounds: never a plain 3x3 timer.
      expect(Boolean(drill.exerciseId) !== Boolean(drill.untimed), drill.id).toBe(true);
      if (drill.exerciseId) expect(isTestId(drill.exerciseId), drill.id).toBe(true);
    }
    expect(pack.sources.length).toBeGreaterThanOrEqual(3);
    for (const source of pack.sources) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.label.length).toBeGreaterThan(3);
    }
    expect(new Set(pack.sources.map((source) => source.url)).size).toBe(pack.sources.length);
  });

  it("is a level pack for 15 → 10 s alone", () => {
    const levelIds = new Set(milestones.map((milestone) => milestone.id));
    for (const level of pack.levels) expect(levelIds.has(level), level).toBe(true);
    expect(pack.aspectId).toBeUndefined();
    expect(bandsForPack(pack).map((band) => band.id)).toEqual(["15-10"]);
  });

  it("clashes with no pack, lesson or drill id already in use", () => {
    const own = [...pack.lessons, ...pack.drills].map((item) => item.id);
    expect(new Set(own).size).toBe(own.length);
    // Still true once the pack and its questions are wired into the shared lists.
    const taken = new Set(
      TRAINING_PACKS.filter((other) => other.id !== pack.id).flatMap((other) => [
        other.id,
        ...other.lessons.map((item) => item.id),
        ...other.drills.map((item) => item.id),
      ]),
    );
    for (const id of [pack.id, ...own]) expect(taken.has(id), id).toBe(false);
    for (const id of Object.keys(quizzes)) {
      expect([undefined, quizzes[id]], id).toContain(LESSON_QUIZZES[id]);
    }
  });

  it("asks a balanced question about every lesson, and only its lessons", () => {
    expect(Object.keys(quizzes).sort()).toEqual(pack.lessons.map((item) => item.id).sort());
    for (const [id, questions] of Object.entries(quizzes)) {
      expect(questions.length, id).toBeGreaterThan(0);
      for (const quiz of questions) {
        expect(quiz.options.length, id).toBeGreaterThanOrEqual(3);
        expect(quiz.options.length, id).toBeLessThanOrEqual(4);
        expect(new Set(quiz.options).size, id).toBe(quiz.options.length);
        expect(quiz.answer, id).toBeGreaterThanOrEqual(0);
        expect(quiz.answer, id).toBeLessThan(quiz.options.length);
        expect(quiz.why.split(/\s+/).length, id).toBeGreaterThan(8);
        // The right answer mustn't give itself away by length (phase5-quiz-balance).
        const right = quiz.options[quiz.answer]!.length;
        const longestWrong = Math.max(
          ...quiz.options.filter((_, index) => index !== quiz.answer).map((o) => o.length),
        );
        expect(right, quiz.question).toBeLessThanOrEqual(longestWrong);
      }
    }
  });

  it("quotes only move sequences the engine accepts, and bank-verified ones for a case", () => {
    const cases = new Map(ALGORITHM_SETS.flatMap((set) => set.cases).map((c) => [c.id, c]));
    const examples = pack.lessons.flatMap((item) => item.examples ?? []);
    expect(examples.length).toBeGreaterThan(0);
    for (const ex of examples) {
      expect(ex.moves && isValidAlgorithm(ex.moves), ex.label).toBe(true);
      expect(ex.slot, ex.label).toBeUndefined();
      if (ex.caseId) {
        expect(
          algorithmsFor(cases.get(ex.caseId)!).map((a) => a.moves),
          ex.label,
        ).toContain(ex.moves);
      }
    }
  });
});

describe("Read the corners before the OLL", () => {
  it("enumerates all 288 oriented last layers", () => {
    expect(PLL_STATES).toHaveLength(288);
  });

  it("splits the PLLs into the three corner groups, at every angle", () => {
    const solved = ["pll-ua", "pll-ub", "pll-h", "pll-z"];
    const none = ["pll-e", "pll-na", "pll-nb", "pll-v", "pll-y"];
    for (const entry of PLL.cases) {
      const moves = algorithmsFor(entry)[0]!.moves;
      for (const pre of AUF) {
        const group = cornerGroup(apply(inv(`${pre} ${moves}`.trim())));
        if (solved.includes(entry.id)) expect(group, entry.id).toBe("solved");
        else if (none.includes(entry.id)) expect(group, entry.id).toBe("none");
        else expect(SIDES, entry.id).toContain(group);
      }
    }
    const adjacent = PLL.cases.map((c) => c.id).filter((id) => ![...solved, ...none].includes(id));
    expect(adjacent.sort()).toEqual(
      ["aa", "ab", "f", "ga", "gb", "gc", "gd", "ja", "jb", "ra", "rb", "t"].map((x) => `pll-${x}`),
    );
    expect(text("gaps-corners-before-oll")).toContain("U, H or Z perm or a skip");
    expect(text("gaps-corners-before-oll")).toContain("A, F, G, J, R or T perm");
    expect(text("gaps-corners-before-oll")).toContain("an E, N, V or Y");
  });

  /** For every last layer the OLL can leave, the reading before it against the group after it. */
  function table(oll: string, faces: [Side, Side]) {
    const seen = new Map<string, Set<string>>();
    for (const after of PLL_STATES) {
      const before = apply(inv(oll), after);
      expect(apply(oll, before)).toBe(after);
      const key = faces.map((face) => cornerRelation(before, face)).join("/");
      if (!seen.has(key)) seen.set(key, new Set());
      seen.get(key)!.add(cornerGroup(after));
    }
    return Object.fromEntries(
      [...seen].map(([key, groups]) => [key, [...groups].sort().join("|")]),
    );
  }

  it("reads the T shape's group from the front and right, as the lesson tables it", () => {
    expect(first("oll", "oll-45")).toBe("F R U R' U' F'");
    expect(table("F R U R' U' F'", ["front", "right"])).toEqual({
      "adj/opp": "solved",
      "adj/same": "none",
      "opp/opp": "left",
      "opp/same": "right",
      "adj/adj": "back|front",
    });
  });

  it("reads the P shape's group from the left and front, as the example tables it", () => {
    expect(first("oll", "oll-44")).toBe("F U R U' R' F'");
    expect(table("F U R U' R' F'", ["left", "front"])).toEqual({
      "opp/adj": "solved",
      "same/adj": "none",
      "same/opp": "left",
      "opp/opp": "right",
      "adj/adj": "back|front",
    });
  });

  it("keeps the matching side where it is for every bank algorithm of OLL 28 and 57, and only the group for OLL 20", () => {
    const kind = (group: string) => (group === "solved" || group === "none" ? group : "side");
    for (const id of ["oll-20", "oll-28", "oll-57"]) {
      const entry = getAlgorithmSet("oll")!.cases.find((c) => c.id === id)!;
      for (const { moves } of algorithmsFor(entry)) {
        let moved = 0;
        for (const after of PLL_STATES) {
          const before = apply(inv(moves), after);
          // Every corner already faces up before the OLL.
          expect(
            [0, 2, 6, 8].every((spot) => before[spot] === "U"),
            `${id} ${moves}`,
          ).toBe(true);
          expect(kind(cornerGroup(before)), `${id} ${moves}`).toBe(kind(cornerGroup(after)));
          if (cornerGroup(before) !== cornerGroup(after)) {
            moved++;
            // One face round, never across the cube.
            const turn =
              (SIDES.indexOf(cornerGroup(after) as Side) -
                SIDES.indexOf(cornerGroup(before) as Side) +
                4) %
              4;
            expect([1, 3], `${id} ${moves}`).toContain(turn);
          }
        }
        expect(moved > 0, `${id} ${moves}`).toBe(id === "oll-20");
      }
    }
    expect(text("gaps-corners-before-oll")).toContain("carry the matching side one face round");
  });

  it("can't settle Sune or Antisune from the front and either side; only the back and left would", () => {
    const settles = (oll: string, faces: [Side, Side]) => {
      // Even the exact colours, not just their relation, leave more than one group.
      const seen = new Map<string, Set<string>>();
      for (const after of PLL_STATES) {
        const before = apply(inv(oll), after);
        const stickers = faces.flatMap((face) => cornerPair(before, face)).join("");
        const group = cornerGroup(after);
        if (!seen.has(stickers)) seen.set(stickers, new Set());
        seen.get(stickers)!.add(group === "solved" || group === "none" ? group : "side");
      }
      return [...seen.values()].every((groups) => groups.size === 1);
    };
    const shows = (oll: string, faces: [Side, Side]) =>
      PLL_STATES.some((after) =>
        faces.some((face) => cornerPair(apply(inv(oll), after), face).includes("U")),
      );
    for (const [id, oll] of [
      ["oll-27", "R U R' U R U2 R'"],
      ["oll-26", "R U2 R' U' R U' R'"],
    ] as const) {
      expect(first("oll", id)).toBe(oll);
      for (const faces of [
        ["front", "right"],
        ["left", "front"],
      ] as [Side, Side][]) {
        expect(settles(oll, faces), `${id} ${faces}`).toBe(false);
        expect(shows(oll, faces), `${id} ${faces}`).toBe(true);
      }
      expect(settles(oll, ["back", "left"]), id).toBe(true);
    }
  });

  it("is wrong that an OLL only turns corners in place: the T shape moves them", () => {
    const pieceAt = (state: string, spot: readonly number[]) =>
      spot
        .map((index) => state[index])
        .sort()
        .join("");
    const after = apply("F R U R' U' F'");
    expect(
      CORNER_SPOTS.some((spot) => pieceAt(after, spot) !== pieceAt(SOLVED_FACELETS, spot)),
    ).toBe(true);
  });

  it("sets an OLL up as the drill says, with the PLL at a random angle behind it", () => {
    const oll = "F R U R' U' F'";
    for (const entry of PLL.cases) {
      for (const [a, b] of [
        ["U", "U2"],
        ["", "U'"],
      ] as const) {
        const set = apply(`${a} ${inv(algorithmsFor(entry)[0]!.moves)} ${b} ${inv(oll)}`.trim());
        expect(firstTwoLayersSolved(set)).toBe(true);
        expect(lastLayerOriented(set)).toBe(false);
        expect(lastLayerOriented(apply(oll, set))).toBe(true);
      }
    }
  });
});

describe("The sticker that splits look-alike PLLs", () => {
  it("finds 71 different rows, none of them shared by two PLLs", () => {
    const owners = new Map<string, Set<string>>();
    for (const { id, row } of VIEWS) {
      const key = pattern(row);
      if (!owners.has(key)) owners.set(key, new Set());
      owners.get(key)!.add(id);
    }
    expect(owners.size).toBe(71);
    expect([...owners.values()].every((ids) => ids.size === 1)).toBe(true);
    expect(text("gaps-confusable-plls")).toContain("71 different rows across all 21 PLLs");
    expect(PLL.cases).toHaveLength(21);
  });

  it("puts every PLL one sticker from another, never at the corner the two faces share", () => {
    const neighbours = new Set<string>();
    const deciding = new Set<number>();
    for (const a of VIEWS) {
      for (const b of VIEWS) {
        if (a.id === b.id) continue;
        const differ = [0, 1, 2, 3, 4, 5].filter((index) => a.row[index] !== b.row[index]);
        if (differ.length !== 1) continue;
        neighbours.add(a.id);
        deciding.add(differ[0]!);
      }
    }
    expect(neighbours.size).toBe(21);
    // 0 and 5 are the far corners, 1 and 4 the edges, 2 and 3 the shared corner.
    expect([...deciding].sort()).toEqual([0, 1, 4, 5]);
  });

  it("leaves 54 shapes when colours are ignored, 12 of them shared, each settled by one opposite-or-neighbour question", () => {
    const owners = new Map<string, Set<string>>();
    for (const { id, row } of VIEWS) {
      const key = shape(row);
      if (!owners.has(key)) owners.set(key, new Set());
      owners.get(key)!.add(id);
    }
    expect(owners.size).toBe(54);
    const shared = [...owners].filter(([, ids]) => ids.size > 1);
    expect(shared).toHaveLength(12);
    const families = new Set(
      shared.map(([, ids]) =>
        [...ids]
          .map((id) => id.slice(4))
          .sort()
          .join(","),
      ),
    );
    // Aa, Ab and T; Ga, Gb and Rb; Gc, Gd and Ra; H and Z; Ua and Ub.
    expect([...families].sort()).toEqual(
      [
        "aa,ab",
        "aa,t",
        "ab,t",
        "ga,gb",
        "ga,rb",
        "gb,rb",
        "gc,gd",
        "gc,ra",
        "gd,ra",
        "h,z",
        "ua,ub",
      ].sort(),
    );
    for (const [key, ids] of shared) {
      const views = VIEWS.filter((view) => shape(view.row) === key);
      const letters = [...new Set(key)];
      const settles = letters.some((x, i) =>
        letters.slice(i + 1).some((y) => {
          const byRelation = new Map<boolean, Set<string>>();
          for (const view of views) {
            const opposite = OPPOSITE[view.row[key.indexOf(x)]!] === view.row[key.indexOf(y)];
            if (!byRelation.has(opposite)) byRelation.set(opposite, new Set());
            byRelation.get(opposite)!.add(view.id);
          }
          return byRelation.size === 2 && [...byRelation.values()].every((set) => set.size === 1);
        }),
      );
      expect(settles, `${key} ${[...ids]}`).toBe(true);
    }
    expect(text("gaps-confusable-plls")).toContain("54 patterns are left and 12 of them");
  });

  it("tells H from Z by whether each edge is opposite its own headlights", () => {
    let checked = 0;
    for (const { id, row } of VIEWS) {
      const count = (x: string) => [...row].filter((y) => y === x).length;
      const headlights = row[0] === row[2] && row[3] === row[5];
      if (!headlights || count(row[1]!) !== 1 || count(row[4]!) !== 1) continue;
      expect(["pll-h", "pll-z"]).toContain(id);
      const opposite = OPPOSITE[row[0]!] === row[1] && OPPOSITE[row[3]!] === row[4];
      const neighbours = OPPOSITE[row[0]!] !== row[1] && OPPOSITE[row[3]!] !== row[4];
      expect(id === "pll-h" ? opposite : neighbours, row).toBe(true);
      // Same shape, same number of colours: counting them can't split the pair.
      expect(new Set(row).size).toBe(4);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("tells R from G by whether the twice-seen colour is opposite the end colour", () => {
    const owners = new Set<string>();
    for (const { id, row } of VIEWS) {
      if (row[0] !== row[5]) continue;
      const twice = [...new Set(row)].filter(
        (x) => x !== row[0] && [...row].filter((y) => y === x).length === 2,
      );
      if (twice.length !== 1) continue;
      const colour = twice[0]!;
      if (row.lastIndexOf(colour) - row.indexOf(colour) === 1) continue;
      owners.add(id.slice(4, 5));
      expect(OPPOSITE[colour] === row[0], `${id} ${row}`).toBe(id.startsWith("pll-g"));
    }
    expect([...owners].sort()).toEqual(["g", "r"]);
  });

  it("describes each example's row as the case stands at its algorithm", () => {
    const rows: [string, string, string][] = [
      ["H perm: edges opposite their headlights", "green, blue, green", "orange, red, orange"],
      ["Z perm: edges are neighbour colours", "red, blue, red", "green, orange, green"],
      ["Ra perm: the twice-seen colour is a neighbour", "red, red, green", "orange, green, red"],
      ["Gc perm: the twice-seen colour is opposite", "green, blue, orange", "blue, red, green"],
    ];
    for (const [label, front, right] of rows) {
      const ex = example("gaps-confusable-plls", label);
      const row = six(apply(inv(ex.moves!)));
      expect(words(row.slice(0, 3)), label).toBe(front);
      expect(words(row.slice(3)), label).toBe(right);
      expect(ex.note).toContain(`Front: ${front}. Right: ${right}.`);
    }
  });
});

describe("OLL into PLL as one motion", () => {
  /** Merges turns of the same face that end up side by side, as a hand would. */
  function cancel(alg: string): string {
    const out: { face: string; turns: number }[] = [];
    for (const token of alg.split(/\s+/)) {
      const face = token[0]!;
      const turns = token.endsWith("2") ? 2 : token.endsWith("'") ? 3 : 1;
      const last = out.at(-1);
      if (last && last.face === face && "URFDLB".includes(face)) {
        last.turns = (last.turns + turns) % 4;
        if (last.turns === 0) out.pop();
      } else out.push({ face, turns });
    }
    return out.map(({ face, turns }) => face + ["", "", "2", "'"][turns]).join(" ");
  }

  const SUNE = first("oll", "oll-27");
  const OLL_33 = first("oll", "oll-33");
  const T = first("pll", "pll-t");
  const Y = first("pll", "pll-y");
  const RA = first("pll", "pll-ra");

  it("cancels Sune into a T perm from 21 moves to 18", () => {
    expect(SUNE).toBe("R U R' U R U2 R'");
    expect(T).toBe("R U R' U' R' F R2 U' R' U' R U R' F'");
    const joined = `${SUNE} ${T}`;
    const merged = example("gaps-one-motion", "Sune into a T perm, cancelled").moves!;
    expect(cancel(joined)).toBe(merged);
    expect([moveCount(joined), moveCount(merged)]).toEqual([21, 18]);
    expect(apply(merged)).toBe(apply(joined));
    expect(text("gaps-one-motion")).toContain("21 moves become 18");
  });

  it("cancels OLL 33 into a Y perm from 25 moves to 22", () => {
    expect(OLL_33).toBe("R U R' U' R' F R F'");
    expect(Y).toBe("F R U' R' U' R U R' F' R U R' U' R' F R F'");
    const joined = `${OLL_33} ${Y}`;
    const merged = example("gaps-one-motion", "OLL 33 into a Y perm, cancelled").moves!;
    expect(cancel(joined)).toBe(merged);
    expect([moveCount(joined), moveCount(merged)]).toEqual([25, 22]);
    expect(apply(merged)).toBe(apply(joined));
    expect(text("gaps-one-motion")).toContain("25 moves become 22");
  });

  it("finishes a last layer each time: the OLL orients it and the PLL solves it", () => {
    for (const [oll, pll] of [
      [SUNE, T],
      [OLL_33, Y],
      [OLL_33, `U' ${RA} U'`],
    ]) {
      const start = apply(inv(`${oll} ${pll}`));
      // The drill's set-up: the PLL backwards, then the OLL backwards.
      expect(apply(`${inv(pll)} ${inv(oll)}`)).toBe(start);
      expect(firstTwoLayersSolved(start)).toBe(true);
      expect(lastLayerOriented(start)).toBe(false);
      expect(lastLayerOriented(apply(oll, start))).toBe(true);
      expect(apply(`${oll} ${pll}`, start)).toBe(SOLVED_FACELETS);
    }
  });

  it("quotes Yiheng Wang's 4.49 last layer as OLL 33, U', Ra, U': 25 moves", () => {
    const moves = example("gaps-one-motion", "Yiheng Wang's last layer in a 4.49").moves!;
    expect(moves).toBe(`${OLL_33} U' ${RA} U'`);
    expect(moveCount(moves)).toBe(25);
    // reco.nz: LL 25 moves in 1.59 s; the whole solve 55 in 4.49; F2L 30 in 2.90.
    expect((25 / 1.59).toFixed(2)).toBe("15.72");
    expect((55 / 4.49).toFixed(2)).toBe("12.25");
    expect((30 / 2.9).toFixed(2)).toBe("10.34");
    expect(text("gaps-ll-budget")).toContain(
      "25 moves in 1.59 s, 15.72 turns a second, against 12.25",
    );
    expect(text("gaps-ll-budget")).toContain("10.34 for F2L");
  });
});

describe("Where your last-layer time goes", () => {
  it("prices COLL and the join with the lesson's arithmetic", () => {
    const coll = 0.4 / 8;
    expect(coll).toBeCloseTo(0.05, 10);
    expect(0.1 / coll).toBeCloseTo(2, 10);
    expect(text("gaps-ll-budget")).toContain("that's 0.05 s a solve on average");
    expect(text("gaps-ll-budget")).toContain("twice as much");
    expect(quizzes["gaps-ll-budget"]![0]!.options[1]).toContain("0.05 s");
  });
});
