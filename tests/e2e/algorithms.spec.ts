import { expect, test } from "./fixtures";

test.describe("the algorithm bank", () => {
  test("marks what you know, remembers the algorithm you picked, and filters", async ({ page }) => {
    await page.goto("/algorithms/");
    await expect(page.getByTestId("set-pll")).toContainText("21 cases");
    await expect(page.getByTestId("set-oll")).toContainText("57 cases");

    await page.getByTestId("set-pll").click();
    await expect(page).toHaveURL(/\/algorithms\/pll\/?$/);
    await expect(page.getByTestId("set-progress")).toContainText("0 of 21 known", {
      timeout: 20_000,
    });

    // Open a case and read the algorithms it offers.
    await page.getByTestId("case-pll-t").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("algorithms that solve it");
    const second = dialog.locator('[data-testid^="algorithm-t-"]').nth(1);
    const secondMoves = (await second.locator("p").first().innerText()).trim();

    await dialog.getByTestId("case-label-known").click();
    await second.getByRole("button", { name: "Use this one" }).click();
    await expect(second).toContainText("Yours");
    await dialog.getByRole("button", { name: "Done" }).click();

    // The card follows what was chosen, and so does the set's count.
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Know it");
    await expect(page.getByTestId("case-pll-t")).toContainText(secondMoves);
    await expect(page.getByTestId("set-progress")).toContainText("1 of 21 known");

    // It survives a reload, because it is saved rather than held in the page.
    await page.reload();
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Know it", { timeout: 20_000 });
    await expect(page.getByTestId("case-pll-t")).toContainText(secondMoves);

    // Filtering and searching narrow the grid.
    await page.getByRole("radio", { name: "Know it" }).click();
    await expect(page.getByTestId("case-pll-t")).toBeVisible();
    await expect(page.getByTestId("case-pll-aa")).toHaveCount(0);
    await page.getByRole("radio", { name: "All" }).click();
    await page.getByLabel("Find a case").fill("edges only");
    await expect(page.getByTestId("case-pll-h")).toBeVisible();
    await expect(page.getByTestId("case-pll-t")).toHaveCount(0);
  });

  test("every case shows a diagram and at least one algorithm", async ({ page }) => {
    await page.goto("/algorithms/oll/");
    await expect(page.getByTestId("set-progress")).toBeVisible({ timeout: 20_000 });
    const cards = page.locator('[data-testid^="case-oll-"]');
    await expect(cards).toHaveCount(57);
    await expect(page.getByRole("img", { name: /OLL 1, seen from above/ })).toBeVisible();
    await page.getByTestId("case-oll-57").click();
    await expect(page.getByRole("dialog")).toContainText("Mummy");
  });
});
