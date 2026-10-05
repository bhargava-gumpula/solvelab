/**
 * Scoring for the coach eval (plan 3.3). Everything here is pure: fixtures in,
 * a canned or live reply in, checks and breaks out. `scripts/coach-eval.ts`
 * does the talking to Ollama; `tests/unit/coach-eval.test.ts` runs these
 * functions against canned replies, so the scoring itself is tested without a
 * model.
 *
 * Two kinds of result:
 * - checks: scored, and the run passes at PASS_MARK of them (95%).
 * - breaks ("must never"): any single one fails the run.
 */
import { CORE_TESTS } from "@/data/exercises";
import { aspectTargetsFor } from "@/data/milestones/aspect-targets";
import { getCourse } from "@/data/hub/courses";
import { unknownReferences } from "@/lib/ai/grounding";
import { ASPECTS, rateAspect, type AspectId } from "@/lib/coach/aspects";
import type { AspectResult, SolveProfile } from "@/lib/coach/profile";
import { drillCases } from "@/lib/hub/recognition";
import type { RecognitionStats } from "@/lib/hub/recognition-stats";
import type { RecognitionSet } from "@/lib/hub/units";
import type { HubIntro, KnownAlgorithms, PaceTag } from "@/types/domain";
import type { CoachContextV2Input } from "./context";
import type { ChatMessage, CoachReply } from "./types";

/** At least this share of checks must pass, with no must-never break. */
export const PASS_MARK = 0.95;
export const DEFAULT_MAX_WORDS = 150;
const MIN_WORDS = 8;

// ---------------------------------------------------------------------------
// Fixture shape (tests/coach-eval/fixtures/*.json)
// ---------------------------------------------------------------------------

/** A way to say a fact: a phrase (case-insensitive) or a number, to within `tol`. */
export type FactAlt = string | { number: number; tol?: number };
/** One fact the reply must state. An array is "any of these". */
export type Fact = FactAlt | FactAlt[];

export interface NeverRule {
  id: string;
  why: string;
  /** A regular expression, tested against each sentence of the reply. */
  pattern: string;
  /** Regular expression flags; "i" when absent. */
  flags?: string;
  /** A sentence that also matches this is not a break ("later", "skip", …). */
  excuse?: string;
  /** Shorthand for excusing negations: "doesn't", "can't", "not", … */
  negatable?: boolean;
}

export interface FixtureAspect {
  /** ms for times and losses, 0–1 for shares and spreads, turns/s for speed. */
  value: number;
  range?: [number, number];
  /** Attempts behind the number. */
  samples: number;
  /** The value before the latest test, for a trend. */
  previous?: number;
}

export interface FixtureWeakCases {
  set: RecognitionSet;
  known: number;
  total: number;
  medianMs: number | null;
  /** Case names as the algorithm bank spells them ("Gb", "OLL 21"). */
  slowest: string[];
  missed?: string[];
}

export interface FixtureProfile {
  goal: string | null;
  averageMs: number | null;
  courseId: string | null;
  intro?: {
    average: string | null;
    slowParts: string[];
    pll: KnownAlgorithms | null;
    oll: KnownAlgorithms | null;
  };
  /** Tests with a finished run; every measured aspect needs its tests here. */
  testsTaken: string[];
  aspects: Partial<Record<AspectId, FixtureAspect>>;
  weakCases?: FixtureWeakCases[];
  picks?: { title: string; reason: string; id?: string }[];
}

export interface ExpectedWeakest {
  aspect: AspectId;
  /** Pack or test ids that count as pointing at the weakest part. */
  refs: string[];
  /** Words that show the reply names the weakest part. */
  words: string[];
}

export interface EvalTurn {
  user: string;
  mustMention?: Fact[];
  mustNever?: NeverRule[];
  /** The first suggestion must match the weakest part (or the reply must say why not). */
  checksWeakest?: boolean;
  /** At least one valid id in `refs`. */
  expectRefs?: boolean;
  maxWords?: number;
}

