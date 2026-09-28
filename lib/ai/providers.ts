/**
 * The ways SolveLab can put someone's own AI to work, all without an API key
 * being pasted anywhere:
 *
 * - Hand-off: open Claude, ChatGPT or Gemini with the coaching prompt ready,
 *   so it runs on the person's own subscription in that app. Providers don't
 *   allow third-party sites to use subscription sign-ins directly (Anthropic's
 *   consumer terms, for one, limit them to Claude.ai and Claude Code), so this
 *   is the supported way to use a subscription.
 * - OpenRouter: "Sign in with OpenRouter" (OAuth with PKCE). The person
 *   approves on openrouter.ai and SolveLab receives a key that bills their
 *   OpenRouter account and can reach Claude, GPT, Gemini and other models.
 * - A model on their own computer, through Ollama's OpenAI-compatible API.
 */

export type HandOffTarget = "claude" | "chatgpt" | "gemini";

export const HAND_OFF: Record<
  HandOffTarget,
  { label: string; plan: string; url: (prompt: string) => string | null }
> = {
  claude: {
    label: "Claude",
    plan: "Free, Pro or Max",
    url: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  chatgpt: {
    label: "ChatGPT",
    plan: "Free, Plus or Pro",
    url: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  gemini: {
    label: "Gemini",
    plan: "Free or Google AI Pro",
    // Gemini has no documented way to prefill a prompt, so it gets the
    // clipboard and a plain link.
    url: () => null,
  },
};

export const GEMINI_HOME = "https://gemini.google.com/app";

/** Longest prefilled link we open; beyond this the prompt goes on the clipboard. */
export const MAX_HAND_OFF_URL = 7500;

/** Where to send someone, and whether the prompt must be pasted by hand. */
export function handOff(target: HandOffTarget, prompt: string): { url: string; paste: boolean } {
  const url = HAND_OFF[target].url(prompt);
  if (url && url.length <= MAX_HAND_OFF_URL) return { url, paste: false };
  const home =
    target === "claude"
      ? "https://claude.ai/new"
      : target === "chatgpt"
        ? "https://chatgpt.com/"
        : GEMINI_HOME;
  return { url: home, paste: true };
}

// --- OpenRouter sign-in (OAuth PKCE) ---------------------------------------

export const OPENROUTER_KEY = "solvelab.ai.openrouter";
const VERIFIER_KEY = "solvelab.ai.openrouterVerifier";

function base64Url(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomVerifier(): string {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

/** The PKCE challenge: SHA-256 of the verifier, base64url-encoded. */
export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/** Builds the sign-in link and remembers the verifier for this tab only. */
export async function openRouterSignInUrl(callbackUrl: string): Promise<string> {
  const verifier = randomVerifier();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const challenge = await challengeFor(verifier);
  const params = new URLSearchParams({
    callback_url: callbackUrl,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `https://openrouter.ai/auth?${params.toString()}`;
}

/**
 * Finishes a sign-in this tab started. A code that arrives without our own
 * verifier is ignored: it wasn't started here, and exchanging it could attach
 * someone else's account.
 */
export async function completeOpenRouterSignIn(
  code: string,
  fetcher: typeof fetch = fetch,
): Promise<string | null> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  if (!verifier || !code) return null;
  const response = await fetcher("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { key?: unknown };
  return typeof data.key === "string" && data.key ? data.key : null;
}

// --- Chat --------------------------------------------------------------------

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatEndpoint {
  url: string;
  /** Sent as a bearer token; empty for a local model. */
  key: string;
  model: string;
}

export const OPENROUTER_CHAT = "https://openrouter.ai/api/v1/chat/completions";
export const OLLAMA_CHAT = "http://localhost:11434/v1/chat/completions";

/**
 * Pulls the text out of a server-sent-events chunk from an OpenAI-style
 * streaming chat. Returns the pieces of text and whether the stream said it's
 * done; incomplete lines are handed back to be joined with the next chunk.
 */
export function parseStream(buffer: string): { text: string; done: boolean; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  let text = "";
  let done = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") {
      done = true;
      continue;
    }
    try {
      const json = JSON.parse(payload) as {
        choices?: { delta?: { content?: string } }[];
      };
      text += json.choices?.[0]?.delta?.content ?? "";
    } catch {
      // A comment or keep-alive line; nothing to show.
    }
  }
  return { text, done, rest };
}

/** A chat request the service refused; status 0 when it couldn't be reached at all. */
export class ChatHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Streams a chat reply, calling `onText` with each new piece. */
export async function streamChat(
  endpoint: ChatEndpoint,
  messages: ChatMessage[],
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetchChat(endpoint, messages, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ChatHttpError("The AI service couldn't be reached.", 0);
  }
  if (!response.ok || !response.body) {
    throw new ChatHttpError(`The AI service answered ${response.status}.`, response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseStream(buffer);
    buffer = parsed.rest;
    if (parsed.text) onText(parsed.text);
    if (parsed.done) break;
  }
}

function fetchChat(endpoint: ChatEndpoint, messages: ChatMessage[], signal?: AbortSignal) {
  return fetch(endpoint.url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(endpoint.key ? { Authorization: `Bearer ${endpoint.key}` } : {}),
      ...(endpoint.url === OPENROUTER_CHAT
        ? { "HTTP-Referer": location.origin, "X-Title": "SolveLab" }
        : {}),
    },
    body: JSON.stringify({ model: endpoint.model, messages, stream: true }),
  });
}

/** Models offered on OpenRouter, newest families first, with "auto" to let it pick. */
export async function openRouterModels(fetcher: typeof fetch = fetch): Promise<string[]> {
  try {
    const response = await fetcher("https://openrouter.ai/api/v1/models");
    if (!response.ok) return ["openrouter/auto"];
    const data = (await response.json()) as { data?: { id?: string }[] };
    const ids = (data.data ?? [])
      .map((model) => model.id ?? "")
      .filter((id) => /^(anthropic|openai|google)\//.test(id))
      .slice(0, 30);
    return ["openrouter/auto", ...ids];
  } catch {
    return ["openrouter/auto"];
  }
}
