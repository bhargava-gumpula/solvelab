/**
 * Turning shared test results (Firestore `trainingContributions/{uid}/runs`)
 * into a training file: keep only well-formed records, and replace account ids
 * with random ones that differ on every export, so the file can't be tied back
 * to a Firebase user. Pure, so it can be tested; the Firestore reading is in
 * ml/train/export-contributions.ts.
 */
import type { ContributionPayload } from "@/lib/training-data/payload";

export interface RawContribution {
  uid: string;
  runId: string;
  data: unknown;
}

export interface ExportedRun extends ContributionPayload {
  /** Random per-export id standing in for the account. */
  contributor: string;
}

export interface ExportFile {
  format: "solvelab-training-export";
  version: 1;
  exportedAt: string;
  contributors: number;
  runs: ExportedRun[];
  skipped: number;
}

const INSPECTIONS = new Set(["wca", "none"]);

/** The same checks as the Firestore rules, so nothing odd slips into training. */
export function isContribution(data: unknown): data is ContributionPayload {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  const keys = Object.keys(d).sort().join();
  if (keys !== "appVersion,attemptsMs,baseline,completed,day,goal,inspection,schema,testId")
    return false;
  const baseline = d.baseline as Record<string, unknown> | null;
  return (
    d.schema === 1 &&
    typeof d.appVersion === "string" &&
    typeof d.testId === "string" &&
    typeof d.day === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d.day) &&
    (d.goal === null || typeof d.goal === "string") &&
    INSPECTIONS.has(d.inspection as string) &&
    Array.isArray(d.attemptsMs) &&
    d.attemptsMs.length >= 1 &&
    d.attemptsMs.length <= 50 &&
    d.attemptsMs.every((ms) => typeof ms === "number" && Number.isFinite(ms) && ms > 0) &&
    typeof d.completed === "boolean" &&
    typeof baseline === "object" &&
    baseline !== null &&
    typeof baseline.count === "number"
  );
}

export function deidentify(
  raw: RawContribution[],
  makeId: () => string,
  exportedAt: string,
): ExportFile {
  const ids = new Map<string, string>();
  const runs: ExportedRun[] = [];
  let skipped = 0;
  for (const item of raw) {
    if (!isContribution(item.data)) {
      skipped++;
      continue;
    }
    let contributor = ids.get(item.uid);
    if (!contributor) {
      contributor = makeId();
      ids.set(item.uid, contributor);
    }
    // Copy only the known fields; the Firestore run id is dropped too.
    const { schema, appVersion, testId, day, goal, inspection, attemptsMs, completed, baseline } =
      item.data;
    runs.push({
      contributor,
      schema,
      appVersion,
      testId,
      day,
      goal,
      inspection,
      attemptsMs: [...attemptsMs],
      completed,
      baseline: { count: baseline.count, averageMs: baseline.averageMs, cv: baseline.cv },
    });
  }
  // Sort so the file order says nothing about account ids or upload order.
  runs.sort(
    (a, b) =>
      a.contributor.localeCompare(b.contributor) ||
      a.day.localeCompare(b.day) ||
      a.testId.localeCompare(b.testId),
  );
  return {
    format: "solvelab-training-export",
    version: 1,
    exportedAt,
    contributors: ids.size,
    runs,
    skipped,
  };
}
