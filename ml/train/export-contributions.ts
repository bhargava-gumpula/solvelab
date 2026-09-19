/**
 * Exports shared test results for retraining the coach. The owner runs this
 * with their own Firebase admin key; the key file stays on their machine
 * (git-ignored) and is never read by anything else.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=~/keys/solvelab-admin.json \
 *     npm run ml:export
 *
 * Writes ml/exports/contributions-<date>.json (git-ignored): only well-formed
 * records, with account ids replaced by random ones that change every export.
 */
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { deidentify, type RawContribution } from "../export";

const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentials) {
  console.error(
    "Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service-account key file (Project settings → Service accounts → Generate new private key). Keep that file out of the repository.",
  );
  process.exit(1);
}

const { initializeApp, applicationDefault } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

// Every trainingContributions/{uid}/runs/{runId} document.
const snapshot = await db.collectionGroup("runs").get();
const raw: RawContribution[] = [];
for (const doc of snapshot.docs) {
  const owner = doc.ref.parent.parent;
  if (!owner || owner.parent.id !== "trainingContributions") continue;
  raw.push({ uid: owner.id, runId: doc.id, data: doc.data() });
}

const exportedAt = new Date().toISOString();
const file = deidentify(raw, () => randomUUID().slice(0, 8), exportedAt);
mkdirSync("ml/exports", { recursive: true });
const path = `ml/exports/contributions-${exportedAt.slice(0, 10)}.json`;
writeFileSync(path, `${JSON.stringify(file, null, 2)}\n`);
console.log(
  `Wrote ${path}: ${file.runs.length} runs from ${file.contributors} people (${file.skipped} malformed records skipped).`,
);
