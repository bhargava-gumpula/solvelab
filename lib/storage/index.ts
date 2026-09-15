import { getDatabase, type LocalDatabase } from "./database";
import { CoachRepository } from "./coach-repository";
import { SessionRepository } from "./session-repository";
import { SettingsRepository } from "./settings-repository";
import { SolveRepository } from "./solve-repository";

export interface Repositories {
  db: LocalDatabase;
  sessions: SessionRepository;
  solves: SolveRepository;
  settings: SettingsRepository;
  coach: CoachRepository;
}

export function createRepositories(db: LocalDatabase): Repositories {
  return {
    db,
    sessions: new SessionRepository(db),
    solves: new SolveRepository(db),
    settings: new SettingsRepository(db),
    coach: new CoachRepository(db),
  };
}

let repositories: Repositories | undefined;

/** Browser-only singleton used by hooks and components. */
export function getRepositories(): Repositories {
  repositories ??= createRepositories(getDatabase());
  return repositories;
}
