import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const config = JSON.parse(read("src-tauri/tauri.conf.json"));
const csp: Record<string, string> = config.app.security.csp;
const capability = JSON.parse(read("src-tauri/capabilities/default.json"));

describe("the Mac app shell", () => {
  it("keeps its storage: the bundle identifier never changes (plan 1.4)", () => {
    expect(config.identifier).toBe("com.bhargavagumpula.solvelab");
  });

  it("runs the pages under a tight security policy (plan 1.6)", () => {
    const all = Object.values(csp).join(" ");
    expect(all).not.toMatch(/'unsafe-eval'|'unsafe-hashes'|\*/);
    // A bare scheme ("https:", "wss:") is as open as "*".
    expect(all).not.toMatch(/(^|\s)(https?|wss?):(\s|$)/);
    expect(csp["default-src"]).toBe("'self'");
    expect(csp["script-src"]).toBe("'self' 'wasm-unsafe-eval'");
    expect(csp["object-src"]).toBe("'none'");
    const [self, ipc, ipcHttp, ollama, supabase, realtime, ...rest] = csp["connect-src"].split(" ");
    expect([self, ipc, ipcHttp, ollama, rest]).toEqual([
      "'self'",
      "ipc:",
      "http://ipc.localhost",
      "http://127.0.0.1:11434",
      [],
    ]);
    expect(supabase).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    expect(realtime).toBe(supabase.replace("https:", "wss:"));
  });

  it("grants the page only the sign-in deep link and https links", () => {
    // Every file in capabilities/ is applied, so a second one could widen this.
    expect(readdirSync(new URL("../../src-tauri/capabilities", import.meta.url))).toEqual([
      "default.json",
    ]);
    expect(capability.windows).toEqual(["main"]);
    expect(capability.remote).toBeUndefined();
    expect(capability.permissions).toEqual([
      "core:event:allow-listen",
      "core:event:allow-unlisten",
      "deep-link:allow-get-current",
      { identifier: "opener:allow-open-url", allow: [{ url: "https://*" }] },
    ]);
  });

  it("leaves Space to the timer: no menu accelerator uses it (plan 1.5)", () => {
    const accelerators = [...read("src-tauri/src/menu.rs").matchAll(/Some\("([^"]*)"\)/g)].map(
      (m) => m[1],
    );
    expect(accelerators).toContain("CmdOrCtrl+,");
    expect(accelerators.filter((key) => /space/i.test(key))).toEqual([]);
  });
});
