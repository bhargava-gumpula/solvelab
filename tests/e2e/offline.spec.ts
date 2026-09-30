import { expect, test } from "./fixtures";
import { display, keyboardSolve, openTimer } from "./helpers";

test.use({ serviceWorkers: "allow" });

test.describe("offline", () => {
  test("the timer reloads and times a solve with no network", async ({ page, context }) => {
    await openTimer(page);
    // Wait until the worker controls the page, as it would for a returning visitor.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }),
        );
      }
    });
    await keyboardSolve(page, 800);
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId("solve-count")).toHaveText("1/1", { timeout: 20_000 });
    // The scrambler was kept at install, so a scramble arrives without the network.
    await expect(page.getByTestId("scramble")).not.toBeEmpty({ timeout: 20_000 });
    await keyboardSolve(page, 800);
    await expect(page.getByTestId("solve-count")).toHaveText("2/2");
    await expect(display(page)).toBeVisible();

    // A page never visited falls back to the kept timer rather than an error page.
    await page.goto("/privacy/").catch(() => undefined);
    await expect(page.getByTestId("solve-count")).toHaveText("2/2", { timeout: 20_000 });
    await context.setOffline(false);
  });
});
