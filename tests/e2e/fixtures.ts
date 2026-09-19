import { expect, test as base } from "@playwright/test";

/** Firebase Auth and Firestore. Builds with a Firebase config would otherwise reach the real project. */
const FIREBASE_HOSTS = /^https:\/\/(identitytoolkit|securetoken|firestore)\.googleapis\.com\//;

/**
 * Every test runs with Firebase blocked. `firebaseRequests` lists what the
 * page tried to send, so tests can check that nothing was shared.
 */
export const test = base.extend<{ firebaseRequests: string[] }>({
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
});

export { expect };
export type { Page } from "@playwright/test";
