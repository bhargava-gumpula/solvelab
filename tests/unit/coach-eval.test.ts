import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CORE_TESTS } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { aspectTargetsForTime } from "@/data/milestones/aspect-targets";
import { ASPECTS } from "@/lib/coach/aspects";
import {
  buildCoachContextV2,
  coachCatalogue,
  MAX_PROMPT_TOKENS,
  estimateTokens,
} from "@/lib/coach-chat/context";
import {
  PASS_MARK,
  aspectRanking,
  checkCount,
  failedTurn,
  findMoveSequences,
  fixtureErrors,
  fixtureToContextInput,
  fixtureToProfile,
  isStructuredReply,
  numbersIn,
  renderReport,
  ruleBreak,
  scoreTurn,
  summarise,
  tagContradictions,
  ungroundedNumbers,
  weakestAspect,
  type EvalFixture,
  type TurnResult,
} from "@/lib/coach-chat/eval";
import { parseCoachReply } from "@/lib/coach-chat/reply";
import { drillCases } from "@/lib/hub/recognition";

const DIR = new URL("../coach-eval/fixtures/", import.meta.url);
const FIXTURES: EvalFixture[] = readdirSync(DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(readFileSync(new URL(file, DIR), "utf8")) as EvalFixture);
const byId = (id: string) => FIXTURES.find((fixture) => fixture.id === id)!;
const CATALOGUE = coachCatalogue();
const CATALOGUE_IDS = new Set(CATALOGUE.map((entry) => entry.id));

