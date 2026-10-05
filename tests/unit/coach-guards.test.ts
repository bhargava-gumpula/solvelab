import { describe, expect, it } from "vitest";
import { currentLevel } from "@/data/training/levels";
import { coachCatalogue } from "@/lib/coach-chat/context";
import {
  fixKindWords,
  groundNumbers,
  guardAdvice,
  guardText,
  leaveAloneSets,
  refSlips,
  replyCheck,
  statedNumbers,
  type ReplyCheck,
} from "@/lib/coach-chat/guards";

const CATALOGUE = coachCatalogue();

const SYSTEM = [
  "Goal: Sub 12",
  "Timer average: 14.00 s",
  "- Cross: 1.69 s (likely 1.50–1.88 s; 10 attempts), goal under 1.44 s, pace SLOW (clearly behind the goal), 1.89 s → 1.69 s since the latest test (improving)",
  "- Pair speed: 1.33 s (likely 1.18–1.48 s; 10 attempts), goal under 1.20 s, pace SLOW (clearly behind the goal)",
  "- OLL algorithms: 12% (likely 2–22%; 10 attempts), goal under 10%, pace average (close to the goal)",
  "- Turning speed: 11.5 turns/s (likely 10.8–12.2 turns/s; 10 attempts), goal over 12.5 turns/s, pace average (close to the goal)",
].join("\n");

const check = (said: string[] = [], over: Partial<ReplyCheck> = {}): ReplyCheck => ({
  system: SYSTEM,
  said,
  knownSets: [],
  leaveAloneSets: [],
  ...over,
});

const stated = (text: string) => statedNumbers(text).map((item) => item.text);

describe("statedNumbers", () => {
  it("finds numbers with a unit, decimals and times", () => {
    expect(stated("Your cross is 1.69 s, 1.3s or 2 seconds, 12% and 11.5 turns/s.")).toEqual([
      "1.69 s",
      "1.3s",
      "2 seconds",
      "12%",
      "11.5 turns/s",
    ]);
    expect(stated("A 1:05.3 solve and 1.5 either way")).toEqual(["1:05.3", "1.5"]);
  });

  it("ignores whole numbers with no unit, and digits inside names", () => {
    expect(
      stated("Do 10 drills of 5 solves in the sub-12 f2l-efficiency pack, 2-look OLL."),
    ).toEqual([]);
    expect(stated("10 attempts and 30 minutes a day")).toEqual([]);
  });
});

