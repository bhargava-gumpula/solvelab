import { expect, test } from "@playwright/test";
import { keyboardSolve, makeBackup } from "./helpers";

test.describe("v3 diagnostic coach", () => {
  test("set goal → diagnostic times a stage → Coach shows a pace tag", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/coach/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Set a goal. Time your stages.",
    );
    await expect(page.getByText("Pick a goal")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Choose your goal")).toBeVisible();
    await expect(page.getByTestId("start-full-diagnostic")).toHaveCount(0);

    await page.getByRole("button", { name: /Sub 20/ }).click();
    await expect(page.getByRole("heading", { name: /Time your stages for Sub 20/ })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: /Start diagnostic/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Start training/ })).toHaveCount(0);
    await expect(page.getByText("Choose your goal")).toBeVisible();

    await page.getByTestId("start-full-diagnostic").click();
    await page.waitForURL(/\/coach\/diagnostic\/?$/, { timeout: 20_000 });
    await expect(page.getByTestId("full-diagnostic-surface")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("h1").filter({ hasText: "Cross" })).toBeVisible();
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("full-diagnostic-surface").focus();

    for (let i = 1; i <= 8; i++) {
      await keyboardSolve(page, 400);
      await expect(page.getByText(`${i}/10`)).toBeVisible();
    }

    await page.getByRole("button", { name: /^Finish$/ }).click();
    await expect(page.getByTestId("diagnostic-results")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("stage-pace-cross")).toBeVisible();
    await expect(page.getByTestId("stage-pace-cross").locator("[data-pace]")).toHaveAttribute(
      "data-pace",
      "fast",
    );
    await expect(page.getByRole("link", { name: /Start training/ })).toHaveCount(0);

    await page.getByRole("link", { name: "Back to Coach" }).click();
    await expect(page).toHaveURL(/\/coach\/?$/);
    await expect(page.getByTestId("stage-pace-cross").locator("[data-pace]")).toHaveAttribute(
      "data-pace",
      "fast",
    );
    await expect(page.getByRole("link", { name: /Start training/ })).toHaveCount(0);
  });

  test("save and leave, then continue the same diagnostic", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/coach/");
    await expect(page.getByText("Pick a goal")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /Sub 20/ }).click();
    await expect(page.getByTestId("start-full-diagnostic")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("start-full-diagnostic").click();
    await page.waitForURL(/\/coach\/diagnostic\/?$/, { timeout: 20_000 });
    await expect(page.getByTestId("full-diagnostic-surface")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("full-diagnostic-surface").focus();
    await keyboardSolve(page, 400);
    await keyboardSolve(page, 450);
    await expect(page.getByText("2/10")).toBeVisible();
    await page.getByRole("button", { name: /Save & leave/ }).click();
    await expect(page).toHaveURL(/\/coach\/?$/);
    await expect(page.getByRole("link", { name: /Continue diagnostic/ })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("start-full-diagnostic").click();
    await expect(page.getByText("2/10")).toBeVisible({ timeout: 20_000 });
  });

  test("single-stage diagnostic still works and does not pollute timer averages", async ({
    page,
  }) => {
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
    const beforeCount = (await page.getByTestId("solve-count").textContent()) ?? "";

    await page.goto("/coach/diagnostic/cross_only/");
    await expect(page.getByText("Diagnostic", { exact: true }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("h1").filter({ hasText: "Cross" })).toBeVisible();
    await expect(page.getByTestId("diagnostic-sandbox-surface")).toBeVisible();
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("diagnostic-sandbox-surface").focus();

    await keyboardSolve(page, 400);
    await keyboardSolve(page, 450);
    await keyboardSolve(page, 500);
    await page.getByRole("button", { name: /^Finish$/ }).click();
    await expect(page.getByTestId("diagnostic-results")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /Go to Train|Start training/ })).toHaveCount(0);

    await page.goto("/timer/");
    await expect(page.getByTestId("solve-count")).toHaveText(beforeCount);
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
