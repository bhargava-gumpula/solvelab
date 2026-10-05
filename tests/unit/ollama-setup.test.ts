import { describe, expect, it } from "vitest";
import { COACH_MODELS, GiB } from "@/lib/config/coach-model";
import {
  diskTooSmall,
  fetchStatus,
  modelForTag,
  modelPlan,
  nextStep,
  NOT_RUNNING,
  pickModel,
  shouldUnloadForTimer,
  unloadCoachModels,
  versionOk,
  type OllamaStatus,
} from "@/lib/desktop/ollama-setup";
import {
  cancelPull,
  getPullState,
  pullModel,
  resetPull,
  startPull,
  type PullProgress,
} from "@/lib/desktop/ollama-pull";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const model = COACH_MODELS.standard;
const up = (over: Partial<OllamaStatus> = {}): OllamaStatus => ({
  running: true,
  version: "0.35.1",
  versionOk: true,
  models: [],
  ...over,
});

/** A fetch whose body arrives as the given text chunks. */
const streaming = (chunks: string[]) =>
  (() =>
    Promise.resolve(
      new Response(
        new ReadableStream<Uint8Array>({
          start(c) {
            for (const chunk of chunks) c.enqueue(new TextEncoder().encode(chunk));
            c.close();
          },
        }),
      ),
    )) as unknown as typeof fetch;

describe("versionOk", () => {
  it("compares against the floor", () => {
    expect(versionOk("0.17.5")).toBe(true);
    expect(versionOk("0.35.1")).toBe(true);
    expect(versionOk("0.40.0-rc2")).toBe(true);
    expect(versionOk("1.0.0")).toBe(true);
    expect(versionOk("0.17.4")).toBe(false);
    expect(versionOk("0.9.9")).toBe(false);
  });
  it("allows a source build and unreadable versions", () => {
    expect(versionOk("0.0.0")).toBe(true);
    expect(versionOk("")).toBe(true);
    expect(versionOk("dev")).toBe(true);
  });
});

describe("modelPlan", () => {
  it("picks the tier by memory", () => {
    expect(modelPlan(8 * GiB)).toEqual({ default: COACH_MODELS.small, better: null });
    expect(modelPlan(16 * GiB)).toEqual({ default: COACH_MODELS.standard, better: null });
    expect(modelPlan(18 * GiB)).toEqual({ default: COACH_MODELS.standard, better: null });
    expect(modelPlan(24 * GiB)).toEqual({
      default: COACH_MODELS.standard,
      better: COACH_MODELS.better,
    });
    expect(modelPlan(64 * GiB).better).toBe(COACH_MODELS.better);
  });
  it("defaults to the 4B model when memory is unknown", () => {
    expect(modelPlan(null)).toEqual({ default: COACH_MODELS.standard, better: null });
  });
});

describe("pickModel", () => {
  const big = modelPlan(24 * GiB);
  it("uses the tier default, or the better model when asked for", () => {
    expect(pickModel(big, [], false)).toBe(COACH_MODELS.standard);
    expect(pickModel(big, [], true)).toBe(COACH_MODELS.better);
    expect(pickModel(modelPlan(16 * GiB), [], true)).toBe(COACH_MODELS.standard);
  });
  it("keeps the better model when only it is downloaded (the choice is lost on a reload)", () => {
    expect(pickModel(big, ["qwen3.5:9b"], false)).toBe(COACH_MODELS.better);
    expect(pickModel(big, ["qwen3.5:9b", "qwen3.5:4b"], false)).toBe(COACH_MODELS.standard);
    expect(pickModel(modelPlan(16 * GiB), ["qwen3.5:9b"], false)).toBe(COACH_MODELS.standard);
  });
  it("finds a model by tag", () => {
    expect(modelForTag("qwen3.5:9b")).toBe(COACH_MODELS.better);
    expect(modelForTag("llama3:8b")).toBeUndefined();
  });
});

describe("nextStep", () => {
  it("walks Ollama, then the model", () => {
    expect(nextStep(NOT_RUNNING, null, model)).toBe("install");
    expect(nextStep(NOT_RUNNING, { app: false, cli: false }, model)).toBe("install");
    expect(nextStep(NOT_RUNNING, { app: true, cli: false }, model)).toBe("open");
    expect(nextStep(NOT_RUNNING, { app: false, cli: true }, model)).toBe("start-cli");
    expect(nextStep(up({ versionOk: false, version: "0.10.0" }), null, model)).toBe("update");
    expect(nextStep(up(), null, model)).toBe("download");
    expect(nextStep(up({ models: ["qwen3.5:2b"] }), null, model)).toBe("download");
    expect(nextStep(up({ models: [model.tag] }), null, model)).toBe("ready");
  });
});

