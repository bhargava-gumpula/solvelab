import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ASPECT_PACKS,
  LEVEL_BANDS,
  LEVEL_PACKS,
  TRAINING_PACKS,
  bandForRung,
  bandsForPack,
  getPack,
  isMadeFor,
  packBandLabel,
  packForAspect,
  packsForIds,
} from "@/data/training";
import { ALGORITHM_SETS, algorithmsFor } from "@/lib/algorithms/catalog";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { packMinutes } from "@/data/training/types";
import {
  LEVELS,
  currentLevel,
  levelFor,
  levelForAverage,
  levelForGoal,
  levelSplits,
} from "@/data/training/levels";
import { getLesson } from "@/data/learning/lessons";
import { SOURCES } from "@/data/training/sources";
import { ASPECTS, getAspect, type AspectId } from "@/lib/coach/aspects";
import { PRACTICE_TOPICS, isTestId } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { isValidAlgorithm } from "@/lib/cube/notation";
import { packProgress, progressByPack } from "@/lib/training/progress";
import {
  diagnosisFor,
  levelRecommendations,
  modelRecommendations,
  packRecommendations,
  rulesRecommendations,
} from "@/lib/training/recommend";
import { loadCoachModel, type Diagnosis } from "@/lib/coach/ai/model";
import { MODEL_ASPECTS } from "@/lib/coach/ai/features";
import { buildSolveProfile } from "@/lib/coach/profile";
import { aspectTargetsFor, testGoal } from "@/data/milestones/aspect-targets";
import { CORE_TESTS } from "@/data/exercises";
import type { DiagnosticRun } from "@/types/domain";
import type { AspectResult } from "@/lib/coach/profile";

