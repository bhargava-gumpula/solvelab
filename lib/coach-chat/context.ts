/**
 * What the local coach is told (context v2): the same numbers-only summary as
 * lib/ai/context.ts, plus how sure each number is (range, attempts), where it
 * is heading (trend), the person's slowest recognition cases, and what their
 * level says to leave alone. It never carries a name, an email, notes,
 * scrambles or raw solves. The catalogue is a list of `id: title` pairs the
 * model may point to; reply.ts checks every id it returns against it.
 */
import { algorithmSets } from "@/data/algorithms/sets";
import { TEST_ORDER, testTitle } from "@/data/exercises";
import { currentLevel, levelFor } from "@/data/training/levels";
import { milestones } from "@/data/milestones";
import { TRAINING_PACKS } from "@/data/training";
import { learningPaths } from "@/data/learning/paths";
import { lessons } from "@/data/learning/lessons";
import type { CoachContextInput } from "@/lib/ai/context";
import { formatAspectGoal, formatAspectRange, formatAspectValue } from "@/lib/coach/profile-format";
import { HOLD_RULE, SCRAMBLE_VIEW, SOLVING_VIEW } from "@/lib/config/cube";
import { drillCases } from "@/lib/hub/recognition";
import type { RecognitionStats } from "@/lib/hub/recognition-stats";
import { AVERAGE_CHOICES, SLOW_CHOICES } from "@/lib/hub/intro";
import { ALL_UNITS, RECOGNITION_LABEL, RETIRED_METHOD_PATHS } from "@/lib/hub/units";
import type { ProfileSnapshot } from "@/types/domain";

export interface CatalogueEntry {
  id: string;
  title: string;
  /** pack, test, unit, drill, lesson or set. */
  kind: string;
}

export interface CoachContextV2Input extends CoachContextInput {
  /** The top of their path; `id` is the unit's id when the caller has it (else matched by title). */
  picks: { title: string; reason: string; id?: string }[];
  /** Saved profile snapshots, any order: the source of each number's trend. */
  snapshots?: readonly ProfileSnapshot[];
  /** Recognition drill results per set (`recognitionStats(attempts, set)`): the source of weak cases. */
  recognition?: readonly RecognitionStats[];
}

/** Fewer attempts than this and a number is called thin. */
export const THIN_ATTEMPTS = 5;
/** Largest plain-text prompt the app should send, in estimated tokens (plan 3.1). */
export const MAX_PROMPT_TOKENS = 3000;

let catalogueCache: CatalogueEntry[] | null = null;

/** Every pack, test, method unit, drill, lesson and algorithm set the coach may point to. */
export function coachCatalogue(): CatalogueEntry[] {
  if (catalogueCache) return catalogueCache;
  const live = learningPaths.filter((path) => !RETIRED_METHOD_PATHS.includes(path.id));
  const liveIds = new Set<string>(live.map((path) => path.id));
  catalogueCache = [
    ...TRAINING_PACKS.map((pack) => ({ id: pack.id, title: pack.title, kind: "pack" })),
    ...TEST_ORDER.map((id) => ({ id: id as string, title: testTitle(id), kind: "test" })),
    ...live.map((path) => ({ id: `method-${path.id}`, title: path.name, kind: "unit" })),
    ...TRAINING_PACKS.flatMap((pack) =>
      pack.drills.map((drill) => ({ id: drill.id, title: drill.title, kind: "drill" })),
    ),
    ...TRAINING_PACKS.flatMap((pack) =>
      pack.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, kind: "lesson" })),
    ),
    ...lessons
      .filter((lesson) => liveIds.has(lesson.pathId))
      .map((lesson) => ({ id: lesson.id, title: lesson.title, kind: "lesson" })),
    ...algorithmSets.map((set) => ({ id: set.id, title: set.name, kind: "set" })),
  ];
  return catalogueCache;
}

const line = (entry: Pick<CatalogueEntry, "id" | "title">) => `- ${entry.id}: ${entry.title}`;

/**
 * The prompt's list of what the coach may point to. Packs, tests, units and
 * sets are listed in full; drills and lessons only for the packs at the top
 * of the person's path, to keep the prompt short. (reply.ts accepts any real
 * id, listed or not.)
 */