describe("groundNumbers", () => {
  it("keeps numbers the data has, to within rounding, and gaps the coach may work out", () => {
    const text =
      "Your cross is 1.7 s against 1.44 s, which is 0.25 s over, and it dropped 0.2 s. Pair speed is 1.33s and OLL algorithms are at 12%.";
    expect(groundNumbers(text, check())).toEqual({ text, removed: [] });
  });

  it("removes a sentence built on a number nobody gave", () => {
    const result = groundNumbers(
      "Your cross is slow. Aim for 0.9 s on it by Friday. Plan the cross in inspection.",
      check(),
    );
    expect(result.text).toBe("Your cross is slow. Plan the cross in inspection.");
    expect(result.removed).toEqual(["0.9 s"]);
  });

  it("takes a list item's number with it", () => {
    expect(groundNumbers("1. Plan the cross.\n2. Hold it to 0.9 s.\n3. Rest.", check()).text).toBe(
      "1. Plan the cross. 3. Rest.",
    );
  });

  it("drops a bracketed figure and keeps the sentence", () => {
    const result = groundNumbers("Your pair speed (2.4 s) is the slowest part of F2L.", check());
    expect(result.text).toBe("Your pair speed is the slowest part of F2L.");
    expect(result.removed).toEqual(["2.4 s"]);
  });

  it("checks whole seconds and percents too, and keeps what the person said", () => {
    expect(
      groundNumbers("Aim for 20 seconds. Next, hit 40% fewer pauses.", check()).removed,
    ).toEqual(["20 seconds", "40%"]);
    expect(
      groundNumbers("You said 13.5 s, so start from 13.5 s.", check(["I am at 13.5 s"])).removed,
    ).toEqual([]);
  });

  it("does not let the edge of a likely range stand as a cut-off or target", () => {
    const result = groundNumbers(
      "Your cross is likely 1.5 s at best. Keep going until your cross drops below 1.5 s. Beat your goal of 1.44 s.",
      check(),
    );
    expect(result.text).toBe("Your cross is likely 1.5 s at best. Beat your goal of 1.44 s.");
    expect(result.removed).toEqual(["1.5 s"]);
  });

  it("allows the inspection numbers the rule book gives, for inspection only", () => {
    const text = "You have 15 seconds of inspection, with calls at 8 s and 12 seconds.";
    expect(groundNumbers(text, check())).toEqual({ text, removed: [] });
    expect(groundNumbers("You have 13 seconds of inspection.", check()).removed).toEqual([
      "13 seconds",
    ]);
    expect(groundNumbers("You are stuck at 15 seconds.", check()).removed).toEqual(["15 seconds"]);
  });

  it("never backs a slow-case share read as a count of known algorithms", () => {
    const system = `${SYSTEM}\n- OLL slow-case share: 30% (likely 20–40%; 10 attempts), goal under 15%`;
    const result = groundNumbers(
      "You know 30% of your OLL algorithms. You are already solving 30% of OLLs. 30% of your OLL attempts were much slower than usual.",
      { system, said: [] },
    );
    expect(result.text).toBe("30% of your OLL attempts were much slower than usual.");
    expect(result.removed).toEqual(["30%", "30%"]);
  });

  it("does not take a know-verb earlier in the sentence for the share's verb", () => {
    for (const text of [
      "You know full OLL, but 12% of OLL cases are slow.",
      "You use full PLL, and about 12% of OLL cases are slow.",
    ]) {
      expect(groundNumbers(text, check())).toEqual({ text, removed: [] });
    }
    expect(groundNumbers("Only 12% of your OLL algorithms are known.", check()).removed).toEqual([
      "12%",
    ]);
    expect(groundNumbers("You have learned about 12% of OLL.", check()).removed).toEqual(["12%"]);
  });

  it("holds a target to the data however it is worded, but not a plain value", () => {
    for (const text of [
      "Aim for 1.50 s on your cross.",
      "Your target is 1.50 s.",
      "Shave it down to 1.50 seconds.",
      "Get your cross to 1.50 s.",
    ]) {
      expect(groundNumbers(text, check()).removed).toHaveLength(1);
    }
    const text = "Your cross could be as quick as 1.50 s, or 1.69 s on average.";
    expect(groundNumbers(text, check())).toEqual({ text, removed: [] });
  });

  it("does not let a time stand for a share, or the other way round", () => {
    expect(groundNumbers("Your pair speed is 12.5 s.", check()).removed).toEqual(["12.5 s"]);
    expect(groundNumbers("Your turning speed is 11.5%.", check()).removed).toEqual(["11.5%"]);
  });

  it("leaves text with no numbers byte for byte", () => {
    const text = "Plan the cross.\nThen go.";
    expect(groundNumbers(text, check()).text).toBe(text);
  });
});

