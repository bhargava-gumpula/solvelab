// @vitest-environment jsdom
import Dexie from "dexie";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoachChat } from "@/components/coach/coach-chat";
import { OllamaError, ollamaStatus, streamOllamaChat } from "@/lib/coach-chat/ollama";
import { createRepositories, type Repositories } from "@/lib/storage";
import { initializeStorage, LocalDatabase } from "@/lib/storage/database";

const holder = vi.hoisted(() => ({ repos: null as unknown, search: "" }));

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(holder.search) }));
vi.mock("@/components/layout/storage-provider", () => ({
  useStorageStatus: () => ({ status: "ready", retry: () => {} }),
}));
vi.mock("@/hooks/use-coach-context", () => ({ useCoachSystem: () => "SYSTEM PROMPT" }));
vi.mock("@/lib/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storage")>()),
  getRepositories: () => holder.repos,
}));
vi.mock("@/lib/coach-chat/ollama", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/coach-chat/ollama")>()),
  streamOllamaChat: vi.fn(),
  ollamaStatus: vi.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const READY = { running: true, version: "0.18.0", models: ["qwen3.5:4b"] };
const REPLY = JSON.stringify({
  answer: "Your lookahead loses time. Do slow solves this week.",
  refs: [
    { kind: "pack", id: "lookahead" },
    { kind: "pack", id: "made-up-pack" },
  ],
  followUps: ["How long should a slow solve take?"],
});

/** A model reply the test feeds piece by piece. Honours the abort signal like the real client. */
function controlledStream() {
  const items: { piece?: string; end?: true; error?: Error }[] = [];
  let wake: (() => void) | null = null;
  const seen = { signal: undefined as AbortSignal | undefined };
  const push = (item: (typeof items)[number]) => {
    items.push(item);
    wake?.();
    wake = null;
  };
  async function* stream(_messages: unknown, opts: { signal?: AbortSignal }) {
    seen.signal = opts.signal;
    for (;;) {
      if (opts.signal?.aborted) return undefined;
      const item = items.shift();
      if (!item) {
        await new Promise<void>((resolve) => {
          wake = resolve;
          opts.signal?.addEventListener("abort", () => resolve(), { once: true });
        });
        continue;
      }
      if (item.error) throw item.error;
      if (item.end) return undefined;
      yield item.piece!;
    }
  }
  return {
    stream,
    seen,
    piece: (piece: string) => push({ piece }),
    end: () => push({ end: true }),
    fail: (error: Error) => push({ error }),
  };
}

let db: LocalDatabase;
let repos: Repositories;
let root: Root;
let container: HTMLElement;

async function until(check: () => boolean | Promise<boolean>, label: string) {
  const end = Date.now() + 4000;
  while (!(await check())) {
    if (Date.now() > end) throw new Error(`timed out waiting for ${label}`);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
}

async function show(search = "") {
  holder.search = search;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(CoachChat)));
  await until(() => !!container.querySelector("[data-testid=coach-chat]"), "the chat");
}

const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);
const text = (selector: string) => q(selector)?.textContent ?? "";
const input = () => q<HTMLTextAreaElement>("[data-testid=coach-chat-input]")!;
const log = () => q("[role=log]")!;

async function type(value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
      input(),
      value,
    );
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function click(selector: string) {
  await act(async () => q<HTMLElement>(selector)!.click());
}

async function ask(question: string) {
  await type(question);
  await click("[data-testid=coach-chat-send]");
}

beforeEach(async () => {
  db = new LocalDatabase(`chat-ui-${crypto.randomUUID()}`);
  await initializeStorage(db);
  repos = createRepositories(db);
  holder.repos = repos;
  vi.mocked(ollamaStatus).mockResolvedValue(READY);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  db.close();
  await Dexie.delete(db.name);
  vi.resetAllMocks();
});

describe("what the chat says when it cannot run", () => {
  it.each([
    ["not-running", { running: false, models: [] }, "Ollama isn’t running"],
    ["old-version", { ...READY, version: "0.17.4" }, "too old"],
    ["model-missing", { ...READY, models: [] }, "model isn’t downloaded"],
  ] as const)("%s", async (problem, found, words) => {
    vi.mocked(ollamaStatus).mockResolvedValue({ ...found, models: [...found.models] });
    await show();
    await until(() => !!q("[data-testid=coach-chat-problem]"), "the message");
    expect(q("[data-testid=coach-chat-problem]")!.getAttribute("data-problem")).toBe(problem);
    expect(text("[data-testid=coach-chat-problem]")).toContain(words);
    await type("Hello");
    expect(q<HTMLButtonElement>("[data-testid=coach-chat-send]")!.disabled).toBe(true);
    expect(streamOllamaChat).not.toHaveBeenCalled();
  });

  it("lets the person check again once Ollama is up", async () => {
    vi.mocked(ollamaStatus).mockResolvedValueOnce({ running: false, models: [] });
    await show();
    await until(() => !!q("[data-testid=coach-chat-problem]"), "the message");
    vi.mocked(ollamaStatus).mockResolvedValue(READY);
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((b) => b.textContent === "Check again")!
        .click();
    });
    await until(() => !q("[data-testid=coach-chat-problem]"), "the message to go");
    await type("Hello");
    expect(q<HTMLButtonElement>("[data-testid=coach-chat-send]")!.disabled).toBe(false);
  });
});

