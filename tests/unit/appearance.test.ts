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
    expect(resolveTheme("system", true)).toBe("nebula");
    expect(resolveTheme("system", false)).toBe("paper");
    expect(resolveTheme("glacier", false)).toBe("glacier");
  });

  it("defines every preset exactly once with a usable background", () => {
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
    for (const theme of THEMES) {
      if (theme.background.kind === "mesh")
        expect(theme.background.colors.length).toBeGreaterThanOrEqual(4);
    }
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

    localStorage.setItem(APPEARANCE_STORAGE_KEY, "{broken");
    runBootScript(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
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