describe("disk and unload rules", () => {
  it("blocks only when free space is known and too small", () => {
    expect(diskTooSmall(null, model.sizeBytes)).toBe(false);
    expect(diskTooSmall(model.sizeBytes + 1, model.sizeBytes)).toBe(true);
    expect(diskTooSmall(model.sizeBytes + 3 * GiB, model.sizeBytes)).toBe(false);
  });
  it("unloads for the Timer on 16 GB or less (and unknown), not above", () => {
    expect(shouldUnloadForTimer(8 * GiB)).toBe(true);
    expect(shouldUnloadForTimer(16 * GiB)).toBe(true);
    expect(shouldUnloadForTimer(null)).toBe(true);
    expect(shouldUnloadForTimer(18 * GiB)).toBe(false);
    expect(shouldUnloadForTimer(24 * GiB)).toBe(false);
  });
});

describe("fetchStatus", () => {
  it("reports a running server, its version and models", async () => {
    const f = ((url: string) =>
      Promise.resolve(
        url.endsWith("/api/version")
          ? json({ version: "0.35.1" })
          : json({ models: [{ name: "qwen3.5:4b" }] }),
      )) as unknown as typeof fetch;
    expect(await fetchStatus(f)).toEqual(up({ models: ["qwen3.5:4b"] }));
  });
  it("flags an old version and survives a failing /api/tags", async () => {
    const f = ((url: string) =>
      url.endsWith("/api/version")
        ? Promise.resolve(json({ version: "0.17.4" }))
        : Promise.reject(new Error("x"))) as unknown as typeof fetch;
    expect(await fetchStatus(f)).toEqual({
      running: true,
      version: "0.17.4",
      versionOk: false,
      models: [],
    });
  });
  it("says not running when nothing answers", async () => {
    expect(
      await fetchStatus((() =>
        Promise.reject(new TypeError("fetch failed"))) as unknown as typeof fetch),
    ).toEqual(NOT_RUNNING);
    expect(
      await fetchStatus((() => Promise.resolve(json({}, 500))) as unknown as typeof fetch),
    ).toEqual(NOT_RUNNING);
  });
  it("does not count a server that answers without a version as Ollama", async () => {
    expect(
      await fetchStatus((() => Promise.resolve(json({ ok: true }))) as unknown as typeof fetch),
    ).toEqual(NOT_RUNNING);
    expect(
      await fetchStatus((() =>
        Promise.resolve(new Response("<html></html>"))) as unknown as typeof fetch),
    ).toEqual(NOT_RUNNING);
  });
});

describe("unloadCoachModels", () => {
  it("sends keep_alive 0 only for loaded coach models", async () => {
    const posts: unknown[] = [];
    const f = ((url: string, init?: RequestInit) => {
      if (url.endsWith("/api/ps"))
        return Promise.resolve(json({ models: [{ name: "qwen3.5:4b" }, { name: "llama3:8b" }] }));
      posts.push(JSON.parse(String(init?.body)));
      return Promise.resolve(json({}));
    }) as unknown as typeof fetch;
    expect(await unloadCoachModels(f)).toEqual(["qwen3.5:4b"]);
    expect(posts).toEqual([{ model: "qwen3.5:4b", keep_alive: 0 }]);
  });
  it("does nothing when nothing is loaded or Ollama is down", async () => {
    expect(
      await unloadCoachModels((() =>
        Promise.resolve(json({ models: [] }))) as unknown as typeof fetch),
    ).toEqual([]);
    expect(
      await unloadCoachModels((() => Promise.reject(new Error("down"))) as unknown as typeof fetch),
    ).toEqual([]);
  });
});

