// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash, webcrypto } from "node:crypto";
import { getCourse } from "@/data/hub/courses";
import { TRAINING_PACKS } from "@/data/training";
import { HOLD_RULE } from "@/lib/config/cube";
import { COACH_INSTRUCTIONS, coachContext, coachPrompt, coachSystemPrompt } from "@/lib/ai/context";
import {
  challengeFor,
  completeOpenRouterSignIn,
  handOff,
  MAX_HAND_OFF_URL,
  openRouterSignInUrl,
  parseStream,
} from "@/lib/ai/providers";
import { buildSolveProfile } from "@/lib/coach/profile";

// jsdom's crypto lacks subtle; the browser has it.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto });
}

const profile = () => {
  const base = buildSolveProfile({
    runs: [],
    solves: [],
    goalMilestoneId: "sub12",
    snapshots: [],
  });
  return {
    ...base,
    aspects: base.aspects.map((aspect) =>
      aspect.id === "lookahead" ? { ...aspect, value: 1900, tag: "slow" as const } : aspect,
    ),
  };
};

const context = () =>
  coachContext({
    profile: profile(),
    averageMs: 13_420,
    course: getCourse("sub-12")!,
    picks: [
      { title: "Lookahead, properly", reason: "Likely holding you back: Lookahead (92% sure)" },
    ],
    intro: {
      average: "12-15",
      slowParts: ["pauses"],
      pll: "all",
      oll: "some",
      practice: "60",
      answeredAt: "2026-09-26T10:00:00.000Z",
      completedAt: null,
    },
  });

describe("what the AI is told", () => {
  it("summarises the profile, goal, course and what they said", () => {
    const text = context();
    expect(text).toContain("Goal: Sub 12");
    expect(text).toContain("Timer average: 13.42 s");
    expect(text).toContain("Current course: Sub-12");
    expect(text).toContain("- Lookahead: 1.90 s");
    expect(text).toContain("(slow)");
    expect(text).toContain("What they say feels slow: Pausing to find the next pair");
    expect(text).toContain("Lookahead, properly: Likely holding you back");
  });

  it("never carries identity, notes or scrambles", () => {
    // The fixed instructions name the scramble orientation; the rest is their data.
    const text = coachPrompt(context(), "What next?").replace(COACH_INSTRUCTIONS, "");
    expect(text).not.toMatch(/@|email|uid|scramble|note/i);
  });

  it("tells the AI how the cube is held while solving", () => {
    expect(coachSystemPrompt(context())).toContain(HOLD_RULE);
  });

  it("lists every pack by name, so the answer can only point at real ones", () => {
    const system = coachSystemPrompt(context());
    for (const pack of TRAINING_PACKS) expect(system).toContain(`- ${pack.title}`);
  });

  it("uses a default question when none is typed", () => {
    expect(coachPrompt(context(), "  ")).toContain("What should I work on next, and how?");
  });
});

describe("handing off to a subscription", () => {
  it("opens Claude and ChatGPT with the prompt filled in", () => {
    expect(handOff("claude", "hi there").url).toBe("https://claude.ai/new?q=hi%20there");
    expect(handOff("chatgpt", "hi").url).toBe("https://chatgpt.com/?q=hi");
    expect(handOff("claude", "hi").paste).toBe(false);
  });

  it("falls back to pasting when the link would be too long, and always for Gemini", () => {
    const long = "x".repeat(MAX_HAND_OFF_URL);
    expect(handOff("claude", long)).toEqual({ url: "https://claude.ai/new", paste: true });
    expect(handOff("gemini", "hi")).toEqual({ url: "https://gemini.google.com/app", paste: true });
  });

  it("fits a real prompt in a link", () => {
    expect(handOff("claude", coachPrompt(context(), "What next?")).paste).toBe(false);
  });
});

describe("signing in with OpenRouter", () => {
  afterEach(() => sessionStorage.clear());

  it("uses the standard PKCE challenge: SHA-256 of the verifier, base64url", async () => {
    const verifier = "a-verifier-of-reasonable-length-for-pkce-0123456789";
    const expected = createHash("sha256").update(verifier).digest("base64url");
    expect(await challengeFor(verifier)).toBe(expected);
  });

  it("sends the person to OpenRouter with a challenge and the way back", async () => {
    const url = new URL(await openRouterSignInUrl("https://solvelab.test/hub/ask/"));
    expect(url.origin).toBe("https://openrouter.ai");
    expect(url.searchParams.get("callback_url")).toBe("https://solvelab.test/hub/ask/");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("exchanges a code only for a sign-in this tab started", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ key: "sk-or-test" })));
    // No sign-in was started here: a code from a link is ignored without a request.
    expect(await completeOpenRouterSignIn("stray-code", fetcher)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();

    await openRouterSignInUrl("https://solvelab.test/hub/ask/");
    expect(await completeOpenRouterSignIn("the-code", fetcher)).toBe("sk-or-test");
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, string>;
    expect(body.code).toBe("the-code");
    expect(body.code_verifier).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    // The verifier is single-use.
    expect(await completeOpenRouterSignIn("the-code", fetcher)).toBeNull();
  });

  it("returns nothing when OpenRouter refuses", async () => {
    await openRouterSignInUrl("https://solvelab.test/hub/ask/");
    const fetcher = vi.fn(async () => new Response("no", { status: 403 }));
    expect(await completeOpenRouterSignIn("bad", fetcher)).toBeNull();
  });
});

describe("reading a streamed answer", () => {
  it("joins the text pieces, keeps half a line for later, and notices the end", () => {
    const chunk =
      'data: {"choices":[{"delta":{"content":"Work on "}}]}\n' +
      ": keep-alive\n" +
      'data: {"choices":[{"delta":{"content":"lookahead."}}]}\n' +
      'data: {"choices":[{"delta":{"con';
    const first = parseStream(chunk);
    expect(first.text).toBe("Work on lookahead.");
    expect(first.done).toBe(false);
    const second = parseStream(`${first.rest}tent":"!"}}]}\ndata: [DONE]\n`);
    expect(second.text).toBe("!");
    expect(second.done).toBe(true);
  });
});
