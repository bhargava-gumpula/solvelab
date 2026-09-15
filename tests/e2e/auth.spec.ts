import { expect, test } from "@playwright/test";
import { keyboardSolve, openTimer } from "./helpers";

test("unsigned visitors can time solves and are asked to sign in for Coach", async ({ page }) => {
  await openTimer(page);
  await keyboardSolve(page, 300);
  await expect(page.getByTestId("solve-count")).toHaveText("1/1");

  await page.goto("/coach/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in to use Coach.");
  await expect(
    page.getByRole("main").getByRole("button", { name: "Sign in with Google" }),
  ).toBeVisible();
  await expect(page.getByText("Know what to practice next.")).toHaveCount(0);
});

test("Train and Learn are gated the same way", async ({ page }) => {
  await page.goto("/train/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in to use Train.");
  await page.goto("/learn/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in to use Learn.");
});

test("privacy, terms and overview are public", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
  await expect(page.getByText("speedcubing-local")).toBeVisible();
  await expect(page.getByText("Google Cloud Firestore")).toBeVisible();
  await page.goto("/terms/");
  await expect(page).toHaveURL(/\/terms\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of Use");
  await page.goto("/overview/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SolveLab 2.1");
  await expect(page.getByRole("heading", { name: "2.1 — Interface" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2.0 — Accounts and cloud times" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Planned" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "2.2 — Hardware timer and first coach" }),
  ).toBeVisible();
});