export interface EvalFixture {
  id: string;
  description: string;
  profile: FixtureProfile;
  /** Null when the data is too thin to name a weakest part. */
  weakest: ExpectedWeakest | null;
  /** Earlier messages, before the first turn (a long conversation). */
  history?: ChatMessage[];
  /** Rules for every turn of this fixture. */
  mustNever?: NeverRule[];
  /** Asked in order; each reply joins the conversation before the next question. */
  turns: EvalTurn[];
}

// ---------------------------------------------------------------------------
// Fixture to the app's own inputs
// ---------------------------------------------------------------------------

/** How far an aspect is from its goal: above 1 is behind, bigger is worse. */
export function aspectSeverity(
  kind: AspectResult["definition"]["kind"],
  value: number,
  target: number,
): number {
  if (kind === "speed") return target / Math.max(value, 0.01);
  return Math.max(0, value) / Math.max(target, 1e-9);
}

/** Measured parts with a goal, furthest behind first (the full-solve average is an outcome, not a part). */
export function aspectRanking(profile: SolveProfile): { id: AspectId; severity: number }[] {
  return profile.aspects
    .flatMap((aspect) =>
      aspect.definition.outcome || aspect.value === null || aspect.target === null
        ? []
        : [
            {
              id: aspect.id,
              severity: aspectSeverity(aspect.definition.kind, aspect.value, aspect.target),
            },
          ],
    )
    .sort((a, b) => b.severity - a.severity);
}

/** The part of the solve furthest behind its goal, or null when nothing is behind. */
export function weakestAspect(profile: SolveProfile): AspectId | null {
  const [first] = aspectRanking(profile);
  return first && first.severity > 1 ? first.id : null;
}

/** The solve profile a fixture describes, built the way `buildSolveProfile` builds one. */
export function fixtureToProfile(profile: FixtureProfile): SolveProfile {
  const targets = aspectTargetsFor(profile.goal);
  const taken = new Set(profile.testsTaken);
  const aspects = ASPECTS.map((definition): AspectResult => {
    const given = profile.aspects[definition.id];
    const target = targets ? definition.target(targets) : null;
    const missingTests = definition.tests.filter((testId) => !taken.has(testId));
    const base = {
      id: definition.id,
      definition,
      target,
      missingTests,
      nextTest: missingTests[0] ?? definition.tests[definition.tests.length - 1] ?? null,
      parts: [],
    };
    if (!given) {
      return { ...base, value: null, range: null, samples: 0, tag: null, previous: null };
    }
    const rated = definition.kind === "loss" ? Math.max(0, given.value) : given.value;
    return {
      ...base,
      value: given.value,
      range: given.range ?? null,
      samples: given.samples,
      tag: target === null ? null : rateAspect(definition.kind, rated, target),
      previous: given.previous ?? null,
    };
  });
  const counts: Record<PaceTag, number> = { fast: 0, average: 0, slow: 0 };
  for (const aspect of aspects) if (aspect.tag) counts[aspect.tag]++;
  const coreDone = CORE_TESTS.filter((testId) => taken.has(testId)).length;
  return {
    goalMilestoneId: profile.goal,
    aspects,
    measuredCount: aspects.filter((aspect) => aspect.value !== null).length,
    counts,
    nextTest: CORE_TESTS.find((testId) => !taken.has(testId)) ?? null,
    testsTaken: [...profile.testsTaken],
    coreDone,
    coreTotal: CORE_TESTS.length,
    complete: coreDone === CORE_TESTS.length,
  };
}

function fixtureRecognition(weak: FixtureWeakCases): RecognitionStats {
  const ids = (names: string[] | undefined) =>
    (names ?? []).flatMap(
      (name) => drillCases(weak.set).find((entry) => entry.name === name)?.id ?? [],
    );
  return {
    set: weak.set,
    total: weak.total,
    known: weak.known,
    medianMs: weak.medianMs,
    cases: new Map(),
    slowest: ids(weak.slowest),
    missed: ids(weak.missed),
  };
}

