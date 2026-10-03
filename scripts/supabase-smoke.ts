/**
 * Smoke test against the live Supabase project with only the publishable key
 * (docs/SUPABASE_MIGRATION.md §5.5): everything the browser does without
 * Google. Test data only; it deletes what it wrote. The anonymous auth user it
 * creates can't be deleted with this key (Authentication → Users, or it goes
 * with the project's anonymous-user clean-up).
 *
 *   npm run supabase:smoke
 */
import { createClient } from "@supabase/supabase-js";
import { contributionRow } from "@/lib/training-data/row";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key?.startsWith("sb_publishable_")) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL and the publishable NEXT_PUBLIC_SUPABASE_ANON_KEY are needed.",
  );
  process.exit(1);
}

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failed++;
}
const codeOf = (error: { code?: string; message: string } | null) =>
  error ? `${error.code ?? "?"} ${error.message}` : "no error";

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// 1. No session: the anon role has no grants, so the Data API refuses.
const bare = await client.from("training_contributions").select("run_id").limit(1);
check("no session: training_contributions refused", bare.error !== null, codeOf(bare.error));

// 2. Anonymous sign-in.
const signIn = await client.auth.signInAnonymously();
const uid = signIn.data.user?.id;
check(
  "anonymous sign-in",
  !!uid && signIn.data.user?.is_anonymous === true,
  uid ?? codeOf(signIn.error),
);
if (!uid) process.exit(1);

// 3. Share a test result (the uploader's exact write), read it back.
const runId = `smoke-${Date.now()}`;
const row = contributionRow(uid, runId, {
  schema: 1,
  appVersion: "0.0.0-smoke",
  testId: "smoke_test",
  day: new Date().toISOString().slice(0, 10),
  goal: "sub20",
  inspection: "none",
  attemptsMs: [1000, 1100, 1200],
  completed: true,
  baseline: { count: 5, averageMs: 15_000, cv: 0.1 },
});
const upsert = await client
  .from("training_contributions")
  .upsert(row, { onConflict: "owner,run_id" });
check("upload a contribution", upsert.error === null, codeOf(upsert.error));
const mine = await client.from("training_contributions").select("run_id, owner").eq("user_id", uid);
check(
  "read it back",
  mine.data?.length === 1 && mine.data[0]?.run_id === runId,
  codeOf(mine.error),
);

// 4. A malformed row is refused by the CHECK constraints, not just the client.
const bad = await client
  .from("training_contributions")
  .insert({ ...row, run_id: `${runId}-bad`, inspection: "sideways" });
check("malformed row refused (23514)", bad.error?.code === "23514", codeOf(bad.error));

// 5. The claim RPC: a fake old id moves nothing; an empty list is an error.
const claim = await client.rpc("claim_legacy_contributions", { old_ids: ["smoke-fake-old-id"] });
check(
  "claim with a fake old id returns 0",
  claim.error === null && claim.data === 0,
  codeOf(claim.error) + ` data=${claim.data}`,
);
const empty = await client.rpc("claim_legacy_contributions", { old_ids: [] });
check("claim with no ids refused (22023)", empty.error?.code === "22023", codeOf(empty.error));

// 6. RLS: an anonymous user can't own an account copy.
const write = await client.from("records").insert({
  user_id: uid,
  collection: "solves",
  key: "smoke",
  payload: { id: "smoke" },
  stamp: "x",
});
check(
  "anonymous insert into records refused (42501)",
  write.error?.code === "42501",
  codeOf(write.error),
);
const settingsWrite = await client
  .from("settings")
  .upsert({ user_id: uid, payload: { id: "preferences" }, stamp: "x" });
check(
  "anonymous upsert into settings refused (42501)",
  settingsWrite.error?.code === "42501",
  codeOf(settingsWrite.error),
);
const read = await client.from("records").select("key");
check(
  "anonymous read of records sees nothing",
  read.error === null && read.data?.length === 0,
  codeOf(read.error),
);
const legacy = await client.from("legacy_accounts").select("firebase_uid").limit(1);
check("legacy_accounts hidden", legacy.error !== null, codeOf(legacy.error));

// 7. Withdraw (the uploader's exact delete) and confirm nothing is left.
const withdraw = await client.from("training_contributions").delete().eq("user_id", uid);
check("withdraw", withdraw.error === null, codeOf(withdraw.error));
const after = await client.from("training_contributions").select("run_id").eq("user_id", uid);
check("nothing left", after.data?.length === 0, codeOf(after.error));

await client.auth.signOut({ scope: "local" });
console.log(
  failed === 0
    ? `\nAll checks passed. Test rows deleted. One anonymous auth user (${uid}) remains; it holds nothing.`
    : `\n${failed} check(s) failed.`,
);
process.exit(failed === 0 ? 0 : 1);
