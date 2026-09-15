import { expect, test } from "@playwright/test";
import { display, openTimer } from "./helpers";

test("Bluetooth simulator can drive the timer without Space", async ({ page }) => {
  await openTimer(page);

  await page.evaluate(async () => {
    sessionStorage.setItem("solvelab.timerDevice.v1", "simulator");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("speedcubing-local");
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("settings", "readwrite");
      const store = tx.objectStore("settings");
      const getReq = store.get("preferences");
      getReq.onsuccess = () => {
        const current = (getReq.result ?? {}) as Record<string, unknown>;
        store.put({ ...current, id: "preferences", timerInput: "bluetooth" });
      };
      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });

  await page.reload();
  await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("stackmat-simulator")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/Bluetooth timer mode/i)).toBeVisible();

  const pad = page.getByRole("button", { name: "Sensor pad" });
  await pad.dispatchEvent("pointerdown");
  await page.waitForTimeout(450);
  await expect(display(page)).toHaveAttribute("data-tone", "armed");
  await pad.dispatchEvent("pointerup");
  await expect(display(page)).toHaveAttribute("data-tone", "running");
  await page.waitForTimeout(300);
  await page.keyboard.down("Space");
  await expect(display(page)).toHaveAttribute("data-tone", "result");
  await page.keyboard.up("Space");
  await expect(page.getByTestId("solve-count")).toHaveText("1/1", { timeout: 10000 });
});
