import { describe, expect, it } from "vitest";
import { ALGORITHM_SETS } from "@/lib/algorithms/catalog";
import { coachCatalogue } from "@/lib/coach-chat/context";
import { NOTHING_LEFT, type ReplyCheck } from "@/lib/coach-chat/guards";
import {
  ALGORITHM_REMOVED,
  COACH_REPLY_SCHEMA,
  guardAlgorithms,
  parseCoachReply,
  partialAnswer,
} from "@/lib/coach-chat/reply";

const catalogue = coachCatalogue();
const parse = (raw: string) => parseCoachReply(raw, catalogue);

const GOOD = JSON.stringify({
  answer: "Your lookahead loses about 1.9 s. Do slow solves this week.",
  refs: [
    { kind: "pack", id: "lookahead" },
    { kind: "test", id: "cross_f2l" },
  ],
  followUps: ["How long should a slow solve take?", "What is a good pair speed?"],
});

/** A real algorithm from the bank. */
const bankAlgorithm = ALGORITHM_SETS.find((set) => set.id === "pll")!.cases[0]!.algorithms[0]!
  .moves;

describe("an id copied with its kind", () => {
  it("resolves 'cross-for-f2l [pack]' to the id", () => {
    const { reply, unknownIds } = parse(
      JSON.stringify({
        answer: "x",
        refs: [{ kind: "pack", id: "cross-for-f2l [pack]" }],
        followUps: [],
      }),
    );
    expect(unknownIds).toEqual([]);
    expect(reply.refs).toEqual([{ kind: "pack", id: "cross-for-f2l" }]);
  });
});

describe("a well-formed reply", () => {
  it("comes through as it is", () => {
    const { reply, dropped, structured } = parse(GOOD);
    expect(structured).toBe(true);
    expect(dropped).toEqual([]);
    expect(reply).toEqual({
      answer: "Your lookahead loses about 1.9 s. Do slow solves this week.",
      refs: [
        { kind: "pack", id: "lookahead" },
        { kind: "test", id: "cross_f2l" },
      ],
      followUps: ["How long should a slow solve take?", "What is a good pair speed?"],
    });
  });

  it("copes with a code fence, a thinking block and a lead-in", () => {
    expect(parse("<think>hmm</think>\n```json\n" + GOOD + "\n```").reply.refs).toHaveLength(2);
    expect(parse("Here you go: " + GOOD).reply.answer).toMatch(/^Your lookahead/);
  });

  it("asks Ollama for the same shape, answer first", () => {
    expect(Object.keys(COACH_REPLY_SCHEMA.properties)[0]).toBe("answer");
    expect(COACH_REPLY_SCHEMA.properties.refs.items.properties.kind.enum).toEqual([
      "pack",
      "test",
      "unit",
      "drill",
      "lesson",
      "set",
    ]);
  });
});

