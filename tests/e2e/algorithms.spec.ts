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

    // Clicking a case moves it round the three labels.
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Don't know");
    await page.getByTestId("case-pll-t").click();
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Learning");
    await page.getByTestId("case-pll-t").click();
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Know it");
    await expect(page.getByTestId("set-progress")).toContainText("1 of 21 known");
    await page.getByTestId("case-pll-t").click();
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Don't know");

    // The pencil opens the case, where the algorithms are.
    await page.getByTestId("case-open-pll-t").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("algorithms that solve it");
    const second = dialog.locator('[data-testid^="algorithm-t-"]').nth(1);
    const secondId = (await second.getAttribute("data-testid"))!.replace("algorithm-", "");
    const secondMoves = (
      await dialog.getByTestId(`algorithm-moves-${secondId}`).innerText()
    ).trim();
    // This one starts from a different angle to the picture, so it shows the
    // turn it needs; once chosen, the picture turns instead and the turn goes.
    await expect(dialog.getByTestId(`algorithm-turn-${secondId}`)).toHaveText("U2");

    await dialog.getByTestId("case-label-known").click();
    await second.getByRole("button", { name: "Use this one" }).click();
    await expect(second).toContainText("Yours");
    await expect(dialog.getByTestId(`algorithm-turn-${secondId}`)).toHaveCount(0);
    // The one it replaced now needs the opposite turn from the new picture.
    const firstId = (await dialog
      .locator('[data-testid^="algorithm-t-"]')
      .first()
      .getAttribute("data-testid"))!.replace("algorithm-", "");
    await expect(dialog.getByTestId(`algorithm-turn-${firstId}`)).toHaveText("U2");
    await dialog.getByRole("button", { name: "Done" }).click();

    // The card follows what was chosen, and so does the set's count.
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Know it");
    await expect(page.getByTestId("case-pll-t")).toContainText(secondMoves);
    await expect(page.getByTestId("set-progress")).toContainText("1 of 21 known");

    // It survives a reload, because it is saved rather than held in the page.
    await page.reload();
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Know it", { timeout: 20_000 });
    await expect(page.getByTestId("case-pll-t")).toContainText(secondMoves);

    // The filter takes any mix of the labels, not one at a time.
    await page.getByTestId("case-pll-aa").click();
    await expect(page.getByTestId("case-state-pll-aa")).toHaveText("Learning");
    await page.getByTestId("filter-known").click();
    await expect(page.getByTestId("case-pll-t")).toBeVisible();
    await expect(page.getByTestId("case-pll-aa")).toHaveCount(0);
    await page.getByTestId("filter-learning").click();
    await expect(page.getByTestId("case-pll-t")).toBeVisible();
    await expect(page.getByTestId("case-pll-aa")).toBeVisible();
    await expect(page.getByTestId("case-pll-h")).toHaveCount(0);
    await page.getByTestId("filter-known").click();
    await page.getByTestId("filter-learning").click();
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
    await page.getByTestId("case-open-f2l-1").click();
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
    await page.getByTestId("case-open-2oll-sune").click();
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

  test("keeps an algorithm of your own once the cube agrees it solves the case", async ({
    page,
  }) => {
    await page.goto("/algorithms/pll/");
    await expect(page.getByTestId("case-open-pll-t")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("case-open-pll-t").click();
    const dialog = page.getByRole("dialog");
    const input = dialog.getByTestId("custom-algorithm-input");

    // A Y perm doesn't solve a T perm, so it isn't kept.
    await input.fill("F R U' R' U' R U R' F' R U R' U' R' F R F'");
    await dialog.getByTestId("custom-algorithm-add").click();
    await expect(dialog.getByTestId("custom-algorithm-error")).toContainText(
      "doesn't solve this case",
    );

    // The bank's T perm with turns of the top added is the same algorithm.
    await input.fill("U R U R' U' R' F R2 U' R' U' R U R' F' U'");
    await dialog.getByTestId("custom-algorithm-add").click();
    await expect(dialog.getByTestId("custom-algorithm-error")).toContainText(
      "already in the list, written as",
    );

    // One the list doesn't have (R and L commute, so R L R' L' does nothing) is
    // kept, and becomes the one shown on the case.
    await input.fill("(R U R' U') R' F R2 U' R' U' R U R' F' R L R' L'");
    await dialog.getByTestId("custom-algorithm-add").click();
    const own = dialog.locator('[data-testid^="algorithm-custom-"]');
    await expect(own).toHaveCount(1);
    await expect(own).toContainText("Your own");
    await expect(own).toContainText("Yours");
    await expect(input).toHaveValue("");

    // It stays after a reload, and can be removed.
    await page.reload();
    await page.getByTestId("case-open-pll-t").click();
    await expect(
      page.getByRole("dialog").locator('[data-testid^="algorithm-custom-"]'),
    ).toHaveCount(1);
    await page.getByRole("dialog").locator('[data-testid^="remove-custom-"]').click();
    await expect(
      page.getByRole("dialog").locator('[data-testid^="algorithm-custom-"]'),
    ).toHaveCount(0);
  });

  test("every case shows a diagram and at least one algorithm", async ({ page }) => {
    await page.goto("/algorithms/oll/");
    await expect(page.getByTestId("set-progress")).toBeVisible({ timeout: 20_000 });
    const cards = page.locator('[data-testid^="case-oll-"]');
    await expect(cards).toHaveCount(57);
    await expect(page.getByRole("img", { name: /OLL 1, seen from above/ })).toBeVisible();
    await page.getByTestId("case-open-oll-57").click();
    await expect(page.getByRole("dialog")).toContainText("Mummy");
  });

  test("Fundamentals lists the triggers, with what each claims, and keeps your labels", async ({
    page,
  }) => {
    await page.goto("/algorithms/");
    await expect(page.getByTestId("set-fundamentals")).toContainText("15 triggers");
    await page.getByTestId("set-fundamentals").click();
    await expect(page).toHaveURL(/\/algorithms\/fundamentals\/?$/);
    await expect(page.getByTestId("set-progress")).toContainText("0 of 15 owned", {
      timeout: 20_000,
    });
    await expect(page.getByTestId("trigger-sexy")).toContainText("R U R' U'");
    await expect(page.getByTestId("trigger-repeats-sexy")).toHaveText(
      "Six times in a row and the cube is back where it started.",
    );
    await page.getByTestId("trigger-label-sexy-known").click();
    await expect(page.getByTestId("set-progress")).toContainText("1 of 15 owned");
    await page.reload();
    await expect(page.getByTestId("trigger-sexy")).toHaveAttribute("data-label", "known", {
      timeout: 20_000,
    });
  });

  test("ZBLL loads when opened, shows the most common algorithm first and keeps your pick", async ({
    page,
  }) => {
    await page.goto("/algorithms/");
    await expect(page.getByTestId("set-zbll")).toContainText(/493 cases · \d+ algorithms/);
    await page.getByTestId("set-zbll").click();
    await expect(page).toHaveURL(/\/algorithms\/zbll\/?$/);
    await expect(page.getByTestId("case-zbll-t-1")).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator('[data-testid^="case-zbll-"]:not([data-testid^="case-zbll-pll"])').first(),
    ).toBeVisible();
    await expect(page.getByTestId("set-progress")).toContainText("0 of 493 known");

    // A PLL inside ZBLL is the same case as in full PLL, so its label is shared.
    await page.getByTestId("case-zbll-pll-t").click();
    await expect(page.getByTestId("case-state-zbll-pll-t")).toHaveText("Learning");
    // Each group says how much of it you know.
    await expect(page.getByTestId("group-tally-PLL")).toHaveText("0 of 21 known · 1 learning");

    // The dialog shows the default, with the rest behind "More algorithms".
    await page.getByTestId("case-open-zbll-t-1").click();
    const dialog = page.getByRole("dialog");
    const shown = dialog.locator('[data-testid^="algorithm-zb-"]');
    await expect(shown).toHaveCount(1);
    await expect(dialog.getByTestId("more-algorithms-list")).toHaveCount(0);
    await dialog.getByTestId("more-algorithms").click();
    const more = dialog.getByTestId("more-algorithms-list");
    await expect(more).toBeVisible();
    const pick = more.locator('[data-testid^="algorithm-zb-"]').first();
    const pickId = (await pick.getAttribute("data-testid"))!.replace("algorithm-", "");
    await pick.getByRole("button", { name: "Use this one" }).click();
    await expect(dialog.getByTestId(`algorithm-${pickId}`)).toContainText("Yours");
    await page.keyboard.press("Escape");

    await page.reload();
    await expect(page.getByTestId("case-zbll-t-1")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("case-open-zbll-t-1").click();
    // Your pick is shown without opening the list.
    await expect(page.getByRole("dialog").getByTestId(`algorithm-${pickId}`)).toContainText(
      "Yours",
    );
    await page.keyboard.press("Escape");

    await page.goto("/algorithms/pll/");
    await expect(page.getByTestId("case-state-pll-t")).toHaveText("Learning", { timeout: 20_000 });
  });

  test("PLL keeps its own algorithms first, with the extras behind More algorithms", async ({
    page,
  }) => {
    await page.goto("/algorithms/pll/");
    await expect(page.getByTestId("set-progress")).toContainText("0 of 21 known", {
      timeout: 20_000,
    });
    await page.getByTestId("case-open-pll-t").click();
    const dialog = page.getByRole("dialog");
    // The bank's own are listed straight away; the extras load and wait behind the button.
    await expect(dialog.locator('[data-testid^="algorithm-t-"]').first()).toBeVisible();
    await expect(dialog.getByTestId("more-algorithms")).toBeVisible({ timeout: 20_000 });
    await expect(dialog.locator('[data-testid^="algorithm-ex-"]')).toHaveCount(0);
    await dialog.getByTestId("more-algorithms").click();
    const extra = dialog
      .getByTestId("more-algorithms-list")
      .locator('[data-testid^="algorithm-ex-"]')
      .first();
    const extraId = (await extra.getAttribute("data-testid"))!.replace("algorithm-", "");
    await extra.getByRole("button", { name: "Use this one" }).click();
    await expect(dialog.getByTestId(`algorithm-${extraId}`)).toContainText("Yours");
    await page.keyboard.press("Escape");

    // The pick is shown on the card, and in the dialog without opening the list.
    await page.reload();
    await page.getByTestId("case-open-pll-t").click({ timeout: 20_000 });
    await expect(page.getByRole("dialog").getByTestId(`algorithm-${extraId}`)).toContainText(
      "Yours",
      { timeout: 20_000 },
    );
  });

  test("a case with hundreds of extras lists them fifty at a time", async ({ page }) => {
    await page.goto("/algorithms/oll/");
    await page.getByTestId("case-open-oll-24").click({ timeout: 20_000 });
    const dialog = page.getByRole("dialog");
    await dialog.getByTestId("more-algorithms").click({ timeout: 20_000 });
    const rows = dialog.getByTestId("more-algorithms-list").locator("li");
    await expect(rows).toHaveCount(50);
    await dialog.getByTestId("more-algorithms-page").click();
    await expect(rows).toHaveCount(100);
  });
});
