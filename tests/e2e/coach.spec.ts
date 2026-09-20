import { expect, test, type Page } from "./fixtures";
import { importCoreTests, INSPECTION_TESTS, inspectionSolve, keyboardSolve } from "./helpers";

/** Takes the test the coach asked for: three attempts, then Finish now. */
async function takeRequestedTest(page: Page) {
  const link = page.getByTestId("coach-start-test");
  const href = (await link.getAttribute("href")) ?? "";
  const testId = /\/coach\/tests\/([^/]+)\//.exec(href)![1]!;
  await link.click();
  const surface = page.getByTestId("test-timer-surface");
  await expect(surface).toBeVisible({ timeout: 20_000 });
  if (testId !== "tps_test")
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
  await surface.focus();
  for (let i = 0; i < 3; i++) {
    if (INSPECTION_TESTS.has(testId)) await inspectionSolve(page, 400 + i * 50);
    else await keyboardSolve(page, 400 + i * 50);
  }
  await page.getByRole("button", { name: "Finish now" }).click();
  await expect(page.getByTestId("test-results")).toBeVisible({ timeout: 15_000 });
  return testId;
}

test.describe("coach conversation", () => {
  test("asks for a goal, requests tests, records results, and remembers the conversation", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await page.goto("/coach/");
    // The coach writes its messages, so the dots show before the first bubble.
    await expect(page.getByTestId("coach-typing")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("coach-ask-goal")).toBeVisible({ timeout: 20_000 });
    // Typing back isn't possible yet, and the page says so.
    await expect(page.getByTestId("coach-composer")).toContainText("planned for a later version");
    await page
      .getByTestId("coach-ask-goal")
      .getByRole("button", { name: /^Sub 20/ })
      .click();

    const thread = page.getByTestId("coach-thread");
    await expect(thread).toContainText("My goal is Sub 20.");
    await expect(page.getByTestId("coach-request")).toContainText(/It'll show whether/);
    const first = await takeRequestedTest(page);

    // The results page hands control back to the coach.
    await page.getByTestId("back-to-coach").click();
    await expect(thread).toContainText("done.", { timeout: 20_000 });
    await expect(page.getByTestId("coach-request")).toBeVisible();
    const second = (await page.getByTestId("coach-start-test").getAttribute("href")) ?? "";
    expect(second).not.toContain(first);

    // Skipping moves on to another test.
    await page.getByRole("button", { name: "Skip this test" }).click();
    await expect(thread).toContainText(/Skip the .* test\./);
    await expect(page.getByTestId("coach-request")).toBeVisible();

    const before = await thread.innerText();
    await page.reload();
    await expect(page.getByTestId("coach-request")).toBeVisible({ timeout: 20_000 });
    expect(await thread.innerText()).toBe(before);
  });

  test("with recent tests it sums up right away, with tips for every part, and can start over", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // Finished yesterday, so they count as current.
    await importCoreTests(page, { finishedAt: Date.now() - 86_400_000 });
    await page.goto("/coach/");
    const summary = page.getByTestId("coach-summary");
    await expect(summary).toBeVisible({ timeout: 20_000 });
    await expect(summary).toContainText("Based on 10 tests");
    await expect(summary).toContainText(
      /holding you back from Sub 20|on pace for Sub 20|worth checking/,
    );

    // Every part has tips, with sources.
    const cross = page.getByTestId("coach-other-cross").or(page.getByTestId("coach-focus-cross"));
    await expect(cross).toBeVisible();
    const other = summary.locator('[data-testid^="coach-other-"]').first();
    await other.getByRole("button").first().click();
    await expect(other.getByText("Learn more:")).toBeVisible();

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(page.getByTestId("coach-thread")).toContainText(
      "Starting over: I'll measure everything again from scratch.",
    );
    await expect(page.getByTestId("coach-request")).toBeVisible({ timeout: 20_000 });
    await page.getByText("Earlier summaries").click();
    await expect(page.getByText(/goal Sub 20/)).toBeVisible();
  });
});
