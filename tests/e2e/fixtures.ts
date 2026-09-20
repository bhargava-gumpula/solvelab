import { expect, test as base } from "@playwright/test";
import { seedStoredAccount } from "./helpers";

/** Firebase Auth and Firestore. Builds with a Firebase config would otherwise reach the real project. */
const FIREBASE_HOSTS = /^https:\/\/(identitytoolkit|securetoken|firestore)\.googleapis\.com\//;

/**
 * Coach, Stats, Train and Learn need an account, so most tests run as a signed-in
 * person. Firebase is blocked, so the account is a stored session the app reads
 * on start-up, exactly as it would after a real sign-in on this device. Nothing
 * reaches Google; `firebaseRequests` proves it.
 *
 * A test that wants the signed-out site asks for it with
 * `test.use({ account: "signedOut" })`.
 */
export const test = base.extend<{
  firebaseRequests: string[];
  account: "signedIn" | "signedOut";
  accountSetup: void;
}>({
  firebaseRequests: [
    async ({ page }, use) => {
      const requests: string[] = [];
      await page.route(FIREBASE_HOSTS, (route) => {
        const url = new URL(route.request().url());
        requests.push(`${url.host}${url.pathname}`);
        return route.abort();
      });
      await use(requests);
    },
    { auto: true },
  ],
  account: ["signedIn", { option: true }],
  accountSetup: [
    async ({ page, account, firebaseRequests }, use) => {
      // Depend on the route so Firebase is already blocked while seeding.
      void firebaseRequests;
      if (account === "signedIn") await seedStoredAccount(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
export type { Page } from "@playwright/test";
