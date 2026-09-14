import { defineConfig } from "@playwright/test";

/** Hit the public site. Do not start a local static server. */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "https://solvelab.bhargava-gumpula.com",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
});
