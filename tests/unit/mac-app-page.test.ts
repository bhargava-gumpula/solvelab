// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { getCourse } from "@/data/hub/courses";
import { AI_KEYS_REMOVED_NOTE, wipeSavedAiKeys } from "@/lib/ai/legacy-keys";
import { profileSummary } from "@/lib/ai/summary";
import { isDesktop, visitorDevice } from "@/lib/config/mac-app";
import { buildSolveProfile } from "@/lib/coach/profile";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("wiping saved AI keys", () => {
  it("deletes an OpenRouter key, an API key and the sign-in check, and says so", () => {
    localStorage.setItem("solvelab.ai.openrouter", "sk-or-secret");
    localStorage.setItem("solvelab.ai.apiKey", '{"provider":"gemini","key":"AIza-secret"}');
    localStorage.setItem("solvelab.appearance.v1", "kept");
    sessionStorage.setItem("solvelab.ai.openrouterVerifier", "verifier");
    expect(wipeSavedAiKeys(localStorage, sessionStorage)).toBe(true);
    expect(localStorage.getItem("solvelab.ai.openrouter")).toBeNull();
    expect(localStorage.getItem("solvelab.ai.apiKey")).toBeNull();
    expect(sessionStorage.getItem("solvelab.ai.openrouterVerifier")).toBeNull();
    expect(localStorage.getItem("solvelab.appearance.v1")).toBe("kept");
  });

  it("removes a key even when only the other one was saved", () => {
    localStorage.setItem("solvelab.ai.apiKey", "x");
    expect(wipeSavedAiKeys(localStorage, sessionStorage)).toBe(true);
    expect(localStorage.getItem("solvelab.ai.apiKey")).toBeNull();
  });

  it("stays quiet when there was nothing, or only a sign-in check, to remove", () => {
    expect(wipeSavedAiKeys(localStorage, sessionStorage)).toBe(false);
    sessionStorage.setItem("solvelab.ai.openrouterVerifier", "verifier");
    expect(wipeSavedAiKeys(localStorage, sessionStorage)).toBe(false);
    expect(sessionStorage.getItem("solvelab.ai.openrouterVerifier")).toBeNull();
  });

  it("copes with blocked storage", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(wipeSavedAiKeys(blocked, blocked)).toBe(false);
  });

  it("tells the person where the coach went and that the key can be revoked", () => {
    expect(AI_KEYS_REMOVED_NOTE).toMatch(/Mac app/);
    expect(AI_KEYS_REMOVED_NOTE).toMatch(/revoke/);
  });
});

describe("Copy my summary", () => {
  const base = buildSolveProfile({ runs: [], solves: [], goalMilestoneId: "sub12", snapshots: [] });
  const text = profileSummary({
    profile: base,
    averageMs: 13_420,
    course: getCourse("sub-12")!,
    picks: [],
    intro: undefined,
  });

  it("is the numbers-only context, with an opener for whatever AI it's pasted into", () => {
    expect(text).toContain("Goal: Sub 12");
    expect(text).toContain("Timer average: 13.42 s");
    expect(text).toContain("Solve profile");
  });

  it("never carries identity, notes or scrambles", () => {
    expect(text).not.toMatch(/@|email|uid|scramble|note/i);
  });
});

describe("where the coach lives", () => {
  it("is only on in the desktop build", () => {
    expect(isDesktop()).toBe(false);
    process.env.NEXT_PUBLIC_SOLVELAB_TARGET = "desktop";
    expect(isDesktop()).toBe(true);
    delete process.env.NEXT_PUBLIC_SOLVELAB_TARGET;
  });

  it("tells a Mac from a phone, a Windows PC and an iPad in desktop mode", () => {
    const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";
    expect(visitorDevice(mac, 0)).toBe("mac");
    expect(visitorDevice(mac, 5)).toBe("other");
    expect(visitorDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe(
      "other",
    );
    expect(visitorDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 0)).toBe("other");
  });
});
