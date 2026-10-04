/**
 * Exports every account and every shared test result from Firebase, for the
 * move to Supabase (docs/SUPABASE_MIGRATION.md §5.1). The owner runs it with
 * their own Firebase admin key; the key file stays on their machine
 * (git-ignored) and nothing else reads it.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=~/keys/solvelab-admin.json npm run migrate:export
 *
 * Writes migrate/export-<date>.json (git-ignored): users (from Firebase Auth),
 * each user's Firestore tree and every trainingContributions run.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { COLLECTION_NAMES } from "@/lib/sync/collections";
import type { ExportedAccount, ExportedContribution, ExportedUser, MigrationExport } from "./plan";

const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentials) {
  console.error(
    "Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service-account key file (Project settings → Service accounts → Generate new private key). Keep that file out of the repository.",
  );
  process.exit(1);
}

const { initializeApp, applicationDefault } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

// Every user, a page at a time.
const users: ExportedUser[] = [];
let pageToken: string | undefined;
do {
  const page = await auth.listUsers(1000, pageToken);
  for (const user of page.users) {
    users.push({
      uid: user.uid,
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      isAnonymous: user.providerData.length === 0,
      providers: user.providerData.map((provider) => provider.providerId),
    });
  }
  pageToken = page.pageToken;
} while (pageToken);

// Each signed-in user's tree.
const accounts: ExportedAccount[] = [];
for (const user of users) {
  if (user.isAnonymous) continue;
  const collections: Record<string, unknown[]> = {};
  for (const name of COLLECTION_NAMES) {
    const snapshot = await db.collection("users").doc(user.uid).collection(name).get();
    collections[name] = snapshot.docs.map((doc) => doc.data());
  }
  const settings = await db
    .collection("users")
    .doc(user.uid)
    .collection("settings")
    .doc("preferences")
    .get();
  const tombstones = await db.collection("users").doc(user.uid).collection("tombstones").get();
  accounts.push({
    uid: user.uid,
    collections,
    settings: settings.exists ? settings.data() : null,
    tombstones: tombstones.docs.map((doc) => doc.data() as ExportedAccount["tombstones"][number]),
  });
}

// Every trainingContributions/{uid}/runs/{runId}.
const contributions: ExportedContribution[] = [];
const runs = await db.collectionGroup("runs").get();
for (const doc of runs.docs) {
  const owner = doc.ref.parent.parent;
  if (!owner || owner.parent.id !== "trainingContributions") continue;
  contributions.push({ uid: owner.id, runId: doc.id, data: doc.data() });
}

const exportedAt = new Date().toISOString();
const file: MigrationExport = {
  format: "solvelab-firebase-export",
  version: 1,
  exportedAt,
  users,
  accounts,
  contributions,
};
mkdirSync("migrate", { recursive: true });
const path = `migrate/export-${exportedAt.slice(0, 10)}.json`;
writeFileSync(path, `${JSON.stringify(file, null, 2)}\n`);
const documents = accounts.reduce(
  (sum, account) =>
    sum + Object.values(account.collections).reduce((n, list) => n + list.length, 0),
  0,
);
console.log(
  `Wrote ${path}: ${users.length} users (${users.filter((u) => u.isAnonymous).length} anonymous), ${accounts.length} accounts with ${documents} documents, ${contributions.length} shared test results.`,
);
