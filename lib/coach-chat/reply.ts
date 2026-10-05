/**
 * Reading the coach's reply: the JSON schema it is asked for, a reader that
 * copes with JSON cut off anywhere, a check of every id it returns against
 * the catalogue, and the guards (small models invent algorithms, numbers, and
 * advice): the algorithm guard on every reply, and, when the caller passes
 * what the model was told, the number, kind-word and advice guards of
 * guards.ts. A reply that isn't JSON at all is shown as plain text, still guarded.
 */
import { FUNDAMENTALS } from "@/data/algorithms/fundamentals";
import { TRAINING_PACKS } from "@/data/training";
import { ALGORITHM_SETS } from "@/lib/algorithms/catalog";
import { unknownReferences } from "@/lib/ai/grounding";
import {
  formatAlgorithm,
  formatMove,
  parseAlgorithm,
  parseMove,
  type Move,
} from "@/lib/cube/notation";
import type { CatalogueEntry } from "./context";
import { guardText, NOTHING_LEFT, refSlips, type ReplyCheck } from "./guards";
import type { CoachReply } from "./types";

const KINDS = ["pack", "test", "unit", "drill", "lesson", "set"] as const;
const MAX_REFS = 3;
const MAX_FOLLOW_UPS = 3;
/** Fewest moves in a row that count as an algorithm. */
const MIN_RUN = 4;
export const ALGORITHM_REMOVED = "(see the algorithm bank)";

/** For Ollama's `format`: `answer` comes first so it can be shown while the rest streams. */
export const COACH_REPLY_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    refs: {
      type: "array",
      maxItems: MAX_REFS,
      items: {
        type: "object",
        properties: { kind: { type: "string", enum: KINDS }, id: { type: "string" } },
        required: ["kind", "id"],
      },
    },
    followUps: { type: "array", maxItems: MAX_FOLLOW_UPS, items: { type: "string" } },
  },
  required: ["answer", "refs", "followUps"],
} as const;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type Parsed = { v: Json; done: boolean };

/**
 * Lenient JSON reader for text that may stop anywhere (a reply cut off by the
 * length cap, or still streaming). Incomplete array items and objects are
 * dropped; a cut-off string is kept only for `answer`. Throws on text that
 * can't be JSON.
 */
