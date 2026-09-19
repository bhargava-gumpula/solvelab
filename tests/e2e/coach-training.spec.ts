import { expect, test, type Page } from "./fixtures";
import { keyboardSolve } from "./helpers";

const notice = (page: Page) => page.getByTestId("training-data-notice");
const firebaseCalls = (requests: string[]) =>
  requests.filter((url) => /identitytoolkit|firestore/.test(url));

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
    await expect(page.getByText("Local database ready")).toBeVisible({ timeout: 20_000 });
    const configured = await page.getByRole("switch", { name: "Help improve the coach" }).count();
    test.skip(configured === 0, "Sharing needs a build with Firebase configured.");
  });

  test("the notice shows once, and a finished test is shared", async ({
    page,
    firebaseRequests,
  }) => {
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
    // Signed out, sharing starts by creating an anonymous id (blocked here).
    await expect
      .poll(() => firebaseCalls(firebaseRequests).length, { timeout: 15_000 })
      .toBeGreaterThan(0);
  });

  test("turning sharing off is saved and stops uploads", async ({ page, firebaseRequests }) => {
    test.setTimeout(90_000);
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
    const before = firebaseCalls(firebaseRequests).length;
    await takeShortTest(page);
    await page.waitForTimeout(2_000);
    expect(firebaseCalls(firebaseRequests).length).toBe(before);
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
