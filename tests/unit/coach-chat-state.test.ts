import { afterEach, describe, expect, it, vi } from "vitest";
import { askCoach } from "@/lib/coach-chat/ask";
import {
  chatReducer,
  chatTitle,
  initialChat,
  MAX_HISTORY_MESSAGES,
  MAX_QUESTION_CHARS,
  toModelMessages,
  type ChatAction,
  type ChatState,
} from "@/lib/coach-chat/chat-state";
import { coachCatalogue } from "@/lib/coach-chat/context";
import { refLink, refLinks } from "@/lib/coach-chat/links";
import { readiness, versionAtLeast } from "@/lib/coach-chat/readiness";
import { starterHref, starterQuestion } from "@/lib/coach-chat/starters";
import type { CoachChatMessage } from "@/types/domain";

const run = (state: ChatState, ...actions: ChatAction[]) =>
  actions.reduce((current, action) => chatReducer(current, action), state);

const start = initialChat("chat-1");
const asked = run(start, { type: "send", text: "  Why is my cross slow?  " });

describe("the chat state machine", () => {
  it("adds the question and an empty reply, and starts streaming", () => {
    expect(asked.phase).toBe("streaming");
    expect(asked.messages).toEqual([
      { role: "user", content: "Why is my cross slow?" },
      { role: "assistant", content: "" },
    ]);
  });

  it("ignores an empty question, and a second question while one reply is coming", () => {
    expect(chatReducer(start, { type: "send", text: "   " })).toBe(start);
    expect(chatReducer(asked, { type: "send", text: "And F2L?" })).toBe(asked);
  });

  it("cuts a very long question to the limit", () => {
    const long = chatReducer(start, { type: "send", text: "x".repeat(MAX_QUESTION_CHARS + 50) });
    expect(long.messages[0]!.content).toHaveLength(MAX_QUESTION_CHARS);
  });

  it("builds the reply from chunks and settles on done", () => {
    const done = run(
      asked,
      { type: "chunk", text: '{"answer":"Plan' },
      { type: "chunk", text: ' ahead."}' },
      { type: "done" },
    );
    expect(done.phase).toBe("idle");
    expect(done.messages[1]).toEqual({ role: "assistant", content: '{"answer":"Plan ahead."}' });
  });

  it("only takes chunks, done and stop while streaming", () => {
    expect(chatReducer(start, { type: "chunk", text: "x" })).toBe(start);
    expect(chatReducer(start, { type: "done" })).toBe(start);
    expect(chatReducer(start, { type: "stop" })).toBe(start);
    expect(chatReducer(start, { type: "fail", error: { code: "server", message: "x" } })).toBe(
      start,
    );
  });

  it("keeps what came before Stop and marks it stopped", () => {
    const stopped = run(asked, { type: "chunk", text: '{"answer":"Plan' }, { type: "stop" });
    expect(stopped.phase).toBe("idle");
    expect(stopped.messages[1]).toEqual({
      role: "assistant",
      content: '{"answer":"Plan',
      stopped: true,
    });
  });

  it("leaves no empty reply behind when Stop comes before any text", () => {
    const stopped = run(asked, { type: "stop" });
    expect(stopped.phase).toBe("idle");
    expect(stopped.messages).toEqual([{ role: "user", content: "Why is my cross slow?" }]);
  });

  it("drops a reply cut off by an error, keeps the question, and tries again", () => {
    const failed = run(
      asked,
      { type: "chunk", text: "half a rep" },
      { type: "fail", error: { code: "not-running", message: "gone" } },
    );
    expect(failed.phase).toBe("error");
    expect(failed.error).toEqual({ code: "not-running", message: "gone" });
    expect(failed.messages).toEqual([{ role: "user", content: "Why is my cross slow?" }]);
    const again = chatReducer(failed, { type: "retry" });
    expect(again.phase).toBe("streaming");
    expect(again.error).toBeNull();
    expect(again.messages).toHaveLength(2);
    // Retry only follows an error.
    expect(chatReducer(asked, { type: "retry" })).toBe(asked);
  });

  it("a new question after an error clears the error", () => {
    const failed = run(asked, { type: "fail", error: { code: "server", message: "x" } });
    const next = chatReducer(failed, { type: "send", text: "Hello?" });
    expect(next.phase).toBe("streaming");
    expect(next.error).toBeNull();
  });

  it("opens a saved chat or a new one", () => {
    const messages: CoachChatMessage[] = [{ role: "user", content: "Hi" }];
    const opened = chatReducer(asked, { type: "open", chatId: "old", messages });
    expect(opened).toEqual({ chatId: "old", messages, phase: "idle", error: null });
    expect(chatReducer(asked, { type: "open", chatId: "new" }).messages).toEqual([]);
  });
});