/** What the app hands `buildCoachContextV2` for this fixture. */
export function fixtureToContextInput(fixture: EvalFixture): CoachContextV2Input {
  const { profile } = fixture;
  const intro: HubIntro | undefined = profile.intro
    ? {
        average: profile.intro.average,
        slowParts: profile.intro.slowParts,
        pll: profile.intro.pll,
        oll: profile.intro.oll,
        practice: null,
        answeredAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-01-01T00:00:00.000Z",
      }
    : undefined;
  return {
    profile: fixtureToProfile(profile),
    averageMs: profile.averageMs,
    course: profile.courseId ? (getCourse(profile.courseId) ?? null) : null,
    picks: profile.picks ?? [],
    intro,
    recognition: (profile.weakCases ?? []).map(fixtureRecognition),
  };
}

// ---------------------------------------------------------------------------
// Reading a reply
// ---------------------------------------------------------------------------

/** Lowercase, straight quotes, no markdown marks, hyphens as spaces, one space between words. */
export function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[*`]/g, "")
    .replace(/[-_\u2013\u2014]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Numbers in a text: plain ones, and "m:ss.xx" times as seconds. */
export function numbersIn(text: string): number[] {
  const out: number[] = [];
  for (const match of text.matchAll(/(\d+):(\d{2}(?:\.\d+)?)/g)) {
    out.push(Number(match[1]) * 60 + Number(match[2]));
  }
  for (const match of text.replace(/\d+:\d{2}(?:\.\d+)?/g, " ").matchAll(/\d+(?:\.\d+)?/g)) {
    out.push(Number(match[0]));
  }
  return out;
}

function factHit(alt: FactAlt, answerText: string, answerNumbers: number[]): boolean {
  if (typeof alt === "string") return answerText.includes(normaliseText(alt));
  const tol = alt.tol ?? 0.06;
  return answerNumbers.some((value) => Math.abs(value - alt.number) <= tol);
}

const MOVE_TOKEN = /^(?:[URFDLB]w?|[urfdlb]|[MESxyz])(?:2'?|'|2)?$/;
const STRONG_MOVE = /^(?:[URFDLB]w?(?:2'?|'|2)?|[urfdlbMESxyz](?:2'?|'|2))$/;

/**
 * Runs of four or more cube moves ("R U R' U'", "(R U R' U')", "RUR'U'R'FRF'"):
 * the model must not write algorithms, because small models invent them.
 */
export function findMoveSequences(text: string): string[] {
  const found: string[] = [];
  const spaced = text.replace(/[‘’`]/g, "'").replace(/[()[\]{},;:/]/g, " ");
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 4 && run.filter((token) => STRONG_MOVE.test(token)).length >= 3) {
      found.push(run.join(" "));
    }
    run = [];
  };
  for (const token of spaced.split(/\s+/)) {
    if (MOVE_TOKEN.test(token)) run.push(token);
    else flush();
  }
  flush();
  for (const match of spaced.matchAll(/(?<![A-Za-z])(?:[URFDLB]w?[2']?){6,}(?![A-Za-z])/g)) {
    found.push(match[0]);
  }
  return found;
}

/** Seconds a reply states with a unit: "3.2 s", "3.2 seconds", "1:05.3". */
export function secondsStated(text: string): number[] {
  const out: number[] = [];
  for (const match of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:s|secs?|seconds?)\b/gi)) {
    out.push(Number(match[1]));
  }
  for (const match of text.matchAll(/\b(\d+):(\d{2}(?:\.\d+)?)\b/g)) {
    out.push(Number(match[1]) * 60 + Number(match[2]));
  }
  return out;
}

/**
 * The differences a coach may work out for itself from one line of the data:
 * a number against its goal, and against where it was.
 */
function gapsIn(told: string): number[] {
  const gaps: number[] = [];
  for (const line of told.split("\n")) {
    const value = /^- [^:]+: (\d+(?:\.\d+)?) s/.exec(line)?.[1];
    if (value === undefined) continue;
    const goal = /goal (?:under|over) (\d+(?:\.\d+)?) s/.exec(line)?.[1];
    const before = /(\d+(?:\.\d+)?) s → \d+(?:\.\d+)? s/.exec(line)?.[1];
    for (const other of [goal, before]) {
      if (other !== undefined) gaps.push(Math.abs(Number(value) - Number(other)));
    }
  }
  return gaps;
}

