/**
 * Chatting with your own API key. The key is kept in this browser only —
 * never synced, never backed up, never sent anywhere but the provider it
 * belongs to — and it goes on sign-out like every other `solvelab.` key.
 *
 * Google Gemini is the one to recommend: a key from Google AI Studio is free,
 * needs no card, and its free models are plenty for coaching tips. Anything
 * that speaks the OpenAI chat format works too.
 */
import type { ChatMessage } from "./providers";

export type KeyProvider = "gemini" | "groq" | "openai" | "mistral" | "custom";

export interface KeyProviderInfo {
  label: string;
  /** Where to create a key. */
  keyUrl: string | null;
  /** One line for the picker. */
  note: string;
  /** Chat-completions base for OpenAI-style providers; null for Gemini. */
  base: string | null;
  /** Used until the model list loads, or if it can't. */
  defaultModel: string;
}

export const KEY_PROVIDERS: Record<KeyProvider, KeyProviderInfo> = {
  gemini: {
    label: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    note: "Free key, no card needed. Recommended.",
    base: null,
    defaultModel: "gemini-2.5-flash",
  },
  groq: {
    label: "Groq",
    keyUrl: "https://console.groq.com/keys",
    note: "Free tier with open models.",
    base: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
  },
  openai: {
    label: "OpenAI",
    keyUrl: "https://platform.openai.com/api-keys",
    note: "Paid, billed to your OpenAI account.",
    base: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  mistral: {
    label: "Mistral",
    keyUrl: "https://console.mistral.ai/api-keys",
    note: "Free experiment plan available.",
    base: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
  },
  custom: {
    label: "Other (OpenAI-compatible)",
    keyUrl: null,
    note: "Any service with an OpenAI-style chat endpoint.",
    base: null,
    defaultModel: "",
  },
};

export interface SavedKey {
  provider: KeyProvider;
  key: string;
  model: string;
  /** Only for "custom": the base URL, e.g. https://example.com/v1. */
  base?: string;
}

export const API_KEY_STORAGE = "solvelab.ai.apiKey";
export const API_KEY_EVENT = "solvelab:ai-api-key";

export function readSavedKey(): SavedKey | null {
  try {
    const raw = localStorage.getItem(API_KEY_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedKey>;
    if (!parsed.key || !parsed.provider || !(parsed.provider in KEY_PROVIDERS)) return null;
    return {
      provider: parsed.provider,
      key: parsed.key,
      model: parsed.model || KEY_PROVIDERS[parsed.provider].defaultModel,
      ...(parsed.base ? { base: parsed.base } : {}),
    };
  } catch {
    return null;
  }
}

/** Raw stored text, for a stable useSyncExternalStore snapshot. */
export function readSavedKeyRaw(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function writeSavedKey(saved: SavedKey | null) {
  try {
    if (saved) localStorage.setItem(API_KEY_STORAGE, JSON.stringify(saved));
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    // Storage blocked: the key lasts only for this page.
  }
  window.dispatchEvent(new Event(API_KEY_EVENT));
}

/** The chat-completions base for an OpenAI-style key, without a trailing slash. */
export function baseFor(saved: Pick<SavedKey, "provider" | "base">): string | null {
  const base = saved.provider === "custom" ? saved.base : KEY_PROVIDERS[saved.provider].base;
  return base ? base.replace(/\/+$/, "") : null;
}

const GEMINI = "https://generativelanguage.googleapis.com/v1beta";

/** Gemini models that can chat, lightest first, so the free default is at the top. */
export function pickGeminiModels(
  models: { name?: string; supportedGenerationMethods?: string[] }[],
): string[] {
  const rank = (id: string) =>
    id.includes("flash-lite") ? 0 : id.includes("flash") ? 1 : id.includes("pro") ? 3 : 2;
  return models
    .filter(
      (model) =>
        model.name?.startsWith("models/gemini") &&
        model.supportedGenerationMethods?.includes("generateContent") &&
        !/(embedding|image|tts|audio|live|vision)/.test(model.name),
    )
    .map((model) => model.name!.slice("models/".length))
    .sort((a, b) => rank(a) - rank(b) || b.localeCompare(a));
}

export class KeyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** A person-friendly reason for a failed call. */
export function keyErrorMessage(provider: KeyProvider, status: number): string {
  const name = KEY_PROVIDERS[provider].label;
  if (status === 400 || status === 401 || status === 403) {
    return `${name} didn't accept that key. Check you copied all of it, and that it's still active.`;
  }
  if (status === 429) {
    return `You've reached ${name}'s limit for now. Free keys allow a few requests a minute — wait a moment and try again.`;
  }
  if (status === 0) {
    return `Couldn't reach ${name} from this page. Some providers don't accept requests from websites; Gemini and Groq do.`;
  }
  return `${name} answered with an error (${status}). Try again in a moment.`;
}

/**
 * Checks a key by listing the models it can use, and returns them. Throws a
 * KeyError the page can show when the provider refuses.
 */
export async function checkKey(
  saved: Pick<SavedKey, "provider" | "key" | "base">,
  fetcher: typeof fetch = fetch,
): Promise<string[]> {
  let response: Response;
  try {
    response =
      saved.provider === "gemini"
        ? await fetcher(`${GEMINI}/models?pageSize=100`, {
            headers: { "x-goog-api-key": saved.key },
          })
        : await fetcher(`${baseFor(saved)}/models`, {
            headers: { Authorization: `Bearer ${saved.key}` },
          });
  } catch {
    throw new KeyError(keyErrorMessage(saved.provider, 0), 0);
  }
  if (!response.ok) {
    throw new KeyError(keyErrorMessage(saved.provider, response.status), response.status);
  }
  const data = (await response.json()) as {
    models?: { name?: string; supportedGenerationMethods?: string[] }[];
    data?: { id?: string }[];
  };
  return saved.provider === "gemini"
    ? pickGeminiModels(data.models ?? [])
    : (data.data ?? []).map((model) => model.id ?? "").filter(Boolean);
}

/** A Gemini request: the instructions as the system instruction, the chat as turns. */
export function geminiBody(system: string, messages: ChatMessage[]) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
  };
}

/** The text in a chunk of Gemini's server-sent events; half a line is handed back. */
export function parseGeminiStream(buffer: string): { text: string; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  let text = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith("data:")) continue;
    try {
      const json = JSON.parse(line.slice(5).trim()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      text += (json.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("");
    } catch {
      // Not a JSON line; nothing to show.
    }
  }
  return { text, rest };
}

/** Streams a Gemini reply, calling `onText` with each new piece. */
export async function streamGemini(
  saved: Pick<SavedKey, "key" | "model">,
  system: string,
  messages: ChatMessage[],
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `${GEMINI}/models/${encodeURIComponent(saved.model)}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": saved.key },
        body: JSON.stringify(geminiBody(system, messages)),
      },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new KeyError(keyErrorMessage("gemini", 0), 0);
  }
  if (!response.ok || !response.body) {
    throw new KeyError(keyErrorMessage("gemini", response.status), response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseGeminiStream(buffer);
    buffer = parsed.rest;
    if (parsed.text) onText(parsed.text);
  }
  const tail = parseGeminiStream(`${buffer}\n`);
  if (tail.text) onText(tail.text);
}