describe("checking ids against the catalogue", () => {
  it("drops an id SolveLab doesn't have, and reports it", () => {
    const result = parse(
      JSON.stringify({
        answer: "Try this.",
        refs: [
          { kind: "pack", id: "speed-blitz" },
          { kind: "pack", id: "lookahead" },
        ],
        followUps: [],
      }),
    );
    expect(result.reply.refs).toEqual([{ kind: "pack", id: "lookahead" }]);
    expect(result.unknownIds).toEqual(["speed-blitz"]);
    expect(result.dropped).toEqual(["speed-blitz"]);
  });

  it("corrects a real id under the wrong kind", () => {
    const { reply, dropped } = parse(
      JSON.stringify({ answer: "x", refs: [{ kind: "pack", id: "cross_only" }], followUps: [] }),
    );
    expect(reply.refs).toEqual([{ kind: "test", id: "cross_only" }]);
    expect(dropped).toEqual([]);
  });

  it("keeps the kind that fits when a pack and a set share an id", () => {
    const refs = (kind: string) =>
      parse(JSON.stringify({ answer: "x", refs: [{ kind, id: "two-look-oll" }], followUps: [] }))
        .reply.refs;
    expect(refs("set")).toEqual([{ kind: "set", id: "two-look-oll" }]);
    expect(refs("pack")).toEqual([{ kind: "pack", id: "two-look-oll" }]);
  });

  it("accepts a title or a bare string for a real thing, but not a made-up one", () => {
    const { reply, unknownIds } = parse(
      JSON.stringify({
        answer: "x",
        refs: ["Lookahead, properly", { kind: "drill", id: "The slow solve" }, "Finger Gym"],
        followUps: [],
      }),
    );
    expect(reply.refs).toEqual([
      { kind: "pack", id: "lookahead" },
      { kind: "drill", id: "lookahead-slow-solve" },
    ]);
    expect(unknownIds).toEqual(["Finger Gym"]);
  });

  it("reads a title written like an id, when only one thing has that title", () => {
    const { reply, unknownIds } = parse(
      JSON.stringify({
        answer: "x",
        refs: ["blind-pair", { kind: "drill", id: "call-the-last-turn" }, "Finger-Gym"],
        followUps: [],
      }),
    );
    expect(reply.refs).toEqual([{ kind: "drill", id: "lookahead-blind-pair" }]);
    // Two drills share the title "Call the last turn", so which one is meant is not known.
    expect(unknownIds).toEqual(["call-the-last-turn", "Finger-Gym"]);
  });

  it("reads an id the model copied together with its title, but only a real one", () => {
    const { reply, unknownIds } = parse(
      JSON.stringify({
        answer: "x",
        refs: [
          { kind: "pack", id: "lookahead: Lookahead, properly" },
          { kind: "test", id: "- cross_only: Cross test" },
          { kind: "pack", id: "finger-gym: Fast fingers" },
        ],
        followUps: [],
      }),
    );
    expect(reply.refs).toEqual([
      { kind: "pack", id: "lookahead" },
      { kind: "test", id: "cross_only" },
    ]);
    expect(unknownIds).toEqual(["finger-gym: Fast fingers"]);
  });

  it("keeps each ref once and at most three", () => {
    const ids = ["lookahead", "lookahead", "inspection", "consistency", "practice-plan"];
    const { reply } = parse(
      JSON.stringify({ answer: "x", refs: ids.map((id) => ({ kind: "pack", id })), followUps: [] }),
    );
    expect(reply.refs.map((ref) => ref.id)).toEqual(["lookahead", "inspection", "consistency"]);
  });

  it("trims, dedupes and caps the follow-ups, and ignores non-strings", () => {
    const { reply } = parse(
      JSON.stringify({ answer: "x", refs: [], followUps: [" a ", "a", 5, "", "b", "c", "d"] }),
    );
    expect(reply.followUps).toEqual(["a", "b", "c"]);
  });
});

describe("a reply cut off or malformed", () => {
  it("keeps the answer when the length cap cut it mid-sentence", () => {
    const { reply, structured } = parse(
      '{"answer": "Your lookahead loses about 1.9 s. Do slow sol',
    );
    expect(structured).toBe(true);
    expect(reply.answer).toBe("Your lookahead loses about 1.9 s. Do slow sol");
    expect(reply.refs).toEqual([]);
  });

  it("keeps the refs that finished when it was cut inside the next one", () => {
    const { reply, dropped } = parse(
      '{"answer": "Do slow solves.", "refs": [{"kind": "pack", "id": "lookahead"}, {"kind": "pack", "id": "insp',
    );
    expect(reply.refs).toEqual([{ kind: "pack", id: "lookahead" }]);
    expect(dropped).toEqual([]);
  });

  it("reads a string with a literal newline and escapes", () => {
    const { reply } = parse(
      '{"answer": "Line one\nLine \\"two\\" \\u00e9", "refs": [], "followUps": []}',
    );
    expect(reply.answer).toBe('Line one\nLine "two" é');
  });

  it("shows plain text when the reply isn't JSON, still checked", () => {
    const result = parse("Try the \"Cross Mastery\" pack. Then do R U R' F R F' U2 R' F R.");
    expect(result.structured).toBe(false);
    expect(result.reply.refs).toEqual([]);
    expect(result.unknownNames).toEqual(["Cross Mastery"]);
    expect(result.reply.answer).toContain(ALGORITHM_REMOVED);
    expect(result.invented).toHaveLength(1);
  });

  it("keeps a __proto__ key from reaching the reply", () => {
    const result = parse('{"__proto__": {"answer": "from the prototype"}, "refs": []}');
    expect(result.structured).toBe(false);
    expect(result.reply.answer).not.toBe("from the prototype");
    expect(({} as { answer?: string }).answer).toBeUndefined();
  });

  it("falls back to the raw text for broken JSON or JSON without an answer", () => {
    expect(parse('{"answer": nope}').reply.answer).toBe('{"answer": nope}');
    expect(parse('{"text": "hi"}').structured).toBe(false);
    expect(parse("").reply).toEqual({ answer: "", refs: [], followUps: [] });
  });
});

