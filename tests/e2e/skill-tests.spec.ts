import { expect, test, type Page } from "./fixtures";
import { inspectionSolve, keyboardSolve, makeBackup } from "./helpers";

const surface = (page: Page) => page.getByTestId("test-timer-surface");
const progress = (page: Page) => page.getByTestId("test-progress");

async function openTest(page: Page, testId: string) {
  await page.goto(`/coach/tests/${testId}/`);
  await expect(surface(page)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
  await surface(page).focus();
}

test.describe("skill tests and the solve profile", () => {
  test("goal → cross test → delete an attempt → results → profile", async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto("/coach/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Find what’s slowing you down.",
    );
    await expect(page.getByText("What time are you aiming for?")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: /^Sub 20/ }).click();

    await page.getByRole("link", { name: "Start cross test" }).click();
    await page.waitForURL(/\/coach\/tests\/cross_only\/?$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cross test");
    await expect(page.getByText("Goal for Sub 20:")).toBeVisible();
    await expect(surface(page)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await surface(page).focus();

    await inspectionSolve(page, 400);
    await inspectionSolve(page, 2500);
    await inspectionSolve(page, 450);
    await expect(progress(page)).toHaveText("3 of 10");

    // The 2.5 s attempt was an accident: delete it, undo, then delete it for good.
    await page.getByRole("button", { name: /^Delete attempt 2,/ }).click();
    await expect(progress(page)).toHaveText("2 of 10");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(progress(page)).toHaveText("3 of 10");
    await page.getByRole("button", { name: /^Delete attempt 2,/ }).click();
    await expect(progress(page)).toHaveText("2 of 10");
    await expect(page.getByRole("button", { name: "Finish now" })).toBeDisabled();

    await surface(page).focus();
    await inspectionSolve(page, 500);
    await page.getByRole("button", { name: "Finish now" }).click();

    await expect(page.getByTestId("test-results")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("attempt-time")).toHaveCount(3);
    await expect(page.getByTestId("aspect-card-cross").getByTestId("pace-badge")).toHaveAttribute(
      "data-pace",
      "fast",
    );
    await expect(page.getByTestId("next-test")).toHaveText(/Next: F2L test/);

    await page.getByRole("link", { name: "See your solve profile" }).click();
    await expect(page).toHaveURL(/\/stats\/profile\/?$/);
    await expect(page.getByRole("link", { name: "Solve profile" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const cross = page.getByTestId("aspect-row-cross");
    await expect(cross.getByTestId("pace-badge")).toHaveAttribute("data-pace", "fast", {
      timeout: 15_000,
    });
    await expect(cross.getByTestId("aspect-value")).toHaveText(/^0\.\d+ s$/);
    await expect(page.getByTestId("profile-summary")).toContainText("1 of 15 parts measured");
    await expect(page.getByTestId("start-next-test")).toHaveText(/Start F2L test/);
    await expect(page.getByTestId("test-card-cross_only")).toContainText("Done");

    // The choice of goal is saved.
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Goal" })).toHaveText(/Sub 20/, {
      timeout: 15_000,
    });
  });

  test("save and exit, then continue the same test", async ({ page }) => {
    test.setTimeout(120_000);
    await openTest(page, "oll_only");
    await expect(page.getByTestId("test-timer-surface")).toBeVisible();
    await keyboardSolve(page, 400);
    await keyboardSolve(page, 450);
    await expect(progress(page)).toHaveText("2 of 12");
    await page.getByRole("button", { name: "Save and exit" }).click();
    await expect(page).toHaveURL(/\/stats\/profile\/?$/);

    const card = page.getByTestId("test-card-oll_only");
    await expect(card).toContainText("2 of 12", { timeout: 15_000 });
    await card.getByRole("link", { name: "Continue OLL test" }).click();
    await expect(progress(page)).toHaveText("2 of 12", { timeout: 20_000 });
    await expect(page.getByText("Picking up where you left off.")).toBeVisible();
  });

  test("the turning speed test shows turns per second", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/coach/tests/tps_test/");
    await expect(page.getByTestId("test-algorithm")).toHaveText("(R U R' U') × 6");
    await expect(page.getByTestId("scramble")).toHaveCount(0);
    await surface(page).focus();
    for (let i = 0; i < 3; i++) await keyboardSolve(page, 900);
    await page.getByRole("button", { name: "Finish now" }).click();
    await expect(page.getByTestId("test-average")).toHaveText(/turns\/s$/, { timeout: 15_000 });
  });

  test("tests never touch timer solves or averages", async ({ page }) => {
    test.setTimeout(120_000);
    const baseline = makeBackup(
      Array.from({ length: 12 }, (_, i) => ({ rawTimeMs: 20_000 + i * 100 })),
    );

    await page.goto("/settings/");
    await expect(page.getByText("Local database ready")).toBeVisible();
    await page.getByTestId("backup-file-input").setInputFiles({
      name: "baseline.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(baseline)),
    });
    await page.getByRole("radio", { name: /Replace/ }).click();
    await page.getByRole("button", { name: "Replace my data" }).click();
    await expect(page.getByText(/Imported 12 solves/)).toBeVisible();

    await page.goto("/timer/");
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(async () => (await page.getByTestId("solve-count").textContent()) ?? "", {
        timeout: 15_000,
      })
      .toBe("12/12");

    await openTest(page, "f2l_only");
    for (const ms of [400, 450, 500]) await keyboardSolve(page, ms);
    await page.getByRole("button", { name: "Finish now" }).click();
    await expect(page.getByTestId("test-results")).toBeVisible({ timeout: 15_000 });

    await page.goto("/timer/");
    await expect(page.getByTestId("solve-count")).toHaveText("12/12", { timeout: 15_000 });

    await page.goto("/stats/profile/");
    await expect(page.getByTestId("aspect-row-full_solve").getByTestId("aspect-value")).toHaveText(
      /^20\.\d+ s$/,
      { timeout: 15_000 },
    );
  });

  test("old diagnostic links open the matching test", async ({ page }) => {
    await page.goto("/coach/diagnostic/pll_only/");
    await expect(page).toHaveURL(/\/coach\/tests\/pll_only\/?$/, { timeout: 20_000 });
    await page.goto("/coach/diagnostic/");
    await expect(page).toHaveURL(/\/coach\/tests\/cross_only\/?$/, { timeout: 20_000 });
  });

  test("Train and Learn show in nav but open coming-soon pages", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/timer/");
    const mainNav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(mainNav).toBeVisible();
    const train = mainNav.getByRole("link", { name: "Train", exact: true });
    const learn = mainNav.getByRole("link", { name: "Learn", exact: true });
    await expect(train).toBeVisible();
    await expect(learn).toBeVisible();
    await expect(train).toHaveAttribute("data-preview", "true");
    await expect(learn).toHaveAttribute("data-preview", "true");
    await expect(
      mainNav.getByRole("link", { name: "Algorithms", exact: true }),
    ).not.toHaveAttribute("data-preview", "true");

    await page.keyboard.press("ControlOrMeta+k");
    const palette = page.getByRole("dialog", { name: "Command palette" });
    await expect(palette).toBeVisible();
    await expect(palette.getByText("Go to Coach")).toBeVisible();
    await expect(palette.getByText("Go to Train")).toBeVisible();
    await expect(palette.getByText("Go to Learn")).toBeVisible();
    await page.keyboard.press("Escape");

    await train.click();
    await expect(page).toHaveURL(/\/train\/?$/);
    await expect(page.getByRole("heading", { name: "Practice is coming later." })).toBeVisible();
    await expect(
      page.getByRole("paragraph").filter({ hasText: /^Planned for 3\.1\.$/ }),
    ).toBeVisible();
    await expect(page.getByTestId("start-topic-cross")).toHaveCount(0);

    await page.goto("/train/slow_f2l/");
    await expect(page.getByRole("heading", { name: "Practice is coming later." })).toBeVisible();

    await page.goto("/learn/");
    await expect(page.getByRole("heading", { name: "Lessons are coming later." })).toBeVisible();
    await expect(
      page.getByRole("paragraph").filter({ hasText: /^Planned for 3\.2\.$/ }),
    ).toBeVisible();

    await page.goto("/algorithms/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Build a repertoire you can rely on.",
    );
    await expect(
      page.getByRole("strong").filter({ hasText: /^Planned for 3\.1–3\.2\.$/ }),
    ).toBeVisible();
    await expect(page.getByText(/coming in 3\.1–3\.2/).first()).toBeVisible();

    await page.goto("/settings/");
    await expect(page.getByRole("heading", { name: "SolveLab 3.0" })).toBeVisible();
    await expect(page.getByText("Diagnostic coach")).toBeVisible();
  });
});
