import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Runs the real migration on a real Postgres (pglite) with a stand-in for
 * Supabase's auth schema: the roles, auth.users, auth.uid() and auth.jwt()
 * read from the same settings PostgREST sets. What is tested is the SQL that
 * will run on the project: grants, row level security, the CHECK constraints
 * and the claim function.
 */
const MIGRATION = readFileSync("supabase/migrations/20261001120000_accounts.sql", "utf8");

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const ANON = "33333333-3333-4333-8333-333333333333";

let db: PGlite;

/** Run as a signed-in user, the way PostgREST does: role + JWT claims as settings. */
async function as(uid: string | null, anonymous = false): Promise<void> {
  await db.exec("reset role");
  if (uid === null) {
    await db.exec(
      "select set_config('request.jwt.claim.sub', '', false); select set_config('request.jwt.claims', '', false); set role anon",
    );
    return;
  }
  const claims = JSON.stringify({ sub: uid, role: "authenticated", is_anonymous: anonymous });
  await db.exec(
    `select set_config('request.jwt.claim.sub', '${uid}', false); select set_config('request.jwt.claims', '${claims}', false); set role authenticated`,
  );
}

async function owner(): Promise<void> {
  await db.exec("reset role");
}

async function fails(sql: string): Promise<string> {
  try {
    await db.exec(sql);
    return "";
  } catch (error) {
    return (error as Error).message;
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, is_anonymous boolean not null default false);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
    $$;
    grant usage on schema public to anon, authenticated;
  `);
  await db.exec(MIGRATION);
  await db.exec(
    `insert into auth.users (id, is_anonymous) values ('${A}', false), ('${B}', false), ('${ANON}', true)`,
  );
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe("the accounts schema on Postgres", () => {
  it("lets a user write and read only their own records, settings and tombstones", async () => {
    await as(A);
    await db.exec(`
      insert into public.records (user_id, collection, key, payload, stamp)
        values ('${A}', 'solves', 's1', '{"id":"s1","rawTimeMs":1000}', '2026-10-01T00:00:00.000Z');
      insert into public.settings (user_id, payload, stamp) values ('${A}', '{"id":"preferences"}', '2026-10-01T00:00:00.000Z');
      insert into public.tombstones (user_id, kind, key, deleted_at) values ('${A}', 'solve', 'gone', '2026-10-01T00:00:00.000Z');
    `);
    // Writing a row under someone else's id is refused.
    expect(
      await fails(
        `insert into public.records (user_id, collection, key, payload, stamp) values ('${B}', 'solves', 'x', '{}', 't')`,
      ),
    ).toMatch(/row-level security/);
    await as(B);
    const seen = await db.query<{ n: number }>(
      "select (select count(*) from public.records) + (select count(*) from public.settings) + (select count(*) from public.tombstones) as n",
    );
    expect(Number(seen.rows[0]!.n)).toBe(0);
    // An update from the wrong user changes nothing, silently, as RLS does.
    await db.exec(`update public.records set stamp = 'later' where user_id = '${A}'`);
    await as(A);
    const own = await db.query<{ stamp: string; collection: string }>(
      "select stamp, collection from public.records",
    );
    expect(own.rows).toEqual([{ stamp: "2026-10-01T00:00:00.000Z", collection: "solves" }]);
  });

  it("keeps anonymous ids off the account tables but lets them share test results", async () => {
    await as(ANON, true);
    expect(
      await fails(
        `insert into public.records (user_id, collection, key, payload, stamp) values ('${ANON}', 'solves', 'x', '{}', 't')`,
      ),
    ).toMatch(/row-level security/);
    expect(
      await fails(`insert into public.settings (user_id, payload) values ('${ANON}', '{}')`),
    ).toMatch(/row-level security/);
    await db.exec(`
      insert into public.training_contributions
        (owner, run_id, user_id, schema, app_version, test_id, day, goal, inspection, attempts_ms, completed, baseline_count)
      values ('${ANON}', 'run-1', '${ANON}', 1, '5.1', 'pll_only', '2026-10-01', 'sub20', 'wca', '{1200,1300}', true, 12)
    `);
    const mine = await db.query("select run_id from public.training_contributions");
    expect(mine.rows).toEqual([{ run_id: "run-1" }]);
    // Another id sees none of it.
    await as(A);
    expect((await db.query("select run_id from public.training_contributions")).rows).toEqual([]);
  });

  it("rejects a contribution that isn't the agreed shape, like the Firestore rules did", async () => {
    await as(A);
    const insert = (values: string) =>
      `insert into public.training_contributions (owner, run_id, user_id, schema, app_version, test_id, day, goal, inspection, attempts_ms, completed, baseline_count) values (${values})`;
    const bad = [
      // schema 2
      `'${A}', 'bad1', '${A}', 2, '5.1', 'pll_only', '2026-10-01', null, 'wca', '{1000}', true, 0`,
      // inspection outside wca/none
      `'${A}', 'bad2', '${A}', 1, '5.1', 'pll_only', '2026-10-01', null, 'maybe', '{1000}', true, 0`,
      // 51 attempts
      `'${A}', 'bad3', '${A}', 1, '5.1', 'pll_only', '2026-10-01', null, 'wca', array_fill(1000, array[51]), true, 0`,
      // a goal too long
      `'${A}', 'bad4', '${A}', 1, '5.1', 'pll_only', '2026-10-01', repeat('g', 21), 'wca', '{1000}', true, 0`,
      // owner must be the user id
      `'someone-else', 'bad5', '${A}', 1, '5.1', 'pll_only', '2026-10-01', null, 'wca', '{1000}', true, 0`,
    ];
    for (const values of bad)
      expect(await fails(insert(values)), values).toMatch(/check|row-level/);
    expect(
      (await db.query("select count(*)::int as n from public.training_contributions")).rows,
    ).toEqual([{ n: 0 }]);
  });

  it("gives a visitor with no session nothing at all", async () => {
    await as(null);
    for (const table of [
      "records",
      "settings",
      "tombstones",
      "training_contributions",
      "legacy_accounts",
    ]) {
      expect(await fails(`select * from public.${table}`), table).toMatch(/permission denied/);
    }
    expect(await fails("select public.claim_legacy_contributions(array['x'])")).toMatch(
      /permission denied/,
    );
  });

  it("keeps the legacy account map away from every client role", async () => {
    await as(A);
    expect(await fails("select * from public.legacy_accounts")).toMatch(/permission denied/);
  });

  it("lets a browser claim the rows its old anonymous id shared, once, and only by count", async () => {
    await owner();
    // Imported rows from Firebase's anonymous ids: no user yet.
    await db.exec(`
      insert into public.training_contributions
        (owner, run_id, legacy_owner, schema, app_version, test_id, day, goal, inspection, attempts_ms, completed, baseline_count)
      values
        ('fb-anon-1', 'r1', 'fb-anon-1', 1, '4.1', 'cross_only', '2026-09-20', null, 'wca', '{3000}', true, 0),
        ('fb-anon-1', 'r2', 'fb-anon-1', 1, '4.1', 'pll_only', '2026-09-21', null, 'none', '{1500}', true, 0),
        ('fb-anon-2', 'r3', 'fb-anon-2', 1, '4.1', 'oll_only', '2026-09-22', null, 'none', '{1800}', true, 0)
    `);
    // Nobody can see them through the tables.
    await as(ANON, true);
    expect(
      (
        await db.query(
          "select run_id from public.training_contributions where legacy_owner is not null",
        )
      ).rows,
    ).toEqual([]);
    // The claim moves exactly the ids given.
    const first = await db.query<{ n: number }>(
      "select public.claim_legacy_contributions(array['fb-anon-1', 'never-existed']) as n",
    );
    expect(Number(first.rows[0]!.n)).toBe(2);
    const now = await db.query<{ run_id: string; owner: string }>(
      "select run_id, owner from public.training_contributions order by run_id",
    );
    expect(now.rows).toEqual([
      { run_id: "r1", owner: ANON },
      { run_id: "r2", owner: ANON },
      { run_id: "run-1", owner: ANON },
    ]);
    // A second claim finds nothing; fb-anon-2's row is untouched and still invisible.
    const again = await db.query<{ n: number }>(
      "select public.claim_legacy_contributions(array['fb-anon-1']) as n",
    );
    expect(Number(again.rows[0]!.n)).toBe(0);
    // Limits: at most 20 ids, and never without a session.
    expect(
      await fails(`select public.claim_legacy_contributions(array_fill('x'::text, array[21]))`),
    ).toMatch(/between 1 and 20/);
    expect(await fails("select public.claim_legacy_contributions(array[]::text[])")).toMatch(
      /between 1 and 20/,
    );
    // The usual withdraw path now covers the claimed rows.
    await db.exec("delete from public.training_contributions");
    expect(
      (await db.query("select count(*)::int as n from public.training_contributions")).rows,
    ).toEqual([{ n: 0 }]);
    await owner();
    expect((await db.query("select owner from public.training_contributions")).rows).toEqual([
      { owner: "fb-anon-2" },
    ]);
  });

  it("stamps updated_at on every change", async () => {
    await as(A);
    const before = await db.query<{ updated_at: Date }>(
      "select updated_at from public.records where key = 's1'",
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    await db.exec(`update public.records set stamp = '2026-10-02T00:00:00.000Z' where key = 's1'`);
    const after = await db.query<{ updated_at: Date }>(
      "select updated_at from public.records where key = 's1'",
    );
    expect(after.rows[0]!.updated_at.getTime()).toBeGreaterThan(
      before.rows[0]!.updated_at.getTime(),
    );
  });
});
