import { expect, test } from "./fixtures";
import { keyboardSolve } from "./helpers";

test.describe("the algorithm trainer", () => {
  test("sets up a case with a scramble, times it on the space bar and keeps the time", async ({
    page,
  }) => {
    await page.goto("/algorithms/pll/");
    await page.getByTestId("practise-set").click({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/algorithms\/pll\/train\/$/);
    // Nothing labelled yet, so every case is in.
    await expect(page.getByTestId("trainer-count")).toHaveText("21 cases", { timeout: 20_000 });
    await page.getByTestId("trainer-start").click();

    const session = page.getByTestId("trainer-session");
    await expect(session.getByTestId("trainer-case")).toBeVisible();
    await expect(session.getByTestId("trainer-algorithm")).not.toBeEmpty();
    // The scramble comes from the solver in the browser.
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 30_000 });
    const firstCase = (await session.getByTestId("trainer-case").innerText()).trim();

    // A click on the timer never starts it; the space bar does.
    await page.getByTestId("test-timer-surface").click();
    await expect(page.getByTestId("timer-display")).not.toHaveAttribute("data-tone", "running");
    await keyboardSolve(page, 700);
    await expect(session.getByTestId("trainer-last")).toContainText(firstCase);
    await expect(session.getByTestId("trainer-slowest").locator("li")).toHaveCount(1);
    // The next case is a different one, with its own scramble.
    await expect(session.getByTestId("trainer-case")).not.toHaveText(firstCase);
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 30_000 });

    // A time that went wrong can be taken back.
    await session.getByTestId("trainer-undo").click();
    await expect(session.getByTestId("trainer-slowest")).toHaveCount(0);

    // Recognising the case yourself: its name stays hidden until you stop.
    await session.getByTestId("trainer-stop").click();
    await page.getByTestId("trainer-mode-combined").click();
    await page.getByTestId("trainer-start").click();
    await expect(page.getByTestId("trainer-hidden")).toBeVisible();
    await expect(page.getByTestId("trainer-case")).toHaveCount(0);
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 30_000 });
    await keyboardSolve(page, 500);
    await expect(page.getByTestId("trainer-last")).toBeVisible();

    // The time is kept.
    await page.reload();
    await page.getByTestId("trainer-start").click({ timeout: 20_000 });
    await expect(page.getByTestId("trainer-slowest").locator("li")).toHaveCount(1);

    // The profile names your slowest case on the cube, with a way back to practise it.
    await page.goto("/hub/profile/");
    const slowest = page.getByTestId("slowest-on-the-cube");
    await expect(slowest).toContainText("PLL ·", { timeout: 20_000 });
    await expect(slowest.getByRole("link", { name: /Practise/ })).toHaveAttribute(
      "href",
      "/algorithms/pll/train/",
    );

    // The unit that teaches PLL shows the number too.
    await page.goto("/hub/unit/pll-algorithms/");
    await expect(page.getByTestId("unit-trainer-number")).toContainText("1 of 21 cases timed", {
      timeout: 20_000,
    });

    // The case's card in the set shows your median too.
    await page.goto("/algorithms/pll/");
    await expect(page.locator('[data-testid^="case-time-"]')).toHaveCount(1, { timeout: 20_000 });
  });

  test("ZBLL can be practised a COLL group at a time", async ({ page }) => {
    await page.goto("/algorithms/zbll/train/");
    const groups = page.getByTestId("trainer-groups").getByRole("button");
    await expect(groups.first()).toBeVisible({ timeout: 20_000 });
    expect(await groups.count()).toBe(41);
    await groups.filter({ hasText: "T · COLL T 1" }).click();
    await expect(page.getByTestId("trainer-count")).toHaveText("12 cases");
    // Your choice is remembered on this device.
    await page.reload();
    await expect(page.getByTestId("trainer-count")).toHaveText("12 cases", { timeout: 20_000 });
    await expect(groups.filter({ hasText: "T · COLL T 1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("flashcards show the case, then the algorithm, and count what you knew", async ({
    page,
  }) => {
    await page.goto("/algorithms/oll/train/");
    await page.getByTestId("trainer-mode-recall").click({ timeout: 20_000 });
    await page.getByTestId("trainer-start").click();
    const cards = page.getByTestId("flashcards");
    await expect(cards.getByRole("img")).toBeVisible();
    await expect(cards.getByTestId("flash-back")).toHaveCount(0);
    await cards.getByTestId("flash-reveal").click();
    await expect(cards.getByTestId("flash-back")).toContainText("OLL");
    await cards.getByTestId("flash-missed").click();
    // The keyboard works too: Enter shows the card, 1 means you knew it.
    await expect(cards.getByTestId("flash-back")).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(cards.getByTestId("flash-back")).toBeVisible();
    await page.keyboard.press("1");
    await expect(cards.getByTestId("flash-tally")).toContainText("1 known, 1 missed");
  });

  test("can go back over just your slowest cases", async ({ page }) => {
    await page.goto("/algorithms/pll/train/");
    await page.getByTestId("trainer-start").click({ timeout: 20_000 });
    const scramble = page.getByTestId("scramble");
    let previous = "";
    /** Waits for the next case's own scramble, then times a solve of it. */
    const solveNext = async (ms: number) => {
      await expect(scramble).toBeVisible({ timeout: 30_000 });
      await expect(scramble).not.toHaveText(previous, { timeout: 30_000 });
      previous = (await scramble.innerText()).trim();
      const name = (await page.getByTestId("trainer-case").innerText()).trim();
      // The timer's key listeners attach just after the scramble paints; a
      // person is never this quick, a busy test runner can be.
      await page.waitForTimeout(150);
      await keyboardSolve(page, ms);
      return name;
    };
    const timed = [await solveNext(400), await solveNext(700)];
    await page.getByTestId("trainer-stop").click();
    await page.getByTestId("trainer-slowest-start").click();
    // A fresh session can deal the case just timed, at an AUF that gives the very same scramble.
    previous = "";
    for (let round = 0; round < 4; round++) {
      expect(timed).toContain(await solveNext(300));
    }
  });

  test("a case's dialog goes straight to practising just that case", async ({ page }) => {
    await page.goto("/algorithms/pll/");
    await page.getByTestId("case-open-pll-t").click({ timeout: 20_000 });
    await page.getByRole("dialog").getByTestId("practise-case").click();
    await expect(page).toHaveURL(/\/algorithms\/pll\/train\/\?case=pll-t$/);
    await expect(page.getByTestId("trainer-case")).toHaveText("T", { timeout: 20_000 });
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 30_000 });
    await keyboardSolve(page, 300);
    // Only that case comes round.
    await expect(page.getByTestId("trainer-last")).toContainText("T");
    await expect(page.getByTestId("trainer-case")).toHaveText("T");
  });

  test("offers to mark a case known after three flashcards running", async ({ page }) => {
    // Mark one case Learning; the trainer starts with the cases you're learning.
    await page.goto("/algorithms/pll/");
    await page.getByTestId("case-pll-t").click({ timeout: 20_000 });
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Learning");
    // The Practice tab lists the sets you're learning cases in, with their trainers.
    await page.goto("/train/");
    const learning = page.getByTestId("train-algorithms-pll");
    await expect(learning).toHaveText("Full PLL · 1 learning", { timeout: 20_000 });
    await learning.click();
    await expect(page.getByTestId("trainer-count")).toHaveText("1 case", { timeout: 20_000 });
    await page.getByTestId("trainer-mode-recall").click();
    await page.getByTestId("trainer-start").click();
    for (let card = 0; card < 3; card++) {
      await page.getByTestId("flash-reveal").click();
      await page.getByTestId("flash-known").click();
    }
    await page.getByRole("button", { name: "Mark it known" }).click();
    await expect(page.getByText("T marked as known")).toBeVisible();
    await page.goto("/algorithms/pll/");
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Know it", { timeout: 20_000 });
  });
});