describe("a conversation", () => {
  it("streams the answer outside the live log, then announces the finished reply with its links", async () => {
    const model = controlledStream();
    vi.mocked(streamOllamaChat).mockImplementation(model.stream as never);
    await show();
    await until(() => !q("[role=status]")?.textContent?.includes("Checking"), "the check");

    await ask("What should I work on?");
    // Focus comes back to the box, the log has nothing yet, and "thinking" is announced.
    expect(document.activeElement).toBe(input());
    expect(input().value).toBe("");
    expect(log().textContent).toBe("");
    expect(text("[data-testid=coach-chat-announce]")).toBe("The coach is thinking.");
    expect(q("[data-testid=coach-chat-stop]")).not.toBeNull();

    // Partial text shows, but never in the live log, and an invented algorithm never shows at all.
    await act(async () => model.piece('{"answer":"Do R U R\' F D2 B now and plan'));
    const pending = q("[data-testid=coach-chat-pending]")!;
    expect(pending.getAttribute("aria-hidden")).toBe("true");
    expect(pending.textContent).toContain("plan");
    expect(pending.textContent).not.toContain("F D2 B");
    expect(log().textContent).toBe("");

    await act(async () => {
      model.piece('"}');
      model.end();
    });
    await until(() => !q("[data-testid=coach-chat-pending]"), "the reply to finish");
    expect(log().textContent).toContain("plan");
    expect(log().textContent).not.toContain("F D2 B");
  });

  it("shows a finished reply in the log with real links and follow-up chips, and saves it", async () => {
    const model = controlledStream();
    vi.mocked(streamOllamaChat).mockImplementation(model.stream as never);
    await show();
    await until(() => !q("[role=status]")?.textContent?.includes("Checking"), "the check");
    await ask("What should I work on?");
    await act(async () => {
      model.piece(REPLY.slice(0, 40));
      model.piece(REPLY.slice(40));
      model.end();
    });
    await until(() => !!q("[data-testid=coach-ref]"), "the finished reply");

    expect(q("[data-testid=coach-chat-pending]")).toBeNull();
    expect(log().textContent).toContain("What should I work on?");
    expect(log().textContent).toContain("Do slow solves this week.");
    const links = [...container.querySelectorAll<HTMLAnchorElement>("[data-testid=coach-ref]")];
    // The made-up pack is dropped; the real one links to its page.
    expect(links.map((link) => link.getAttribute("href")?.replace(/\/$/, ""))).toEqual([
      "/hub/unit/lookahead",
    ]);
    expect(text("[data-testid=coach-follow-up]")).toBe("How long should a slow solve take?");
    expect(text("[data-testid=coach-chat-announce]")).toBe("");

    // Saved on this Mac, with the raw reply.
    await until(async () => (await repos.coachChats.count()) === 1, "the chat to be saved");
    const saved = await repos.coachChats.list();
    expect(saved).toHaveLength(1);
    expect(saved[0]!.messages[1]!.content).toBe(REPLY);
    expect(saved[0]!.title).toBe("What should I work on?");
  });

  it("sends the raw earlier reply back to the model with the next question, via a chip", async () => {
    const first = controlledStream();
    vi.mocked(streamOllamaChat).mockImplementationOnce(first.stream as never);
    await show();
    await until(() => !q("[role=status]")?.textContent?.includes("Checking"), "the check");
    await ask("What should I work on?");
    await act(async () => {
      first.piece(REPLY);
      first.end();
    });
    await until(() => !!q("[data-testid=coach-follow-up]"), "the chip");

    const second = controlledStream();
    vi.mocked(streamOllamaChat).mockImplementationOnce(second.stream as never);
    await click("[data-testid=coach-follow-up]");
    const [messages, options] = vi.mocked(streamOllamaChat).mock.calls[1]!;
    expect(messages).toEqual([
      { role: "system", content: "SYSTEM PROMPT" },
      { role: "user", content: "What should I work on?" },
      { role: "assistant", content: REPLY },
      { role: "user", content: "How long should a slow solve take?" },
    ]);
    expect(options).toMatchObject({ model: "qwen3.5:4b", format: expect.any(Object) });
    await act(async () => second.end());
  });

  it("stops on the Stop button, keeping what came, and focuses the box", async () => {
    const model = controlledStream();
    vi.mocked(streamOllamaChat).mockImplementation(model.stream as never);
    await show();
    await until(() => !q("[role=status]")?.textContent?.includes("Checking"), "the check");
    await ask("What should I work on?");
    await act(async () => model.piece('{"answer":"Plan ahead'));
    await click("[data-testid=coach-chat-stop]");
    await until(() => !q("[data-testid=coach-chat-stop]"), "Stop to finish");
    await until(async () => (await repos.coachChats.count()) === 1, "the chat to be saved");

    expect(model.seen.signal?.aborted).toBe(true);
    expect(log().textContent).toContain("Plan ahead");
    expect(log().textContent).toContain("Stopped.");
    expect(document.activeElement).toBe(input());
    const saved = await repos.coachChats.list();
    expect(saved[0]!.messages[1]).toMatchObject({
      content: '{"answer":"Plan ahead',
      stopped: true,
    });
  });

  it("ends the reply when the person leaves the page", async () => {
    const model = controlledStream();
    vi.mocked(streamOllamaChat).mockImplementation(model.stream as never);
    await show();
    await until(() => !q("[role=status]")?.textContent?.includes("Checking"), "the check");
    await ask("What should I work on?");
    await act(async () => model.piece('{"answer":"Plan'));
    expect(model.seen.signal?.aborted).toBe(false);
    await act(async () => root.unmount());
    expect(model.seen.signal?.aborted).toBe(true);
    // afterEach unmounts again; give it a root to unmount.
    root = createRoot(container);
  });

  it("says what went wrong and tries again with the same question", async () => {
    vi.mocked(streamOllamaChat).mockImplementationOnce((() => {
      throw new OllamaError("server", "model runner crashed");
    }) as never);
    await show();
    await until(() => !q("[role=status]")?.textContent?.includes("Checking"), "the check");
    await ask("What should I work on?");
    await until(() => !!q("[data-testid=coach-chat-error]"), "the error");
    expect(q("[data-testid=coach-chat-error]")!.getAttribute("role")).toBe("alert");
    expect(text("[data-testid=coach-chat-error]")).toContain("model runner crashed");
    expect(await repos.coachChats.count()).toBe(0);

    const model = controlledStream();
    vi.mocked(streamOllamaChat).mockImplementationOnce(model.stream as never);
    await act(async () => {
      [...container.querySelectorAll("button")].find((b) => b.textContent === "Try again")!.click();
    });
    await act(async () => {
      model.piece(REPLY);
      model.end();
    });
    await until(() => !!q("[data-testid=coach-ref]"), "the retried reply");
    expect(q("[data-testid=coach-chat-error]")).toBeNull();
    expect(vi.mocked(streamOllamaChat).mock.calls[1]![0]).toEqual([
      { role: "system", content: "SYSTEM PROMPT" },
      { role: "user", content: "What should I work on?" },
    ]);
  });

  it("falls back to the 'Ollama isn't running' message when the connection drops mid-way", async () => {
    vi.mocked(streamOllamaChat).mockImplementationOnce((() => {
      throw new OllamaError("not-running", "Ollama stopped answering");
    }) as never);
    await show();
    await until(() => !q("[role=status]")?.textContent?.includes("Checking"), "the check");
    await ask("Hello");
    await until(() => !!q("[data-testid=coach-chat-problem]"), "the message");
    expect(q("[data-testid=coach-chat-problem]")!.getAttribute("data-problem")).toBe("not-running");
  });
});

