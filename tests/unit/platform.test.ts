import { afterEach, describe, expect, it, vi } from "vitest";
import { isDesktop, resolveTarget, target } from "@/lib/config/platform";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function featuresFor(value: string | undefined) {
  if (value === undefined) vi.stubEnv("NEXT_PUBLIC_SOLVELAB_TARGET", "");
  else vi.stubEnv("NEXT_PUBLIC_SOLVELAB_TARGET", value);
  vi.resetModules();
  return (await import("@/lib/config/features")).features;
}

describe("build target", () => {
  it("is the website unless it is exactly desktop", () => {
    expect(resolveTarget(undefined)).toBe("web");
    expect(resolveTarget("")).toBe("web");
    expect(resolveTarget("web")).toBe("web");
    expect(resolveTarget("Desktop")).toBe("web");
    expect(resolveTarget("desktop")).toBe("desktop");
  });

  it("reads NEXT_PUBLIC_SOLVELAB_TARGET", () => {
    vi.stubEnv("NEXT_PUBLIC_SOLVELAB_TARGET", "desktop");
    expect(target()).toBe("desktop");
    expect(isDesktop()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_SOLVELAB_TARGET", "web");
    expect(isDesktop()).toBe(false);
  });
});

describe("feature flags per target", () => {
  it("web: no coach chat, offline worker and Bluetooth timers on", async () => {
    const features = await featuresFor("web");
    expect(features.coachChat).toBe(false);
    expect(features.offline).toBe(true);
    expect(features.bluetoothTimer).toBe(true);
  });

  it("defaults to the web build when the target is unset", async () => {
    const features = await featuresFor(undefined);
    expect(features.coachChat).toBe(false);
    expect(features.offline).toBe(true);
  });

  it("desktop: coach chat on, offline worker and Bluetooth timers off", async () => {
    const features = await featuresFor("desktop");
    expect(features.coachChat).toBe(true);
    expect(features.offline).toBe(false);
    expect(features.bluetoothTimer).toBe(false);
  });
});
