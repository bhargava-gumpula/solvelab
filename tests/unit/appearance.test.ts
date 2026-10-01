// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APPEARANCE_BOOT_SCRIPT,
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  parseAppearance,
  resolveTheme,
} from "@/lib/appearance/preferences";
import { THEMES } from "@/lib/appearance/themes";
import { commandRegistry } from "@/lib/commands/registry";

function runBootScript(prefersDark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("dark") ? prefersDark : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  new Function(APPEARANCE_BOOT_SCRIPT)();
}

afterEach(() => {
  localStorage.clear();
  const root = document.documentElement;
  root.className = "";
  delete root.dataset.theme;
  delete root.dataset.digits;
});

describe("appearance preferences", () => {
  it("falls back to defaults for missing, corrupt or invalid values", () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance("{not json")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance(JSON.stringify({ theme: "neon" }))).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance(JSON.stringify({ theme: "ember", timerScale: 1.2 }))).toMatchObject({
      theme: "ember",
      timerScale: 1.2,
      digitFont: "clean",
    });
  });

  it("resolves Match system to a dark or light preset", () => {
    // v6: Terracotta is the dark default (owner, 2026-09-30).
    expect(resolveTheme("system", true)).toBe("ember");
    expect(resolveTheme("system", false)).toBe("paper");
    expect(resolveTheme("paper", true)).toBe("paper");
  });

  it("opens a saved Porcelain as Linen (the theme was removed)", () => {
    expect(parseAppearance(JSON.stringify({ theme: "glacier", digitFont: "dot" }))).toMatchObject({
      theme: "paper",
      digitFont: "dot",
    });
    // Only real retired ids map; anything else still falls back to the defaults.
    expect(parseAppearance(JSON.stringify({ theme: "constructor" }))).toEqual(DEFAULT_APPEARANCE);
  });

  it("draws Sage after dark and Linen as the one light paper", () => {
    expect(THEMES.find((theme) => theme.id === "matcha")?.mode).toBe("dark");
    expect(THEMES.filter((theme) => theme.mode === "light").map((theme) => theme.id)).toEqual([
      "paper",
    ]);
  });

  it("defines every preset exactly once with a usable background", () => {
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
    for (const theme of THEMES) {
      if (theme.background.kind === "studio") {
        expect(theme.background.aurora).toHaveLength(2);
        expect(theme.background.rayStrength).toBeGreaterThan(0);
      }
    }
  });

  it("shows unique labels for every preset", () => {
    expect(THEMES.map((theme) => theme.label)).toEqual([
      "Linen",
      "Sage",
      "Ink",
      "Nocturne",
      "Terracotta",
    ]);
  });
});

describe("appearance boot script", () => {
  it("applies the saved theme and digit style before the app loads", () => {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme: "paper", digitFont: "lcd" }),
    );
    runBootScript(true);
    const root = document.documentElement;
    expect(root.dataset.theme).toBe("paper");
    expect(root.dataset.digits).toBe("lcd");
    expect(root.classList.contains("light")).toBe(true);
  });

  it("uses the system preference and survives corrupt storage", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: "system" }));
    runBootScript(false);
    expect(document.documentElement.dataset.theme).toBe("paper");

    document.documentElement.className = "";
    delete document.documentElement.dataset.theme;
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "{broken");
    runBootScript(true);
    // Corrupt storage falls back to the default theme, Terracotta (dark).
    expect(document.documentElement.dataset.theme).toBe("ember");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("opens a saved Porcelain as Linen and Sage dark, with no light flash for Sage", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: "glacier" }));
    runBootScript(true);
    expect(document.documentElement.dataset.theme).toBe("paper");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    document.documentElement.className = "";
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: "matcha" }));
    runBootScript(false);
    expect(document.documentElement.dataset.theme).toBe("matcha");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });
});

describe("command registry", () => {
  it("combines commands from every mounted source and removes them on unmount", () => {
    const listener = vi.fn();
    const unsubscribe = commandRegistry.subscribe(listener);
    const removeShell = commandRegistry.register("shell", [
      { id: "a", label: "A", group: "Navigate", run: () => {} },
    ]);
    const removeTimer = commandRegistry.register("timer", [
      { id: "b", label: "B", group: "Timer", run: () => {} },
    ]);
    expect(commandRegistry.getSnapshot().map((command) => command.id)).toEqual(["a", "b"]);
    removeTimer();
    expect(commandRegistry.getSnapshot().map((command) => command.id)).toEqual(["a"]);
    removeShell();
    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
  });
});
