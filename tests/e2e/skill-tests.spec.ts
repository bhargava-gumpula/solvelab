import { expect, test, type Page } from "./fixtures";
import {
  importCoreTests as importProfile,
  inspectionSolve,
  keyboardSolve,
  makeBackup,
} from "./helpers";

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
    await page.goto("/hub/profile/");
    await expect(page.getByTestId("pick-goal")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /^Sub 20/ }).click();

    await page.getByTestId("start-next-test").click();
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
    await expect(page).toHaveURL(/\/hub\/profile\/?$/);
    await expect(
      page
        .getByRole("navigation", { name: "Learning Hub sections" })
        .getByRole("link", { name: "Profile" }),
    ).toHaveAttribute("aria-current", "page");
    const cross = page.getByTestId("aspect-row-cross");
    await expect(cross.getByTestId("pace-badge")).toHaveAttribute("data-pace", "fast", {
      timeout: 15_000,
    });
    await expect(cross.getByTestId("aspect-value")).toHaveText(/^0\.\d+ s$/);
    await expect(page.getByTestId("profile-summary")).toContainText("1 of 10 tests done");
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
    await expect(page).toHaveURL(/\/hub\/profile\/?$/);

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

    await page.goto("/hub/profile/");
    await expect(page.getByTestId("aspect-row-full_solve").getByTestId("aspect-value")).toHaveText(
      /^20\.\d+ s$/,
      { timeout: 15_000 },
    );
  });

  test("finishing the last core test completes the profile, with no retake loop", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await importProfile(page, { skip: ["tps_test"] });

    await page.goto("/hub/profile/");
    await expect(page.getByTestId("profile-summary")).toContainText("9 of 10 tests done", {
      timeout: 20_000,
    });
    await expect(page.getByTestId("start-next-test")).toHaveText(/Start turning speed test/);

    await page.getByTestId("start-next-test").click();
    await expect(surface(page)).toBeVisible({ timeout: 20_000 });
    await surface(page).focus();
    for (let i = 0; i < 4; i++) await keyboardSolve(page, 700);
    await keyboardSolve(page, 700, { moveOn: true });
    await expect(page.getByTestId("test-results")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("profile-complete")).toContainText(
      "Your solve profile is complete.",
    );
    await expect(page.getByTestId("next-test")).toHaveCount(0);

    await page.getByRole("link", { name: "See your solve profile" }).click();
    await expect(page.getByTestId("profile-summary")).toContainText(
      "Your solve profile is complete",
    );
    await expect(page.getByTestId("start-next-test")).toHaveCount(0);
    await expect(page.getByTestId("daily-check-card")).toContainText("Start daily check");

    // Each join shows the sum behind it.
    const planning = page.getByTestId("aspect-row-cross_planning");
    await planning.getByRole("button").first().click();
    await expect(planning.getByTestId("aspect-math")).toContainText(
      "Cross test 2.00 s − Unlimited-inspection cross test 1.80 s = 0.20 s",
    );

    // With every core test done, the coach says so and stops asking for more.
    await page.goto("/coach/");
    await expect(page.getByTestId("coach-headline")).toHaveText("Your solve profile is complete.", {
      timeout: 20_000,
    });
    await expect(page.getByTestId("coach-next-test")).toHaveCount(0);
  });

  test("daily check: two attempts each, fix a mistake, skip, results and reminder", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await importProfile(page);

    await page.goto("/coach/daily/");
    await expect(page.getByTestId("daily-intro")).toBeVisible({ timeout: 20_000 });
    const reminder = page.getByRole("switch", { name: "Remind me each day" });
    await reminder.click();
    await expect(reminder).toBeChecked();
    await expect(page.getByTestId("nav-alert-hub").first()).toBeAttached();

    await page.getByRole("button", { name: "Start daily check" }).click();
    await expect(page.getByTestId("daily-test-title")).toHaveText("Cross test");
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await surface(page).focus();
    await inspectionSolve(page, 400);
    await inspectionSolve(page, 2500, { moveOn: true });
    // Two attempts move on to the next test…
    await expect(page.getByTestId("daily-test-title")).toHaveText("F2L test");
    // …and deleting one brings the cross test back.
    await page.getByRole("button", { name: /^Delete Cross test attempt 2,/ }).click();
    await expect(page.getByTestId("daily-test-title")).toHaveText("Cross test");
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await surface(page).focus();
    await inspectionSolve(page, 450, { moveOn: true });
    await expect(page.getByTestId("daily-test-title")).toHaveText("F2L test");

    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await surface(page).focus();
    await keyboardSolve(page, 500);
    await keyboardSolve(page, 550, { moveOn: true });
    await expect(page.getByTestId("daily-progress")).toHaveText("2 of 10 tests done");

    for (let i = 0; i < 8; i++) {
      await page.getByRole("button", { name: "Skip this test" }).click();
    }
    await expect(page.getByTestId("daily-results")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("daily-row-cross").getByText("Better")).toBeVisible();
    await expect(page.getByTestId("daily-row-oll").locator("[data-change]")).toHaveAttribute(
      "data-change",
      "none",
    );
    await expect(page.getByText("1-day streak")).toBeVisible();
    await expect(page.getByTestId("nav-alert-hub")).toHaveCount(0);

    // Coming back today shows today's results, still compared with the profile before today.
    await page.reload();
    await expect(page.getByTestId("daily-results")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("daily-row-cross").getByText("Better")).toBeVisible();
    // The check's attempts join the latest full test: two fast crosses nudge 2.00 s, not replace it.
    await page.goto("/hub/profile/");
    await expect(page.getByTestId("aspect-row-cross").getByTestId("aspect-value")).toHaveText(
      /^1\.8\d s$/,
      { timeout: 20_000 },
    );
  });

  test("old diagnostic links open the matching test", async ({ page }) => {
    await page.goto("/coach/diagnostic/pll_only/");
    await expect(page).toHaveURL(/\/coach\/tests\/pll_only\/?$/, { timeout: 20_000 });
    await page.goto("/coach/diagnostic/");
    await expect(page).toHaveURL(/\/coach\/tests\/cross_only\/?$/, { timeout: 20_000 });
  });

  test("every surface is open, and the nav reaches all of them", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/timer/");
    const mainNav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(mainNav).toBeVisible();
    await expect(mainNav.getByRole("link")).toHaveText(["Timer", "Learning Hub"]);

    await page.keyboard.press("ControlOrMeta+k");
    const palette = page.getByRole("dialog", { name: "Command palette" });
    await expect(palette).toBeVisible();
    await expect(palette.getByText("Go to Stats")).toBeVisible();
    await expect(palette.getByText("Go to Practice")).toBeVisible();
    await expect(palette.getByText("Go to Library")).toBeVisible();
    await page.keyboard.press("Escape");

    await mainNav.getByRole("link", { name: "Learning Hub" }).click();
    await expect(page).toHaveURL(/\/hub\/?$/);
    const sections = page.getByRole("navigation", { name: "Learning Hub sections" });
    await sections.getByRole("link", { name: "Practice" }).click();
    await expect(page).toHaveURL(/\/train\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What you're working on.");
    await expect(page.getByTestId("train-browse-learn")).toBeVisible();

    // The road and every pack stay on Learn, reached from the Library.
    await sections.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL(/\/hub\/library\/?$/);
    await page.getByRole("link", { name: /The road, 2:00 to sub-10/ }).click();
    await expect(page).toHaveURL(/\/learn\/?$/);
    await expect(page.getByTestId("level-sub20")).toBeVisible();
    await expect(page.getByTestId("see-all")).toBeVisible();

    await page.goto("/learn/f2l-efficiency/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("F2L in fewer moves");

    await page.goto("/algorithms/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Every case, every algorithm that works.",
    );
    await expect(page.getByTestId("set-pll")).toContainText("21 cases");
    await expect(page.getByTestId("set-zbll")).toContainText("493 cases");

    await page.goto("/settings/");
    await expect(page.getByRole("heading", { name: "SolveLab 5.1.1" })).toBeVisible();
    await expect(page.getByText("The Learning Hub", { exact: true })).toBeVisible();
  });
});
