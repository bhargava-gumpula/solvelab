/**
 * App smoke suite (docs/DESKTOP_APP_PLAN.md section 6). Launches the real Mac
 * app, built with the test-only `smoke` feature, and lets its init script
 * (src-tauri/src/smoke.js) walk the main pages inside WKWebView. Fails on any
 * Content-Security-Policy violation, a failed IPC health check, the 3D cube or
 * cubing.js not working, Ollama or Supabase being blocked, a website loading in the
 * app window, or tabFocusesLinks off.
 *
 * Build the pages without account settings (CI has none; locally, blank them so
 * .env.local doesn't apply), so the Hub, Stats and Train aren't behind the sign-in wall:
 *
 *   NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_FIREBASE_API_KEY= npm run build:desktop
 *   npx tauri build --bundles app --features smoke
 *   npm run test:app [path/to/SolveLab.app]
 *
 * Ollama: a stand-in answers on 127.0.0.1:11434 unless a real Ollama is running there.
 */
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { createServer } from "node:http";
import { createInterface } from "node:readline";

const app = process.argv[2] ?? "src-tauri/target/release/bundle/macos/SolveLab.app";
const binDir = `${app}/Contents/MacOS`;
const bin = `${binDir}/${readdirSync(binDir)[0]}`;
const TIMEOUT_MS = 180_000;

const stub = createServer((_request, response) => {
  response.writeHead(200, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  });
  response.end('{"version":"smoke-stub"}');
});
await new Promise((resolve, reject) => {
  stub.once("error", (error) => {
    if (error.code !== "EADDRINUSE") return reject(error);
    console.log("Something already answers on 127.0.0.1:11434 (Ollama?); using it.");
    resolve();
  });
  stub.listen(11434, "127.0.0.1", resolve);
});

const events = [];
const child = spawn(bin, [], { stdio: ["ignore", "pipe", "inherit"] });
const finished = new Promise((resolve) => {
  const timer = setTimeout(() => resolve("timeout"), TIMEOUT_MS);
  child.on(
    "exit",
    (code, signal) => (clearTimeout(timer), resolve(`app exited (${signal ?? code})`)),
  );
  createInterface({ input: child.stdout }).on("line", (line) => {
    const match = /^SMOKE (\S+) (.*)$/.exec(line);
    if (!match) return;
    const event = { kind: match[1], data: JSON.parse(match[2]) };
    events.push(event);
    console.log(`${event.kind.padEnd(12)} ${JSON.stringify(event.data)}`);
    if (event.kind === "done") {
      clearTimeout(timer);
      resolve("done");
    }
  });
});
const outcome = await finished;
child.kill();
stub.close();
console.log(`outcome: ${outcome}`);

const of = (kind) => events.filter((event) => event.kind === kind).map((event) => event.data);
const pages = of("page");
const page = (route) => pages.find((entry) => entry.route === route) ?? {};
const lesson = pages.find((entry) => entry.route?.startsWith("/hub/lesson/")) ?? {};
const network = of("network")[0] ?? {};
const checks = {
  "the walk finished": outcome === "done",
  "every page reported": pages.length === of("done")[0]?.pages,
  "IPC health check answers": network.health?.ok === true,
  "the policy has no 'unsafe-eval'":
    /connect-src/.test(network.health?.value?.csp) &&
    !/'unsafe-eval'/.test(network.health.value.csp),
  "no policy violations": of("csp").length === 0,
  "the policy blocks an unlisted address":
    network.blocked?.ok === false && of("csp-expected").length > 0,
  "Ollama (127.0.0.1:11434) is reachable": network.ollama?.ok === true,
  "Supabase (https) is reachable": network.supabase?.ok === true,
  "Supabase realtime (wss) is not blocked": network.realtime?.ok === true,
  "a website can't load in the app window": network.navigation === "tauri:",
  "Timer: 3D cube canvas": page("/timer/").canvas > 0 && page("/timer/").webgl === true,
  "Timer: 3x3 scramble (cubing.js worker)": page("/timer/").scramble333?.ok === true,
  "Timer: 2x2 scramble (cubing.js WebAssembly)": page("/timer/").scramble222?.ok === true,
  "Lesson: 3D cube player": lesson.twisty === true,
  "Tab focuses links": of("pref")[0]?.tabFocusesLinks === true,
};

console.log("");
for (const [name, ok] of Object.entries(checks)) console.log(`${ok ? "pass" : "FAIL"}  ${name}`);
if (lesson.signInWall)
  console.log(
    "\nThe Hub showed the sign-in wall: build the pages without account settings (see the top of this file).",
  );
if (of("error").length)
  console.log(`\n${of("error").length} page error(s) reported above (not failures).`);
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