function catalogueText(focusPackIds: readonly string[]): string {
  const all = coachCatalogue();
  const of = (kind: string) => all.filter((entry) => entry.kind === kind);
  const focus = TRAINING_PACKS.filter((pack) => focusPackIds.includes(pack.id));
  const sections = [
    "Ids you may point to, as id: title. Copy ids exactly.",
    "Packs (kind pack):",
    ...of("pack").map(line),
    "Skill tests (kind test):",
    ...of("test").map(line),
    "Method units (kind unit):",
    ...of("unit").map(line),
    "Algorithm bank sets (kind set):",
    ...of("set").map(line),
  ];
  if (focus.length) {
    sections.push(
      "Drills (kind drill) in the packs at the top of their path:",
      ...focus.flatMap((pack) => pack.drills.map(line)),
      "Lessons (kind lesson) in those packs:",
      ...focus.flatMap((pack) => pack.lessons.map(line)),
    );
  }
  return sections.join("\n");
}

const REPLY_SHAPE =
  '{"answer": "...", "refs": [{"kind": "pack", "id": "<an id from the lists>"}], "followUps": ["<a short question they might ask next>"]}';

export const COACH_INSTRUCTIONS_V2 = [
  "You are a friendly, expert speedcubing coach (3x3, CFOP) inside the SolveLab app. Help this person improve using only their data below.",
  `How SolveLab holds the cube: ${HOLD_RULE}`,
  `Describe every hold and case in that solving orientation, with ${SOLVING_VIEW.U} as the last layer. Never tell them to solve with ${SCRAMBLE_VIEW.U} on top.`,
  "Rules:",
  "1. Base advice on their data: name the part of the solve, why it matters at their level, and one concrete thing to do this week.",
  "2. Each number shows a likely range and the attempts behind it. A number marked thin is a rough guess: say so, and suggest retaking that test before changing anything.",
  "3. Never suggest anything in the 'Leave alone at this level' list, even if asked. Say it can wait, and why.",
  "4. Never write cube moves or algorithms (nothing like R U R' U'). Name the case or set and point to its set in the algorithm bank instead.",
  "5. Point only to ids from the lists below, copied exactly. Never invent a pack, test, drill, lesson or set, or an id.",
  "6. Keep answer under 90 words, in plain language, no markdown.",
  `Reply with one JSON object and nothing else, answer first: ${REPLY_SHAPE}`,
  "kind is one of pack, test, unit, drill, lesson, set. refs holds 0 to 3 ids, most useful first. followUps holds 0 to 3.",
].join("\n");

/** The text up to the first sentence end (or at most `max` characters). */
function firstSentence(text: string, max = 140): string {
  const end = text.search(/[.!?](\s|$)/);
  const cut = end === -1 ? text : text.slice(0, end + 1);
  return cut.length > max ? `${cut.slice(0, max - 1).trimEnd()}…` : cut;
}

const DAY_MS = 86_400_000;

function span(fromIso: string, toIso: string): string {
  const days = Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);
  if (!(days >= 1)) return "the same day";
  if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

/** "2.40 s → 1.90 s over 3 weeks (improving)", from the oldest and newest snapshots with a value. */
function trendText(
  aspect: CoachContextInput["profile"]["aspects"][number],
  snapshots: readonly ProfileSnapshot[],
): string | null {
  const { kind } = aspect.definition;
  const seen = snapshots
    .filter((snapshot) => typeof snapshot.values[aspect.id] === "number")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let from: number | null = null;
  let to: number | null = aspect.value;
  let over = "";
  if (seen.length >= 2) {
    from = seen[0]!.values[aspect.id]!;
    to = seen.at(-1)!.values[aspect.id]!;
    over = ` over ${span(seen[0]!.createdAt, seen.at(-1)!.createdAt)}`;
  } else if (aspect.previous !== null) {
    from = aspect.previous;
    over = " since the latest test";
  }
  if (from === null || to === null) return null;
  const change = (to - from) / Math.max(Math.abs(from), Math.abs(to), 1e-9);
  const better = kind === "speed" ? change > 0 : change < 0;
  const verdict =
    Math.abs(change) < 0.03 ? "about the same" : better ? "improving" : "getting worse";
  return `${formatAspectValue(kind, from)} → ${formatAspectValue(kind, to)}${over} (${verdict})`;
}

function recognitionLines(stats: readonly RecognitionStats[]): string[] {
  const out: string[] = [];
  for (const stat of stats) {
    if (stat.known === 0 && stat.missed.length === 0) continue;
    const names = (ids: string[]) =>
      ids
        .slice(0, 3)
        .map((id) => drillCases(stat.set).find((entry) => entry.id === id)?.name)
        .filter(Boolean)
        .join(", ");
    const parts = [`${stat.known} of ${stat.total} known on sight`];
    if (stat.medianMs !== null) parts.push(`median ${(stat.medianMs / 1000).toFixed(1)} s`);
    const slowest = names(stat.slowest);
    if (slowest) parts.push(`slowest: ${slowest}`);
    const missed = names(stat.missed);
    if (missed) parts.push(`latest answer wrong: ${missed}`);
    out.push(`- ${RECOGNITION_LABEL[stat.set]}: ${parts.join("; ")}`);
  }
  return out;
}

