import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isDesktop, resolveTarget, target } from "@/lib/config/platform";
import { resolveInputSource } from "@/lib/timer/input";

vi.mock("@/components/timer/timer-device-provider", () => ({
  useTimerDevice: () => ({
    session: { connected: false, mode: "idle" },
    connectBluetooth: vi.fn(),
    connectSimulator: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function featuresFor(value: string | undefined) {
  vi.stubEnv("NEXT_PUBLIC_SOLVELAB_TARGET", value);
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
    expect(process.env.NEXT_PUBLIC_SOLVELAB_TARGET).toBeUndefined();
    expect(features.coachChat).toBe(false);
    expect(features.offline).toBe(true);
    expect(features.bluetoothTimer).toBe(true);
  });

  it("desktop: coach chat on, offline worker and Bluetooth timers off", async () => {
    const features = await featuresFor("desktop");
    expect(features.coachChat).toBe(true);
    expect(features.offline).toBe(false);
    expect(features.bluetoothTimer).toBe(false);
  });
});

describe("Bluetooth timers in the Mac app", () => {
  it("a synced Bluetooth setting means the keyboard where Web Bluetooth is missing", () => {
    expect(resolveInputSource("bluetooth", true)).toBe("bluetooth");
    expect(resolveInputSource("bluetooth", false)).toBe("keyboard");
    expect(resolveInputSource("keyboard", true)).toBe("keyboard");
    expect(resolveInputSource(undefined, true)).toBe("keyboard");
  });

  async function settingsMarkup(value: string) {
    vi.stubEnv("NEXT_PUBLIC_SOLVELAB_TARGET", value);
    vi.resetModules();
    const { HardwareTimerControls } = await import("@/components/settings/hardware-timer-section");
    return renderToStaticMarkup(
      createElement(HardwareTimerControls, {
        timerInput: "bluetooth",
        bluetoothTimerBrand: "auto",
        onChangeTimerInput: () => undefined,
        onChangeBrand: () => undefined,
      }),
    );
  }

  it("the website's settings offer the Bluetooth timer", async () => {
    const html = await settingsMarkup("web");
    expect(html).toContain("Bluetooth timer");
    expect(html).toContain("Timer brand");
  });

  it("the app's settings only say Space and point to the website", async () => {
    const html = await settingsMarkup("desktop");
    expect(html).toContain("Keyboard (Space). Bluetooth timers: use the website in Chrome.");
    expect(html).not.toContain("Timer brand");
    expect(html).not.toContain("<button");
  });
});