describe("fixKindWords", () => {
  it("calls a pack a pack, by id or by title, before or after the name", () => {
    expect(fixKindWords("Add the first-lookahead lesson to your week.", CATALOGUE)).toEqual({
      text: "Add the first-lookahead pack to your week.",
      fixes: ["lesson → pack: first-lookahead"],
    });
    expect(fixKindWords("Try the Your first lookahead drill.", CATALOGUE).text).toBe(
      "Try the Your first lookahead pack.",
    );
    expect(fixKindWords("Open the lesson cross-for-f2l today.", CATALOGUE).text).toBe(
      "Open the pack cross-for-f2l today.",
    );
  });

  it("reads a name inside a longer title as that title", () => {
    // "Full PLL" is a set, but here it ends the pack "Learning full PLL".
    expect(fixKindWords("Start with the Learning full PLL pack.", CATALOGUE).fixes).toEqual([]);
    expect(fixKindWords("Open the pack 2-look OLL: ten algorithms.", CATALOGUE).fixes).toEqual([]);
    expect(fixKindWords("Open the full PLL pack.", CATALOGUE).text).toBe("Open the full PLL set.");
  });

  it("leaves a right kind word, a name with a kind in it, and a lone word alone", () => {
    for (const text of [
      "Start with the cross-for-f2l pack.",
      "Use the f2l-case-audit drill.",
      "Retake the F2L test this week.",
      "Retake the Cross test.",
      "A lookahead lesson helps.",
      "Do the pack for lookahead.",
      "Take the last-pair-ls-oll drill.",
      "Open the cross-for-f2l-extra lesson.",
    ]) {
      expect(fixKindWords(text, CATALOGUE)).toEqual({ text, fixes: [] });
    }
  });

  it("leaves a verb alone: drilling or testing a topic is not naming a drill or a test", () => {
    for (const text of [
      "Drill pair recognition for ten minutes a day.",
      "Then test cross efficiency by timing five solves.",
      "Set practice plan reminders weekly.",
    ]) {
      expect(fixKindWords(text, CATALOGUE)).toEqual({ text, fixes: [] });
    }
    expect(fixKindWords("Try the drill pair recognition.", CATALOGUE).text).toBe(
      "Try the pack pair recognition.",
    );
  });

  it("keeps a capital letter", () => {
    expect(fixKindWords("Lesson cross-for-f2l is next.", CATALOGUE).text).toBe(
      "Pack cross-for-f2l is next.",
    );
  });
});

describe("leaveAloneSets", () => {
  it("reads the sets a level's not-yet list names, and skips what it allows", () => {
    expect(leaveAloneSets(["COLL, Winter Variation and ZBLL."])).toEqual([
      "zbll",
      "coll",
      "winter-variation",
    ]);
    expect(leaveAloneSets(["Full OLL and PLL. Learn the 2-look versions here."])).toEqual([
      "oll",
      "pll",
    ]);
    expect(leaveAloneSets(["Chasing personal bests.", "Practising only full solves."])).toEqual([]);
    expect(leaveAloneSets(["Big algorithm sets beyond full OLL and PLL."])).toEqual([]);
  });

  it("reads real levels", () => {
    const level = currentLevel(14000, "sub12")?.level;
    expect(level).toBeDefined();
    expect(leaveAloneSets(level!.notYet.map((item) => item.split(/[.!?](?:\s|$)/)[0]!))).toContain(
      "zbll",
    );
  });
});

describe("guardAdvice", () => {
  const known = {
    knownSets: ["pll", "two-look-pll", "oll", "two-look-oll"],
    leaveAloneSets: ["zbll"],
  };

  it("replaces advice to learn what they already know", () => {
    const result = guardAdvice(
      "You should focus on Full OLL because your data shows it. Your OLL execution time is slower than the goal, so mastering all 57 algorithms is next. Use the pair pack.",
      known,
    );
    expect(result.text).toBe(
      "You already know full OLL, so there is nothing new to learn there. Use the pair pack.",
    );
    expect(result.removed).toEqual(["known: oll", "known: oll"]);
  });

  it("replaces advice to learn what the level says to leave alone", () => {
    const result = guardAdvice("Yes, you should learn ZBLL now.", known);
    expect(result.text).toBe("ZBLL can wait at your level.");
    expect(result.removed).toEqual(["leave alone: zbll"]);
  });

  it("leaves a mention, a no, and a putting off alone", () => {
    for (const text of [
      "You already know full OLL, so skip learning it.",
      "No need to learn full PLL: you have all 21.",
      "Don't start ZBLL yet.",
      "Learn ZBLL once your F2L is under six seconds.",
      "Learning ZBLL adds complexity when you need speed.",
      "Your OLL algorithms are fast, so keep using full OLL as it is.",
      "Open the Gb perm in the PLL set.",
      "When should I learn full OLL?",
    ]) {
      expect(guardAdvice(text, known)).toEqual({ text, removed: [] });
    }
  });

  it("leaves advice that only says what they know, whichever way round it is worded", () => {
    for (const text of [
      "Focus on lookahead, since you already know full OLL.",
      "Work on pair recognition now that you know full PLL.",
      "Start with pair recognition, you know all 57 OLLs.",
      "Try the lookahead pack, as you have full OLL already.",
    ]) {
      expect(guardAdvice(text, known)).toEqual({ text, removed: [] });
    }
  });

  it("leaves advice to use what they know, with the set named before or after the verb", () => {
    for (const text of [
      "Focus on using the two-look OLL and PLL sets you already know well.",
      "Work on using full PLL more smoothly.",
      "Focus on the full OLL algorithms you have already learned.",
      "Work on full OLL execution speed.",
    ]) {
      expect(guardAdvice(text, known)).toEqual({ text, removed: [] });
    }
    // For a set to leave alone, using it is the advice to refuse.
    expect(guardAdvice("Start using ZBLL.", known).removed).toEqual(["leave alone: zbll"]);
  });

  it("catches advice worded without a learn verb", () => {
    for (const text of [
      "I recommend full OLL.",
      "Your next step is full PLL.",
      "Full OLL is the next thing for you.",
      "Learn the full set of OLL algorithms.",
      "Learn every OLL case.",
      "No problem, learn full OLL next.",
    ]) {
      expect(guardAdvice(text, known).removed).toHaveLength(1);
    }
  });

  it("does not treat 2-look as full, nor full as 2-look knowledge it lacks", () => {
    const twoLook = { knownSets: ["two-look-pll"], leaveAloneSets: [] };
    expect(guardAdvice("You should learn full PLL next.", twoLook).removed).toEqual([]);
    expect(guardAdvice("You should learn 2-look PLL next.", twoLook).removed).toEqual([
      "known: two-look-pll",
    ]);
  });
});

