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
  await expect(page.getByText(/Imported 1 solve\b/)).toBeVisible();
}

/** Tests that start with 15-second inspection. */
export const INSPECTION_TESTS = new Set(["cross_only", "cross_f2l", "cross_first_pair"]);

/**
 * Plants a signed-in session the way the build's account service reads it on
 * start-up, exactly as after a real sign-in on this device. The chunks are
 * scanned for the service's public config; a build with neither can't sign
 * anyone in, and doesn't lock.
 */
export async function seedStoredAccount(page: Page, uid = "e2e-account"): Promise<void> {
  await page.goto("/timer/");
  await page.evaluate(async (accountId) => {
    const urls = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((name) => name.includes("/_next/static/chunks/"));
    let apiKey: string | null = null;
    let supabaseRef: string | null = null;
    for (const url of urls) {
      const source = await (await fetch(url)).text();
      const supabase = /https:\/\/([a-z0-9-]+)\.supabase\.(?:co|in|red)/.exec(source);
      if (supabase) {
        supabaseRef = supabase[1]!;
        break;
      }
      const firebase = /AIzaSy[A-Za-z0-9_-]{20,}/.exec(source);
      if (firebase) apiKey = firebase[0];
    }
    const now = Date.now();
    if (supabaseRef) {
      // supabase-js keeps the session under sb-<ref>-auth-token. The token is
      // unsigned: the client doesn't verify it, and the project is blocked.
      const encode = (value: object) =>
        btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      // The test's id is used as the user id as it is; nothing client-side needs
      // a uuid, and the project is blocked, so the tests can read it back.
      const userId = accountId;
      const expiresAt = Math.floor(now / 1000) + 86_400;
      const user = {
        id: userId,
        aud: "authenticated",
        role: "authenticated",
        email: `${accountId}@example.com`,
        email_confirmed_at: new Date(now).toISOString(),
        app_metadata: { provider: "google", providers: ["google"] },
        user_metadata: {
          full_name: `Tester ${accountId}`,
          name: `Tester ${accountId}`,
          email: `${accountId}@example.com`,
          avatar_url: null,
        },
        identities: [],
        is_anonymous: false,
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      };
      const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
        sub: userId,
        aud: "authenticated",
        role: "authenticated",
        email: user.email,
        is_anonymous: false,
        exp: expiresAt,
        iat: Math.floor(now / 1000),
      })}.e2e`;
      localStorage.setItem(
        `sb-${supabaseRef}-auth-token`,
        JSON.stringify({
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 86_400,
          expires_at: expiresAt,
          refresh_token: `${accountId}-refresh`,
          user,
        }),
      );
      return;
    }
    if (!apiKey) return;
    const user = {
      uid: accountId,
      email: `${accountId}@example.com`,
      displayName: `Tester ${accountId}`,
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
      providerData: [
        {
          providerId: "google.com",
          uid: accountId,
          displayName: `Tester ${accountId}`,
          email: `${accountId}@example.com`,
          phoneNumber: null,
          photoURL: null,
        },
      ],
      stsTokenManager: {
        refreshToken: `${accountId}-refresh`,
        accessToken: `${accountId}-access`,
        expirationTime: now + 86_400_000,
      },
      createdAt: String(now),
      lastLoginAt: String(now),
      apiKey,
      appName: "[DEFAULT]",
    };
    const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
    // Firebase settles on localStorage in this browser, so that is what it
    // reads on the next load; the IndexedDB copy is kept in step with it.
    localStorage.setItem(key, JSON.stringify(user));
    await new Promise<void>((resolve) => {
      const open = indexedDB.open("firebaseLocalStorageDb", 1);
      open.onupgradeneeded = () =>
        open.result.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
      open.onsuccess = () => {
        const transaction = open.result.transaction("firebaseLocalStorage", "readwrite");
        transaction.objectStore("firebaseLocalStorage").put({ fbase_key: key, value: user });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      };
      open.onerror = () => resolve();
    });
  }, uid);
}
