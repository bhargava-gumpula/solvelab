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
});