describe("pullModel", () => {
  it("streams progress, summing layers, even when lines split across chunks", async () => {
    const lines = [
      { status: "pulling manifest" },
      { status: "pulling aaa", digest: "aaa", total: 3_000_000_000, completed: 1_500_000_000 },
      { status: "pulling bbb", digest: "bbb", total: 300_000_000, completed: 0 },
      { status: "pulling aaa", digest: "aaa", total: 3_000_000_000, completed: 3_000_000_000 },
      { status: "success" },
    ].map((l) => JSON.stringify(l) + "\n");
    const text = lines.join("");
    const seen: (PullProgress & { fraction: number })[] = [];
    await pullModel(
      model,
      (p) => seen.push(p),
      undefined,
      streaming([text.slice(0, 40), text.slice(40, 130), text.slice(130)]),
    );
    expect(seen.map((p) => p.status)).toEqual([
      "pulling manifest",
      "pulling aaa",
      "pulling bbb",
      "pulling aaa",
      "success",
    ]);
    expect(seen[0].fraction).toBe(0);
    expect(seen[1].completed).toBe(1_500_000_000);
    expect(seen[1].total).toBe(model.sizeBytes); // the configured size is the floor
    expect(seen[3].completed).toBe(3_000_000_000);
    expect(seen[3].fraction).toBeLessThan(1);
    expect(seen[4].status).toBe("success");
  });
  it("reads a final line with no newline", async () => {
    const seen: string[] = [];
    await pullModel(
      model,
      (p) => seen.push(p.status),
      undefined,
      streaming(['{"status":"a"}\n{"status":"success"}']),
    );
    expect(seen).toEqual(["a", "success"]);
  });
  it("throws Ollama's error line, an HTTP error, and a stream that stops early", async () => {
    await expect(
      pullModel(
        model,
        () => {},
        undefined,
        streaming(['{"error":"pull model manifest: file does not exist"}\n']),
      ),
    ).rejects.toThrow("file does not exist");
    await expect(
      pullModel(model, () => {}, undefined, (() =>
        Promise.resolve(json({ error: "disk full" }, 500))) as unknown as typeof fetch),
    ).rejects.toThrow("disk full");
    await expect(
      pullModel(model, () => {}, undefined, streaming(['{"status":"pulling manifest"}\n'])),
    ).rejects.toThrow("stopped");
  });
  it("never reports a non-number progress", async () => {
    const seen: number[] = [];
    await pullModel(
      model,
      (p) => seen.push(p.fraction),
      undefined,
      streaming([
        '{"status":"pulling a","digest":"a","total":100,"completed":"x"}\n{"status":"success"}\n',
      ]),
    );
    expect(seen.every(Number.isFinite)).toBe(true);
  });
  it("closes the connection when it stops reading early", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode('{"error":"boom"}\n'));
      },
      cancel() {
        cancelled = true;
      },
    });
    await expect(
      pullModel(model, () => {}, undefined, (() =>
        Promise.resolve(new Response(body))) as unknown as typeof fetch),
    ).rejects.toThrow("boom");
    await new Promise((r) => setTimeout(r, 0));
    expect(cancelled).toBe(true);
  });
});

describe("startPull / cancelPull", () => {
  it("cancels an in-flight download and keeps going on a second start", async () => {
    const hang = ((_u: string, init?: RequestInit) =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(c) {
              c.enqueue(
                new TextEncoder().encode(
                  '{"status":"pulling aaa","digest":"aaa","total":10,"completed":5}\n',
                ),
              );
              init?.signal?.addEventListener("abort", () =>
                c.error(new DOMException("aborted", "AbortError")),
              );
            },
          }),
        ),
      )) as unknown as typeof fetch;
    const run = startPull(model, hang);
    void startPull(model, hang); // ignored while one is running
    await new Promise((r) => setTimeout(r, 10));
    expect(getPullState().phase).toBe("pulling");
    cancelPull();
    await run;
    expect(getPullState()).toEqual({ phase: "cancelled", tag: model.tag });
    resetPull();
    expect(getPullState().phase).toBe("idle");
  });
  it("ends in done, or in error with the message", async () => {
    await startPull(model, streaming(['{"status":"success"}\n']));
    expect(getPullState()).toEqual({ phase: "done", tag: model.tag });
    await startPull(model, streaming(['{"error":"no space left"}\n']));
    expect(getPullState()).toEqual({ phase: "error", tag: model.tag, message: "no space left" });
    resetPull();
  });
  it("turns a lost connection into a plain message", async () => {
    await startPull(model, (() =>
      Promise.reject(new TypeError("Load failed"))) as unknown as typeof fetch);
    const s = getPullState();
    expect(s.phase === "error" && s.message).toMatch(/Lost contact with Ollama/);
    resetPull();
  });
});
