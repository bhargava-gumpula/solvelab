/**
 * Imports a Firebase export into the Supabase project
 * (docs/SUPABASE_MIGRATION.md §5.2). The owner runs it with the project's
 * secret key in the environment; the key is never read from a file in the
 * repository and never written anywhere.
 *
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=… \
 *     npm run migrate:import -- migrate/export-2026-10-05.json [--dry-run]
 *
 * --dry-run plans everything and writes the report, creating and inserting
 * nothing. A real run is idempotent: users are matched by e-mail if they
 * already exist, rows are upserted on their primary keys.
 *
 * Order: create users (confirmed e-mail, firebase_uid in app_metadata, so
 * Google links to them on first sign-in and the browser keeps its copy), then
 * records, settings, tombstones, legacy_accounts, contributions.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { batches, planMigration, type MigrationExport } from "./plan";

const [, , exportPath, ...flags] = process.argv;
const dryRun = flags.includes("--dry-run");
if (!exportPath) {
  console.error("Usage: npm run migrate:import -- <export.json> [--dry-run]");
  process.exit(1);
}
const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!dryRun && (!url || !secret)) {
  console.error(
    "Set SUPABASE_URL and SUPABASE_SECRET_KEY in the environment (the project's secret key; never put it in a file in this repository).",
  );
  process.exit(1);
}
if (secret && /^sb_publishable_|^eyJ.*anon/.test(secret)) {
  console.error(
    "SUPABASE_SECRET_KEY looks like a publishable or anon key; the import needs the secret key.",
  );
  process.exit(1);
}

const data = JSON.parse(readFileSync(exportPath, "utf8")) as MigrationExport;
if (data.format !== "solvelab-firebase-export" || data.version !== 1) {
  console.error("Not a SolveLab Firebase export.");
  process.exit(1);
}
const plan = planMigration(data);
const reportPath = exportPath.replace(
  /\.json$/,
  dryRun ? "-dry-run-report.json" : "-import-report.json",
);

const summary = {
  dryRun,
  plannedAt: new Date().toISOString(),
  ...plan.report,
  inserted: { records: 0, settings: 0, tombstones: 0, contributions: 0, legacyContributions: 0 },
  usersCreated: 0,
  usersExisting: 0,
  failures: [] as string[],
};

if (dryRun) {
  writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Dry run only. Report: ${reportPath}`);
  console.log(JSON.stringify(plan.report, null, 2));
  process.exit(0);
}

const client = createClient(url!, secret!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 1. Users. The map from Firebase uid to Supabase uid drives everything else.
const uidOf = new Map<string, string>();
for (const user of plan.users) {
  const { data: created, error } = await client.auth.admin.createUser({
    email: user.email,
    email_confirm: true,
    user_metadata: user.userMetadata,
    app_metadata: user.appMetadata,
  });
  if (!error && created.user) {
    uidOf.set(user.firebaseUid, created.user.id);
    summary.usersCreated++;
    continue;
  }
  // Already there (a re-run, or the person signed in before the import): find by e-mail.
  const found = await findUserByEmail(user.email);
  if (found) {
    uidOf.set(user.firebaseUid, found);
    summary.usersExisting++;
    // Make sure the old uid is recorded on the account, for the browser's claim.
    await client.auth.admin.updateUserById(found, { app_metadata: user.appMetadata });
  } else {
    summary.failures.push(
      `user ${user.firebaseUid} (${user.email}): ${error?.message ?? "not found"}`,
    );
  }
}

async function findUserByEmail(email: string): Promise<string | null> {
  for (let page = 1; page < 1000; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data.users.length) return null;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

async function upsert(
  table: string,
  rows: object[],
  onConflict: string,
  count: keyof typeof summary.inserted,
) {
  for (const batch of batches(rows, 1000)) {
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) summary.failures.push(`${table}: ${error.message}`);
    else summary.inserted[count] += batch.length;
  }
}

const mapped = <T extends { firebaseUid: string }>(items: T[]) =>
  items.flatMap((item) => {
    const user_id = uidOf.get(item.firebaseUid);
    if (!user_id) return [];
    const { firebaseUid, ...rest } = item;
    void firebaseUid;
    return [{ ...rest, user_id }];
  });

// 2. Account data.
await upsert(
  "records",
  mapped(plan.records).map((row) => ({
    user_id: row.user_id,
    collection: row.collection,
    key: row.key,
    payload: row.payload,
    stamp: row.stamp,
  })),
  "user_id,collection,key",
  "records",
);
await upsert("settings", mapped(plan.settings), "user_id", "settings");
await upsert(
  "tombstones",
  mapped(plan.tombstones).map((row) => ({
    user_id: row.user_id,
    kind: row.kind,
    key: row.key,
    deleted_at: row.deletedAt,
  })),
  "user_id,kind,key",
  "tombstones",
);

// 3. The owner's record of the mapping.
{
  const rows = plan.users.flatMap((user) => {
    const supabase_uid = uidOf.get(user.firebaseUid);
    return supabase_uid
      ? [{ firebase_uid: user.firebaseUid, supabase_uid, email: user.email }]
      : [];
  });
  for (const batch of batches(rows, 1000)) {
    const { error } = await client
      .from("legacy_accounts")
      .upsert(batch, { onConflict: "firebase_uid" });
    if (error) summary.failures.push(`legacy_accounts: ${error.message}`);
  }
}

// 4. Shared test results: signed-in users' under their new id, anonymous ids' as legacy rows.
await upsert(
  "training_contributions",
  mapped(plan.contributions).map((row) => ({ ...row, owner: row.user_id })),
  "owner,run_id",
  "contributions",
);
await upsert(
  "training_contributions",
  plan.legacyContributions.map(({ legacyOwner, ...row }) => ({
    ...row,
    owner: legacyOwner,
    legacy_owner: legacyOwner,
    user_id: null,
  })),
  "owner,run_id",
  "legacyContributions",
);

writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Report: ${reportPath}`);
console.log(JSON.stringify({ ...summary, failures: summary.failures.length }, null, 2));
if (summary.failures.length) {
  console.error(`${summary.failures.length} failures; see the report.`);
  process.exit(1);
}