describe("refSlips", () => {
  const facts = { knownSets: ["pll", "oll"], leaveAloneSets: ["zbll", "coll"] };

  it("drops what teaches a known set, but keeps its page in the bank", () => {
    const result = refSlips(
      [
        { kind: "pack", id: "oll-algorithms" },
        { kind: "set", id: "pll" },
        { kind: "pack", id: "pll-algorithms" },
        { kind: "pack", id: "cross-for-f2l" },
      ],
      facts,
    );
    expect(result.kept.map((ref) => ref.id)).toEqual(["pll", "cross-for-f2l"]);
    expect(result.removed).toEqual(["known: oll-algorithms", "known: pll-algorithms"]);
  });

  it("drops a leave-alone set unless their question named it", () => {
    const refs = [
      { kind: "set", id: "zbll" },
      { kind: "set", id: "coll" },
    ];
    expect(refSlips(refs, facts).kept).toEqual([]);
    expect(refSlips(refs, facts, "Should I learn ZBLL?").kept).toEqual([refs[0]]);
  });
});

describe("guardText", () => {
  it("runs advice, numbers and kind words together", () => {
    const result = guardText(
      "You already know it. Use the first-lookahead lesson. Aim for 0.9 s on your cross.",
      CATALOGUE,
      check(),
    );
    expect(result.text).toBe("You already know it. Use the first-lookahead pack.");
    expect(result.ungrounded).toEqual(["0.9 s"]);
    expect(result.kindFixes).toEqual(["lesson → pack: first-lookahead"]);
    expect(result.badAdvice).toEqual([]);
  });

  it("never shows the catalogue's [kind] tag a model copied into its prose", () => {
    const result = guardText(
      "Use pack cross-into-f2l [pack] first, then take test f2l_only [test] and drill f2l-case-audit [Drill].",
      CATALOGUE,
      check(),
    );
    expect(result.text).toBe(
      "Use pack cross-into-f2l first, then take test f2l_only and drill f2l-case-audit.",
    );
    expect(result.kindFixes).toEqual([]);
  });

  it("builds the check from a conversation", () => {
    const built = replyCheck(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: "I am at 13.5 s" },
        { role: "assistant", content: "answer with 99.9 s" },
      ],
      { knownSets: ["pll"], leaveAloneSets: [] },
    );
    expect(built.said).toEqual(["I am at 13.5 s"]);
    expect(built.system).toBe(SYSTEM);
  });
});