describe("streaming: the answer so far", () => {
  it("never throws, and every step is the start of the final answer", () => {
    const final = partialAnswer(GOOD);
    expect(final).toBe("Your lookahead loses about 1.9 s. Do slow solves this week.");
    for (let end = 0; end <= GOOD.length; end++) {
      expect(final.startsWith(partialAnswer(GOOD.slice(0, end)))).toBe(true);
    }
  });

  it("shows nothing of the JSON scaffolding", () => {
    expect(partialAnswer('{"ans')).toBe("");
    expect(partialAnswer('{"answer": "Hel')).toBe("Hel");
    expect(partialAnswer('{"answer": "Hi \\')).toBe("Hi ");
    expect(partialAnswer('{"answer": "Hi", "refs": [{"kind": "pa')).toBe("Hi");
  });

  it("passes text that isn't JSON straight through", () => {
    expect(partialAnswer("Work on lookahead.")).toBe("Work on lookahead.");
  });

  it("never shows an invented algorithm, even on the way to the final answer", () => {
    const raw = JSON.stringify({
      answer: "Try F R U2 L D' B2 R now, then rest.",
      refs: [],
      followUps: [],
    });
    for (let end = 0; end <= raw.length; end++) {
      expect(partialAnswer(raw.slice(0, end))).not.toMatch(/F R U2 L/);
    }
    expect(partialAnswer(raw)).toBe(`Try ${ALGORITHM_REMOVED} now, then rest.`);
    expect(partialAnswer("Do F R U2 L D' B2 R now")).toBe(`Do ${ALGORITHM_REMOVED} now`);
  });
});

