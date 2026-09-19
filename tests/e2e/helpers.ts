import { expect, type Page } from "@playwright/test";

export async function openTimer(page: Page) {
  await page.goto("/timer/");
  await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Preparing timer…")).toHaveCount(0);
}

export const display = (page: Page) => page.getByTestId("timer-display");

/**
 * Holds space long enough to arm, solves for `solveMs`, then stops. Pass
 * `moveOn` when stopping leaves the timer (the last attempt of a test).
 */
export async function keyboardSolve(page: Page, solveMs = 600, { moveOn = false } = {}) {
  await page.keyboard.down("Space");
  await page.waitForTimeout(450);
  await expect(display(page)).toHaveAttribute("data-tone", "armed");
  await page.keyboard.up("Space");
  await expect(display(page)).toHaveAttribute("data-tone", "running");
  await page.waitForTimeout(solveMs);
  await page.keyboard.down("Space");
  if (!moveOn) await expect(display(page)).toHaveAttribute("data-tone", "result");
  await page.keyboard.up("Space");
}

export function secondsFrom(text: string): number {
  return Number(text.replace(/[^0-9.]/g, ""));
}

export interface BackupSolveInput {
  rawTimeMs: number;
  penalty?: "none" | "plus2" | "dnf";
}

export function makeBackup(solves: BackupSolveInput[], sessionName = "Imported") {
  const start = Date.UTC(2026, 7, 1);
  return {
    format: "speedcubing-local-backup",
    version: 1,
    exportedAt: new Date(start).toISOString(),
    app: { name: "SolveLab", schemaVersion: 2 },
    data: {
      sessions: [
        {
          id: "imported",
          name: sessionName,
          event: "333",
          createdAt: new Date(start).toISOString(),
          sortOrder: 0,
        },
      ],
      solves: solves.map((solve, index) => ({
        id: `imported-${index}`,
        sessionId: "imported",
        event: "333",
        scramble: "R U R' U' F2 D L2",
        rawTimeMs: solve.rawTimeMs,
        penalty: solve.penalty ?? "none",
        createdAt: new Date(start + index * 60_000).toISOString(),
        source: "normal",
      })),
      settings: {
        id: "preferences",
        inspectionSeconds: 0,
        activeSessionId: "imported",
        method: "cfop",
        targetMilestone: null,
        holdToStartMs: 300,
        hideTimeWhileRunning: false,
        inspectionAudioCues: false,
        showScramblePreview: true,
        timerInput: "keyboard",
        bluetoothTimerBrand: "auto",
        activeExerciseId: null,
        panelOffsets: {},
      },
    },
  };
}

/** Starts 15-second inspection with a tap of Space, then solves like keyboardSolve. */
export async function inspectionSolve(page: Page, solveMs = 600, options = { moveOn: false }) {
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await expect(display(page)).toHaveAttribute("data-tone", "inspection");
  await keyboardSolve(page, solveMs, options);
}

/** Mean times used for imported core-test runs (a solver close to Sub 20). */
const CORE_TEST_MEANS: Record<string, number> = {
  cross_only: 2000,
  f2l_only: 7000,
  oll_only: 1600,
  pll_only: 1900,
  cross_f2l: 9800,
  last_slot: 1500,
  ls_oll: 3400,
  oll_pll_only: 3700,
  cross_unlimited: 1800,
  tps_test: 3000,
};

/**
 * Imports one timer solve plus finished runs of the core tests (cross 2.00 s,
 * unlimited cross 1.80 s, …) with goal Sub 20, through Settings → Import.
 */
export async function importCoreTests(
  page: Page,
  { skip = [] as string[], finishedAt = Date.UTC(2026, 7, 2) } = {},
) {
  const backup = makeBackup([{ rawTimeMs: 20_000 }]);
  Object.assign(backup.data, {
    diagnosticRuns: Object.entries(CORE_TEST_MEANS)
      .filter(([testId]) => !skip.includes(testId))
      .map(([exerciseId, mean], index) => {
        const at = new Date(finishedAt + index * 60_000).toISOString();
        return {
          id: `run-${exerciseId}`,
          exerciseId,
          createdAt: at,
          completedAt: at,
          updatedAt: at,
          solveIds: [],
          sampleCount: 12,
          timesMs: Array(12).fill(mean),
        };
      }),
  });
  Object.assign(backup.data.settings, { targetMilestone: "sub20", trainingNoticeSeen: true });
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible();
  await page.getByTestId("backup-file-input").setInputFiles({
    name: "profile.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("radio", { name: /Replace/ }).click();
  await page.getByRole("button", { name: "Replace my data" }).click();
  await expect(page.getByText(/Imported 1 solves/)).toBeVisible();
}

/** Tests that start with 15-second inspection. */
export const INSPECTION_TESTS = new Set(["cross_only", "cross_f2l", "cross_first_pair"]);
