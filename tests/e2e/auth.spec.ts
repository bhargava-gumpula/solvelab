import { expect, test } from "./fixtures";
import { keyboardSolve, openTimer, seedStoredAccount } from "./helpers";

test.describe("without an account", () => {
  test.use({ account: "signedOut" });

  test("the timer works, and the areas that keep your data ask you to sign in", async ({
    page,
  }) => {
    await openTimer(page);
    await keyboardSolve(page, 300);
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");

    for (const [path, heading] of [
      ["/coach/", "Sign in to use Coach."],
      ["/stats/", "Sign in to use Stats."],
      ["/train/", "Sign in to use Train."],
      ["/learn/", "Sign in to use Learn."],
    ] as const) {
      await page.goto(path);
      await expect(page.getByTestId("sign-in-wall")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(
        page.getByTestId("sign-in-wall").getByRole("button", { name: "Sign in with Google" }),
      ).toBeVisible();
    }

    // A test inside Coach is locked too, not just the front page.
    await page.goto("/coach/tests/pll_only/");
    await expect(page.getByTestId("sign-in-wall")).toBeVisible({ timeout: 20_000 });

    // Pages that are nobody's private data stay open.
    await page.goto("/algorithms/");
    await expect(page.getByTestId("sign-in-wall")).toHaveCount(0);
    await page.goto("/settings/");
    await expect(page.getByTestId("sign-in-wall")).toHaveCount(0);
  });
});

test.describe("with an account", () => {
  test("Coach and Stats open, and signing out clears this browser", async ({ page }) => {
    await page.goto("/coach/");
    await expect(page.getByTestId("coach-thread")).toBeVisible({ timeout: 20_000 });
    await page.goto("/stats/");
    await expect(page.getByTestId("sign-in-wall")).toHaveCount(0);
    await page.goto("/train/");
    await expect(page.getByRole("heading", { name: "Practice is coming later." })).toBeVisible();
    await page.goto("/learn/");
    await expect(page.getByRole("heading", { name: "Lessons are coming later." })).toBeVisible();

    // Something of "mine" to leave behind: a solve and a coach conversation.
    await openTimer(page);
    await keyboardSolve(page, 300);
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");

    await page.goto("/settings/");
    await page.getByRole("button", { name: "Sign out" }).click();
    const dialog = page.getByTestId("sign-out-dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Sign out" }).click();
    // Firebase is blocked here, so it warns that the account is out of reach
    // before clearing anything, and only goes ahead when told to.
    await expect(dialog).toContainText("out of reach", { timeout: 20_000 });
    await dialog.getByRole("button", { name: "Sign out anyway" }).click();

    // Back to the timer, signed out, with nothing of the account's left.
    await expect(page).toHaveURL(/\/timer\/?$/, { timeout: 20_000 });
    await expect(page.getByText("No solves yet")).toBeVisible({ timeout: 20_000 });
    await page.goto("/coach/");
    await expect(page.getByTestId("sign-in-wall")).toBeVisible({ timeout: 20_000 });

    // The database the reload rebuilt holds no solves and no conversations.
    const left = await page.evaluate(async () => {
      const counts = await new Promise<Record<string, number>>((resolve, reject) => {
        const open = indexedDB.open("speedcubing-local");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const names = Array.from(db.objectStoreNames);
          const transaction = db.transaction(names, "readonly");
          const totals: Record<string, number> = {};
          let pending = names.length;
          for (const name of names) {
            const request = transaction.objectStore(name).count();
            request.onsuccess = () => {
              totals[name] = request.result;
              if (--pending === 0) resolve(totals);
            };
          }
        };
      });
      return { counts, tombstones: localStorage.getItem("solvelab.sync.tombstones.v1") };
    });
    expect(left.counts.solves).toBe(0);
    expect(left.counts.coachThreads).toBe(0);
    expect(left.counts.diagnosticRuns).toBe(0);
    expect(left.tombstones).toBeNull();
  });
});

test.describe("switching accounts", () => {
  test("a second account signing in gets none of the first one's data", async ({ page }) => {
    // The first account leaves a solve and a conversation behind.
    await openTimer(page);
    await keyboardSolve(page, 300);
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");
    await page.goto("/coach/");
    await expect(page.getByTestId("coach-thread")).toBeVisible({ timeout: 20_000 });

    // Someone else signs in on the same browser without signing out first.
    await seedStoredAccount(page, "e2e-account-two");
    await page.goto("/timer/");

    // The app clears the other account's copy and starts the page again, so
    // read until that has settled.
    let left: { solves: number; threads: number; owner: string | null } | null = null;
    await expect
      .poll(
        async () => {
          try {
            left = await page.evaluate(
              async () =>
                await new Promise<{ solves: number; threads: number; owner: string | null }>(
                  (resolve) => {
                    const open = indexedDB.open("speedcubing-local");
                    open.onsuccess = () => {
                      const db = open.result;
                      const transaction = db.transaction(
                        ["solves", "coachThreads", "meta"],
                        "readonly",
                      );
                      const solves = transaction.objectStore("solves").count();
                      const threads = transaction.objectStore("coachThreads").count();
                      const owner = transaction.objectStore("meta").get("accountOwner");
                      transaction.oncomplete = () =>
                        resolve({
                          solves: solves.result,
                          threads: threads.result,
                          owner: (owner.result as { value?: string } | undefined)?.value ?? null,
                        });
                    };
                  },
                ),
            );
          } catch {
            // The page reloaded mid-read; try again.
            return null;
          }
          return left;
        },
        { timeout: 30_000 },
      )
      .toMatchObject({ solves: 0, owner: "e2e-account-two" });

    await expect(page.getByText("No solves yet")).toBeVisible({ timeout: 20_000 });
    // Any conversation here is a new, empty one for the second account.
    expect(left!.threads).toBeLessThanOrEqual(1);
  });
});

test("privacy, terms and overview are public", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
  await expect(page.getByText("speedcubing-local")).toBeVisible();
  await expect(page.getByText("Google Cloud Firestore").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "How your solve data is used" })).toBeVisible();
  await page.goto("/terms/");
  await expect(page).toHaveURL(/\/terms\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of Use");
  await page.goto("/overview/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SolveLab 3.1");
  await expect(page.getByRole("heading", { name: "3.1 — Solve profile" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3.0 — Diagnostic coach" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "2.2 — Hardware timer and first coach" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "2.1 — Interface" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2.0 — Accounts and cloud times" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Planned" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3.2 — AI coach" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3.3 — Algorithm bank" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3.4 — Training and lessons" })).toBeVisible();
});