describe("the algorithm guard", () => {
  const guard = (text: string) => guardAlgorithms(text);

  it("lets an algorithm from the bank through, however it is written", () => {
    for (const text of [
      bankAlgorithm,
      `(${bankAlgorithm})`,
      `**${bankAlgorithm}**.`,
      `\`${bankAlgorithm}\``,
    ]) {
      expect(guard(`Use ${text} here`).invented).toEqual([]);
    }
    expect(guard(`Use ${bankAlgorithm.replace(/'/g, "’")} here`).invented).toEqual([]);
  });

  it("lets through every algorithm of every set in the bank", () => {
    const missed = ALGORITHM_SETS.flatMap((set) =>
      set.cases.flatMap((entry) =>
        entry.algorithms.filter((algorithm) => guard(algorithm.moves).invented.length > 0),
      ),
    );
    expect(missed).toEqual([]);
  });

  it("lets through a sequence SolveLab's own lessons write out in their text", () => {
    expect(guard("Compare R U R' L U' L' with the bank.").invented).toEqual([]);
  });

  it("lets through a set-up turn or an adjustment at either end, and a known trigger repeated", () => {
    expect(guard(`y ${bankAlgorithm} U2`).invented).toEqual([]);
    expect(
      guard("Do R U R' U' six times: R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' R U R' U'.")
        .invented,
    ).toEqual([]);
  });

  it("removes an invented algorithm and says so", () => {
    const result = guard("For this case do R U2 R' D R U' R' D' R U R, then continue.");
    expect(result.invented).toEqual(["R U2 R' D R U' R' D' R U R"]);
    expect(result.text).toBe(`For this case do ${ALGORITHM_REMOVED}, then continue.`);
  });

  it("reads moves written without spaces, and still passes a bank algorithm written that way", () => {
    const result = guard("It is FRU2L'D'B2RUL'D every time.");
    expect(result.invented).toEqual(["FRU2L'D'B2RUL'D"]);
    expect(result.text).toBe(`It is ${ALGORITHM_REMOVED} every time.`);
    expect(guard(`Use ${bankAlgorithm.replace(/ /g, "")} here`).invented).toEqual([]);
  });

  it("reads moves joined by hyphens or arrows, and primes written as U+2032", () => {
    const invented = ["R-U2-R'-D-R-U'-R'-D'-R-U-R", "R→U2→R'→D→R→U'→R'→D'→R→U→R"];
    for (const moves of invented) {
      expect(guard(`Do ${moves} now`)).toEqual({
        text: `Do ${ALGORITHM_REMOVED} now`,
        invented: [moves],
      });
    }
    const spelled = "R U2 R' D R U' R' D' R U R";
    expect(guard(`Do ${spelled.replace(/ /g, " → ")} now`).invented).toHaveLength(1);
    expect(guard(`Do ${spelled.replace(/ /g, " - ")} now`).invented).toHaveLength(1);
    expect(guard("Do FRU2L′D′B2RUL′D now").invented).toEqual(["FRU2L′D′B2RUL′D"]);
    expect(guard("Do R2'U2'F2'D2'B2'L2' now").invented).toEqual(["R2'U2'F2'D2'B2'L2'"]);
    // A bank algorithm written that way still passes, and ordinary hyphenated words are not moves.
    expect(guard(`Use ${bankAlgorithm.replace(/ /g, "-")} here`).invented).toEqual([]);
    const words = "The U-perm, F2L-style, x-axis, R-U and plan-B work is a D-day thing.";
    expect(guard(words)).toEqual({ text: words, invented: [] });
  });

  it("removes two separate inventions", () => {
    const result = guard("A: F R U2 L D' B2 R. B: L2 B D' F U2 R'.");
    expect(result.invented).toHaveLength(2);
    expect(result.text).not.toMatch(/F R U2|L2 B D/);
  });

  it("ignores talk of faces, stages and short turns", () => {
    const text = "Plan B: do F2L, then OLL. Turn U or R, then D. Do R U R' next, and x y z.";
    expect(guard(text)).toEqual({ text, invented: [] });
  });

  it("does not treat a list of faces split by commas as a sequence", () => {
    const text = "The faces are U, D, L, R, F and B.";
    expect(guard(text).invented).toEqual([]);
  });

  it("is applied to the answer and the follow-ups of a parsed reply", () => {
    const { reply, invented, dropped } = parse(
      JSON.stringify({
        answer: "Try F R U2 L D' B2 R now.",
        refs: [],
        followUps: ["Is L2 B D' F U2 R' faster?"],
      }),
    );
    expect(invented).toHaveLength(2);
    expect(reply.answer).toBe(`Try ${ALGORITHM_REMOVED} now.`);
    expect(reply.followUps).toEqual([`Is ${ALGORITHM_REMOVED} faster?`]);
    expect(dropped).toEqual(invented);
  });
});

