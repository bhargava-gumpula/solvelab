import { expect, test } from "./fixtures";

// Scrubs the route transition's animations to every 4 ms and reads the old and new page opacities:
// the old page must be gone before the new one shows, and the whole switch must stay short.
test("switching pages never shows the old and the new page together", async ({ page }) => {
  await page.goto("/timer/");
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const w = window as unknown as { __rows?: { t: number; old: number; new: number }[] };
    const pseudo = (a: Animation) => (a.effect as KeyframeEffect | null)?.pseudoElement ?? "";
    const tick = (): void => {
      const anims = document
        .getAnimations()
        .filter((a) => /^::view-transition-(old|new)\(_t_/.test(pseudo(a)));
      if (!anims.length) {
        requestAnimationFrame(tick);
        return;
      }
      anims.forEach((a) => a.pause());
      const rows: { t: number; old: number; new: number }[] = [];
      for (let t = 0; t <= 700; t += 4) {
        const row = { t, old: 0, new: 0 };
        anims.forEach((a) => (a.currentTime = t));
        for (const a of anims) {
          const side = /^::view-transition-(old|new)/.exec(pseudo(a))![1] as "old" | "new";
          row[side] = +getComputedStyle(document.documentElement, pseudo(a)).opacity;
        }
        rows.push(row);
      }
      w.__rows = rows;
      anims.forEach((a) => a.play());
    };
    requestAnimationFrame(tick);
  });
  await page.getByRole("link", { name: "Learning Hub" }).first().click();
  await page.waitForFunction(() => (window as unknown as { __rows?: unknown }).__rows);
  const rows = await page.evaluate(
    () => (window as unknown as { __rows: { t: number; old: number; new: number }[] }).__rows,
  );
  expect(rows.filter((r) => r.old > 0.02 && r.new > 0.02)).toEqual([]);
  expect(rows.find((r) => r.new > 0.99)!.t).toBeLessThan(400);
});
