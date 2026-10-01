// A believable local history for the draft screenshots (shared by
// draft-pages.mjs and hub-interactions.mjs): ~850 solves over 110 days, the
// core Hub tests, two read lessons and a finished questionnaire, imported
// through Settings → Import like the e2e helpers do.
/* ── A believable history: ~110 days, trending from ~16 s to ~12.8 s ── */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeHistory() {
  const random = seededRandom(7);
  const gauss = () => {
    const u = 1 - random();
    const v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const now = new Date();
  const days = 110;
  const solves = [];
  for (let back = days; back >= 0; back--) {
    // Most days practised, a few gaps, heavier weekends.
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    if (back > 0 && random() < (weekend ? 0.12 : 0.3)) continue;
    const count = back === 0 ? 14 : Math.round((weekend ? 9 : 4) + random() * 8);
    const hour = random() < 0.7 ? 19 + Math.floor(random() * 3) : 7 + Math.floor(random() * 9);
    for (let index = 0; index < count; index++) {
      const progress = 1 - back / days;
      const evening = hour >= 19 ? -600 : 700;
      const mean = 16200 - progress * 3400 + evening;
      const raw = Math.max(8200, Math.round(mean + gauss() * 1150 + (random() < 0.05 ? 3500 : 0)));
      const created = new Date(day);
      created.setHours(hour, index * 2, Math.floor(random() * 59));
      if (created > now) created.setTime(now.getTime() - (count - index) * 90_000);
      const roll = random();
      solves.push({
        rawTimeMs: raw,
        penalty: roll < 0.015 ? "dnf" : roll < 0.04 ? "plus2" : "none",
        createdAt: created.toISOString(),
      });
    }
  }
  return solves.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const CORE_TEST_MEANS = {
  cross_only: 2100,
  f2l_only: 6400,
  oll_only: 1500,
  pll_only: 1700,
  cross_f2l: 8600,
  last_slot: 1400,
  ls_oll: 3000,
  oll_pll_only: 3300,
  cross_unlimited: 1900,
  tps_test: 3200,
};

export function makeBackup() {
  const history = makeHistory();
  const start = history[0].createdAt;
  const at = (daysAgo) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  return {
    format: "speedcubing-local-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    app: { name: "SolveLab", schemaVersion: 2 },
    data: {
      sessions: [{ id: "main", name: "Main", event: "333", createdAt: start, sortOrder: 0 }],
      solves: history.map((solve, index) => ({
        id: `seed-${index}`,
        sessionId: "main",
        event: "333",
        scramble: "R U R' U' F2 D L2 B' R2 U' F D2 L' B2 U R'",
        rawTimeMs: solve.rawTimeMs,
        penalty: solve.penalty,
        createdAt: solve.createdAt,
        source: "normal",
      })),
      diagnosticRuns: Object.entries(CORE_TEST_MEANS).map(([exerciseId, mean], index) => ({
        id: `run-${exerciseId}`,
        exerciseId,
        createdAt: at(20 - index),
        completedAt: at(20 - index),
        updatedAt: at(20 - index),
        solveIds: [],
        sampleCount: 12,
        timesMs: Array.from({ length: 12 }, (_, i) => mean + ((i * 137) % 400) - 200),
      })),
      lessonProgress: ["cfop-cross", "cfop-f2l"].map((lessonId, index) => ({
        lessonId,
        completedAt: at(30 - index),
      })),
      settings: {
        id: "preferences",
        inspectionSeconds: 0,
        activeSessionId: "main",
        method: "cfop",
        targetMilestone: "sub12",
        holdToStartMs: 300,
        hideTimeWhileRunning: false,
        inspectionAudioCues: false,
        showScramblePreview: true,
        timerInput: "keyboard",
        bluetoothTimerBrand: "auto",
        activeExerciseId: null,
        panelOffsets: {},
        trainingNoticeSeen: true,
        hubIntro: {
          average: "12-15",
          slowParts: ["pauses"],
          pll: "all",
          oll: "some",
          practice: "30",
          answeredAt: at(21),
          completedAt: at(21),
        },
      },
    },
  };
}

export async function importHistory(page, baseUrl) {
  await page.goto(new URL("/settings/", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.getByText("Local database ready").waitFor({ timeout: 30000 });
  const backup = makeBackup();
  await page.getByTestId("backup-file-input").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("radio", { name: /Replace/ }).click();
  await page.getByRole("button", { name: "Replace my data" }).click();
  await page.getByText(/Imported \d+ solves/).waitFor({ timeout: 30000 });
  console.log(`imported ${backup.data.solves.length} solves`);
}
