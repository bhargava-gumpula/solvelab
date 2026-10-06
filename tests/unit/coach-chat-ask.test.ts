import { describe, expect, it, vi } from "vitest";
import { askCoach } from "@/lib/coach-chat/ask";
import * as ollama from "@/lib/coach-chat/ollama";
import type { OllamaStats } from "@/lib/coach-chat/ollama";

vi.mock("@/lib/coach-chat/ollama", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/coach-chat/ollama")>()),
  streamOllamaChat: vi.fn(),
}));

function reply(pieces: string[], stats: OllamaStats | undefined) {
  vi.mocked(ollama.streamOllamaChat).mockImplementation(async function* () {
    yield* pieces;
    return stats;
  });
}

const ask = (signal = new AbortController().signal) =>
  askCoach({ system: "s", messages: [], model: "m", signal, onText: () => {} });

describe("askCoach and a reply that ran out of room", () => {
  it("marks a reply Ollama ended with done_reason length as cut", async () => {
    reply(['{"answer":"Half a'], { doneReason: "length" });
    expect(await ask()).toMatchObject({ ok: true, raw: '{"answer":"Half a', cut: true });
  });

  it("does not mark a normal finish as cut", async () => {
    reply(["{}"], { doneReason: "stop" });
    expect(await ask()).toMatchObject({ ok: true, cut: false, stopped: false });
  });

  it("a reply the person stopped is stopped, not cut", async () => {
    const controller = new AbortController();
    controller.abort();
    reply(["{"], undefined);
    expect(await ask(controller.signal)).toMatchObject({ ok: true, cut: false, stopped: true });
  });
});