/** A pick's unit id: given, else found by matching the title. */
function pickId(pick: CoachContextV2Input["picks"][number]): string | undefined {
  return pick.id ?? ALL_UNITS.find((unit) => unit.title === pick.title)?.id;
}

function focusPacks(picks: CoachContextV2Input["picks"]): string[] {
  return picks
    .slice(0, 5)
    .map(pickId)
    .filter((id): id is string => Boolean(id));
}

/** The person's data, as lines of plain text: numbers and choices only. */
export function coachDataV2(input: CoachContextV2Input): string {
  const { profile, averageMs, course, picks, intro } = input;
  const goal = milestones.find((milestone) => milestone.id === profile.goalMilestoneId);
  const level =
    currentLevel(averageMs, profile.goalMilestoneId)?.level ?? levelFor(course?.rungs[0]) ?? null;
  const lines: string[] = [];
  lines.push(`Goal: ${goal ? goal.label : "not set"}`);
  lines.push(
    `Timer average: ${averageMs === null ? "not enough solves yet" : `${(averageMs / 1000).toFixed(2)} s`}`,
  );
  if (level) lines.push(`Level: ${level.label} (${level.range})`);
  if (course) lines.push(`Current course: ${course.title}`);
  if (intro?.average) {
    const said = AVERAGE_CHOICES.find((choice) => choice.id === intro.average)?.label;
    if (said) lines.push(`Their own estimate of their average: ${said}`);
  }
  if (intro?.slowParts.length) {
    const said = intro.slowParts
      .map((id) => SLOW_CHOICES.find((choice) => choice.id === id)?.label)
      .filter(Boolean);
    lines.push(`What they say feels slow: ${said.join(", ")}`);
  }
  if (intro?.pll || intro?.oll) {
    lines.push(`Algorithms known: PLL ${intro.pll ?? "unknown"}, OLL ${intro.oll ?? "unknown"}`);
  }
  lines.push("");
  lines.push(
    `Solve profile (${profile.coreDone} of ${profile.coreTotal} core tests taken). Format: value (likely range; attempts), goal, pace, trend:`,
  );
  const snapshots = input.snapshots ?? [];
  for (const aspect of profile.aspects) {
    const { definition } = aspect;
    if (aspect.value === null) {
      lines.push(`- ${definition.label}: not measured`);
      continue;
    }
    const range = formatAspectRange(definition.kind, aspect.range);
    const attempts = `${aspect.samples} attempt${aspect.samples === 1 ? "" : "s"}`;
    const sure = [range ? `likely ${range}` : null, attempts].filter(Boolean).join("; ");
    const parts = [
      `${formatAspectValue(definition.kind, aspect.value)} (${sure})`,
      aspect.target === null ? null : `goal ${formatAspectGoal(definition.kind, aspect.target)}`,
      aspect.tag,
      aspect.samples < THIN_ATTEMPTS ? "THIN data" : null,
      trendText(aspect, snapshots),
    ].filter(Boolean);
    lines.push(`- ${definition.label}: ${parts.join(", ")}`);
  }
  if (profile.nextTest)
    lines.push(`Next test to take: ${profile.nextTest}: ${testTitle(profile.nextTest)}`);
  const recognition = recognitionLines(input.recognition ?? []);
  if (recognition.length) {
    lines.push("", "Recognition drills (knowing a case on sight):", ...recognition);
  }
  if (picks.length) {
    lines.push("", "Top of their Learning Hub path:");
    for (const pick of picks.slice(0, 5)) {
      const id = pickId(pick);
      lines.push(`- ${id ? `${id}: ` : ""}${pick.title}: ${pick.reason}`);
    }
  }
  if (level?.notYet.length) {
    lines.push("", "Leave alone at this level (the course says not yet):");
    for (const item of level.notYet) lines.push(`- ${firstSentence(item)}`);
  }
  return lines.join("\n");
}

/** Rough token count (about four characters each) for the prompt-size budget. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * The system message for a coaching chat, and the catalogue its replies are
 * checked against. Stays under MAX_PROMPT_TOKENS (a test holds it to that).
 */
export function buildCoachContextV2(input: CoachContextV2Input): {
  system: string;
  catalogue: CatalogueEntry[];
} {
  const system = [
    COACH_INSTRUCTIONS_V2,
    "",
    "Their data from SolveLab:",
    coachDataV2(input),
    "",
    catalogueText(focusPacks(input.picks)),
  ].join("\n");
  return { system, catalogue: coachCatalogue() };
}
