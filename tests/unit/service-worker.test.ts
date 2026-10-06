import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
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

/** Runs public/sw.js against an in-memory Cache Storage and a fake network. */
function loadWorker(online: { value: boolean }) {
  const stores = new Map<string, Map<string, Response>>();
  const keyOf = (key: RequestInfo) => (typeof key === "string" ? key : key.url);
  const cacheFor = (name: string) => {
    const store = stores.get(name) ?? new Map<string, Response>();
    stores.set(name, store);
    return {
      put: async (key: RequestInfo, response: Response) => void store.set(keyOf(key), response),
      match: async (key: RequestInfo) => store.get(keyOf(key))?.clone(),
    };
  };
  const listeners: Record<string, (event: unknown) => void> = {};
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self: {
      registration: { scope: "https://solvelab.test/" },
      addEventListener: (type: string, listener: (event: unknown) => void) =>
        (listeners[type] = listener),
    },
    caches: { open: async (name: string) => cacheFor(name) },
    fetch: async (request: Request) => {
      if (!online.value) throw new TypeError("offline");
      const response = new Response(`page ${new URL(request.url).pathname}`);
      Object.defineProperty(response, "type", { value: "basic" });
      return response;
    },
    URL,
  });
  async function navigate(url: string) {
    let answer: Promise<Response> | undefined;
    listeners.fetch!({
      request: { url, method: "GET", mode: "navigate" },
      respondWith: (response: Promise<Response>) => (answer = response),
    });
    return answer!;
  }
  const pages = () =>
    [...stores].flatMap(([name, store]) =>
      name.startsWith("solvelab-pages-") ? [...store.keys()] : [],
    );
  return { navigate, pages };
}

describe("the service worker's page cache", () => {
  it("never keeps the sign-in return or a URL carrying an auth code", async () => {
    const worker = loadWorker({ value: true });
    await worker.navigate("https://solvelab.test/signed-in/?code=secret-code");
    await worker.navigate("https://solvelab.test/signed-in/");
    await worker.navigate("https://solvelab.test/timer/?code=secret-code&state=s");
    expect(worker.pages()).toEqual([]);
  });

  it("keeps a page under its path only and serves it offline whatever the query", async () => {
    const online = { value: true };
    const worker = loadWorker(online);
    await worker.navigate("https://solvelab.test/timer/?ref=a");
    await worker.navigate("https://solvelab.test/timer/?ref=b");
    expect(worker.pages()).toEqual(["https://solvelab.test/timer/"]);
    online.value = false;
    const kept = await worker.navigate("https://solvelab.test/timer/?ref=c");
    expect(await kept.text()).toBe("page /timer/");
  });
});