describe("what goes back to the model", () => {
  const reply = (content: string, stopped?: boolean): CoachChatMessage => ({
    role: "assistant",
    content,
    ...(stopped ? { stopped } : {}),
  });

  it("is the system message, then the conversation, with the raw reply as it came", () => {
    const raw = '{"answer":"Plan ahead.","refs":[],"followUps":[]}';
    const sent = toModelMessages("SYS", [{ role: "user", content: "Q1" }, reply(raw)]);
    expect(sent).toEqual([
      { role: "system", content: "SYS" },
      { role: "user", content: "Q1" },
      { role: "assistant", content: raw },
    ]);
  });

  it("leaves out a stopped reply and the empty one being written", () => {
    const sent = toModelMessages("SYS", [
      { role: "user", content: "Q1" },
      reply('{"answer":"Pla', true),
      { role: "user", content: "Q2" },
      reply(""),
    ]);
    expect(sent.map((message) => message.content)).toEqual(["SYS", "Q1", "Q2"]);
  });

  it("sends only the latest messages, and always the system message", () => {
    const many: CoachChatMessage[] = Array.from({ length: 40 }, (_, index) =>
      index % 2 ? reply(`a${index}`) : { role: "user", content: `q${index}` },
    );
    const sent = toModelMessages("SYS", many);
    expect(sent).toHaveLength(MAX_HISTORY_MESSAGES + 1);
    expect(sent[0]).toEqual({ role: "system", content: "SYS" });
    expect(sent.at(-1)!.content).toBe("a39");
  });

  it("titles a chat with its first question, shortened", () => {
    expect(chatTitle([{ role: "user", content: "Why is my cross slow?" }])).toBe(
      "Why is my cross slow?",
    );
    expect(chatTitle([{ role: "user", content: "x".repeat(100) }])).toHaveLength(60);
    expect(chatTitle([])).toBe("New chat");
  });
});

describe("can the chat run", () => {
  const status = { running: true, version: "0.18.0", models: ["qwen3.5:4b"] };

  it("names what is missing, in order", () => {
    expect(readiness({ running: false, models: [] })).toBe("not-running");
    expect(readiness({ ...status, version: "0.17.4" })).toBe("old-version");
    expect(readiness({ ...status, models: ["llama3:latest"] })).toBe("model-missing");
    expect(readiness(status)).toBe("ready");
    expect(readiness({ ...status, models: ["qwen3.5:4b-q4_K_M"] })).toBe("model-missing");
    expect(readiness({ ...status, models: ["qwen3.5:4b-q4_K_M"] }, "qwen3.5:4b-q4_K_M")).toBe(
      "ready",
    );
  });

  it("compares versions, and does not block one it cannot read", () => {
    expect(versionAtLeast("0.17.5")).toBe(true);
    expect(versionAtLeast("0.17.4")).toBe(false);
    expect(versionAtLeast("0.9.9")).toBe(false);
    expect(versionAtLeast("1.0.0")).toBe(true);
    expect(versionAtLeast("0.40.0-rc2")).toBe(true);
    expect(versionAtLeast(undefined)).toBe(true);
    expect(versionAtLeast("weird")).toBe(true);
    expect(versionAtLeast("0.0.0")).toBe(true); // a source build, as in the setup screen
  });
});

