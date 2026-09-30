import { afterEach, describe, expect, it, vi } from "vitest";
import { setUpServiceWorker } from "@/lib/offline/service-worker";

function fakeWorkers(existing = 0) {
  const unregister = vi.fn(async () => true);
  const register = vi.fn(async () => ({}));
  const getRegistrations = vi.fn(async () =>
    Array.from({ length: existing }, () => ({ unregister })),
  );
  vi.stubGlobal("navigator", { serviceWorker: { register, getRegistrations } });
  return { register, unregister };
}

afterEach(() => vi.unstubAllGlobals());

describe("setting up the service worker", () => {
  it("registers under the base path in a production build", async () => {
    const { register } = fakeWorkers();
    expect(await setUpServiceWorker({ production: true, base: "/solvelab", enabled: true })).toBe(
      "registered",
    );
    expect(register).toHaveBeenCalledWith("/solvelab/sw.js", { scope: "/solvelab/" });
  });

  it("never registers in development, and removes a worker left from a build", async () => {
    const { register, unregister } = fakeWorkers(1);
    expect(await setUpServiceWorker({ production: false, base: "", enabled: true })).toBe(
      "removed",
    );
    expect(register).not.toHaveBeenCalled();
    expect(unregister).toHaveBeenCalledOnce();
  });

  it("removes itself when the feature is turned off", async () => {
    const { register, unregister } = fakeWorkers(2);
    expect(await setUpServiceWorker({ production: true, base: "", enabled: false })).toBe(
      "removed",
    );
    expect(register).not.toHaveBeenCalled();
    expect(unregister).toHaveBeenCalledTimes(2);
  });

  it("does nothing where service workers aren't available", async () => {
    vi.stubGlobal("navigator", {});
    expect(await setUpServiceWorker({ production: true, base: "", enabled: true })).toBe("skipped");
  });
});