function parsePartial(src: string): { [key: string]: Json } {
  let i = 0;
  const skip = () => {
    while (i < src.length && /\s/.test(src[i]!)) i++;
  };
  const string = (): { v: string; done: boolean } => {
    i++;
    let out = "";
    while (i < src.length) {
      const c = src[i++]!;
      if (c === '"') return { v: out, done: true };
      if (c !== "\\") {
        out += c;
        continue;
      }
      const next = src[i++];
      if (next === undefined) break;
      if (next === "u") {
        const hex = src.slice(i, i + 4);
        if (!/^[0-9a-f]{4}$/i.test(hex)) {
          i = src.length;
          break;
        }
        out += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else {
        out +=
          ({ n: "\n", t: "\t", r: "\r", b: "\b", f: "\f" } as Record<string, string>)[next] ?? next;
      }
    }
    return { v: out, done: false };
  };
  const value = (): Parsed | null => {
    skip();
    const c = src[i];
    if (c === undefined) return null;
    if (c === '"') return string();
    if (c === "{") return object();
    if (c === "[") return array();
    const token = /^[^\s,\]}]+/.exec(src.slice(i))?.[0] ?? "";
    i += token.length;
    if (i >= src.length) return { v: null, done: false };
    try {
      return { v: JSON.parse(token) as Json, done: true };
    } catch {
      throw new Error(`not JSON: ${token}`);
    }
  };
  const object = (): Parsed => {
    i++;
    const out: { [key: string]: Json } = {};
    for (;;) {
      skip();
      if (i >= src.length) return { v: out, done: false };
      if (src[i] === "}") return (i++, { v: out, done: true });
      if (src[i] === ",") {
        i++;
        continue;
      }
      if (src[i] !== '"') throw new Error("not JSON: expected a key");
      const key = string();
      skip();
      if (!key.done || i >= src.length) return { v: out, done: false };
      if (src[i++] !== ":") throw new Error("not JSON: expected a colon");
      const item = value();
      if (!item) return { v: out, done: false };
      if (
        item.done ||
        Array.isArray(item.v) ||
        (key.v === "answer" && typeof item.v === "string")
      ) {
        // An own property for every key, "__proto__" included, as JSON.parse makes it.
        Object.defineProperty(out, key.v, {
          value: item.v,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      if (!item.done) return { v: out, done: false };
    }
  };
  const array = (): Parsed => {
    i++;
    const out: Json[] = [];
    for (;;) {
      skip();
      if (i >= src.length) return { v: out, done: false };
      if (src[i] === "]") return (i++, { v: out, done: true });
      if (src[i] === ",") {
        i++;
        continue;
      }
      const item = value();
      if (!item || !item.done) return { v: out, done: false };
      out.push(item.v);
    }
  };
  const top = object();
  return top.v as { [key: string]: Json };
}

/** The reply without a thinking block or a code fence around it. */
function clean(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

/** Where the JSON starts: at the opening brace, or after a short lead-in before `{"answer"`. */
function jsonStart(text: string): number {
  return text.startsWith("{") ? 0 : text.search(/\{\s*"answer"/);
}

function readObject(text: string): { [key: string]: Json } | null {
  const start = jsonStart(text);
  if (start === -1) return null;
  try {
    return parsePartial(text.slice(start));
  } catch {
    return null;
  }
}

/**
 * The `answer` text so far, for showing while the reply streams, with any
 * invented algorithm already taken out (so it is never on screen, not even
 * for a moment). A reply that isn't JSON is returned as it is, guarded.
 *
 * With `guards`, only whole sentences are shown and each goes through the
 * number, kind-word and advice guards first, so no made-up number is on
 * screen even for a moment. The sentence still being written appears when the
 * reply is done and `parseCoachReply` gives the final answer.
 */
export function partialAnswer(
  raw: string,
  guards?: { catalogue: readonly CatalogueEntry[]; check: ReplyCheck },
): string {
  const text = clean(raw);
  const object = jsonStart(text) === -1 ? null : readObject(text);
  const shown = !object ? text : typeof object.answer === "string" ? object.answer : "";
  const safe = guardAlgorithms(shown).text;
  if (!guards) return safe;
  const end = [...safe.matchAll(/[.!?]+(?=\s)/g)].at(-1);
  if (!end) return "";
  const settled = safe.slice(0, end.index! + end[0].length);
  return guardText(settled, guards.catalogue, guards.check).text.trim();
}

// --- algorithm guard -------------------------------------------------------

type Run = { start: number; end: number; moves: Move[] };

/** Joins one move to the next: "R-U-R'-U'", "R→U→R'→U'", "R->U". */
const JOINER = /->|[-–—→]/;
/** A joiner standing alone between spaced moves: "R → U → R'". */
const JOINER_WORD = /^(?:->|[-–—→]+)$/;

/**
 * One move, or several: six or more written together with no spaces
 * ("RUR'U'R'FRF'"), or any number joined by hyphens or arrows. Empty when the
 * word is not made only of moves.
 */
function wordMoves(word: string): Move[] {
  const single = parseMove(word);
  if (single) return [single];
  const joined = word.split(JOINER);
  if (joined.length > 1) {
    const moves = joined.map(wordMoves);
    return moves.every((part) => part.length > 0) ? moves.flat() : [];
  }
  if (!/^(?:[URFDLB]w?2?['’′]?){6,}$/.test(word)) return [];
  const parts = word.match(/[URFDLB]w?2?['’′]?/g) ?? [];
  return parts.flatMap((part) => parseMove(part) ?? []);
}

/** Runs of MIN_RUN or more moves written one after another in the text. */
function findRuns(text: string): Run[] {
  const runs: Run[] = [];
  let run: Run | null = null;
  const flush = () => {
    if (run && run.moves.length >= MIN_RUN) runs.push(run);
    run = null;
  };
  for (const match of text.matchAll(/\S+/g)) {
    const word = match[0];
    const lead = /^[([{`*_"]*/.exec(word)![0].length;
    const trail = /[)\]}`*_",.;:!?]*$/.exec(word)![0];
    const end = word.length - trail.length;
    const core = word.slice(lead, end);
    if (run && JOINER_WORD.test(core)) continue;
    const moves = end > lead ? wordMoves(core) : [];
    if (moves.length === 0) {
      flush();
      continue;
    }
    run ??= { start: match.index! + lead, end: 0, moves: [] };
    run.end = match.index! + end;
    run.moves.push(...moves);
    if (/[,;:.!?]/.test(trail)) flush();
  }
  flush();
  return runs;
}

let bankCache: string | null = null;

/** SolveLab's own algorithms and triggers as " a b c | d e f ", so a fragment is one substring check. */
function bank(): string {
  if (bankCache) return bankCache;
  const sources = [
    ...ALGORITHM_SETS.flatMap((set) =>
      set.cases.flatMap((entry) => entry.algorithms.map((algorithm) => algorithm.moves)),
    ),
    ...FUNDAMENTALS.map((trigger) => trigger.moves),
    ...TRAINING_PACKS.flatMap((pack) =>
      pack.lessons.flatMap(
        (lesson) => lesson.examples?.flatMap((example) => example.moves ?? []) ?? [],
      ),
    ),
  ];
  const parts: string[] = [];
  for (const moves of sources) {
    const parsed = parseAlgorithm(moves);
    if (parsed.ok) parts.push(formatAlgorithm(parsed.moves));
  }
  // Sequences SolveLab's own lessons and drills write out in their text.
  for (const pack of TRAINING_PACKS) {
    const texts = [
      pack.why,
      ...pack.mistakes,
      ...pack.lessons.flatMap((lesson) => [lesson.takeaway, ...lesson.body]),
      ...pack.drills.flatMap((drill) => [drill.purpose, ...drill.rules]),
    ];
    for (const run of texts.flatMap(findRuns)) parts.push(formatAlgorithm(run.moves));
  }
  return (bankCache = ` ${parts.join(" | ")} `);
}

/** Set-up turns and last-layer adjustments at either end don't make a sequence a new one. */
const PEEL = new Set(["U", "x", "y", "z"]);

function isKnown(moves: Move[]): boolean {
  let from = 0;
  let to = moves.length;
  while (from < to && PEEL.has(moves[from]!.family)) from++;
  while (to > from && PEEL.has(moves[to - 1]!.family)) to--;
  const known = (tokens: string[]) =>
    tokens.length < MIN_RUN || bank().includes(` ${tokens.join(" ")} `);
  // The same known chunk several times in a row ("R U R' U'" six times).
  const repeated = (tokens: string[]) => {
    for (let size = 1; size <= tokens.length / 2; size++) {
      if (
        tokens.length % size === 0 &&
        tokens.every((token, index) => token === tokens[index % size])
      ) {
        return known(tokens.slice(0, size));
      }
    }
    return false;
  };
  const whole = moves.map(formatMove);
  const core = whole.slice(from, to);
  return known(core) || repeated(core) || repeated(whole);
}

/**
 * Removes any run of four or more moves that isn't in SolveLab's own bank
 * (an algorithm, a trigger, or an example in its lessons, however it is
 * held), and reports what it removed.
 */
export function guardAlgorithms(text: string): { text: string; invented: string[] } {
  const invented: string[] = [];
  let out = text;
  for (const found of findRuns(text).reverse()) {
    if (isKnown(found.moves)) continue;
    invented.unshift(text.slice(found.start, found.end));
    out = out.slice(0, found.start) + ALGORITHM_REMOVED + out.slice(found.end);
  }
  return { text: out, invented };
}

// --- the reply -------------------------------------------------------------

export interface ParsedCoachReply {
  reply: CoachReply;
  /** What the model said, with only the algorithm guard applied: what the eval scores the model on. Same as `reply` when no `check` is given. */
  unguarded: CoachReply;
  /** Everything removed or flagged: unknown ref ids, invented algorithms, unknown pack/test/drill names, and what the number, kind-word and advice guards changed. */
  dropped: string[];
  /** Ref ids the catalogue doesn't have (dropped from `refs`). */
  unknownIds: string[];
  /** Move sequences taken out of the text because SolveLab's bank doesn't have them. */
  invented: string[];
  /** Pack, test or drill names in the text that SolveLab doesn't have (flagged, text unchanged). */
  unknownNames: string[];
  /** Numbers (with a unit, or decimals) taken out because nothing the model was told backs them. */
  ungrounded: string[];
  /** Kind words corrected, as "lesson → pack: first-lookahead". */
  kindFixes: string[];
  /** Advice to learn a known or leave-alone set replaced, and refs to such sets dropped. */
  badAdvice: string[];
  /** False when the reply was not JSON and the raw text is shown. */
  structured: boolean;
}

function resolveRefs(items: Json, catalogue: readonly CatalogueEntry[]) {
  const byKey = new Map<string, CatalogueEntry[]>();
  for (const entry of catalogue) {
    for (const key of [entry.id, entry.title]) {
      const list = byKey.get(key.trim().toLowerCase()) ?? [];
      list.push(entry);
      byKey.set(key.trim().toLowerCase(), list);
    }
  }
  const refs: CoachReply["refs"] = [];
  const unknownIds: string[] = [];
  for (const item of Array.isArray(items) ? items : []) {
    const record = item && typeof item === "object" && !Array.isArray(item) ? item : null;
    const id = typeof item === "string" ? item : typeof record?.id === "string" ? record.id : null;
    if (!id?.trim()) continue;
    const kind = typeof record?.kind === "string" ? record.kind : "";
    // A model sometimes copies the "[pack]" the list puts after a title.
    const key = id
      .trim()
      .toLowerCase()
      .replace(/\s*\[[a-z]+\]\s*$/, "");
    // A model sometimes copies the whole catalogue line ("- id: title"): then the id is what comes before the colon.
    const found =
      byKey.get(key) ??
      byKey.get(
        key
          .replace(/^[-*]\s*/, "")
          .split(":")[0]!
          .trim(),
      );
    // A right id under the wrong kind is the model's slip; the catalogue's kind wins.
    const entry = found?.find((candidate) => candidate.kind === kind) ?? found?.[0];
    if (!entry) {
      unknownIds.push(id.trim());
      continue;
    }
    if (!refs.some((ref) => ref.id === entry.id) && refs.length < MAX_REFS) {
      refs.push({ kind: entry.kind as CoachReply["refs"][number]["kind"], id: entry.id });
    }
  }
  return { refs, unknownIds };
}

/**
 * Turns the model's raw reply into a CoachReply. Ids not in the catalogue are
 * dropped, move sequences not in SolveLab's bank are removed, and a reply that
 * isn't usable JSON becomes plain text (no refs), still checked.
 *
 * With `check` (what the model was told: `replyCheck(messages, facts)`), the
 * guards of guards.ts also run: numbers no data backs are removed, kind words
 * are corrected, advice to learn a known or leave-alone set is replaced and
 * refs that teach a known set are dropped. A follow-up that fails a guard is
 * dropped. If nothing of the answer is left, the person gets NOTHING_LEFT.
 */
export function parseCoachReply(
  raw: string,
  catalogue: readonly CatalogueEntry[],
  check?: ReplyCheck,
): ParsedCoachReply {
  const text = clean(raw);
  const object = readObject(text);
  const structured = typeof object?.answer === "string";
  const answer = structured ? (object!.answer as string).trim() : text;
  const { refs, unknownIds } = structured
    ? resolveRefs(object!.refs ?? [], catalogue)
    : { refs: [], unknownIds: [] };
  const asked = structured && Array.isArray(object!.followUps) ? object!.followUps : [];
  const followUps = [
    ...new Set(
      asked.filter((item): item is string => typeof item === "string").map((item) => item.trim()),
    ),
  ]
    .filter(Boolean)
    .slice(0, MAX_FOLLOW_UPS);

  const invented: string[] = [];
  const guard = (value: string) => {
    const guarded = guardAlgorithms(value);
    invented.push(...guarded.invented);
    return guarded.text;
  };
  const unguarded: CoachReply = {
    answer: guard(answer),
    refs,
    followUps: followUps.map(guard),
  };
  let reply = unguarded;
  const ungrounded: string[] = [];
  const kindFixes: string[] = [];
  const badAdvice: string[] = [];
  if (check) {
    const body = guardText(unguarded.answer, catalogue, check);
    ungrounded.push(...body.ungrounded);
    kindFixes.push(...body.kindFixes);
    badAdvice.push(...body.badAdvice);
    const refCheck = refSlips(unguarded.refs, check, check.said.at(-1));
    badAdvice.push(...refCheck.removed);
    const kept: string[] = [];
    for (const followUp of unguarded.followUps) {
      const one = guardText(followUp, catalogue, check);
      kindFixes.push(...one.kindFixes);
      if (one.ungrounded.length || one.badAdvice.length) {
        ungrounded.push(...one.ungrounded);
        badAdvice.push(...one.badAdvice);
      } else kept.push(one.text);
    }
    const answer = body.text.trim() ? body.text : unguarded.answer.trim() ? NOTHING_LEFT : "";
    reply = { answer, refs: refCheck.kept as CoachReply["refs"], followUps: kept };
  }
  const unknownNames = unknownReferences([reply.answer, ...reply.followUps].join("\n"));
  return {
    reply,
    unguarded,
    dropped: [
      ...unknownIds,
      ...invented,
      ...unknownNames,
      ...ungrounded.map((number) => `number ${number}`),
      ...kindFixes.map((fix) => `kind word ${fix}`),
      ...badAdvice.map((slip) => `advice ${slip}`),
    ],
    unknownIds,
    invented,
    unknownNames,
    ungrounded,
    kindFixes,
    badAdvice,
    structured,
  };
}
