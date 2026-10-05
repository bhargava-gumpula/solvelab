import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OllamaError,
  isLoopbackUrl,
  ollamaStatus,
  streamOllamaChat,
} from "@/lib/coach-chat/ollama";
import type { OllamaStats } from "@/lib/coach-chat/ollama";

const enc = new TextEncoder();
const MESSAGES = [{ role: "user" as const, content: "hi" }];
const OPTS = { model: "qwen3.5:4b-q4_K_M" };

const line = (content: string, done = false, extra: object = {}) =>
  JSON.stringify({ model: "m", message: { role: "assistant", content }, done, ...extra }) + "\n";

/** A Response whose body delivers `chunks` (strings or raw bytes) one by one. */
function ndjson(chunks: (string | Uint8Array)[], init: ResponseInit = {}, onCancel?: () => void) {
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= chunks.length) return controller.close();
      const c = chunks[i++];
      controller.enqueue(typeof c === "string" ? enc.encode(c) : c);
    },
    cancel: onCancel,
  });
  return new Response(body, { status: 200, ...init });
}

function stubFetch(impl: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn((url: string, init: RequestInit) => Promise.resolve(impl(url, init)));
  vi.stubGlobal("fetch", fn);
  return fn;
}

async function collect(gen: AsyncGenerator<string, OllamaStats | undefined>) {
  const parts: string[] = [];
  let r = await gen.next();
  while (!r.done) {
    parts.push(r.value);
    r = await gen.next();
  }
  return { parts, stats: r.value };
}

afterEach(() => vi.unstubAllGlobals());

describe("streamOllamaChat request", () => {
  it("posts to /api/chat on 127.0.0.1 with thinking off and an 8K context", async () => {
    const fetchMock = stubFetch(() => ndjson([line("ok", true)]));
    await collect(streamOllamaChat(MESSAGES, OPTS));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:11434/api/chat");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      model: OPTS.model,
      messages: MESSAGES,
      stream: true,
      think: false,
      options: { num_ctx: 8192 },
    });
  });

  it("passes every option through and honours baseUrl", async () => {
    const fetchMock = stubFetch(() => ndjson([line("", true)]));
    const signal = new AbortController().signal;
    await collect(
      streamOllamaChat(MESSAGES, {
        ...OPTS,
        numCtx: 4096,
        numPredict: 300,
        temperature: 0.2,
        format: { type: "object" },
        keepAlive: "10m",
        baseUrl: "http://localhost:9999",
        signal,
      }),
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:9999/api/chat");
    expect(init.signal).toBe(signal);
    expect(JSON.parse(init.body as string)).toMatchObject({
      format: { type: "object" },
      keep_alive: "10m",
      think: false,
      options: { num_ctx: 4096, num_predict: 300, temperature: 0.2 },
    });
  });

  it("accepts format: 'json'", async () => {
    const fetchMock = stubFetch(() => ndjson([line("", true)]));
    await collect(streamOllamaChat(MESSAGES, { ...OPTS, format: "json" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).format).toBe("json");
  });
});

