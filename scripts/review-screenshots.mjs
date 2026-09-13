import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
// Usage: npm run build, serve out/ on :4173, then SHOTS=/some/dir node scripts/review-screenshots.mjs
const out = process.env.SHOTS ?? "review-screenshots";
mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:4173";

// Realistic practice data: ~320 solves over 20 days, improving from ~16 s to ~12.5 s.
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const gauss = () => Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
const now = Date.now();
const solves = Array.from({ length: 320 }, (_, i) => {
  const mean = 16200 - (i / 320) * 3600;
  let t = mean + gauss() * 1300;
  if (rand() < 0.03) t += 6000;
  const penalty = rand() < 0.015 ? "dnf" : rand() < 0.03 ? "plus2" : "none";
  return {
    id: `s${i}`,
    sessionId: "main",
    event: "333",
    scramble: "D2 F2 U' L2 U B2 U F2 R2 D' F2 L' B' U2 R' F L2 D' B' L'",
    rawTimeMs: Math.round(Math.max(8000, t)),
    penalty,
    createdAt: new Date(now - (320 - i) * 90 * 60 * 1000).toISOString(),
    source: "normal",
    ...(i === 318 ? { notes: "Lockup on the last pair" } : {}),
  };
});
const backup = {
  format: "speedcubing-local-backup",
  version: 1,
  exportedAt: new Date().toISOString(),
  app: { name: "SolveLab", schemaVersion: 2 },
  data: {
    sessions: [
      {
        id: "main",
        name: "Main",
        event: "333",
        createdAt: new Date(now - 30 * 864e5).toISOString(),
        sortOrder: 0,
      },
      {
        id: "oh",
        name: "PLL Practice",
        event: "333",
        createdAt: new Date(now - 10 * 864e5).toISOString(),
        sortOrder: 1,
      },
    ],
    solves,
    settings: {
      id: "preferences",
      inspectionSeconds: 0,
      activeSessionId: "main",
      method: "cfop",
      targetMilestone: null,
      holdToStartMs: 300,
      hideTimeWhileRunning: false,
      inspectionAudioCues: false,
      showScramblePreview: true,
    },
  },
};
writeFileSync(`${out}/demo-backup.json`, JSON.stringify(backup));

const browser = await chromium.launch();
async function shoot(name, { width, height, scheme = "dark", run }) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: scheme,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("pageerror", name, e.message));
  await page.goto(`${base}/settings/`);
  await page.getByText("Local database ready").waitFor();
  if (scheme === "light") await page.getByRole("radio", { name: "Light" }).check();
  await page.getByTestId("backup-file-input").setInputFiles(`${out}/demo-backup.json`);
  await page.getByRole("radio", { name: /Replace/ }).click();
  await page.getByRole("button", { name: "Replace my data" }).click();
  await page.getByText(/Imported 320 solves/).waitFor();
  await run(page);
  await page.screenshot({ path: `${out}/${name}.png` });
  await context.close();
}
const timer = async (page) => {
  await page.goto(`${base}/timer/`);
  await page.getByTestId("scramble").waitFor({ timeout: 20000 });
  await page.waitForTimeout(600);
};
await shoot("timer-desktop-dark", { width: 1440, height: 900, run: timer });
await shoot("timer-desktop-light", { width: 1440, height: 900, scheme: "light", run: timer });
await shoot("timer-running", {
  width: 1440,
  height: 900,
  run: async (page) => {
    await timer(page);
    await page.keyboard.down("Space");
    await page.waitForTimeout(400);
    await page.keyboard.up("Space");
    await page.waitForTimeout(2300);
  },
});
await shoot("timer-holding", {
  width: 1440,
  height: 900,
  run: async (page) => {
    await timer(page);
    await page.keyboard.down("Space");
    await page.waitForTimeout(500);
  },
});
await shoot("timer-mobile", { width: 390, height: 844, run: timer });
await shoot("solve-dialog", {
  width: 1440,
  height: 900,
  run: async (page) => {
    await timer(page);
    await page.getByRole("button", { name: /^Solve 319:/ }).click();
    await page.waitForTimeout(400);
  },
});
await shoot("stats-desktop", {
  width: 1440,
  height: 1500,
  run: async (page) => {
    await page.goto(`${base}/stats/`);
    await page.locator(".recharts-surface").first().waitFor();
    await page.waitForTimeout(800);
  },
});
await shoot("stats-mobile", {
  width: 390,
  height: 1600,
  run: async (page) => {
    await page.goto(`${base}/stats/`);
    await page.locator(".recharts-surface").first().waitFor();
    await page.waitForTimeout(800);
  },
});
await shoot("settings", {
  width: 1440,
  height: 1100,
  run: async (page) => {
    await page.goto(`${base}/settings/`);
    await page.waitForTimeout(400);
  },
});
await shoot("coach", {
  width: 1440,
  height: 900,
  run: async (page) => {
    await page.goto(`${base}/coach/`);
    await page.waitForTimeout(300);
  },
});
await browser.close();
