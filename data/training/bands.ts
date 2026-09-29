import type { TrainingPack } from "./types";

/**
 * The stretches of the road packs are marked with. Coarser than the ladder on
 * Learn — 30 to 20 is one stretch here where the ladder has two rungs — because
 * a pack's advice rarely changes at 25 seconds.
 */
export interface LevelBand {
  id: string;
  /** Where the stretch starts and ends, for "2:00 → 1:00". */
  from: string;
  to: string | null;
  /** The ladder rungs (milestone ids) inside this stretch. */
  rungs: readonly string[];
}

export const LEVEL_BANDS: readonly LevelBand[] = [
  // Learning to solve has no time to start from, so it gets a stretch of its
  // own rather than being filed under a two-minute start it hasn't reached.
  { id: "first-2m", from: "First solves", to: "2:00", rungs: ["beginner"] },
  { id: "2m-1m", from: "2:00", to: "1:00", rungs: ["sub120"] },
  { id: "1m-45", from: "1:00", to: "45 s", rungs: ["sub60"] },
  { id: "45-30", from: "45", to: "30 s", rungs: ["sub45"] },
  { id: "30-20", from: "30", to: "20 s", rungs: ["sub30", "sub25"] },
  { id: "20-15", from: "20", to: "15 s", rungs: ["sub20"] },
  { id: "15-10", from: "15", to: "10 s", rungs: ["sub15", "sub12"] },
  { id: "sub10", from: "Sub-10", to: null, rungs: ["sub10"] },
];

export function bandLabel(band: LevelBand): string {
  return band.to ? `${band.from} → ${band.to}` : band.from;
}

/** The stretch a ladder rung sits in. */
export function bandForRung(rungId: string | null | undefined): LevelBand | null {
  return LEVEL_BANDS.find((band) => rungId && band.rungs.includes(rungId)) ?? null;
}

/** Every stretch a pack is written for, in order. */
export function bandsForPack(pack: TrainingPack): LevelBand[] {
  return LEVEL_BANDS.filter((band) => band.rungs.some((rung) => pack.levels.includes(rung)));
}

/** Whether a pack is written for this stretch alone, rather than spanning several. */
export function isMadeFor(pack: TrainingPack, band: LevelBand): boolean {
  const bands = bandsForPack(pack);
  return bands.length === 1 && bands[0]!.id === band.id;
}

/** "45 → 30 s" for one stretch, "45 → 10 s" across several, "15 → sub-10" to the end. */
export function packBandLabel(pack: TrainingPack): string {
  const bands = bandsForPack(pack);
  if (bands.length === 0) return "";
  if (bands.length === 1) return bandLabel(bands[0]!);
  const first = bands[0]!;
  const last = bands[bands.length - 1]!;
  return `${first.from} → ${last.to ?? "sub-10"}`;
}
