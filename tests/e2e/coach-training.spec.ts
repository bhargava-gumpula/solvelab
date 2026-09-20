import { expect, test, type Page } from "./fixtures";
import { keyboardSolve } from "./helpers";

const notice = (page: Page) => page.getByTestId("training-data-notice");

/**
 * Uploads of a finished test: a Firestore body carrying a payload for the
 * training collection. Ordinary account sync and withdrawals also talk to
 * Firestore, so the attempt times are what tells an upload apart.
 */
async function watchUploads(page: Page): Promise<string[]> {
  const uploads: string[] = [];
  await page.route(/^https:\/\/firestore\.googleapis\.com\//, (route) => {
    const body = route.request().postData() ?? "";
    if (body.includes("trainingContributions") && body.includes("attemptsMs")) {
      uploads.push(body.slice(0, 120));
    }
    return route.abort();
  });
  return uploads;
}

/**
 * The ids this browser has shared under. The uploader records one before it
 * writes, so this shows an upload was made even though Firebase is blocked.
 */
const sharedUnder = (page: Page) =>
  page.evaluate(() => localStorage.getItem("solvelab.trainingContributors.v1"));

async function takeShortTest(page: Page) {
  await page.goto("/coach/tests/pll_only/");
  await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("test-timer-surface").focus();
  for (const ms of [300, 350, 400]) await keyboardSolve(page, ms);
  await page.getByRole("button", { name: "Finish now" }).click();
  await expect(page.getByTestId("test-results")).toBeVisible({ timeout: 15_000 });
}

test.describe("sharing test results to train the coach", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/");
    const toggle = page.getByRole("switch", { name: "Help improve the coach" });
    // Wait until Settings has decided either way before checking.
    await expect(
      toggle.or(page.getByText("Accounts aren’t configured on this build.")).first(),
    ).toBeVisible({ timeout: 20_000 });
    test.skip((await toggle.count()) === 0, "Sharing needs a build with Firebase configured.");
  });

  test("the notice shows once, and a finished test is shared", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/stats/profile/");
    await expect(notice(page)).toBeVisible({ timeout: 20_000 });
    await expect(notice(page)).toContainText("Never your name, email, notes or scrambles");
    await notice(page).getByRole("button", { name: "Got it" }).click();
    await expect(notice(page)).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("profile-summary").or(page.getByTestId("pick-goal"))).toBeVisible(
      { timeout: 20_000 },
    );
    await expect(notice(page)).toHaveCount(0);

    await takeShortTest(page);
    // The finished test is shared under the account id (the write is blocked here).
    await expect.poll(() => sharedUnder(page), { timeout: 15_000 }).toContain("e2e-account");
  });

  test("turning sharing off is saved and stops uploads", async ({ page }) => {
    test.setTimeout(90_000);
    const uploads = await watchUploads(page);
    await page.goto("/settings/");
    const toggle = page.getByRole("switch", { name: "Help improve the coach" });
    await expect(toggle).toBeChecked({ timeout: 20_000 });
    await toggle.click();
    await expect(page.getByText(/^Sharing is off/)).toBeVisible();
    await expect(toggle).not.toBeChecked();

    await page.reload();
    await expect(page.getByRole("switch", { name: "Help improve the coach" })).not.toBeChecked({
      timeout: 20_000,
    });

    // With sharing off there's no notice and nothing is sent.
    await page.goto("/coach/tests/pll_only/");
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await expect(notice(page)).toHaveCount(0);
    await takeShortTest(page);
    await page.waitForTimeout(2_000);
    expect(uploads).toEqual([]);
    expect(await sharedUnder(page)).toBeNull();
  });

  test("Don’t share in the notice turns sharing off", async ({ page }) => {
    await page.goto("/coach/tests/cross_only/");
    await expect(notice(page)).toBeVisible({ timeout: 20_000 });
    await notice(page).getByRole("button", { name: "Don’t share" }).click();
    await expect(notice(page)).toHaveCount(0);
    await page.goto("/settings/");
    await expect(page.getByRole("switch", { name: "Help improve the coach" })).not.toBeChecked({
      timeout: 20_000,
    });
  });
});
