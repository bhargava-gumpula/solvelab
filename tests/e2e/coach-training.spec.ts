import { expect, test, type Page } from "./fixtures";
import { keyboardSolve } from "./helpers";

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

  test("sharing is off until it's turned on, and nothing is shared meanwhile", async ({ page }) => {
    test.setTimeout(90_000);
    await expect(page.getByRole("switch", { name: "Help improve the coach" })).not.toBeChecked();
    await takeShortTest(page);
    await page.waitForTimeout(2_000);
    expect(await sharedUnder(page)).toBeNull();
  });

  test("turning sharing on shares a finished test; turning it off is saved", async ({ page }) => {
    test.setTimeout(90_000);
    const toggle = () => page.getByRole("switch", { name: "Help improve the coach" });
    await toggle().click();
    await expect(page.getByText(/^Thanks!/)).toBeVisible();
    await page.reload();
    await expect(toggle()).toBeChecked({ timeout: 20_000 });

    await takeShortTest(page);
    // The finished test is shared under the account id (the write is blocked here).
    await expect.poll(() => sharedUnder(page), { timeout: 15_000 }).toContain("e2e-account");

    await page.goto("/settings/");
    await expect(toggle()).toBeChecked({ timeout: 20_000 });
    await toggle().click();
    await expect(page.getByText(/^Sharing is off/)).toBeVisible();
    await page.reload();
    await expect(toggle()).not.toBeChecked({ timeout: 20_000 });
  });
});
