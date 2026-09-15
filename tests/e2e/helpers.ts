import { expect, type Page } from "@playwright/test";

export async function openTimer(page: Page) {
  await page.goto("/timer/");
  await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Preparing timer…")).toHaveCount(0);
}

export const display = (page: Page) => page.getByTestId("timer-display");

/** Holds space long enough to arm, solves for `solveMs`, then stops. */
export async function keyboardSolve(page: Page, solveMs = 600) {
  await page.keyboard.down("Space");
  await page.waitForTimeout(450);
  await expect(display(page)).toHaveAttribute("data-tone", "armed");
  await page.keyboard.up("Space");
  await expect(display(page)).toHaveAttribute("data-tone", "running");
  await page.waitForTimeout(solveMs);
  await page.keyboard.down("Space");
  await expect(display(page)).toHaveAttribute("data-tone", "result");
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
        panelOffsets: {},
      },
    },
  };
}