/**
 * Decimal seconds in a reply that appear nowhere in what the model was told,
 * nor as a number's gap to its goal or to where it was. Whole numbers are
 * advice ("ten minutes", "15 seconds"), not data, and are never flagged.
 */
export function ungroundedNumbers(reply: string, told: string): number[] {
  const known = numbersIn(told);
  const gaps = gapsIn(told);
  const near = (value: number, pool: readonly number[]) =>
    pool.some((item) => Math.abs(item - value) <= 0.051);
  return secondsStated(reply).filter(
    (value) => !Number.isInteger(value) && !near(value, known) && !near(value, gaps),
  );
}

/** The reply as the model wrote it: a JSON object with an `answer`, not the raw-text fallback. */
export function isStructuredReply(raw: string): boolean {
  const body = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(body) as { answer?: unknown };
    return typeof parsed === "object" && parsed !== null && typeof parsed.answer === "string";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Rules that apply to every reply
// ---------------------------------------------------------------------------

export const NEGATION = "\\b(?:not|no|never|without|cannot|unable|nor)\\b|n't";

/** Must-never rules every reply is held to, whatever the fixture. */
export const DEFAULT_RULES: NeverRule[] = [
  {
    id: "orientation",
    why: "Solving orientation is white cross on the bottom, yellow on top.",
    pattern:
      "white (?:cross )?(?:on|at|facing) (?:the )?(?:top|up)\\b|cross (?:on|at) (?:the )?top\\b|yellow (?:on|at) (?:the )?bottom\\b",
    excuse: "scrambl",
  },
  {
    id: "medical",
    why: "No medical advice: medicines, conditions, treatments.",
    pattern:
      "\\b(?:ibuprofen|paracetamol|acetaminophen|aspirin|anti-?inflammator\\w*|painkiller\\w*|tendon?itis|tendinitis|carpal tunnel|repetitive strain|RSI|medication|(?:ice|heat|massage|splint|brace)\\b[^.]{0,20}\\b(?:wrist|hand|finger|thumb|forearm|elbow)s?)\\b",
  },
  {
    id: "medical-cause",
    why: "No guessing at what is wrong with a hurting body: that is for a doctor.",
    pattern:
      "\\b(?:pain|hurts?|hurting|sore|soreness|injur\\w*|strain|aching|ache)\\b[^.]{0,60}\\b(?:likely|probably|caused|comes? from|because|due to|sounds like|is a sign|means)\\b|\\b(?:likely|probably|sounds like|could be|might be)\\b[^.]{0,40}\\b(?:pain|injur\\w*|strain|tendon\\w*|inflammation)\\b",
    excuse: "\\b(?:doctor|physio\\w*|professional|medical)\\b",
  },
  {
    id: "invents-roadmap",
    why: "No promises about features SolveLab does not have today.",
    pattern:
      "\\b(?:coming soon|will be (?:added|released|available)|future (?:update|release|version)|in a future|planned feature|on the roadmap|hasn't been released|not (?:yet )?released|upcoming (?:feature|release|update))\\b",
  },
  {
    id: "asks-for-known-data",
    why: "The profile is in the prompt: asking for it again means it was forgotten.",
    pattern:
      "\\b(?:can you (?:tell|share|give|send) me|what(?:'s| is) your|could you (?:tell|share|give)|please (?:tell|share|give) me)\\b[^.?]{0,30}\\b(?:average|goal|times?|solves|splits|numbers|data|level)\\b",
  },
  {
    id: "off-topic-code",
    why: "A cubing coach does not write code.",
    pattern:
      "```|\\bdef \\w+\\(|\\bconsole\\.log\\b|\\bimport \\w+(?: from|\\s*$)|\\bSELECT .+ FROM\\b",
  },
  {
    id: "leaks-instructions",
    why: "The instructions are not for sharing word for word.",
    pattern:
      "You are a friendly, expert speedcubing coach|Reply with one JSON object|Copy ids exactly",
  },
];

/** The first sentence of `text` that breaks `rule`, or null. */
export function ruleBreak(rule: NeverRule, text: string): string | null {
  const pattern = new RegExp(rule.pattern, rule.flags ?? "i");
  const excuse = rule.excuse
    ? new RegExp(rule.excuse, "i")
    : rule.negatable
      ? new RegExp(NEGATION, "i")
      : null;
  for (const sentence of splitSentences(text)) {
    if (pattern.test(sentence) && !(excuse && excuse.test(sentence))) return sentence;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Scoring one reply
// ---------------------------------------------------------------------------

export interface Check {
  id: string;
  ok: boolean;
  detail?: string;
}

export interface Break {
  rule: string;
  detail: string;
}

export interface TurnScore {
  checks: Check[];
  breaks: Break[];
  words: number;
  passed: number;
  total: number;
}

export interface ScoreInput {
  fixture: EvalFixture;
  turn: EvalTurn;
  /** What the model wrote, before parsing. */
  raw: string;
  /** From `parseCoachReply` (algorithms already taken out of the text). */
  reply: CoachReply;
  /** `unknownIds` from `parseCoachReply`: ids the model returned that the catalogue does not have. */
  unknownIds: readonly string[];
  catalogue: readonly { id: string; title: string; kind: string }[];
  /** Everything the model was told (system prompt and the conversation), for number checks. */
  told: string;
}

const clip = (text: string, max = 120) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** How many checks a turn has, so a turn that produced no reply can count as all failed. */
export function checkCount(fixture: EvalFixture, turn: EvalTurn): number {
  return (
    3 + // json, length, numbers
    (turn.mustMention?.length ?? 0) +
    (turn.checksWeakest && fixture.weakest ? 1 : 0) +
    (turn.expectRefs ? 1 : 0)
  );
}

export function scoreTurn(input: ScoreInput): TurnScore {
  const { fixture, turn, raw, reply, unknownIds, catalogue, told } = input;
  const checks: Check[] = [];
  const breaks: Break[] = [];
  const everything = [reply.answer, ...reply.followUps].join("\n");
  const searchable = normaliseText(everything);
  const numbers = numbersIn(everything);
  const words = wordCount(reply.answer);

  // --- scored checks
  checks.push({
    id: "json",
    ok: isStructuredReply(raw),
    detail: "the reply was not a JSON object with an answer (raw-text fallback)",
  });
  const maxWords = turn.maxWords ?? DEFAULT_MAX_WORDS;
  checks.push({
    id: "length",
    ok: words >= MIN_WORDS && words <= maxWords,
    detail: `${words} words (allowed ${MIN_WORDS}-${maxWords})`,
  });
  const invented = ungroundedNumbers(reply.answer, told);
  checks.push({
    id: "numbers",
    ok: invented.length === 0,
    detail: `seconds not in the data: ${invented.join(", ")}`,
  });
  (turn.mustMention ?? []).forEach((fact, index) => {
    const alts = Array.isArray(fact) ? fact : [fact];
    const ok = alts.some((alt) => factHit(alt, searchable, numbers));
    const label = alts
      .map((alt) => (typeof alt === "string" ? alt : String(alt.number)))
      .join(" | ");
    checks.push({ id: `mention:${index + 1}`, ok, detail: `does not say: ${clip(label)}` });
  });
  const known = new Set(catalogue.map((entry) => entry.id));
  const validRefs = reply.refs.filter((ref) => known.has(ref.id));
  if (turn.expectRefs) {
    checks.push({
      id: "refs-present",
      ok: validRefs.length > 0,
      detail: "no valid id in refs",
    });
  }
  if (turn.checksWeakest && fixture.weakest) {
    const weakest = fixture.weakest;
    const first = reply.refs[0];
    const named = splitSentences(reply.answer).slice(0, 2).join(" ");
    const namedText = normaliseText(named);
    const byRef = first ? weakest.refs.includes(first.id) : false;
    const byWords = weakest.words.some((word) => namedText.includes(normaliseText(word)));
    checks.push({
      id: "weakest",
      ok: byRef || byWords,
      detail: `first suggestion ${first?.id ?? "none"} is not for ${weakest.aspect}, and the answer's opening does not name it`,
    });
  }

  // --- must-never breaks
  for (const id of unknownIds) {
    breaks.push({ rule: "id-outside-catalogue", detail: `the model returned ${clip(id, 60)}` });
  }
  for (const ref of reply.refs) {
    if (!known.has(ref.id)) {
      breaks.push({
        rule: "id-outside-catalogue",
        detail: `ref ${clip(ref.id, 60)} is not in the catalogue`,
      });
    }
  }
  for (const name of unknownReferences(everything)) {
    breaks.push({
      rule: "unknown-name",
      detail: `names a pack, test or drill SolveLab does not have: ${name}`,
    });
  }
  // The raw text: parseCoachReply has already taken moves out of `reply`.
  for (const moves of findMoveSequences(raw)) {
    breaks.push({ rule: "algorithm", detail: `writes moves: ${clip(moves, 60)}` });
  }
  for (const rule of [...DEFAULT_RULES, ...(fixture.mustNever ?? []), ...(turn.mustNever ?? [])]) {
    const sentence = ruleBreak(rule, everything);
    if (sentence !== null) breaks.push({ rule: rule.id, detail: clip(sentence) });
  }

  const passed = checks.filter((check) => check.ok).length;
  return { checks, breaks, words, passed, total: checks.length };
}

/** A turn that produced no usable reply (Ollama error, timeout): every check fails. */
export function failedTurn(fixture: EvalFixture, turn: EvalTurn, message: string): TurnScore {
  return {
    checks: [{ id: "reply", ok: false, detail: message }],
    breaks: [],
    words: 0,
    passed: 0,
    total: checkCount(fixture, turn),
  };
}

// ---------------------------------------------------------------------------
// Totals and the printed table
// ---------------------------------------------------------------------------

export interface TurnResult extends TurnScore {
  fixtureId: string;
  turn: number;
  user: string;
  answer: string;
  refs: string[];
  seconds?: number;
}

export interface EvalSummary {
  turns: number;
  passed: number;
  total: number;
  /** Share of checks that passed, 0–1. */
  rate: number;
  breaks: number;
  pass: boolean;
}

export function summarise(results: readonly TurnResult[]): EvalSummary {
  const passed = results.reduce((sum, result) => sum + result.passed, 0);
  const total = results.reduce((sum, result) => sum + result.total, 0);
  const breaks = results.reduce((sum, result) => sum + result.breaks.length, 0);
  const rate = total === 0 ? 0 : passed / total;
  return {
    turns: results.length,
    passed,
    total,
    rate,
    breaks,
    pass: total > 0 && rate >= PASS_MARK && breaks === 0,
  };
}

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

/** A table of every fixture, the failing checks under it, and the verdict. */
export function renderReport(results: readonly TurnResult[]): string {
  const byFixture = new Map<string, TurnResult[]>();
  for (const result of results) {
    byFixture.set(result.fixtureId, [...(byFixture.get(result.fixtureId) ?? []), result]);
  }
  const head = ["fixture", "turns", "checks", "pass", "breaks", "words", "secs"];
  const rows: string[][] = [head];
  for (const [id, turns] of byFixture) {
    const sum = summarise(turns);
    const words = Math.round(turns.reduce((n, turn) => n + turn.words, 0) / turns.length);
    const timed = turns.filter((turn) => turn.seconds !== undefined);
    const secs = timed.length
      ? (timed.reduce((n, turn) => n + (turn.seconds ?? 0), 0) / timed.length).toFixed(1)
      : "-";
    rows.push([
      id,
      String(sum.turns),
      `${sum.passed}/${sum.total}`,
      pct(sum.rate),
      String(sum.breaks),
      String(words),
      secs,
    ]);
  }
  const widths = head.map((_, col) => Math.max(...rows.map((row) => row[col]!.length)));
  const line = (row: string[]) =>
    row
      .map((cell, col) => (col === 0 ? cell.padEnd(widths[col]!) : cell.padStart(widths[col]!)))
      .join("  ");
  const out: string[] = [
    line(rows[0]!),
    widths.map((width) => "-".repeat(width)).join("  "),
    ...rows.slice(1).map(line),
  ];

  const problems: string[] = [];
  for (const result of results) {
    const where = `${result.fixtureId} #${result.turn + 1}`;
    for (const rule of result.breaks)
      problems.push(`BREAK  ${where}  ${rule.rule}: ${rule.detail}`);
    for (const check of result.checks) {
      if (!check.ok) problems.push(`miss   ${where}  ${check.id}: ${check.detail ?? ""}`);
    }
  }
  if (problems.length) out.push("", ...problems);

  const all = summarise(results);
  out.push(
    "",
    `Checks passed: ${all.passed}/${all.total} (${pct(all.rate)}, pass mark ${pct(PASS_MARK)})`,
    `Must-never breaks: ${all.breaks} (must be 0)`,
    all.pass ? "RESULT: PASS" : "RESULT: FAIL",
  );
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Fixture files
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ruleErrors(where: string, rules: unknown): string[] {
  if (rules === undefined) return [];
  if (!Array.isArray(rules)) return [`${where}: mustNever must be an array`];
  const errors: string[] = [];
  rules.forEach((rule, index) => {
    const at = `${where}.mustNever[${index}]`;
    if (
      !isRecord(rule) ||
      typeof rule.id !== "string" ||
      typeof rule.why !== "string" ||
      typeof rule.pattern !== "string"
    ) {
      errors.push(`${at}: needs id, why and pattern`);
      return;
    }
    for (const source of [rule.pattern, rule.excuse]) {
      if (typeof source !== "string") continue;
      try {
        new RegExp(source, typeof rule.flags === "string" ? rule.flags : "i");
      } catch {
        errors.push(`${at}: not a regular expression: ${source}`);
      }
    }
  });
  return errors;
}

/** Structural problems in a parsed fixture file; empty when it is usable. */
export function fixtureErrors(value: unknown): string[] {
  if (!isRecord(value)) return ["not an object"];
  const errors: string[] = [];
  const id = typeof value.id === "string" ? value.id : "?";
  if (typeof value.id !== "string" || !/^[a-z0-9-]+$/.test(value.id))
    errors.push("id must be kebab-case");
  if (typeof value.description !== "string") errors.push(`${id}: description is missing`);
  if (!isRecord(value.profile)) errors.push(`${id}: profile is missing`);
  else {
    const profile = value.profile;
    if (!Array.isArray(profile.testsTaken)) errors.push(`${id}: profile.testsTaken is missing`);
    if (!isRecord(profile.aspects)) errors.push(`${id}: profile.aspects is missing`);
  }
  if (value.weakest !== null && !isRecord(value.weakest))
    errors.push(`${id}: weakest must be an object or null`);
  errors.push(...ruleErrors(id, value.mustNever));
  if (!Array.isArray(value.turns) || value.turns.length === 0)
    errors.push(`${id}: needs at least one turn`);
  else {
    value.turns.forEach((turn, index) => {
      if (!isRecord(turn) || typeof turn.user !== "string" || !turn.user.trim()) {
        errors.push(`${id}.turns[${index}]: needs a user message`);
        return;
      }
      errors.push(...ruleErrors(`${id}.turns[${index}]`, turn.mustNever));
    });
  }
  if (value.history !== undefined) {
    if (!Array.isArray(value.history)) errors.push(`${id}: history must be an array`);
    else {
      value.history.forEach((message, index) => {
        if (
          !isRecord(message) ||
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.content !== "string"
        ) {
          errors.push(`${id}.history[${index}]: needs role user or assistant, and content`);
        }
      });
    }
  }
  return errors;
}
