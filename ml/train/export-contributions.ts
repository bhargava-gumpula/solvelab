/**
 * Exports shared test results for retraining the coach. The owner runs this
 * with their own admin credentials, which stay on their machine (git-ignored
 * or in the environment) and are never read by anything else.
 *
 * Supabase (after the move; docs/SUPABASE_MIGRATION.md):
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=… npm run ml:export
 *
 * Firebase (before it):
 *   GOOGLE_APPLICATION_CREDENTIALS=~/keys/solvelab-admin.json npm run ml:export
 *
 * Writes ml/exports/contributions-<date>.json (git-ignored): only well-formed
 * records, with account ids replaced by random ones that change every export.
 */
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { contributionFromRow, type ContributionRow } from "@/lib/training-data/row";
import { deidentify, type RawContribution } from "../export";

const raw: RawContribution[] = [];

if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Every row, a page at a time; the owner (a user id or a legacy id) stands in for the uid.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from("training_contributions")
      .select("*")
      .order("owner")
      .order("run_id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as (ContributionRow & { owner: string })[]) {
      raw.push({ uid: row.owner, runId: row.run_id, data: contributionFromRow(row) });
    }
    if (!data || data.length < 1000) break;
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const { initializeApp, applicationDefault } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  initializeApp({ credential: applicationDefault() });
  const db = getFirestore();
  // Every trainingContributions/{uid}/runs/{runId} document.
  const snapshot = await db.collectionGroup("runs").get();
  for (const doc of snapshot.docs) {
    const owner = doc.ref.parent.parent;
    if (!owner || owner.parent.id !== "trainingContributions") continue;
    raw.push({ uid: owner.id, runId: doc.id, data: doc.data() });
  }
} else {
  console.error(
    "Set SUPABASE_URL and SUPABASE_SECRET_KEY (the project's secret key), or GOOGLE_APPLICATION_CREDENTIALS for the old Firebase project. Keep both out of the repository.",
  );
  process.exit(1);
}

const exportedAt = new Date().toISOString();
const file = deidentify(raw, () => randomUUID().slice(0, 8), exportedAt);
mkdirSync("ml/exports", { recursive: true });
const path = `ml/exports/contributions-${exportedAt.slice(0, 10)}.json`;
writeFileSync(path, `${JSON.stringify(file, null, 2)}\n`);
console.log(
  `Wrote ${path}: ${file.runs.length} runs from ${file.contributors} people (${file.skipped} malformed records skipped).`,
);
