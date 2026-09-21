import { expect, test } from "./fixtures";
import { importCoreTests } from "./helpers";

test.describe("the coach", () => {
  test("asks for a goal, then points at the test it wants next", async ({ page }) => {
    await page.goto("/coach/");
    await expect(page.getByRole("heading", { name: "What time are you aiming for?" })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: /^Sub 20/ }).click();

    // With a goal set it names the first test and why it is worth taking.
    await expect(page.getByTestId("coach-headline")).toContainText("Sub 20", { timeout: 20_000 });
    const start = page.getByTestId("coach-next-test");
    await expect(start).toBeVisible();
    await expect(page.getByTestId("coach-message")).toContainText("Up first");

    // The button opens that test.
    const href = (await start.getAttribute("href")) ?? "";
    expect(href).toMatch(/\/coach\/tests\/[a-z_]+\/$/);
    await start.click();
    await expect(page.getByTestId("test-timer-surface")).toBeVisible({ timeout: 20_000 });
  });

  test("with tests done it says what to work on, with tips and sources", async ({ page }) => {
    await importCoreTests(page, { finishedAt: Date.now() - 86_400_000 });
    await page.goto("/coach/");
    await expect(page.getByTestId("coach-headline")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "What to work on first" })).toBeVisible();
    await expect(page.getByText("Try this:").first()).toBeVisible();
    await expect(page.getByText("Learn more:").first()).toBeVisible();

    // The profile and the daily check are a click away.
    await expect(page.getByRole("link", { name: "See your solve profile" })).toBeVisible();
    await expect(page.getByRole("link", { name: /daily check/i })).toBeVisible();
  });
});
