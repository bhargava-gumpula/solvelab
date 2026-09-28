// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  API_KEY_STORAGE,
  baseFor,
  checkKey,
  geminiBody,
  KeyError,
  keyErrorMessage,
  parseGeminiStream,
  pickGeminiModels,
  readSavedKey,
  writeSavedKey,
} from "@/lib/ai/keys";

afterEach(() => localStorage.clear());

describe("your own API key", () => {
  it("is kept in this browser under a solvelab. key, so sign-out clears it", () => {
    writeSavedKey({ provider: "gemini", key: "AIza-test", model: "gemini-2.5-flash" });
    expect(API_KEY_STORAGE.startsWith("solvelab.")).toBe(true);
    expect(readSavedKey()).toEqual({
      provider: "gemini",
      key: "AIza-test",
      model: "gemini-2.5-flash",
    });
    writeSavedKey(null);
    expect(readSavedKey()).toBeNull();
  });

  it("ignores a broken saved value", () => {
    localStorage.setItem(API_KEY_STORAGE, "{not json");
    expect(readSavedKey()).toBeNull();
    localStorage.setItem(API_KEY_STORAGE, JSON.stringify({ provider: "nope", key: "x" }));
    expect(readSavedKey()).toBeNull();
  });

  it("builds chat addresses for OpenAI-style providers", () => {
    expect(baseFor({ provider: "groq" })).toBe("https://api.groq.com/openai/v1");
    expect(baseFor({ provider: "custom", base: "https://example.com/v1/" })).toBe(
      "https://example.com/v1",
    );
    expect(baseFor({ provider: "gemini" })).toBeNull();
  });
});

describe("Gemini", () => {
  it("offers chat models only, lightest first", () => {
    expect(
      pickGeminiModels([
        { name: "models/gemini-2.5-pro", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
        { name: "models/text-embedding-004", supportedGenerationMethods: ["embedContent"] },
        { name: "models/gemini-2.5-flash-lite", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-2.5-flash-image", supportedGenerationMethods: ["generateContent"] },
      ]),
    ).toEqual(["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"]);
  });

  it("sends the coaching instructions as the system instruction and the chat as turns", () => {
    expect(
      geminiBody("Be a coach.", [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" },
        { role: "user", content: "Tips?" },
      ]),
    ).toEqual({
      systemInstruction: { parts: [{ text: "Be a coach." }] },
      contents: [
        { role: "user", parts: [{ text: "Hi" }] },
        { role: "model", parts: [{ text: "Hello" }] },
        { role: "user", parts: [{ text: "Tips?" }] },
      ],
    });
  });

  it("reads streamed text, keeping half a line for the next chunk", () => {
    const first = parseGeminiStream(
      'data: {"candidates":[{"content":{"parts":[{"text":"Slow "}]}}]}\n\ndata: {"candi',
    );
    expect(first.text).toBe("Slow ");
    const second = parseGeminiStream(
      `${first.rest}dates":[{"content":{"parts":[{"text":"down."}]}}]}\n`,
    );
    expect(second.text).toBe("down.");
  });
});

describe("checking a key", () => {
  it("lists a Gemini key's models, sending the key only to Google", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            models: [
              { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
            ],
          }),
        ),
    );
    expect(await checkKey({ provider: "gemini", key: "AIza-test" }, fetcher)).toEqual([
      "gemini-2.5-flash",
    ]);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.startsWith("https://generativelanguage.googleapis.com/")).toBe(true);
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("AIza-test");
  });

  it("lists an OpenAI-style key's models with a bearer token", async () => {
    const fetcher = vi.fn(
      async () => new Response(JSON.stringify({ data: [{ id: "llama-3.1-8b-instant" }] })),
    );
    expect(await checkKey({ provider: "groq", key: "gsk-test" }, fetcher)).toEqual([
      "llama-3.1-8b-instant",
    ]);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/models");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer gsk-test");
  });

  it("explains a refused key, a rate limit and an unreachable provider in plain words", async () => {
    const refused = vi.fn(async () => new Response("no", { status: 400 }));
    await expect(checkKey({ provider: "gemini", key: "bad" }, refused)).rejects.toBeInstanceOf(
      KeyError,
    );
    expect(keyErrorMessage("gemini", 400)).toContain("didn't accept that key");
    expect(keyErrorMessage("gemini", 429)).toContain("limit");
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(checkKey({ provider: "mistral", key: "k" }, offline)).rejects.toMatchObject({
      status: 0,
    });
  });
});