describe("only Ollama on this Mac", () => {
  it("knows an address on this Mac from any other", () => {
    for (const url of [
      "http://127.0.0.1:11434",
      "http://localhost:9999",
      "http://[::1]:11434",
      "http://ollama.localhost:11434",
      "https://127.0.0.2",
    ])
      expect(isLoopbackUrl(url), url).toBe(true);
    for (const url of [
      "http://192.168.1.20:11434",
      "http://example.com:11434",
      "http://127.0.0.1.example.com:11434",
      "http://localhost.example.com",
      "ftp://127.0.0.1",
      "not a url",
      "",
    ])
      expect(isLoopbackUrl(url), url).toBe(false);
  });

  it("never sends the prompt to another address", async () => {
    const fetchMock = stubFetch(() => ndjson([line("x", true)]));
    await expect(
      collect(streamOllamaChat(MESSAGES, { ...OPTS, baseUrl: "http://192.168.1.20:11434" })),
    ).rejects.toThrow(/on this Mac/);
    expect(await ollamaStatus("http://example.com:11434")).toEqual({ running: false, models: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("streamOllamaChat stream reading", () => {
  it("yields deltas when lines arrive whole, and returns the final stats", async () => {
    stubFetch(() =>
      ndjson([
        line("Hel") + line("lo"),
        line("", true, { done_reason: "stop", prompt_eval_count: 812, eval_count: 5 }),
      ]),
    );
    const { parts, stats } = await collect(streamOllamaChat(MESSAGES, OPTS));
    expect(parts).toEqual(["Hel", "lo"]);
    expect(stats).toEqual({ promptEvalCount: 812, evalCount: 5, doneReason: "stop" });
  });

  it("copes with chunks split mid-line, mid-key and several lines to a chunk", async () => {
    const all = line("A") + line("B") + line("C") + line("", true);
    // Awkward cuts: inside a key, between a line and its newline, mid-way through the next line.
    const cuts = [7, 20, all.indexOf("\n") + 3, all.length - 4];
    const chunks: string[] = [];
    let from = 0;
    for (const c of cuts.sort((a, b) => a - b)) {
      chunks.push(all.slice(from, c));
      from = c;
    }
    chunks.push(all.slice(from));
    stubFetch(() => ndjson(chunks));
    const { parts } = await collect(streamOllamaChat(MESSAGES, OPTS));
    expect(parts.join("")).toBe("ABC");
  });

  it("copes with one byte per chunk, including a multi-byte character split across chunks", async () => {
    const bytes = enc.encode(line("héllo ✓ 😀") + line("", true));
    const chunks = Array.from(bytes, (b) => Uint8Array.of(b));
    stubFetch(() => ndjson(chunks));
    const { parts } = await collect(streamOllamaChat(MESSAGES, OPTS));
    expect(parts.join("")).toBe("héllo ✓ 😀");
  });

  it("reads a last line that has no trailing newline, and skips blank lines and empty deltas", async () => {
    stubFetch(() => ndjson([line("x") + "\n\n" + line(""), line("y", true).trimEnd()]));
    const { parts } = await collect(streamOllamaChat(MESSAGES, OPTS));
    expect(parts).toEqual(["x", "y"]);
  });

  it("ignores thinking text and stops reading at done", async () => {
    const thinking =
      JSON.stringify({
        message: { role: "assistant", content: "", thinking: "hmm" },
        done: false,
      }) + "\n";
    stubFetch(() => ndjson([thinking + line("a") + line("", true) + line("after-done")]));
    const { parts } = await collect(streamOllamaChat(MESSAGES, OPTS));
    expect(parts).toEqual(["a"]);
  });
});

describe("streamOllamaChat errors", () => {
  const failure = async (gen: AsyncGenerator<string, OllamaStats | undefined>) => {
    try {
      await collect(gen);
    } catch (e) {
      return e as OllamaError;
    }
    throw new Error("expected an error");
  };

  it("not-running when the connection is refused", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Load failed"))),
    );
    const e = await failure(streamOllamaChat(MESSAGES, OPTS));
    expect(e).toBeInstanceOf(OllamaError);
    expect(e.code).toBe("not-running");
  });

  it("model-missing on a 404 'not found'", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({ error: 'model "qwen3.5:4b-q4_K_M" not found, try pulling it first' }),
          {
            status: 404,
          },
        ),
    );
    const e = await failure(streamOllamaChat(MESSAGES, OPTS));
    expect(e.code).toBe("model-missing");
    expect(e.status).toBe(404);
    expect(e.message).toContain("not found");
  });

  it("out-of-memory on a 500 'requires more system memory'", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            error: "model requires more system memory (6.1 GiB) than is available (3.2 GiB)",
          }),
          {
            status: 500,
          },
        ),
    );
    expect((await failure(streamOllamaChat(MESSAGES, OPTS))).code).toBe("out-of-memory");
  });

  it("old-version when Ollama cannot run the model", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            error:
              "llama runner process has terminated: error loading model architecture: unknown model architecture: 'qwen35'",
          }),
          { status: 500 },
        ),
    );
    expect((await failure(streamOllamaChat(MESSAGES, OPTS))).code).toBe("old-version");
    stubFetch(() => new Response("this model requires a newer version of Ollama", { status: 412 }));
    expect((await failure(streamOllamaChat(MESSAGES, OPTS))).code).toBe("old-version");
  });

  it("server for any other HTTP failure, using the status when the body is not JSON", async () => {
    stubFetch(() => new Response("", { status: 503 }));
    const e = await failure(streamOllamaChat(MESSAGES, OPTS));
    expect(e.code).toBe("server");
    expect(e.message).toContain("503");
  });

  it("an error line in the middle of the stream throws after the text already read", async () => {
    stubFetch(() =>
      ndjson([
        line("partial"),
        JSON.stringify({ error: "model requires more system memory" }) + "\n",
      ]),
    );
    const gen = streamOllamaChat(MESSAGES, OPTS);
    expect((await gen.next()).value).toBe("partial");
    await expect(gen.next()).rejects.toMatchObject({ code: "out-of-memory" });
  });

  it("bad-stream for a line that is not JSON", async () => {
    stubFetch(() => ndjson(["<html>proxy error</html>\n"]));
    expect((await failure(streamOllamaChat(MESSAGES, OPTS))).code).toBe("bad-stream");
  });

  it("bad-stream when the stream ends without a done chunk", async () => {
    stubFetch(() => ndjson([line("cut off")]));
    const e = await failure(streamOllamaChat(MESSAGES, OPTS));
    expect(e.code).toBe("bad-stream");
  });

  it("not-running when the connection drops mid-reply", async () => {
    stubFetch(() => {
      let sent = false;
      return new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            if (!sent) {
              sent = true;
              controller.enqueue(enc.encode(line("so far")));
            } else controller.error(new TypeError("network error"));
          },
        }),
      );
    });
    const gen = streamOllamaChat(MESSAGES, OPTS);
    expect((await gen.next()).value).toBe("so far");
    await expect(gen.next()).rejects.toMatchObject({ code: "not-running" });
  });
});