describe("the number, kind-word and advice guards", () => {
  const check: ReplyCheck = {
    system: [
      "- Pair speed: 1.33 s (likely 1.18–1.48 s; 10 attempts), goal under 1.20 s, pace SLOW (clearly behind the goal)",
      "- Lookahead: 0.94 s (likely 0.76–1.12 s; 10 attempts), goal under 0.85 s, pace average (close to the goal)",
    ].join("\n"),
    said: ["What should I learn next: full OLL or COLL?"],
    knownSets: ["oll", "two-look-oll", "pll", "two-look-pll"],
    leaveAloneSets: ["zbll"],
  };
  const guarded = (
    answer: string,
    refs: { kind: string; id: string }[] = [],
    followUps: string[] = [],
  ) => parseCoachReply(JSON.stringify({ answer, refs, followUps }), catalogue, check);

  it("changes nothing without a check, and keeps the unguarded reply as it was", () => {
    const raw = JSON.stringify({
      answer: "Aim for 0.6 s. Add the first-lookahead lesson.",
      refs: [],
      followUps: [],
    });
    const result = parseCoachReply(raw, catalogue);
    expect(result.reply.answer).toBe("Aim for 0.6 s. Add the first-lookahead lesson.");
    expect(result.unguarded).toEqual(result.reply);
    expect(result.ungrounded).toEqual([]);
  });

  it("removes a number nothing backs up, and reports it", () => {
    const result = guarded(
      "Your pair speed is 1.33 s. Aim for 0.6 s by Friday. Do ten pair drills.",
    );
    expect(result.reply.answer).toBe("Your pair speed is 1.33 s. Do ten pair drills.");
    expect(result.unguarded.answer).toContain("0.6 s");
    expect(result.ungrounded).toEqual(["0.6 s"]);
    expect(result.dropped).toContain("number 0.6 s");
  });

  it("drops a follow-up built on a made-up number, and keeps the others", () => {
    const result = guarded(
      "Work on pair speed.",
      [],
      ["Can I reach 0.4 s lookahead?", "How do I find the next pair?"],
    );
    expect(result.reply.followUps).toEqual(["How do I find the next pair?"]);
  });

  it("corrects a kind word", () => {
    const result = guarded(
      "Start with the cross-for-f2l pack, then add the first-lookahead lesson.",
    );
    expect(result.reply.answer).toBe(
      "Start with the cross-for-f2l pack, then add the first-lookahead pack.",
    );
    expect(result.kindFixes).toEqual(["lesson → pack: first-lookahead"]);
    expect(result.dropped).toContain("kind word lesson → pack: first-lookahead");
  });

  it("replaces advice to learn a set they know, and drops the pack that teaches it", () => {
    const result = guarded("You should focus on Full OLL because it is next. Use the pair pack.", [
      { kind: "pack", id: "oll-algorithms" },
      { kind: "set", id: "coll" },
    ]);
    expect(result.reply.answer).toBe(
      "You already know full OLL, so there is nothing new to learn there. Use the pair pack.",
    );
    expect(result.reply.refs).toEqual([{ kind: "set", id: "coll" }]);
    expect(result.badAdvice).toEqual(["known: oll", "known: oll-algorithms"]);
  });

  it("drops a leave-alone set from the refs unless they asked about it", () => {
    const refs = [{ kind: "set", id: "zbll" }];
    expect(guarded("Skip it for now.", refs).reply.refs).toEqual([]);
    const asked = parseCoachReply(
      JSON.stringify({ answer: "Skip it for now.", refs, followUps: [] }),
      catalogue,
      { ...check, said: ["Should I learn ZBLL?"] },
    );
    expect(asked.reply.refs).toEqual(refs);
  });

  it("says so when no sentence of the answer survives, and not for an empty answer", () => {
    expect(guarded("Aim for 0.6 s on pair speed.").reply.answer).toBe(NOTHING_LEFT);
    expect(guarded("").reply.answer).toBe("");
  });

  it("still guards algorithms first, and applies to a reply that is not JSON", () => {
    const result = parseCoachReply("Do F R U2 L D' B2 R in 0.6 s. Then rest.", catalogue, check);
    expect(result.structured).toBe(false);
    expect(result.invented).toHaveLength(1);
    expect(result.reply.answer).toBe("Then rest.");
  });

  it("streams whole sentences only, each already guarded", () => {
    const raw = '{"answer": "Your pair speed is 1.33 s. Aim for 0.6 s by Friday. Do ten pair dri';
    expect(partialAnswer(raw, { catalogue, check })).toBe("Your pair speed is 1.33 s.");
    expect(partialAnswer('{"answer": "Your pair speed is 1.', { catalogue, check })).toBe("");
    expect(partialAnswer(raw)).toContain("0.6 s");
  });
});
