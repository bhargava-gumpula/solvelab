import { describe, expect, it } from "vitest";
import { ALGORITHM_SETS } from "@/lib/algorithms/catalog";
import { coachCatalogue } from "@/lib/coach-chat/context";
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
