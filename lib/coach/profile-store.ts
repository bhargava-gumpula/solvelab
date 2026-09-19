import { getRepositories } from "@/lib/storage";
import { buildSolveProfile, snapshotValues } from "./profile";

/**
 * Saves the whole solve profile as it stands after a test, so each aspect can
 * show how it changed since last time.
 */
export async function saveProfileSnapshot(testId: string): Promise<void> {
  const repos = getRepositories();
  const [runs, solves, settings] = await Promise.all([
    repos.coach.listDiagnosticRuns(),
    repos.solves.listAll(),
    repos.settings.get(),
  ]);
  const profile = buildSolveProfile({ runs, solves, goalMilestoneId: settings.targetMilestone });
  await repos.coach.saveProfileSnapshot({
    testId,
    goalMilestoneId: settings.targetMilestone,
    values: snapshotValues(profile),
  });
}
