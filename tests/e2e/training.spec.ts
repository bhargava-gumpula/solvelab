import { expect, test } from "./fixtures";
import { importCoreTests } from "./helpers";

test.describe("packs on Learn, practice on Train", () => {
  test("Learn shows the packs recommended for you, and every other one behind See all", async ({
    page,
  }) => {
    // The imported profile averages 20 s (the 30 → 20 stretch) with every core test taken.
    await importCoreTests(page);
    await page.goto("/learn/");
    await expect(page.getByTestId("level-sub25")).toContainText("You are here");

    // The coach model's picks come first, then the packs written for the level.
    const recommended = page.getByTestId("packs-recommended");
    await expect(page.getByTestId("packs-why")).toContainText("The coach model picked these");
    await expect(recommended.getByTestId("rec-auf-both-ends")).toBeVisible();
    await expect(recommended.getByTestId("rec-sub-20-budget")).toBeVisible();
    await expect(recommended.getByTestId("rec-auf-both-ends").getByTestId("pack-band")).toHaveText(
      "30 → 20 s",
    );
    // Only the recommended packs show until you ask for the rest.
    await expect(page.getByTestId("packs-all")).toHaveCount(0);
    await expect(page.getByTestId("all-beginner-method-cold")).toHaveCount(0);

    await page.getByTestId("see-all").click();
    const all = page.getByTestId("packs-all");
    await expect(all.getByTestId("all-beginner-method-cold")).toBeVisible();
    // Nothing recommended is listed twice.
    await expect(all.getByTestId("all-auf-both-ends")).toHaveCount(0);

    // Filter the rest by stretch of the road.
    await all.getByTestId("filter-band-sub10").click();
    await expect(all.getByTestId("all-reconstruct-your-solves")).toBeVisible();
    await expect(all.getByTestId("all-beginner-method-cold")).toHaveCount(0);
    await all.getByTestId("filter-band-2m-1m").click();
    await expect(all.getByTestId("all-beginner-method-cold")).toBeVisible();

    await all.getByTestId("all-beginner-method-cold").click();
    await expect(page).toHaveURL(/\/learn\/beginner-method-cold\/$/);
    await expect(page.getByText("Learn · 2:00 → 1:00")).toBeVisible();
    await expect(page.getByText("Why it matters at 2:00 → 1:00")).toBeVisible();
  });

  test("with no tests taken, Learn recommends only the packs for your goal's level", async ({
    page,
  }) => {
    // Aiming at sub-20 with no average yet puts you on the stretch leading to it, 30 → 20.
    await page.goto("/coach/");
    await page.getByRole("button", { name: /^Sub 20/ }).click();
    await expect(page.getByTestId("coach-headline")).toBeVisible();
    await page.goto("/learn/");
    await expect(page.getByTestId("packs-why")).toContainText("The packs written for your level");
    await expect(page.getByTestId("rec-auf-both-ends")).toBeVisible();
    await expect(page.getByTestId("rec-lookahead")).toHaveCount(0);
  });

  test("a pack teaches, and remembers what you have read", async ({ page }) => {
    await page.goto("/learn/lookahead/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lookahead, properly");
    // Only shown once the saved progress has loaded, so this is a real reading.
    await expect(page.getByTestId("pack-progress")).toContainText("0/3");

    await page.getByTestId("lesson-lookahead-slow-solves").getByRole("button").first().click();
    const lesson = page.getByTestId("lesson-lookahead-slow-solves");
    await expect(lesson).toContainText("The cube never stops moving");
    await expect(lesson).toContainText("You have it when:");

    await page.getByTestId("lesson-done-lookahead-slow-solves").click();
    await expect(page.getByTestId("pack-progress")).toContainText("1/3");

    await page.reload();
    await expect(page.getByTestId("pack-progress")).toContainText("1/3");
  });

  test("a drill you choose to practise lands on Train, and leaves when you untick it", async ({
    page,
  }) => {
    await page.goto("/train/");
    await expect(page.getByTestId("train-empty")).toBeVisible();
    await expect(page.getByTestId("train-drills")).toHaveCount(0);

    await page.goto("/learn/lookahead/");
    const drill = page.getByTestId("drill-lookahead-metronome");
    await expect(drill).toContainText("How much");
    await expect(drill).toContainText("It is working when");
    await page.getByTestId("drill-done-lookahead-metronome").click();
    await expect(page.getByTestId("drill-done-lookahead-metronome")).toContainText("Practising");

    await page.goto("/train/");
    const drills = page.getByTestId("train-drills");
    await expect(drills.getByTestId("drill-lookahead-metronome")).toBeVisible();
    // It says which pack it came from, so the lessons behind it are one click away.
    await expect(drills.getByRole("link", { name: "Lookahead, properly" })).toHaveAttribute(
      "href",
      "/learn/lookahead/",
    );
    await expect(page.getByTestId("started-lookahead")).toBeVisible();
    await expect(page.getByTestId("train-empty")).toHaveCount(0);

    await drills.getByTestId("drill-done-lookahead-metronome").click();
    await expect(page.getByTestId("train-drills")).toHaveCount(0);
  });

  test("Train sends you to your recommended packs on Learn", async ({ page }) => {
    await importCoreTests(page);
    await page.goto("/train/");
    await expect(page.getByTestId("train-intro")).toContainText("30 → 20 s");
    await page.getByTestId("train-browse-learn").click();
    await expect(page).toHaveURL(/\/learn\/#packs$/);
    await expect(page.getByTestId("packs-recommended")).toBeVisible();
  });

  test("a slow part on Coach links to its pack on Learn, and back to the retest", async ({
    page,
  }) => {
    await importCoreTests(page);
    await page.goto("/coach/");
    const link = page.getByTestId(/^coach-pack-/).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/learn\/[a-z0-9-]+\//);
    await expect(page.getByTestId("pack-retest")).toBeVisible();
  });
});
