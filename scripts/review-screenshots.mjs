import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

// Usage: npm run build, serve out/ on :4173 (PORT=4173 npm start),
// then SHOTS=/some/dir node scripts/review-screenshots.mjs
const out = process.env.SHOTS ?? "review-screenshots";
mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";

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
// Skill tests for a ~13 s solver: slow joins between cross and F2L, a few slow OLLs.
const around = (ms, spread, count, slow = []) =>
  Array.from({ length: count }, (_, i) => Math.round(slow[i] ?? ms + gauss() * spread));
const testRuns = [
  ["cross_only", around(1900, 250, 10)],
  ["f2l_only", around(6700, 600, 10)],
  ["oll_only", around(1500, 150, 12, [, 3100, , , , 2900, , , , , 3300])],
  ["pll_only", around(1800, 180, 12)],
  ["cross_f2l", around(9700, 700, 10)],
  ["last_slot", around(1450, 200, 12)],
  ["ls_oll", around(3300, 300, 10)],
  ["oll_pll_only", around(3900, 350, 10)],
  ["cross_unlimited", around(1650, 200, 10)],
  ["tps_test", around(2900, 150, 5)],
].map(([exerciseId, timesMs], i) => {
  const at = new Date(now - (10 - i) * 20 * 60 * 1000).toISOString();
  return {
    id: `run-${exerciseId}`,
    exerciseId,
    createdAt: at,
    completedAt: at,
    updatedAt: at,
    solveIds: [],
    sampleCount: timesMs.length,
    timesMs,
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
    diagnosticRuns: testRuns,
    settings: {
      id: "preferences",
      inspectionSeconds: 0,
      activeSessionId: "main",
      method: "cfop",
      targetMilestone: "sub12",
      trainingNoticeSeen: true,
      holdToStartMs: 300,
      hideTimeWhileRunning: false,
      inspectionAudioCues: false,
      showScramblePreview: true,
    },
  },
};
writeFileSync(`${out}/demo-backup.json`, JSON.stringify(backup));

const browser = await chromium.launch();

// Coach, Stats, Train and Learn need an account. Firebase is blocked and the
// session is seeded, exactly as the e2e suite does it, so nothing reaches Google.
const FIREBASE_HOSTS = /^https:\/\/(identitytoolkit|securetoken|firestore)\.googleapis\.com\//;

// The web API key is the same for every shot, so it is found once, on the
// first, by scanning the loaded chunks; every later shot reuses it.
let firebaseApiKey;

async function findApiKey(page) {
  if (firebaseApiKey !== undefined) return firebaseApiKey;
  await page.goto(`${base}/timer/`);
  firebaseApiKey = await page.evaluate(async () => {
    const urls = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((name) => name.includes("/_next/static/chunks/"));
    for (const url of urls) {
      const match = /AIzaSy[A-Za-z0-9_-]{20,}/.exec(await (await fetch(url)).text());
      if (match) return match[0];
    }
    return null;
  });
  return firebaseApiKey;
}

/** Plants a signed-in session that Firebase reads from localStorage on start-up. */
async function seedAccount(context, page) {
  const apiKey = await findApiKey(page);
  if (!apiKey) return;
  const now = Date.now();
  const uid = "screenshots";
  const user = {
    uid,
    email: `${uid}@example.com`,
    displayName: "Screenshots",
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    providerData: [
      {
        providerId: "google.com",
        uid,
        displayName: "Screenshots",
        email: `${uid}@example.com`,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: `${uid}-refresh`,
      accessToken: `${uid}-access`,
      expirationTime: now + 86_400_000,
    },
    createdAt: String(now),
    lastLoginAt: String(now),
    apiKey,
    appName: "[DEFAULT]",
  };
  await context.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [`firebase:authUser:${apiKey}:[DEFAULT]`, JSON.stringify(user)],
  );
}

async function shoot(name, { width, height, appearance = {}, run }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await context.route(FIREBASE_HOSTS, (route) => route.abort());
  await context.addInitScript((prefs) => {
    localStorage.setItem("solvelab.appearance.v1", JSON.stringify(prefs));
  }, appearance);
  const page = await context.newPage();
  page.on("pageerror", (error) => console.log("pageerror", name, error.message));
  await seedAccount(context, page);
  await page.goto(`${base}/settings/`);
  await page.getByText("Local database ready").waitFor();
  await page.getByTestId("backup-file-input").setInputFiles(`${out}/demo-backup.json`);
  await page.getByRole("radio", { name: /Replace/ }).click();
  await page.getByRole("button", { name: "Replace my data" }).click();
  await page.getByText(/Imported 320 solves/).waitFor();
  await run(page);
  await page.screenshot({ path: `${out}/${name}.png` });
  await context.close();
  console.log("captured", name);
}

const timer = async (page) => {
  await page.goto(`${base}/timer/`);
  await page.getByTestId("scramble").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
};

await shoot("timer-nebula", { width: 1440, height: 900, run: timer });
await shoot("timer-ember-lcd", {
  width: 1440,
  height: 900,
  appearance: { theme: "ember", digitFont: "lcd" },
  run: timer,
});
await shoot("timer-paper-dot", {
  width: 1440,
  height: 900,
  appearance: { theme: "paper", digitFont: "dot" },
  run: timer,
});
await shoot("timer-paper", {
  width: 1440,
  height: 900,
  appearance: { theme: "paper" },
  run: timer,
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
await shoot("appearance-sheet", {
  width: 1440,
  height: 900,
  run: async (page) => {
    await timer(page);
    await page.keyboard.press("t");
    await page.waitForTimeout(600);
  },
});
await shoot("command-palette", {
  width: 1440,
  height: 900,
  run: async (page) => {
    await timer(page);
    await page.keyboard.press("ControlOrMeta+k");
    await page.keyboard.type("sc");
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
await shoot("coach", {
  width: 1440,
  height: 1200,
  run: async (page) => {
    await page.goto(`${base}/coach/`);
    await page.getByTestId("coach-message").waitFor({ timeout: 20000 });
    await page.waitForTimeout(600);
  },
});
await shoot("coach-mobile", {
  width: 390,
  height: 1400,
  run: async (page) => {
    await page.goto(`${base}/coach/`);
    await page.getByTestId("coach-message").waitFor({ timeout: 20000 });
    await page.waitForTimeout(600);
  },
});
await shoot("solve-profile", {
  width: 1440,
  height: 2200,
  run: async (page) => {
    await page.goto(`${base}/stats/profile/`);
    await page.getByTestId("profile-summary").waitFor();
    await page.getByTestId("aspect-row-oll_algorithms").getByRole("button").first().click();
    await page.waitForTimeout(600);
  },
});
await shoot("solve-profile-mobile", {
  width: 390,
  height: 1600,
  run: async (page) => {
    await page.goto(`${base}/stats/profile/`);
    await page.getByTestId("profile-summary").waitFor();
    await page.waitForTimeout(600);
  },
});
await shoot("skill-test", {
  width: 1440,
  height: 1000,
  run: async (page) => {
    await page.goto(`${base}/coach/tests/ls_oll/`);
    await page.getByTestId("scramble").waitFor({ timeout: 20000 });
    await page.waitForTimeout(800);
  },
});
await shoot("skill-test-results", {
  width: 1440,
  height: 1100,
  run: async (page) => {
    await page.goto(`${base}/coach/tests/tps_test/`);
    await page.getByTestId("test-timer-surface").focus();
    for (const ms of [2900, 3100, 2700]) {
      await page.keyboard.down("Space");
      await page.waitForTimeout(450);
      await page.keyboard.up("Space");
      await page.waitForTimeout(ms);
      await page.keyboard.down("Space");
      await page.keyboard.up("Space");
      await page.waitForTimeout(300);
    }
    await page.getByRole("button", { name: "Finish now" }).click();
    await page.getByTestId("test-results").waitFor();
    await page.waitForTimeout(600);
  },
});
await shoot("train-packs", {
  width: 1440,
  height: 1600,
  run: async (page) => {
    await page.goto(`${base}/train/`);
    await page.getByTestId("train-intro").waitFor({ timeout: 20000 });
    await page.waitForTimeout(800);
  },
});
await shoot("train-pack-detail", {
  width: 1440,
  height: 1700,
  run: async (page) => {
    await page.goto(`${base}/learn/lookahead/`);
    await page.getByTestId("pack-progress").waitFor({ timeout: 20000 });
    await page.getByTestId("lesson-lookahead-slow-solves").getByRole("button").first().click();
    await page.waitForTimeout(600);
  },
});
await shoot("train-pack-mobile", {
  width: 390,
  height: 1400,
  run: async (page) => {
    await page.goto(`${base}/learn/lookahead/`);
    await page.getByTestId("pack-progress").waitFor({ timeout: 20000 });
    await page.waitForTimeout(600);
  },
});
await shoot("train-level-pack", {
  width: 1440,
  height: 1600,
  run: async (page) => {
    await page.goto(`${base}/learn/two-look-pll/`);
    await page.getByTestId("pack-progress").waitFor({ timeout: 20000 });
    await page.waitForTimeout(600);
  },
});
await shoot("learn-road", {
  width: 1440,
  height: 3200,
  run: async (page) => {
    await page.goto(`${base}/learn/`);
    await page.getByTestId("level-sub25").waitFor({ timeout: 20000 });
    await page.waitForTimeout(800);
  },
});
await browser.close();