describe("streamOllamaChat abort and early exit", () => {
  /** A stream that errors with AbortError when the request's signal aborts, like a real fetch. */
  function abortable(init: RequestInit, onCancel?: () => void) {
    let sent = false;
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          init.signal?.addEventListener("abort", () =>
            controller.error(new DOMException("The operation was aborted.", "AbortError")),
          );
        },
        pull(controller) {
          if (!sent) {
            sent = true;
            controller.enqueue(enc.encode(line("one")));
            return;
          }
          return new Promise(() => {}); // then wait forever, like a slow model
        },
        cancel: onCancel,
      }),
    );
  }

  it("ends quietly when the signal aborts mid-stream", async () => {
    const ac = new AbortController();
    stubFetch((_url, init) => abortable(init));
    const gen = streamOllamaChat(MESSAGES, { ...OPTS, signal: ac.signal });
    expect((await gen.next()).value).toBe("one");
    const pending = gen.next();
    ac.abort();
    expect(await pending).toEqual({ done: true, value: undefined });
  });

  it("ends quietly when the signal is already aborted before the request", async () => {
    const ac = new AbortController();
    ac.abort();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        init.signal?.aborted
          ? Promise.reject(new DOMException("aborted", "AbortError"))
          : Promise.resolve(ndjson([])),
      ),
    );
    const { parts } = await collect(streamOllamaChat(MESSAGES, { ...OPTS, signal: ac.signal }));
    expect(parts).toEqual([]);
  });

  it("cancels the request when the caller stops reading early", async () => {
    const cancelled = vi.fn();
    stubFetch(() => ndjson([line("a"), line("b"), line("c", true)], {}, cancelled));
    for await (const text of streamOllamaChat(MESSAGES, OPTS)) {
      expect(text).toBe("a");
      break;
    }
    await vi.waitFor(() => expect(cancelled).toHaveBeenCalled());
  });
});

describe("ollamaStatus", () => {
  it("reports version and downloaded models", async () => {
    const fetchMock = stubFetch((url) =>
      url.endsWith("/api/version")
        ? Response.json({ version: "0.35.1" })
        : Response.json({
            models: [{ name: "qwen3.5:4b-q4_K_M", digest: "x" }, { model: "qwen3.5:2b-q4_K_M" }],
          }),
    );
    expect(await ollamaStatus()).toEqual({
      running: true,
      version: "0.35.1",
      models: ["qwen3.5:4b-q4_K_M", "qwen3.5:2b-q4_K_M"],
    });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      "http://127.0.0.1:11434/api/version",
      "http://127.0.0.1:11434/api/tags",
    ]);
  });

  it("is not running when nothing answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Load failed"))),
    );
    expect(await ollamaStatus("http://localhost:9999")).toEqual({ running: false, models: [] });
  });

  it("is not running when the version call is not OK", async () => {
    stubFetch(() => new Response("nope", { status: 500 }));
    expect(await ollamaStatus()).toEqual({ running: false, models: [] });
  });

  it("is running with no models when the model list fails", async () => {
    stubFetch((url) =>
      url.endsWith("/api/version")
        ? Response.json({ version: "0.17.5" })
        : new Response("x", { status: 500 }),
    );
    expect(await ollamaStatus()).toEqual({ running: true, version: "0.17.5", models: [] });
  });

  it("an empty install reports no models", async () => {
    stubFetch((url) =>
      url.endsWith("/api/version")
        ? Response.json({ version: "0.35.1" })
        : Response.json({ models: [] }),
    );
    expect(await ollamaStatus()).toEqual({ running: true, version: "0.35.1", models: [] });
  });
});
