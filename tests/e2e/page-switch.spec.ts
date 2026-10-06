import { expect, test } from "./fixtures";

// Page switches are instant: from the first frame the new route is the pathname, the old page's
// content is gone and no page view transition (which could keep the old snapshot on screen) runs.
for (const [link, path] of [
  ["Learning Hub", "/hub/"],
  ["Settings", "/settings/"],
] as const) {
  test(`switching to ${link} never shows the old and the new page together`, async ({ page }) => {
    await page.goto("/timer/");
    await expect(page.getByTestId("timer-display")).toBeVisible();
    await page.evaluate((target) => {
      const w = window as unknown as { __bad?: string[]; __frames?: number };
      w.__bad = [];
      w.__frames = 0;
      const tick = (): void => {
        w.__frames! += 1;
        const vt = document
          .getAnimations()
          .some((a) =>
            ((a.effect as KeyframeEffect | null)?.pseudoElement ?? "").startsWith(
              "::view-transition",
            ),
          );
        const onNew = location.pathname.startsWith(target);
        const oldVisible = !!document.querySelector('[data-testid="timer-display"]');
        if (vt) w.__bad!.push("view transition running");
        if (onNew && oldVisible) w.__bad!.push("old page content still in the DOM");
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, path);
    await page.getByRole("link", { name: link }).first().click();
    await expect(page).toHaveURL(new RegExp(path));
    await expect(page.getByTestId("timer-display")).toHaveCount(0);
    await page.waitForTimeout(700);
    const res = await page.evaluate(() => {
      const w = window as unknown as { __bad: string[]; __frames: number };
      return { bad: w.__bad, frames: w.__frames };
    });
    expect(res.frames).toBeGreaterThan(10);
    expect(res.bad).toEqual([]);
  });
}