describe("links in a reply", () => {
  it("map real ids to real pages, with the catalogue's titles", () => {
    expect(refLink({ kind: "pack", id: "lookahead" })).toEqual({
      title: coachCatalogue().find((entry) => entry.id === "lookahead")!.title,
      href: "/hub/unit/lookahead/",
    });
    expect(refLink({ kind: "test", id: "cross_f2l" })?.href).toBe("/coach/tests/cross_f2l/");
    expect(refLink({ kind: "set", id: "pll" })?.href).toBe("/algorithms/pll/");
    const drill = coachCatalogue().find((entry) => entry.kind === "drill")!;
    expect(refLink({ kind: "drill", id: drill.id })?.href).toMatch(/^\/hub\/drill\/.+\/.+\/$/);
    const lesson = coachCatalogue().find((entry) => entry.kind === "lesson")!;
    expect(refLink({ kind: "lesson", id: lesson.id })?.href).toMatch(/^\/hub\/lesson\/.+\/.+\/$/);
    const unit = coachCatalogue().find((entry) => entry.kind === "unit")!;
    expect(refLink({ kind: "unit", id: unit.id })?.href).toBe(`/hub/unit/${unit.id}/`);
  });

  it("drop an id the catalogue does not have, and an id under the wrong kind", () => {
    expect(refLink({ kind: "pack", id: "no-such-pack" })).toBeNull();
    expect(refLink({ kind: "test", id: "lookahead" })).toBeNull();
    expect(
      refLinks([
        { kind: "pack", id: "made-up" },
        { kind: "pack", id: "lookahead" },
      ]),
    ).toHaveLength(1);
  });

  it("every drill and lesson in the catalogue has a page", () => {
    for (const entry of coachCatalogue()) {
      expect(refLink({ kind: entry.kind as "pack", id: entry.id }), entry.id).not.toBeNull();
    }
  });
});

describe("starter questions", () => {
  it("open the chat with a question from a short key, and put nothing about the person in the address", () => {
    expect(starterHref({ key: "profile" })).toBe("/hub/ask/?starter=profile");
    expect(starterHref({ key: "test", testId: "cross_f2l" })).toBe(
      "/hub/ask/?starter=test&test=cross_f2l",
    );
    expect(starterQuestion("profile", null)).toMatch(/solve profile/);
    expect(starterQuestion("test", "cross_f2l")).toMatch(/Cross \+ F2L test/);
  });

  it("ignore a key or test that is not ours", () => {
    expect(starterQuestion(null, null)).toBeNull();
    expect(starterQuestion("anything else", null)).toBeNull();
    expect(starterQuestion("test", null)).toBeNull();
    expect(starterQuestion("test", "<script>")).toBeNull();
  });
});

describe("asking the model", () => {
  afterEach(() => vi.unstubAllGlobals());

  const body = (...lines: object[]) =>
    new Response(lines.map((line) => JSON.stringify(line) + "\n").join(""), { status: 200 });
  const chunk = (content: string, done = false) => ({ message: { content }, done });

  it("sends the system message and history with the reply format, and returns the whole reply", async () => {
    const fetchMock = vi.fn(async () => body(chunk('{"answer":"Hi"'), chunk("}", true)));
    vi.stubGlobal("fetch", fetchMock);
    const pieces: string[] = [];
    const result = await askCoach({
      system: "SYS",
      messages: [{ role: "user", content: "Q" }],
      model: "qwen3.5:4b",
      signal: new AbortController().signal,
      onText: (piece) => pieces.push(piece),
    });
    expect(result).toEqual({ ok: true, raw: '{"answer":"Hi"}', stopped: false, cut: false });
    expect(pieces).toEqual(['{"answer":"Hi"', "}"]);
    const sent = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(sent.messages).toEqual([
      { role: "system", content: "SYS" },
      { role: "user", content: "Q" },
    ]);
    expect(sent.format.required).toEqual(["answer", "refs", "followUps"]);
    expect(sent.think).toBe(false);
  });

  it("reports a stopped reply, not an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("aborted", "AbortError");
      }),
    );
    const controller = new AbortController();
    controller.abort();
    const result = await askCoach({
      system: "S",
      messages: [{ role: "user", content: "Q" }],
      model: "m",
      signal: controller.signal,
      onText: () => {},
    });
    expect(result).toEqual({ ok: true, raw: "", stopped: true, cut: false });
  });

  it("returns Ollama's problem as a result, never a throw", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("fetch failed"))),
    );
    const result = await askCoach({
      system: "S",
      messages: [{ role: "user", content: "Q" }],
      model: "m",
      signal: new AbortController().signal,
      onText: () => {},
    });
    expect(result).toMatchObject({ ok: false, code: "not-running" });
  });
});