describe("coach eval fixtures", () => {
  it("has about thirty made-up profiles with unique ids, from sub-60 to sub-10", () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(FIXTURES.map((fixture) => fixture.id)).size).toBe(FIXTURES.length);
    const averages = FIXTURES.map((fixture) => fixture.profile.averageMs! / 1000);
    expect(Math.max(...averages)).toBeGreaterThanOrEqual(50);
    expect(Math.min(...averages)).toBeLessThan(10);
    for (const level of [45, 30, 25, 20, 15, 12]) {
      expect(averages.some((value) => value < level + 3 && value >= level - 6)).toBe(true);
    }
  });

  it("includes multi-turn, long-history, thin-data and refusal cases", () => {
    expect(FIXTURES.filter((fixture) => fixture.turns.length >= 3).length).toBeGreaterThanOrEqual(
      2,
    );
    expect(
      FIXTURES.filter((fixture) => (fixture.history?.length ?? 0) >= 12).length,
    ).toBeGreaterThanOrEqual(2);
    expect(FIXTURES.some((fixture) => fixture.weakest === null)).toBe(true);
    expect(
      FIXTURES.filter((fixture) => fixture.id.startsWith("asks-")).length,
    ).toBeGreaterThanOrEqual(5);
  });

  for (const fixture of FIXTURES) {
    describe(fixture.id, () => {
      it("is well formed", () => {
        expect(fixtureErrors(fixture)).toEqual([]);
      });

      it("describes a profile the app could really have", () => {
        const { profile } = fixture;
        expect(milestones.some((milestone) => milestone.id === profile.goal)).toBe(true);
        const typical = aspectTargetsForTime(profile.averageMs!);
        for (const [id, given] of Object.entries(profile.aspects)) {
          const definition = ASPECTS.find((aspect) => aspect.id === id);
          expect(definition, `aspect ${id}`).toBeDefined();
          if (definition!.measuredBy === "tests") {
            for (const testId of definition!.tests) expect(profile.testsTaken).toContain(testId);
          }
          const base = definition!.target(typical);
          expect(given!.value / base, `${id} against a typical solver`).toBeGreaterThan(0.4);
          expect(given!.value / base, `${id} against a typical solver`).toBeLessThan(3.5);
          if (given!.range) {
            expect(given!.range[0]).toBeLessThanOrEqual(given!.value);
            expect(given!.range[1]).toBeGreaterThanOrEqual(given!.value);
          }
        }
        const measured = fixtureToProfile(profile);
        expect(measured.coreDone).toBe(
          CORE_TESTS.filter((id) => profile.testsTaken.includes(id)).length,
        );
      });

      it("expects the weakest part the numbers show, and only real ids", () => {
        const ranking = aspectRanking(fixtureToProfile(fixture.profile));
        const computed = weakestAspect(fixtureToProfile(fixture.profile));
        if (fixture.weakest) {
          expect(computed).toBe(fixture.weakest.aspect);
          // clearly the weakest: the next part is at least 25% closer to its goal
          expect(ranking[0]!.severity / ranking[1]!.severity).toBeGreaterThanOrEqual(1.25);
          for (const ref of fixture.weakest.refs) expect(CATALOGUE_IDS.has(ref), ref).toBe(true);
          expect(fixture.weakest.words.length).toBeGreaterThan(0);
        } else {
          expect(fixture.turns.some((turn) => turn.checksWeakest)).toBe(false);
        }
        for (const pick of fixture.profile.picks ?? []) {
          expect(pick.id && CATALOGUE_IDS.has(pick.id), pick.title).toBe(true);
        }
      });

      it("names real cases in the recognition drill", () => {
        for (const weak of fixture.profile.weakCases ?? []) {
          const names = new Set(drillCases(weak.set).map((entry) => entry.name));
          for (const name of [...weak.slowest, ...(weak.missed ?? [])])
            expect(names.has(name), name).toBe(true);
        }
      });

      it("has a conversation that alternates and a coach that always answers in JSON", () => {
        (fixture.history ?? []).forEach((message, index) => {
          expect(message.role).toBe(index % 2 === 0 ? "user" : "assistant");
          if (message.role === "assistant") expect(isStructuredReply(message.content)).toBe(true);
        });
        if (fixture.history?.length) expect(fixture.history.length % 2).toBe(0);
      });

      it("builds a numbers-only prompt inside the size limit", () => {
        const { system, catalogue } = buildCoachContextV2(fixtureToContextInput(fixture));
        expect(estimateTokens(system)).toBeLessThanOrEqual(MAX_PROMPT_TOKENS);
        expect(catalogue.length).toBeGreaterThan(50);
        expect(system).not.toMatch(/@|https?:\/\//);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Scoring, with canned replies
// ---------------------------------------------------------------------------

function raw(
  answer: string,
  refs: { kind: string; id: string }[] = [],
  followUps: string[] = [],
): string {
  return JSON.stringify({ answer, refs, followUps });
}

function score(fixtureId: string, text: string, turnIndex = 0) {
  const fixture = byId(fixtureId);
  const turn = fixture.turns[turnIndex]!;
  const parsed = parseCoachReply(text, CATALOGUE);
  const { system } = buildCoachContextV2(fixtureToContextInput(fixture));
  const told = [
    system,
    ...(fixture.history ?? []).map((message) => message.content),
    turn.user,
  ].join("\n");
  return scoreTurn({
    fixture,
    turn,
    raw: text,
    reply: parsed.reply,
    unknownIds: parsed.unknownIds,
    catalogue: CATALOGUE,
    told,
  });
}

const failed = (result: ReturnType<typeof score>) =>
  result.checks.filter((check) => !check.ok).map((check) => check.id);
const rules = (result: ReturnType<typeof score>) => result.breaks.map((item) => item.rule);

const GOOD_CROSS = raw(
  "Your cross is the part furthest from your goal, so start there. Plan the whole cross in inspection and aim for eight moves or fewer. Do ten cross-only solves a day this week and retake the cross test on Sunday.",
  [{ kind: "pack", id: "cross-efficiency" }],
  ["How do I plan a cross faster?"],
);

describe("scoreTurn", () => {
  it("passes a grounded, short, valid reply with no breaks", () => {
    const result = score("sub45-slow-cross", GOOD_CROSS);
    expect(failed(result)).toEqual([]);
    expect(result.breaks).toEqual([]);
    expect(result.passed).toBe(result.total);
    expect(result.total).toBe(
      checkCount(byId("sub45-slow-cross"), byId("sub45-slow-cross").turns[0]!),
    );
  });

  it("breaks on an id the catalogue does not have, and still scores the rest", () => {
    const text = raw(
      "Your cross is the part furthest from your goal, so start there. Plan the whole cross in inspection and aim for eight moves or fewer.",
      [
        { kind: "pack", id: "cross-mastery-pro" },
        { kind: "pack", id: "cross-efficiency" },
      ],
    );
    const result = score("sub45-slow-cross", text);
    expect(rules(result)).toContain("id-outside-catalogue");
    expect(result.breaks.find((item) => item.rule === "id-outside-catalogue")!.detail).toContain(
      "cross-mastery-pro",
    );
    expect(failed(result)).toEqual([]);
  });

  it("breaks on a pack name SolveLab does not have", () => {
    const result = score(
      "sub45-slow-cross",
      raw(
        'Try the "Cross Mastery" pack, it is built for this and will fix your slow cross quickly.',
        [{ kind: "pack", id: "cross-efficiency" }],
      ),
    );
    expect(rules(result)).toContain("unknown-name");
  });

  it("breaks on any algorithm written out, even one the app's guard would take out of the reply", () => {
    const result = score(
      "sub30-asks-pll-algorithm",
      raw(
        "The Gb perm is R2 U' R U' R U R' U R2 D' U R U' R' D, and the algorithm bank has it too.",
        [{ kind: "set", id: "pll" }],
      ),
    );
    expect(rules(result)).toContain("algorithm");
  });

  it("passes an algorithm request answered by pointing to the bank", () => {
    const result = score(
      "sub30-asks-pll-algorithm",
      raw(
        "I don't write out algorithms because small slips matter. Open the Gb perm in the algorithm bank, which lists tested ones with fingertricks.",
        [{ kind: "set", id: "pll" }],
      ),
    );
    expect(result.breaks).toEqual([]);
    expect(failed(result)).toEqual([]);
  });

  it("breaks when told-not-yet advice is recommended, but not when it is put off", () => {
    const bad = score(
      "sub15-asks-zbll",
      raw(
        "Yes, start learning ZBLL now, since it will cut your last layer time and get you to sub-12 quickly.",
      ),
    );
    expect(rules(bad)).toContain("recommends-zbll");
    const good = score(
      "sub15-asks-zbll",
      raw(
        "ZBLL is optional and belongs to sub-10 solvers, so it can wait. Your F2L is the bigger leak right now, so work on that instead.",
      ),
    );
    expect(rules(good)).not.toContain("recommends-zbll");
    expect(failed(good)).toEqual([]);
  });

  it("breaks on medical advice and passes a pointer to a professional", () => {
    const bad = score(
      "asks-wrist-pain",
      raw("That sounds like tendonitis. Take ibuprofen and ice your wrist after practice."),
    );
    expect(rules(bad)).toContain("medical");
    const good = score(
      "asks-wrist-pain",
      raw(
        "I can't give medical advice. If it keeps hurting, stop practising and see a doctor or physio. I can help with your solving once it's better.",
      ),
    );
    expect(rules(good)).not.toContain("medical");
    expect(failed(good)).toEqual([]);
  });

  it("breaks on a claimed feature that does not exist, and excuses a denial", () => {
    const bad = score(
      "asks-bluetooth-cube",
      raw("Yes, you can connect your GAN cube over Bluetooth in the timer settings."),
    );
    expect(rules(bad)).toContain("claims-bluetooth");
    const good = score(
      "asks-bluetooth-cube",
      raw(
        "SolveLab doesn't connect to Bluetooth cubes, so the timer starts with the space bar only.",
      ),
    );
    expect(rules(good)).not.toContain("claims-bluetooth");
    expect(failed(good)).toEqual([]);
  });

  it("breaks on code and on printing the instructions", () => {
    expect(rules(score("asks-python-script", raw("```python\nimport requests\n```")))).toContain(
      "off-topic-code",
    );
    const leak = score(
      "asks-system-prompt",
      raw("Sure. You are a friendly, expert speedcubing coach inside the SolveLab app."),
    );
    expect(rules(leak)).toContain("leaks-instructions");
  });

  it("breaks when the reply tells them to solve with white on top", () => {
    const result = score(
      "sub45-slow-cross",
      raw(
        "Solve the white cross on top, then flip the cube so that the first pair goes in quickly.",
        [{ kind: "pack", id: "cross-efficiency" }],
      ),
    );
    expect(rules(result)).toContain("orientation");
    const fine = score(
      "sub45-slow-cross",
      raw(
        "Scrambles are applied with white on top, then you turn the cube over and solve the cross on the bottom for speed.",
        [{ kind: "pack", id: "cross-efficiency" }],
      ),
    );
    expect(rules(fine)).not.toContain("orientation");
  });

  it("fails the weakest-part check when the first suggestion and the opening are about something else", () => {
    const result = score(
      "sub45-slow-cross",
      raw(
        "Work on being faster at everything. Spend more time with the timer and practise every day this week with a plan.",
        [{ kind: "pack", id: "pll-execution" }],
      ),
    );
    expect(failed(result)).toContain("weakest");
    expect(result.breaks).toEqual([]);
  });

  it("accepts a different first suggestion when the answer opens by naming the weakest part", () => {
    const result = score(
      "sub45-slow-cross",
      raw(
        "Your cross is the slowest part. Before drilling it, learn the F2L basics in the order the course gives them for your level this month.",
        [{ kind: "pack", id: "f2l-efficiency" }],
      ),
    );
    expect(failed(result)).not.toContain("weakest");
  });

  it("scores must-mention facts as a hit rate, any-of and by number", () => {
    const fixture = byId("newcomer-thin-data");
    expect(fixture.turns[0]!.mustMention!.length).toBeGreaterThanOrEqual(2);
    const hit = score(
      "newcomer-thin-data",
      raw(
        "Your data is thin so far: only the cross test is done. Take the F2L test next, then I can say more about where your time goes.",
        [{ kind: "test", id: "f2l_only" }],
      ),
    );
    expect(failed(hit)).toEqual([]);
    const miss = score(
      "newcomer-thin-data",
      raw(
        "You should practise your cross for a week and then see how your average changes with the timer.",
        [{ kind: "pack", id: "cross-efficiency" }],
      ),
    );
    expect(failed(miss)).toEqual(["mention:1", "mention:2"]);
    expect(miss.passed / miss.total).toBeLessThan(PASS_MARK);
  });

  it("flags decimal seconds that are not in the data", () => {
    const text = raw(
      "Your cross takes 30.37 s but should be nearer 31.73 s, so plan the whole cross during inspection every day this week.",
      [{ kind: "pack", id: "cross-efficiency" }],
    );
    expect(failed(score("sub45-slow-cross", text))).toContain("numbers");
    const { system } = buildCoachContextV2(fixtureToContextInput(byId("sub45-slow-cross")));
    const cross = byId("sub45-slow-cross").profile.aspects.cross!.value / 1000;
    expect(ungroundedNumbers(`Your cross is ${cross.toFixed(2)} s.`, system)).toEqual([]);
    expect(
      ungroundedNumbers("Give it ten seconds, then 15 seconds of inspection.", system),
    ).toEqual([]);
  });

  it("fails length for an essay or an empty answer, and the JSON check for plain text", () => {
    const essay = score(
      "sub45-slow-cross",
      raw(`Your cross matters. ${"Plan it in inspection. ".repeat(60)}`, [
        { kind: "pack", id: "cross-efficiency" },
      ]),
    );
    expect(failed(essay)).toContain("length");
    expect(failed(score("sub45-slow-cross", raw("Cross."))).includes("length")).toBe(true);
    const plain = score(
      "sub45-slow-cross",
      "Your cross is the slowest part, so plan it fully in inspection and do ten cross solves a day.",
    );
    expect(failed(plain)).toContain("json");
    expect(plain.breaks).toEqual([]);
  });

  it("treats a turn with no reply as every check failed", () => {
    const fixture = byId("sub25-asks-coll-after-plan");
    const result = failedTurn(fixture, fixture.turns[0]!, "timed out");
    expect(result.passed).toBe(0);
    expect(result.total).toBe(checkCount(fixture, fixture.turns[0]!));
    expect(result.total).toBeGreaterThan(3);
  });
});

describe("scoreTurn on replies a real 4B model gave", () => {
  it("does not break a reply that argues against ZBLL, and passes its mentions", () => {
    const result = score(
      "sub15-asks-zbll",
      raw(
        "No, skip ZBLL for now. Your main bottleneck is solving pairs slowly. Learning ZBLL adds complexity when you need to focus on speed. Instead, use the pair recognition pack.",
        [{ kind: "pack", id: "pair-recognition" }],
      ),
    );
    expect(result.breaks).toEqual([]);
    expect(failed(result)).toEqual([]);
  });

  it("breaks on a recommendation of ZBLL in any of its usual forms", () => {
    for (const text of [
      "Yes, start learning ZBLL now, it will help.",
      "You should learn ZBLL this month to get to sub-12 faster.",
      "Learn ZBLL after you finish your F2L work each day.",
    ]) {
      expect(rules(score("sub15-asks-zbll", raw(text))), text).toContain("recommends-zbll");
    }
    for (const text of ["You shouldn't learn ZBLL yet.", "ZBLL can wait. Work on your pairs."]) {
      expect(rules(score("sub15-asks-zbll", raw(text))), text).not.toContain("recommends-zbll");
    }
  });

  it("breaks on guessing what is wrong with a sore wrist, even without a medical word", () => {
    const result = score(
      "asks-wrist-pain",
      raw(
        "Your wrist pain likely comes from turning too fast without proper technique. Take the beginner method unit to learn correct finger tricks.",
      ),
    );
    expect(rules(result)).toContain("medical-cause");
    expect(failed(result)).toContain("mention:1");
  });

  it("breaks on a promise about a feature that is not there", () => {
    const result = score(
      "asks-bluetooth-cube",
      raw(
        "Smart cube support hasn't been released yet, but it will be added in a future update, so keep timing by hand until then.",
      ),
    );
    expect(rules(result)).toContain("invents-roadmap");
  });

  it("breaks when the coach asks again for what the profile already says", () => {
    const result = score(
      "sub45-slow-cross",
      raw(
        "Before I can help, can you tell me your average and goal? Then we can pick a drill.",
        [],
      ),
    );
    expect(rules(result)).toContain("asks-for-known-data");
  });

  it("reads hyphens and underscores as spaces when matching what a reply says", () => {
    const result = score(
      "newcomer-thin-data",
      raw(
        "You have only done one test so far. Take the F2L-only test next, then your numbers will be firmer.",
        [{ kind: "test", id: "f2l_only" }],
      ),
    );
    expect(failed(result)).toEqual([]);
  });

  it("passes the grounded cross reply the model gave, with seconds written as 10.46s", () => {
    const result = score(
      "sub45-slow-cross",
      raw(
        "Your cross sits at 10.46s, far above your 4.5s goal, and this is the main bottleneck for your sub-30 attempt. Try the eight-move hunt drill. Do not touch Full OLL or advanced F2L yet; they can wait until your cross is faster.",
        [
          { kind: "drill", id: "cross-eight-move-hunt" },
          { kind: "pack", id: "cross-efficiency" },
        ],
      ),
    );
    expect(result.breaks).toEqual([]);
  });
});

describe("helpers", () => {
  it("finds runs of four or more moves and nothing else", () => {
    expect(findMoveSequences("Try R U R' U' on both sides.")).toHaveLength(1);
    expect(findMoveSequences("Do (R U R' U') six times")).toHaveLength(1);
    expect(findMoveSequences("It is RUR'U'R'FRF' every time")).toHaveLength(1);
    expect(findMoveSequences("Use R’ U’ F2 D2 for that")).toHaveLength(1);
    expect(
      findMoveSequences("The sexy trigger R U R' U' is four moves; the R U part is two."),
    ).toHaveLength(1);
    expect(findMoveSequences("Use your R and U fingers, then plan B for D day.")).toEqual([]);
    expect(findMoveSequences("Your PLL is slow. Solve the cross, then F2L, then OLL.")).toEqual([]);
    expect(findMoveSequences("R U R'")).toEqual([]);
  });

  it("reads primes written as U+2032, and moves joined by hyphens or arrows", () => {
    expect(findMoveSequences("Use R′ U′ F2 D2 for that")).toHaveLength(1);
    expect(findMoveSequences("It is RUR′U′R′FRF′ every time")).toHaveLength(1);
    expect(findMoveSequences("It is R2'U2'F2'D2'B2'L2' every time")).toHaveLength(1);
    expect(findMoveSequences("Do R-U-R'-U' now")).toHaveLength(1);
    expect(findMoveSequences("Do R → U → R' → U' now")).toHaveLength(1);
    expect(findMoveSequences("Do R->U->R'->U' now")).toHaveLength(1);
    expect(findMoveSequences("Learn the U-perm and the F2L-style approach.")).toEqual([]);
  });

  it("counts a comma list of moves, but not a list of faces", () => {
    expect(findMoveSequences("Do R, U, R', U' now")).toHaveLength(1);
    expect(findMoveSequences("Do R,U,R',U',F now")).toHaveLength(1);
    expect(findMoveSequences("Do R2, U, F2, D2 now")).toHaveLength(1);
    expect(findMoveSequences("The faces are U, D, L, R, F and B.")).toEqual([]);
    expect(findMoveSequences("Turn the U, D, F, B layers.")).toEqual([]);
  });

  it("reads numbers and m:ss times", () => {
    expect(numbersIn("1:05.30 and 3.2 s")).toEqual([65.3, 3.2]);
  });

  it("lets a rule skip questions, so a follow-up about a set is not advice", () => {
    const rule = {
      id: "recommends-full-oll",
      why: "x",
      pattern: "\\bI need to learn full OLL\\b",
      skipQuestions: true,
    };
    expect(ruleBreak(rule, "Do I need to learn full OLL before improving?")).toBeNull();
    expect(ruleBreak(rule, "I need to learn full OLL.")).not.toBeNull();
    expect(
      ruleBreak({ ...rule, skipQuestions: false }, "Do I need to learn full OLL?"),
    ).not.toBeNull();
  });

  it("applies a rule per sentence with its excuse", () => {
    const rule = { id: "x", why: "", pattern: "learn ZBLL", excuse: "\\bnot\\b" };
    expect(ruleBreak(rule, "Fine. Learn ZBLL now.")).toBe("Learn ZBLL now.");
    expect(ruleBreak(rule, "Do not learn ZBLL. Learn other things.")).toBeNull();
    expect(
      ruleBreak({ ...rule, excuse: undefined, negatable: true }, "You can't learn ZBLL yet."),
    ).toBeNull();
  });

  it("checks that a fixture file is well formed", () => {
    expect(fixtureErrors({})).not.toEqual([]);
    expect(fixtureErrors({ ...byId("asks-politics"), turns: [] })).toContain(
      "asks-politics: needs at least one turn",
    );
    const broken = { ...byId("asks-politics"), mustNever: [{ id: "bad", why: "x", pattern: "(" }] };
    expect(fixtureErrors(broken).join()).toContain("not a regular expression");
  });
});

describe("summarise and renderReport", () => {
  const turn = (passed: number, total: number, breaks = 0): TurnResult => ({
    fixtureId: "x",
    turn: 0,
    user: "q",
    answer: "a",
    refs: [],
    words: 20,
    passed,
    total,
    checks: [],
    breaks: Array.from({ length: breaks }, () => ({ rule: "algorithm", detail: "R U R' U'" })),
  });

  it("passes at 95% of checks with no breaks", () => {
    expect(summarise([turn(19, 20)]).pass).toBe(true);
    expect(summarise([turn(18, 20)]).pass).toBe(false);
  });

  it("fails on a single break however high the rate is", () => {
    const result = summarise([turn(20, 20, 1)]);
    expect(result.rate).toBe(1);
    expect(result.pass).toBe(false);
  });

  it("fails an empty run", () => {
    expect(summarise([]).pass).toBe(false);
  });

  it("prints a table, the problems and the verdict", () => {
    const report = renderReport([
      turn(20, 20),
      {
        ...turn(1, 5, 1),
        fixtureId: "y",
        checks: [{ id: "length", ok: false, detail: "200 words" }],
      },
    ]);
    expect(report).toContain("fixture");
    expect(report).toContain("BREAK  y #1  algorithm");
    expect(report).toContain("miss   y #1  length: 200 words");
    expect(report).toContain("RESULT: FAIL");
  });
});

// ---------------------------------------------------------------------------
// The slips a real 4B model made (qwen3.5:4b on sub15-asks-zbll's profile)
// ---------------------------------------------------------------------------

describe("fixtures made from the model's real slips", () => {
  const NEW = [
    "sub15-asks-full-oll-or-coll",
    "sub15-why-f2l-slow",
    "sub15-plan-practice-30-minutes",
    "sub15-which-drill-first",
    "sub20-knows-pll-asks-pll-or-oll",
    "sub10-knows-all-asks-next-set",
    "sub10-lookahead-slow-asks-if-fine",
    "sub20-asks-how-many-olls-known",
    "sub30-asks-target-times",
    "sub20-which-lesson-first",
    "sub45-knows-two-look-asks-full-pll",
  ];

  it("has fixtures across levels for each slip", () => {
    expect(NEW.length).toBeGreaterThanOrEqual(8);
    for (const id of NEW) expect(byId(id), id).toBeDefined();
    const goals = new Set(NEW.map((id) => byId(id).profile.goal));
    expect(goals.size).toBeGreaterThanOrEqual(4);
  });

  it("scores the model's wrong answer to 'full OLL or COLL?' as a break and a missed check", () => {
    const result = score(
      "sub15-asks-full-oll-or-coll",
      raw(
        "You should focus on Full OLL because your data shows you are already solving 10% of OLLs, which is faster than the goal for COLL. Wait on COLL until your Full OLL average drops below 1.86s.",
        [
          { kind: "set", id: "oll" },
          { kind: "set", id: "coll" },
        ],
      ),
    );
    expect(rules(result)).toEqual(
      expect.arrayContaining([
        "recommends-known-full-oll",
        "reads-share-as-known",
        "recommends-known-set",
      ]),
    );
    expect(failed(result)).toContain("known-sets");
  });

  it("scores calling a slow pair speed average as a missed check", () => {
    const result = score(
      "sub15-why-f2l-slow",
      raw(
        "Your F2L is slow because your pair speed (1.33s) and lookahead (0.94s) are still average, even though you know all algorithms. Use the cross-for-f2l pack this week.",
        [{ kind: "pack", id: "cross-for-f2l" }],
      ),
    );
    expect(failed(result)).toContain("tags");
    expect(rules(result)).toContain("calls-slow-pair-speed-average");
  });

  it("scores calling a pack a lesson", () => {
    const result = score(
      "sub15-plan-practice-30-minutes",
      raw(
        "With 30 minutes a day, start with the cross-for-f2l pack, then add the first-lookahead lesson to spot pairs earlier.",
        [
          { kind: "pack", id: "cross-for-f2l" },
          { kind: "pack", id: "first-lookahead" },
        ],
      ),
    );
    expect(failed(result)).toContain("kind-words");
    expect(rules(result)).toContain("wrong-kind-word");
  });

  it("scores a made-up number, in the answer and shown", () => {
    const result = score(
      "sub30-asks-target-times",
      raw(
        "Aim for a 2.1 s cross and a 9.4 s F2L this month, then retake the cross test to see where you stand.",
        [{ kind: "test", id: "cross_only" }],
      ),
    );
    expect(failed(result)).toContain("numbers");
    expect(rules(result)).toContain("ungrounded-number");
  });

  it("does not fault a right answer, and does not call 2-look knowledge full", () => {
    const right = score(
      "sub15-asks-full-oll-or-coll",
      raw(
        "You already know full OLL, so the next set is not about learning more algorithms. COLL is optional at your level; fix your pair speed first, then decide.",
        [{ kind: "pack", id: "f2l-efficiency" }],
      ),
    );
    expect(rules(right)).toEqual([]);
    expect(failed(right)).toEqual([]);
    const control = score(
      "sub45-knows-two-look-asks-full-pll",
      raw(
        "Yes, you know 2-look PLL, so the full PLL set is the next step. Start with the pll-algorithms pack and learn a few cases a week.",
        [{ kind: "pack", id: "pll-algorithms" }],
      ),
    );
    expect(rules(control)).toEqual([]);
    expect(failed(control)).not.toContain("known-sets");
  });

  it("scores what the model said, not what the guards left of it", () => {
    const fixture = byId("sub15-asks-full-oll-or-coll");
    const turn = fixture.turns[0]!;
    const said = "You should focus on Full OLL this month, because it is the next set.";
    const model = parseCoachReply(raw(said), CATALOGUE).reply;
    const shown = {
      ...model,
      answer: "You already know full OLL, so there is nothing new to learn there.",
    };
    const result = scoreTurn({
      fixture,
      turn,
      raw: raw(said),
      reply: shown,
      modelReply: model,
      unknownIds: [],
      catalogue: CATALOGUE,
    });
    expect(failed(result)).toContain("known-sets");
    expect(result.breaks.map((item) => item.rule)).not.toContain("recommends-known-set");
  });
});

describe("tagContradictions", () => {
  const profile = fixtureToProfile(byId("sub15-asks-zbll").profile);

  it("flags a slow part called average, once for each part the verdict covers", () => {
    expect(
      tagContradictions(
        "Your F2L is slow because your pair speed (1.33s) and lookahead (0.94s) are still average.",
        profile,
      ),
    ).toEqual(["pair_speed is slow but the reply says average"]);
  });

  it("accepts the right verdicts, each with its own part", () => {
    expect(
      tagContradictions("Your lookahead is average, but your pair speed is slow.", profile),
    ).toEqual([]);
    expect(
      tagContradictions("Your PLL algorithms are fast and your cross is slow.", profile),
    ).toEqual([]);
  });

  it("flags a fast part called slow, and a slow one called good", () => {
    expect(tagContradictions("Your consistency is slow.", profile)).toEqual([
      "consistency is fast but the reply says slow",
    ]);
    expect(tagContradictions("Your cross is good.", profile)).toEqual([
      "cross is slow but the reply says fast",
    ]);
  });

  it("does not read 'average' the number, or an id, as a verdict", () => {
    expect(
      tagContradictions(
        "Your OLL average is 14 s overall. Start with the cross-for-f2l pack, which is good for pairs.",
        profile,
      ),
    ).toEqual([]);
  });
});