describe("opening the chat", () => {
  it("fills in a starter question from the link without sending it, in a fresh chat", async () => {
    await repos.coachChats.save({
      id: "old",
      title: "Old",
      model: "m",
      messages: [{ role: "user", content: "Old question" }],
    });
    await show("?starter=test&test=cross_f2l");
    expect(input().value).toMatch(/Cross \+ F2L test/);
    expect(log().textContent).toBe("");
    expect(streamOllamaChat).not.toHaveBeenCalled();
  });

  it("carries on with the latest saved chat, and can start a new one or open an earlier one", async () => {
    await repos.coachChats.save({
      id: "one",
      title: "First chat",
      model: "m",
      messages: [{ role: "user", content: "First question" }],
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await repos.coachChats.save({
      id: "two",
      title: "Second chat",
      model: "m",
      messages: [{ role: "user", content: "Second question" }],
    });
    await show();
    expect(log().textContent).toContain("Second question");

    await click("[data-testid=coach-chat-new]");
    expect(log().textContent).toBe("");

    const earlier = [...container.querySelectorAll<HTMLButtonElement>("details li button")].find(
      (button) => button.textContent?.includes("First chat"),
    )!;
    await act(async () => earlier.click());
    expect(log().textContent).toContain("First question");
  });

  it("starts a message with Enter and keeps Shift+Enter for a new line", async () => {
    const model = controlledStream();
    vi.mocked(streamOllamaChat).mockImplementation(model.stream as never);
    await show();
    await until(() => !q("[role=status]")?.textContent?.includes("Checking"), "the check");
    await type("Line one");
    await act(async () => {
      input().dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(streamOllamaChat).not.toHaveBeenCalled();
    await act(async () => {
      input().dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });
    expect(streamOllamaChat).toHaveBeenCalledTimes(1);
    await act(async () => model.end());
  });
});