describe("training packs", () => {
  it("covers every part of the solve profile exactly once", () => {
    const covered = ASPECT_PACKS.map((pack) => pack.aspectId).sort();
    const expected = ASPECTS.map((aspect) => aspect.id).sort();
    expect(covered).toEqual(expected);
  });

  it("has unique pack ids and unique item ids inside each pack", () => {
    const ids = TRAINING_PACKS.map((pack) => pack.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const pack of TRAINING_PACKS) {
      const items = [...pack.lessons, ...pack.drills].map((item) => item.id);
      expect(new Set(items).size, `duplicate item id in ${pack.id}`).toBe(items.length);
    }
  });

  it("teaches before it drills: every pack has lessons with real bodies", () => {
    // These three follow the CFOP method lessons in Sub-60, which took over their
    // overlapping lessons, so they keep only what those lessons don't teach.
    const companions = new Set(["switch-to-f2l", "two-look-oll", "two-look-pll"]);
    for (const pack of TRAINING_PACKS) {
      expect(pack.lessons.length, `${pack.id} has no lessons`).toBeGreaterThanOrEqual(
        companions.has(pack.id) ? 1 : 2,
      );
      expect(pack.drills.length, `${pack.id} has no drills`).toBeGreaterThanOrEqual(2);
      expect(pack.mistakes.length).toBeGreaterThanOrEqual(3);
      expect(packMinutes(pack)).toBeGreaterThan(0);
      for (const lesson of pack.lessons) {
        expect(lesson.body.length, `${pack.id}/${lesson.id} is too short`).toBeGreaterThanOrEqual(
          2,
        );
        // A lesson explains; a one-line tip belongs in the coach's tips instead.
        const words = lesson.body.join(" ").split(/\s+/).length;
        expect(words, `${pack.id}/${lesson.id} is too thin`).toBeGreaterThan(80);
        expect(lesson.takeaway.length).toBeGreaterThan(20);
        expect(lesson.minutes).toBeGreaterThan(0);
      }
    }
  });

  it("gives every drill a rule, a dose and a signal", () => {
    for (const pack of TRAINING_PACKS) {
      for (const drill of pack.drills) {
        expect(drill.rules.length, `${pack.id}/${drill.id} has no rules`).toBeGreaterThanOrEqual(2);
        expect(drill.dose.length).toBeGreaterThan(5);
        expect(drill.signal.length).toBeGreaterThan(15);
        expect(drill.purpose.length).toBeGreaterThan(20);
      }
    }
  });

  it("writes example moves in valid notation", () => {
    for (const pack of TRAINING_PACKS) {
      for (const lesson of pack.lessons) {
        for (const example of lesson.examples ?? []) {
          if (!example.moves) continue;
          expect(isValidAlgorithm(example.moves), `${pack.id}/${lesson.id}`).toBe(true);
        }
      }
    }
  });

  it("inserts into the slot it says, and nowhere else, whenever an example names a slot", () => {
    // Each slot's corner and edge, as sticker positions; the cross edges on D.
    const SLOTS = {
      FR: [
        [29, 26, 15],
        [23, 12],
      ],
      FL: [
        [27, 44, 24],
        [21, 41],
      ],
      BL: [
        [33, 42, 53],
        [50, 39],
      ],
      BR: [
        [35, 51, 17],
        [48, 14],
      ],
    } as const;
    const CROSS = [
      [32, 16],
      [28, 25],
      [30, 43],
      [34, 52],
    ];
    const home = (spot: number) => "URFDLB"[Math.floor(spot / 9)];
    const solved = (state: string, pieces: readonly (readonly number[])[]) =>
      pieces.every((piece) => piece.every((spot) => state[spot] === home(spot)));
    let checked = 0;
    for (const pack of TRAINING_PACKS) {
      for (const lesson of pack.lessons) {
        for (const example of lesson.examples ?? []) {
          if (!example.slot || !example.moves) continue;
          const parsed = parseAlgorithm(example.moves);
          if (!parsed.ok) throw new Error(example.moves);
          // Undoing the moves on a solved cube shows the case they solve.
          const state = applyAlgorithm(
            formatAlgorithm(invertAlgorithm(parsed.moves)),
            SOLVED_FACELETS,
          );
          const label = `${pack.id}/${lesson.id}: ${example.moves}`;
          expect(solved(state, CROSS), label).toBe(true);
          for (const [slot, pieces] of Object.entries(SLOTS)) {
            expect(solved(state, pieces), `${label} (${slot})`).toBe(slot !== example.slot);
          }
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("cites a source for everything, over https", () => {
    for (const pack of TRAINING_PACKS) {
      expect(pack.sources.length, `${pack.id} cites nothing`).toBeGreaterThanOrEqual(3);
      for (const source of pack.sources) {
        expect(source.url).toMatch(/^https?:\/\//);
        expect(source.label.length).toBeGreaterThan(3);
      }
    }
    // Every source in the shared list is used by at least one pack, so the
    // list can't quietly fill up with links nothing points at.
    const used = new Set(TRAINING_PACKS.flatMap((pack) => pack.sources.map((s) => s.url)));
    for (const source of Object.values(SOURCES)) {
      expect(used.has(source.url), `${source.label} is unused`).toBe(true);
    }
  });

  it("names levels that exist for each pack", () => {
    const levelIds = new Set(milestones.map((milestone) => milestone.id));
    for (const pack of TRAINING_PACKS) {
      expect(pack.levels.length).toBeGreaterThan(0);
      for (const level of pack.levels) {
        expect(levelIds.has(level), `${pack.id} names ${level}`).toBe(true);
      }
    }
  });

  it("looks packs up by id and by aspect", () => {
    expect(getPack("lookahead")?.aspectId).toBe("lookahead");
    expect(getPack("nope")).toBeUndefined();
    expect(packForAspect("cross")?.id).toBe("cross-efficiency");
    expect(packsForIds(["lookahead", "nope"]).map((pack) => pack.id)).toEqual(["lookahead"]);
  });
});

describe("the level ladder", () => {
  it("runs from learning the method to sub-10, without gaps", () => {
    expect(LEVELS.map((level) => level.id)).toEqual([
      "beginner",
      "sub120",
      "sub60",
      "sub45",
      "sub30",
      "sub25",
      "sub20",
      "sub15",
      "sub12",
      "sub10",
    ]);
    // Each rung points at the next, so "what am I working towards" always answers.
    for (let i = 0; i < LEVELS.length - 1; i++) {
      expect(LEVELS[i]!.goalId).toBe(LEVELS[i + 1]!.id);
    }
    expect(LEVELS[LEVELS.length - 1]!.goalId).toBeNull();
  });

  it("says what to do and what to leave alone at every level", () => {
    for (const level of LEVELS) {
      expect(level.doNow.length, `${level.id}`).toBeGreaterThanOrEqual(3);
      expect(level.notYet.length, `${level.id}`).toBeGreaterThanOrEqual(1);
      expect(level.bottleneck.split(/\s+/).length).toBeGreaterThan(15);
      expect(level.headline.length).toBeGreaterThan(20);
    }
  });

  it("lists on each rung only packs tagged for that rung", () => {
    // The road and each pack's own level must agree, or a pack would show at
    // one level on the road and another on its card and in the filter.
    for (const level of LEVELS) {
      for (const id of level.packs) {
        expect(getPack(id)!.levels, `${level.id} lists ${id}`).toContain(level.id);
      }
    }
  });

  it("only recommends packs that exist", () => {
    for (const level of LEVELS) {
      expect(level.packs.length).toBeGreaterThan(0);
      expect(packsForIds(level.packs).length, `${level.id}`).toBe(level.packs.length);
    }
  });

  it("puts an average on the rung whose band contains it", () => {
    expect(levelForAverage(8_500)?.id).toBe("sub10");
    expect(levelForAverage(18_000)?.id).toBe("sub20");
    expect(levelForAverage(22_000)?.id).toBe("sub25");
    expect(levelForAverage(55_000)?.id).toBe("sub60");
    expect(levelForAverage(150_000)?.id).toBe("beginner");
    expect(levelForAverage(null)).toBeNull();
  });

  it("puts a goal on the rung below it, which is where you stand", () => {
    expect(levelForGoal("sub15")?.id).toBe("sub20");
    expect(levelForGoal("sub10")?.id).toBe("sub12");
    expect(levelForGoal("nope")).toBeNull();
    expect(levelForGoal(null)).toBeNull();
    expect(levelForGoal(undefined)).toBeNull();
    expect(levelFor("sub20")?.label).toBe("Around 20 seconds");
  });
});

function aspectResult(id: AspectId, value: number, target: number, tag: AspectResult["tag"]) {
  return {
    id,
    definition: getAspect(id),
    value,
    range: null,
    samples: 10,
    target,
    tag,
    missingTests: [],
    nextTest: getAspect(id).tests[0] ?? null,
    previous: null,
    parts: [],
  } satisfies AspectResult;
}

const GOAL = "sub20";

/** A full set of core test runs, each attempt `factor` times the goal for that test. */
function runsAt(factor: number): DiagnosticRun[] {
  const targets = aspectTargetsFor(GOAL)!;
  return CORE_TESTS.map((testId, index) => {
    const goal = testGoal(testId, targets)!;
    // The turning test's goal is a speed: 24 turns at that many a second.
    const goalMs = goal.kind === "speed" ? (24 / goal.value) * 1000 : goal.value;
    // A little spread, as real attempts have.
    const timesMs = Array.from({ length: 12 }, (_, i) =>
      Math.round(goalMs * factor * (1 + ((i % 5) - 2) * 0.03)),
    );
    const at = new Date(Date.UTC(2026, 8, 1, 12, index)).toISOString();
    return {
      id: `run-${testId}`,
      exerciseId: testId,
      createdAt: at,
      completedAt: at,
      updatedAt: at,
      solveIds: [],
      sampleCount: timesMs.length,
      timesMs,
    };
  });
}

const profileFor = (runs: DiagnosticRun[]) =>
  buildSolveProfile({ runs, solves: [], goalMilestoneId: GOAL, snapshots: [] });

describe("pack recommendations: the coach model", () => {
  it("recommends the parts it judges weak, most confident first, once they're tested", () => {
    const profile = profileFor(runsAt(1).filter((run) => run.exerciseId !== "tps_test"));
    const probability = Object.fromEntries(
      ASPECTS.map((a) => [a.id, 0.1]),
    ) as Diagnosis["probability"];
    const weak = Object.fromEntries(ASPECTS.map((a) => [a.id, false])) as Diagnosis["weak"];
    Object.assign(probability, { lookahead: 0.7, oll: 0.9, turning_speed: 0.95 });
    Object.assign(weak, { lookahead: true, oll: true, turning_speed: true });

    const result = modelRecommendations({ probability, weak }, profile);
    // Turning speed is judged weak, but its test was never taken, so it waits.
    expect(result.map((entry) => entry.pack.id)).toEqual(["oll-execution", "lookahead"]);
    expect(result.every((entry) => entry.source === "model")).toBe(true);
    expect(result[0]!.reason).toBe("Likely holding you back: OLL (90% sure).");
  });

  it("uses the real trained model: a slow solver gets packs, one on pace gets fewer", async () => {
    const model = await loadCoachModel();
    expect(model).not.toBeNull();
    const slowRuns = runsAt(2);
    const onPaceRuns = runsAt(0.95);
    const slow = modelRecommendations(
      diagnosisFor(model!, slowRuns, [], GOAL)!,
      profileFor(slowRuns),
    );
    const onPace = modelRecommendations(
      diagnosisFor(model!, onPaceRuns, [], GOAL)!,
      profileFor(onPaceRuns),
    );
    expect(slow.length).toBeGreaterThan(0);
    expect(onPace.length).toBeLessThan(slow.length);
    for (const entry of slow) expect(entry.pack.aspectId).toBeDefined();
  });

  it("can't judge anything without a goal", async () => {
    const model = await loadCoachModel();
    expect(diagnosisFor(model!, runsAt(2), [], null)).toBeNull();
  });
});

describe("what measures each part", () => {
  it("marks exactly the parts the trained model judges as test-measured", () => {
    // The model's weights are tied to this list; if a part changed how it is
    // measured, the recommendations would quietly stop judging it.
    const byTests = ASPECTS.filter((aspect) => aspect.measuredBy === "tests").map((a) => a.id);
    expect(byTests).toEqual([...MODEL_ASPECTS]);
    expect(ASPECTS.filter((aspect) => aspect.outcome).map((a) => a.id)).toEqual(["full_solve"]);
  });
});

describe("pack recommendations: rules, level and the whole list", () => {
  it("falls back to the rules when the model can't load: slow parts, furthest behind first", () => {
    const result = rulesRecommendations([
      aspectResult("cross", 3000, 2600, "average"),
      aspectResult("lookahead", 2400, 800, "slow"),
      aspectResult("pll", 2600, 2400, "slow"),
      aspectResult("full_solve", 30000, 20000, "slow"),
      aspectResult("turning_speed", 5, 9, "slow"),
    ]);
    // Full solve is left out: being slower than your goal is the premise, not a weakness.
    expect(result.map((entry) => entry.pack.id)).toEqual([
      "lookahead",
      "turning-technique",
      "pll-execution",
    ]);
    expect(result[0]!.reason).toBe("Behind your goal pace: Lookahead.");
  });

  it("adds the packs written for your level", () => {
    const band = bandForRung("sub20")!;
    const level = levelRecommendations(band);
    expect(level.map((entry) => entry.pack.id).sort()).toEqual(
      [
        "alg-sets-worth-it",
        "f2l-from-the-front",
        "filler-moves",
        "good-and-bad-edges",
        "stuck-at-fifteen",
      ].sort(),
    );
    expect(level[0]!.reason).toBe("Written for your level, 20 → 15 s.");
    expect(levelRecommendations(null)).toEqual([]);
  });

  it("puts the parts first, then the level, with nothing twice", async () => {
    const model = await loadCoachModel();
    const runs = runsAt(2);
    const band = bandForRung("sub25")!;
    const list = packRecommendations({ profile: profileFor(runs), model, runs, solves: [], band });
    const ids = list.map((entry) => entry.pack.id);
    expect(new Set(ids).size).toBe(ids.length);
    const firstLevel = list.findIndex((entry) => entry.source === "level");
    expect(firstLevel).toBeGreaterThan(0);
    expect(list.slice(firstLevel).every((entry) => entry.source === "level")).toBe(true);
  });

  it("never lists a pack twice when the course stands in for the level", async () => {
    const model = await loadCoachModel();
    for (const rung of ["sub45", "sub60", "sub120"] as const) {
      const runs = runsAt(2);
      const band = bandForRung(rung)!;
      const list = packRecommendations({
        profile: profileFor(runs),
        model,
        runs,
        solves: [],
        band,
      });
      const ids = list.map((entry) => entry.pack.id);
      expect(new Set(ids).size, rung).toBe(ids.length);
    }
  });

  it("shows only the level's packs before any test is taken", async () => {
    const model = await loadCoachModel();
    const band = bandForRung("sub45")!;
    const list = packRecommendations({
      profile: profileFor([]),
      model,
      runs: [],
      solves: [],
      band,
    });
    expect(list.every((entry) => entry.source === "level")).toBe(true);
    // Sub-30 is taught by staged skill packs, so its course stands in for level packs.
    expect(list.map((entry) => entry.pack.id).sort()).toEqual(
      [
        "cross-efficiency",
        "f2l-efficiency",
        "inspection",
        "lookahead",
        "oll-execution",
        "pll-algorithms",
        "turning-technique",
      ].sort(),
    );
    expect(list[0]!.reason).toBe("In your course, Sub-30.");
  });
});

describe("pack progress", () => {
  const pack = getPack("lookahead")!;

  it("is empty until something is ticked", () => {
    const progress = packProgress(pack, undefined);
    expect(progress.started).toBe(false);
    expect(progress.complete).toBe(false);
    expect(progress.lessonsDone).toBe(0);
    expect(progress.lessonTotal).toBe(pack.lessons.length);
  });

  it("counts only items the pack still has", () => {
    const progress = packProgress(pack, {
      packId: pack.id,
      lessonsDone: [pack.lessons[0]!.id, "a-lesson-that-was-removed"],
      drillsDone: [pack.drills[0]!.id],
      startedAt: "2026-09-21T08:00:00.000Z",
      updatedAt: "2026-09-21T08:00:00.000Z",
    });
    expect(progress.lessonsDone).toBe(1);
    expect(progress.started).toBe(true);
    expect(progress.complete).toBe(false);
    expect(progress.isLessonDone(pack.lessons[0]!.id)).toBe(true);
    expect(progress.isDrillDone(pack.drills[0]!.id)).toBe(true);
  });

  it("counts a pack as read once every lesson is, with drills left open", () => {
    const progress = packProgress(pack, {
      packId: pack.id,
      lessonsDone: pack.lessons.map((lesson) => lesson.id),
      drillsDone: [],
      startedAt: "2026-09-21T08:00:00.000Z",
      updatedAt: "2026-09-21T08:00:00.000Z",
    });
    expect(progress.complete).toBe(true);
    expect(progress.isDrillDone(pack.drills[0]!.id)).toBe(false);
  });

  it("builds a map over every pack", () => {
    const map = progressByPack(TRAINING_PACKS, []);
    expect(Object.keys(map).length).toBe(TRAINING_PACKS.length);
    expect(map["lookahead"]!.started).toBe(false);
  });
});

describe("links that have to keep working", () => {
  it("points every lesson a rung names at a lesson that exists", () => {
    for (const level of LEVELS) {
      for (const lessonId of level.lessons ?? []) {
        expect(getLesson(lessonId), `${level.id} names ${lessonId}`).toBeDefined();
      }
    }
  });

  it("only borrows timers from tests that have a page", () => {
    for (const pack of TRAINING_PACKS) {
      for (const drill of pack.drills) {
        if (drill.exerciseId) expect(isTestId(drill.exerciseId), drill.id).toBe(true);
      }
    }
  });

  it("redirects every pre-4.1 training URL to a pack that exists", () => {
    const rules = readFileSync(join(process.cwd(), "public/_redirects"), "utf8")
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => line.trim().split(/\s+/));
    const targets = new Map(rules.map(([from, to]) => [from!, to!]));
    for (const topic of PRACTICE_TOPICS) {
      for (const from of [`/train/${topic.trainingId}/`, `/train/${topic.trainingId}`]) {
        const to = targets.get(from);
        expect(to, `no redirect for ${from}`).toBeDefined();
        expect(to, from).toMatch(/^\/learn\/[a-z0-9-]+\/$/);
        expect(getPack(to!.replace(/^\/learn\/|\/$/g, "")), `${from} → ${to}`).toBeDefined();
      }
    }
    for (const [, , status] of rules) expect(status).toBe("301");
  });
});

describe("level splits", () => {
  it("add up to the goal they are for", () => {
    for (const level of LEVELS) {
      const splits = levelSplits(level);
      const goal = milestones.find((milestone) => milestone.id === level.goalId);
      if (!goal?.thresholdMs) {
        expect(splits).toBeNull();
        continue;
      }
      const total = splits!.crossMs + splits!.f2lMs + splits!.lastLayerMs;
      // Each target is rounded to 10 ms, so a few tens of ms either way.
      expect(Math.abs(total - goal.thresholdMs), level.id).toBeLessThanOrEqual(60);
    }
  });

  it("picks the rung from the average first, then from the goal", () => {
    expect(currentLevel(18_000, "sub10")).toMatchObject({ source: "average" });
    expect(currentLevel(18_000, "sub10")?.level.id).toBe("sub20");
    expect(currentLevel(null, "sub15")).toMatchObject({ source: "goal" });
    expect(currentLevel(null, "sub15")?.level.id).toBe("sub20");
    expect(currentLevel(null, null)).toBeNull();
  });
});

describe("packs by level", () => {
  it("has eight stretches, first solves down to sub-10, covering every rung once", () => {
    expect(
      LEVEL_BANDS.map((band) => packBandLabel({ ...LEVEL_PACKS[0]!, levels: [...band.rungs] })),
    ).toEqual([
      "First solves → 2:00",
      "2:00 → 1:00",
      "1:00 → 45 s",
      "45 → 30 s",
      "30 → 20 s",
      "20 → 15 s",
      "15 → 10 s",
      "Sub-10",
    ]);
    const rungs = LEVEL_BANDS.flatMap((band) => band.rungs);
    expect(new Set(rungs).size).toBe(rungs.length);
    for (const level of LEVELS) expect(bandForRung(level.id), level.id).not.toBeNull();
  });

  it("offers at least two packs for every stretch: its own, or its course's", () => {
    for (const band of LEVEL_BANDS) {
      expect(levelRecommendations(band).length, band.id).toBeGreaterThanOrEqual(2);
    }
    // Most stretches still have packs written only for them.
    const written = LEVEL_BANDS.filter(
      (band) => TRAINING_PACKS.filter((pack) => isMadeFor(pack, band)).length >= 2,
    );
    expect(written.length).toBeGreaterThanOrEqual(5);
  });

  it("marks every pack with at least one stretch", () => {
    for (const pack of TRAINING_PACKS) {
      expect(bandsForPack(pack).length, pack.id).toBeGreaterThan(0);
      expect(packBandLabel(pack), pack.id).not.toBe("");
    }
    // Packs are marked for the courses that teach them (data/hub/courses.ts).
    expect(packBandLabel(getPack("practice-plan")!)).toBe("2:00 → 15 s");
    expect(packBandLabel(getPack("lookahead")!)).toBe("45 → 10 s");
    expect(packBandLabel(getPack("stuck-pieces")!)).toBe("1:00 → 45 s");
  });

  it("marks each level pack with exactly one stretch, and keeps it out of recommendations", () => {
    for (const pack of LEVEL_PACKS) {
      expect(pack.aspectId, pack.id).toBeUndefined();
      expect(bandsForPack(pack).length, pack.id).toBe(1);
    }
    const ids = new Set(TRAINING_PACKS.map((pack) => pack.id));
    expect(ids.size).toBe(TRAINING_PACKS.length);
  });

  it("quotes only algorithms the bank has verified for that case", () => {
    const cases = new Map(
      ALGORITHM_SETS.flatMap((set) => set.cases).map((entry) => [entry.id, entry]),
    );
    let checked = 0;
    for (const pack of TRAINING_PACKS) {
      for (const lesson of pack.lessons) {
        for (const example of lesson.examples ?? []) {
          if (!example.caseId) continue;
          const entry = cases.get(example.caseId);
          expect(entry, `${pack.id}: no case ${example.caseId}`).toBeDefined();
          const moves = algorithmsFor(entry!).map((algorithm) => algorithm.moves);
          expect(moves, `${pack.id}/${lesson.id}`).toContain(example.moves);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(7);
  });
});
