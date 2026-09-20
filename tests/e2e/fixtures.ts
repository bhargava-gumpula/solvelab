import { expect, test as base, type Page } from "@playwright/test";

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
async function seedStoredAccount(page: Page): Promise<void> {
  await page.goto("/timer/");
  await page.evaluate(async () => {
    const urls = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((name) => name.includes("/_next/static/chunks/"));
    let apiKey: string | null = null;
    for (const url of urls) {
      const source = await (await fetch(url)).text();
      const match = /AIzaSy[A-Za-z0-9_-]{20,}/.exec(source);
      if (match) {
        apiKey = match[0];
        break;
      }
    }
    // A build without Firebase config can't sign anyone in, and doesn't lock.
    if (!apiKey) return;
    const now = Date.now();
    const user = {
      uid: "e2e-account",
      email: "e2e@example.com",
      displayName: "E2E Tester",
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
      providerData: [
        {
          providerId: "google.com",
          uid: "e2e-account",
          displayName: "E2E Tester",
          email: "e2e@example.com",
          phoneNumber: null,
          photoURL: null,
        },
      ],
      stsTokenManager: {
        refreshToken: "e2e-refresh",
        accessToken: "e2e-access",
        expirationTime: now + 86_400_000,
      },
      createdAt: String(now),
      lastLoginAt: String(now),
      apiKey,
      appName: "[DEFAULT]",
    };
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("firebaseLocalStorageDb", 1);
      open.onupgradeneeded = () =>
        open.result.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
      open.onsuccess = () => {
        const transaction = open.result.transaction("firebaseLocalStorage", "readwrite");
        transaction
          .objectStore("firebaseLocalStorage")
          .put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: user });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      open.onerror = () => reject(open.error);
    });
  });
}

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
