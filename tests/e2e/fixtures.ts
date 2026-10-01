import { expect, test as base } from "@playwright/test";
import { seedStoredAccount } from "./helpers";

/**
 * The account services: Firebase Auth and Firestore, and Supabase (auth and
 * the Data API). A build with either config would otherwise reach the real
 * project. Both are blocked, whichever the build uses.
 */
const ACCOUNT_HOSTS =
  /^https:\/\/((identitytoolkit|securetoken|firestore)\.googleapis\.com|[a-z0-9-]+\.supabase\.(co|in|red))\//;

/**
 * Coach, Stats, Train and Learn need an account, so most tests run as a signed-in
 * person. Firebase is blocked, so the account is a stored session the app reads
 * on start-up, exactly as it would after a real sign-in on this device. Nothing
 * reaches Google or Supabase; `firebaseRequests` (its historical name) proves it.
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
      await page.route(ACCOUNT_HOSTS, (route) => {
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
