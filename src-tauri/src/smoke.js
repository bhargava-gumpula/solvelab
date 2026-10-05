// Test-only (cargo feature `smoke`): runs in the real app window on every page
// load, walks the main pages and reports policy violations and a few checks to
// the Rust side, which prints them for scripts/desktop-smoke.mjs.
(() => {
  if (window !== window.top) return;
  const ROUTES = [
    "/timer/",
    "/hub/",
    "/hub/lesson/method-cfop/cfop-2look-oll/",
    "/train/",
    "/algorithms/",
    "/stats/",
    "/settings/",
    "/hub/ask/",
  ];
  const SETTLE_MS = 4000;
  const invoke = (cmd, args) => window.__TAURI_INTERNALS__.invoke(cmd, args);
  const report = (kind, data) =>
    invoke("smoke_report", { kind, data: JSON.stringify(data) }).catch(() => {});
  // A full page load each time, so every page meets the policy from a cold start.
  const open = (route) => location.assign(new URL(route, location.href));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const attempt = async (run, ms = 20000) => {
    try {
      const timeout = sleep(ms).then(() => Promise.reject(new Error(`timed out after ${ms} ms`)));
      return { ok: true, value: await Promise.race([run(), timeout]) };
    } catch (error) {
      return { ok: false, error: String(error?.message ?? error) };
    }
  };

  let expectViolation = false;
  document.addEventListener("securitypolicyviolation", (event) =>
    report(expectViolation ? "csp-expected" : "csp", {
      page: location.pathname,
      directive: event.effectiveDirective,
      blocked: event.blockedURI,
      source: event.sourceFile,
      line: event.lineNumber,
      sample: event.sample,
    }),
  );
  addEventListener("error", (event) =>
    report("error", {
      page: location.pathname,
      message: String(event.message),
      source: event.filename,
    }),
  );
  addEventListener("unhandledrejection", (event) =>
    report("error", {
      page: location.pathname,
      message: String(event.reason?.message ?? event.reason),
    }),
  );

  async function pageChecks(route) {
    if (route === "/timer/") {
      // The Timer's 3D cube, and cubing.js in its worker: 3x3 is plain JS, 2x2 needs WebAssembly.
      const cubing = () => import(new URL("/vendor/cubing/scramble.js", location.href).href);
      const scramble = (event) =>
        attempt(async () => String(await (await cubing()).randomScrambleForEvent(event)));
      return {
        canvas: document.querySelectorAll("canvas").length,
        webgl: Boolean(document.createElement("canvas").getContext("webgl2")),
        scramble333: await scramble("333"),
        scramble222: await scramble("222"),
      };
    }
    if (route.startsWith("/hub/lesson/")) {
      // Continue through the cards to the first worked example on the 3D cube.
      const watch = () => document.querySelector('[data-testid="lesson-step-watch"]');
      for (let i = 0; i < 30 && !watch(); i++) {
        const next = document.querySelector('[data-testid="lesson-continue"]');
        if (next && !next.disabled) next.click();
        await sleep(700);
      }
      await sleep(2500);
      const player = watch()?.querySelector("twisty-player");
      const card = document.querySelector("section[data-testid^='lesson-step-']")?.dataset.testid;
      const next = document.querySelector('[data-testid="lesson-continue"]');
      return {
        card,
        signInWall: Boolean(document.querySelector('[data-testid="sign-in-wall"]')),
        continue: next ? (next.disabled ? "disabled" : "enabled") : "missing",
        twisty: Boolean(player) && player.getBoundingClientRect().width > 0,
      };
    }
    return {};
  }

  async function networkChecks() {
    // The health check answers with the app's policy, so the checks below follow tauri.conf.json.
    const health = await attempt(() => invoke("smoke_health"), 5000);
    const connect = (health.value?.csp.match(/connect-src([^;]*)/)?.[1] ?? "").trim().split(/\s+/);
    const supabase = connect.find((source) => /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(source));
    const status = (url) => attempt(async () => (await fetch(url)).status, 10000);
    const result = {
      health,
      ollama: await status("http://127.0.0.1:11434/api/version"),
      supabase: supabase
        ? await status(`${supabase}/auth/v1/health`)
        : { ok: false, error: "no Supabase origin in connect-src" },
      realtime: supabase
        ? await attempt(
            () =>
              new Promise((resolve) => {
                // Without a key the server refuses the handshake; only a policy block counts (as a "csp" report).
                const socket = new WebSocket(
                  `${supabase.replace("https:", "wss:")}/realtime/v1/websocket?vsn=1.0.0`,
                );
                socket.onopen = () => (socket.close(), resolve("open"));
                socket.onerror = () => resolve("refused by the server");
              }),
            10000,
          )
        : { ok: false, error: "no Supabase origin in connect-src" },
    };
    // The policy must actually be enforced: an address it doesn't list has to be blocked.
    expectViolation = true;
    result.blocked = await status("https://example.com/");
    await sleep(500);
    expectViolation = false;
    // The navigation guard: no website may load in the app window (http isn't handed to the browser
    // either, so this opens nothing). If it loaded, this page would be gone and the walk would never finish.
    location.assign("http://127.0.0.1:11434/navigation-guard");
    await sleep(2000);
    result.navigation = location.protocol;
    return result;
  }

  addEventListener("load", async () => {
    const stored = sessionStorage.getItem("smoke-step");
    report("load", { path: location.pathname, step: stored });
    // The app opens on "/", which forwards to the last section used; start the walk from a known page.
    if (stored === null) {
      sessionStorage.setItem("smoke-step", "0");
      return open(ROUTES[0]);
    }
    const step = Number(stored);
    await sleep(SETTLE_MS);
    const route = ROUTES[step];
    // Awaited, so leaving the page can't drop it.
    await report("page", {
      route,
      path: location.pathname,
      title: document.title,
      ...(await pageChecks(route)),
    });
    if (step + 1 < ROUTES.length) {
      sessionStorage.setItem("smoke-step", String(step + 1));
      open(ROUTES[step + 1]);
    } else {
      await report("network", await networkChecks());
      await report("done", { pages: ROUTES.length });
    }
  });
})();
