import { expect, test } from "./fixtures";

test.describe("the algorithm bank", () => {
  test("marks what you know, remembers the algorithm you picked, and filters", async ({ page }) => {
    await page.goto("/algorithms/");
    await expect(page.getByTestId("set-pll")).toContainText("21 cases");
    await expect(page.getByTestId("set-oll")).toContainText("57 cases");
    await expect(page.getByTestId("set-f2l")).toContainText("41 cases");
    await expect(page.getByTestId("set-coll")).toContainText("40 cases");
    await expect(page.getByTestId("set-winter-variation")).toContainText("27 cases");

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

  test("pair cases show where the pair is and how to put it in", async ({ page }) => {
    await page.goto("/algorithms/f2l/");
    await expect(page.getByTestId("set-progress")).toContainText("0 of 41 known", {
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid^="case-f2l-"]')).toHaveCount(41);
    await page.getByTestId("case-f2l-1").click();
    const dialog = page.getByRole("dialog");
    // The case says where the pair sits, in words.
    await expect(dialog).toContainText(/Corner .*\. Edge .*\./);
    await expect(dialog.locator('[data-testid^="algorithm-f1-"]').first()).toContainText("R U R'");
  });

  test("a two-look step is the same case as the full one it comes from", async ({ page }) => {
    // Sune in 2-look OLL is OLL 27: the same algorithms, and one shared label.
    await page.goto("/algorithms/two-look-oll/");
    await expect(page.getByTestId("set-progress")).toContainText("0 of 10 known", {
      timeout: 20_000,
    });
    await page.getByTestId("case-2oll-sune").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator('[data-testid^="algorithm-o27-"]').first()).toContainText(
      "R U R' U R U2 R'",
    );
    await dialog.getByTestId("case-label-known").click();
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(page.getByTestId("case-state-2oll-sune")).toHaveText("Know it");

    // The full set knows it too, because it is one case, not two.
    await page.goto("/algorithms/oll/");
    await expect(page.getByTestId("case-state-oll-27")).toHaveText("Know it", { timeout: 20_000 });
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
