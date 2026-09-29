import { expect, test, type Page } from "./fixtures";
import { importCoreTests, keyboardSolve } from "./helpers";

/** Answers the questionnaire as someone at 12–15 s who thinks lookahead is their problem. */
async function findLevel(page: Page) {
  await page.goto("/hub/");
  await expect(page.getByTestId("hub-welcome")).toBeVisible();
  await page.getByTestId("find-level").click();
  await page.getByTestId("onboarding-start").click();
  await page.getByTestId("choice-12-15").click();
  await page.getByTestId("choice-cfop").click();
  await page.getByTestId("pll-all").click();
  await page.getByTestId("oll-some").click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId("choice-pauses").click();
  await page.getByTestId("onboarding-next").click();
  // The goal comes suggested from the answer: 12–15 s is chasing sub-12.
  await expect(page.getByTestId("choice-sub12")).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("choice-sub12").click();
  await page.getByTestId("choice-60").click();
}

test.describe("the Learning Hub", () => {
  test("two places at the top, and the site reopens on the last one", async ({ page }) => {
    await page.goto("/timer/");
    const main = page.getByRole("navigation", { name: "Main navigation" });
    await expect(main.getByRole("link")).toHaveText(["Timer", "Learning Hub"]);
    const sections = page.getByRole("navigation", { name: "Timer sections" });
    await sections.getByRole("link", { name: "Stats" }).click();
    await expect(page).toHaveURL(/\/stats\/$/);
    await expect(main.getByRole("link", { name: "Timer" })).toHaveAttribute("aria-current", "page");

    await main.getByRole("link", { name: "Learning Hub" }).click();
    await expect(page).toHaveURL(/\/hub\/$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/hub\/$/);

    // The profile moved into the Hub; the old address still finds it.
    await page.goto("/stats/profile/");
    await expect(page).toHaveURL(/\/hub\/profile\/$/);
  });

  test("finding your level: questions, then results, then a path built around them", async ({
    page,
  }) => {
    await findLevel(page);
    await expect(page.getByTestId("onboarding-solves")).toContainText("Do 12 more solves");
    await page.getByTestId("skip-solves").click();
    await expect(page.getByTestId("onboarding-tests")).toContainText("0 of");
    await page.getByTestId("skip-tests").click();
    await expect(page.getByTestId("result-course")).toHaveText("Sub-12");
    await expect(page.getByTestId("agreements")).toContainText("Lookahead");
    await page.getByTestId("start-path").click();

    await expect(page).toHaveURL(/\/hub\/$/);
    await expect(page.getByTestId("course-title")).toHaveText("Sub-12");
    await expect(page.getByTestId("course-hero")).toContainText("placed by your answers");
    // What they said feels slow comes first while nothing has measured it.
    const first = page.getByTestId("course-path").locator("section").first();
    await expect(first).toHaveAttribute("data-testid", "unit-lookahead");
    await expect(first).toContainText("You flagged this");

    // The answers are kept.
    await page.reload();
    await expect(page.getByTestId("course-title")).toHaveText("Sub-12");
    await expect(page.getByTestId("setup-banner")).toHaveCount(0);
  });

  test("a lesson, card by card, ends in a finished lesson on the path", async ({ page }) => {
    await findLevel(page);
    await page.getByTestId("skip-solves").click();
    await page.getByTestId("skip-tests").click();
    await page.getByTestId("start-path").click();
    await expect(page.getByTestId("course-progress")).toHaveText(/^0\//);

    await page.getByTestId("continue-lesson").click();
    await expect(page.getByTestId("lesson-step-intro")).toBeVisible();
    for (let step = 0; step < 20; step++) {
      // Continue locks on the question card, so a locked button means we're there.
      if (await page.getByTestId("lesson-continue").isDisabled()) break;
      await page.getByTestId("lesson-continue").click();
    }
    // The question has to be answered before moving on.
    await expect(page.getByTestId("lesson-step-quiz")).toBeVisible();
    await expect(page.getByTestId("lesson-continue")).toBeDisabled();
    await page.locator("[data-correct=true]").click();
    await expect(page.getByTestId("quiz-feedback")).toContainText("Exactly right.");
    for (let step = 0; step < 5; step++) {
      // The last card swaps Continue for the ways out.
      if ((await page.getByTestId("lesson-continue").count()) === 0) break;
      await page.getByTestId("lesson-continue").click();
    }
    await expect(page.getByTestId("lesson-step-done")).toContainText("Lesson complete");

    await page.getByRole("link", { name: "Your path" }).click();
    await expect(page.getByTestId("course-progress")).toHaveText(/^1\//);
    await expect(page.getByTestId("continue-lesson")).toContainText("Continue");
  });

  test("a wrong answer gets another go, and the lesson isn't read until it's right", async ({
    page,
  }) => {
    await findLevel(page);
    await page.getByTestId("skip-solves").click();
    await page.getByTestId("skip-tests").click();
    await page.getByTestId("start-path").click();
    await page.getByTestId("continue-lesson").click();
    const toTheQuestion = async () => {
      for (let step = 0; step < 20; step++) {
        if (await page.getByTestId("lesson-continue").isDisabled()) break;
        await page.getByTestId("lesson-continue").click();
      }
      await expect(page.getByTestId("lesson-step-quiz")).toBeVisible();
    };
    const toTheEnd = async () => {
      for (let step = 0; step < 8; step++) {
        if ((await page.getByTestId("lesson-continue").count()) === 0) break;
        await page.getByTestId("lesson-continue").click();
      }
    };
    await toTheQuestion();

    // A wrong answer says why, keeps the right one hidden, and doesn't let you on.
    await page.locator("[data-testid^=quiz-option-]:not([data-correct])").first().click();
    await expect(page.getByTestId("quiz-feedback")).toContainText("Not quite.");
    await expect(page.getByTestId("lesson-continue")).toBeDisabled();

    // Skipping leaves the lesson unread.
    await page.getByTestId("quiz-skip").click();
    await toTheEnd();
    await expect(page.getByTestId("lesson-unchecked")).toContainText("One question to go");

    // Back to the question, right this time, and the lesson counts.
    await page.getByTestId("back-to-question").click();
    await page.locator("[data-correct=true]").click();
    await expect(page.getByTestId("quiz-feedback")).toContainText("Exactly right.");
    await toTheEnd();
    await expect(page.getByTestId("lesson-step-done")).toContainText("Lesson complete");
    await page.getByRole("link", { name: "Your path" }).click();
    await expect(page.getByTestId("course-progress")).toHaveText(/^1\//);
  });

  test("units pass on numbers, and say so on the path", async ({ page }) => {
    await importCoreTests(page);
    await page.goto("/hub/");
    await expect(page.getByTestId("course-title")).toHaveText("Sub-20");
    // Every core test is taken, which is what "Where 20 seconds goes" asks for.
    await expect(page.getByTestId("status-sub-20-budget")).toHaveText("Passed");
    await expect(page.getByTestId("course-units")).toContainText(/\d+ of \d+ units finished/);
    // Nothing has been read, so no unit says "Read".
    await expect(page.locator("[data-testid^=status-]").filter({ hasText: /^Read$/ })).toHaveCount(
      0,
    );

    await page.goto("/hub/unit/sub-20-budget/");
    await expect(page.getByTestId("unit-measure")).toContainText("Core tests taken");
    await expect(page.getByTestId("unit-passed")).toBeVisible();
  });

  test("tests you've taken put the coach model's picks at the top", async ({ page }) => {
    await importCoreTests(page);
    await page.goto("/hub/");
    await expect(page.getByTestId("course-title")).toHaveText("Sub-20");
    await expect(page.getByTestId("course-hero")).toContainText("placed by your goal");
    const first = page.getByTestId("course-path").locator("section").first();
    await expect(first).toContainText("Picked for you");
    await expect(page.getByTestId("profile-snapshot")).toContainText(/\d+\/\d+ tests/);
  });

  test("a drill runs with its rule on screen, and keeps the session for next time", async ({
    page,
  }) => {
    await page.goto("/hub/unit/lookahead/");
    await expect(page.getByTestId("unit-measure")).toContainText("Lookahead");
    const drill = page.locator("[data-testid^=drill-run-]").first();
    await drill.click();
    await expect(page.getByTestId("drill-rules")).toContainText("The rule is the point");
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("test-timer-surface").focus();
    await keyboardSolve(page, 500);
    await keyboardSolve(page, 600);
    await expect(page.getByTestId("drill-times").locator("li")).toHaveCount(2);
    await page.getByTestId("drill-finish").click();
    await expect(page.getByTestId("drill-summary")).toContainText(
      "your first session of this drill",
    );

    // The next session sits beside the last one.
    await page.reload();
    await expect(page.getByTestId("drill-session")).toContainText("2 attempts");

    // The drill now shows as done on the course's path.
    await page.goto("/hub/course/sub-30/");
    await page.getByTestId("unit-toggle-lookahead").click();
    await expect(
      page.locator("[data-testid^=path-node-lookahead-drill-][data-state=done]"),
    ).toHaveCount(1);
  });

  test("the recognition drill times twelve cases and sums them up", async ({ page }) => {
    await page.goto("/hub/unit/pll-algorithms/");
    await page.getByTestId("unit-recognition").click();
    await page.getByTestId("recognition-start").click();
    for (let card = 0; card < 12; card++) {
      await expect(page.getByTestId("recognition-card")).toBeVisible();
      await page.locator("[data-correct=true]").first().click();
    }
    await expect(page.getByTestId("recognition-summary")).toContainText("12 of 12 right");
    await expect(page.getByTestId("recognition-known")).toContainText(/\d+ of 21 cases/);

    // The answers are kept: the profile lists the set and what you know of it.
    await page.goto("/hub/profile/");
    await expect(page.getByTestId("known-pll")).toContainText(/PLL: \d+ of 21 known/);
  });

  test("the library holds every course and unit, searchable and filterable", async ({ page }) => {
    await page.goto("/hub/library/");
    for (const course of [
      "learn-to-solve",
      "sub-60",
      "sub-45",
      "sub-30",
      "sub-20",
      "sub-15",
      "sub-12",
      "sub-10",
    ]) {
      await expect(page.getByTestId(`library-course-${course}`)).toBeVisible();
    }
    await expect(page.getByTestId("library-unit-reconstruct-your-solves")).toBeVisible();
    await page.getByTestId("library-filter-learn-to-solve").click();
    await expect(page.getByTestId("library-unit-method-beginner")).toBeVisible();
    await expect(page.getByTestId("library-unit-reconstruct-your-solves")).toHaveCount(0);
    await page.getByTestId("library-search").fill("notation");
    await expect(page.getByTestId("library-unit-method-beginner")).toBeVisible();
    await expect(page.getByTestId("library-unit-set-up-your-cube")).toHaveCount(0);
  });
});
