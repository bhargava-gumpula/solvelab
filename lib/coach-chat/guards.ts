/**
 * Guards on what the coach says, applied by reply.ts to every reply and used
 * by eval.ts to score the model. A small model sounds sure about things it
 * has made up, so what it says is checked against what it was told:
 *
 * - numbers: every number with a unit or a decimal must be one the data (or
 *   the person) gave, to within rounding, or a gap the coach may work out
 *   (a value against its goal, or against where it was); a cut-off or target
 *   ("until it drops below 1.86 s") may not be the edge of a likely range;
 * - kind words: "lesson", "pack", "drill", "test", "set" and "unit" must be
 *   the kind the catalogue gives the thing they sit next to;
 * - advice: never "learn" a set the person already knows, and never a set
 *   the course says to leave alone.
 *
 * Everything here is pure text in, text and a report out.
 */
import type { CatalogueEntry } from "./context";

// ---------------------------------------------------------------------------
// What the guards know
// ---------------------------------------------------------------------------

/** Algorithm bank set ids ("pll", "oll", "two-look-oll", "coll", "zbll", "winter-variation"). */
export interface SetFacts {
  /** Sets the profile marks as already known. */
  knownSets: string[];
  /** Sets the person's level says to leave alone. */
  leaveAloneSets: string[];
}

export interface ReplyCheck extends SetFacts {
  /** The system message the model was given: its numbers are what a reply may state. */
  system: string;
  /** What the person has said so far (their own numbers may be repeated back). */
  said: readonly string[];
}

/** The check for a conversation: the system message, then the person's messages from `messages`. */
export function replyCheck(
  messages: readonly { role: string; content: string }[],
  facts: SetFacts,
): ReplyCheck {
  return {
    ...facts,
    system: messages.find((message) => message.role === "system")?.content ?? "",
    said: messages.filter((message) => message.role === "user").map((message) => message.content),
  };
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/** s: seconds, %: a share, rate: turns per second, "": no unit given. */
type Dim = "s" | "%" | "rate" | "";

interface Stated {
  value: number;
  dim: Dim;
  /** Decimals as written, which set how far off a rounded number may be. */
  decimals: number;
  start: number;
  end: number;
  text: string;
  /** Written as a cut-off or target ("until it drops below 1.86 s"): only a goal or a value may be one. */
  threshold: boolean;
  /** Said of the inspection ("15 seconds of inspection"): the rule book's own numbers are allowed there and only there. */
  inspection: boolean;
  /** A share of slow attempts read as a count of what they know ("you know 30% of OLL algorithms"): never backed, whatever the data says. */
  misread: boolean;
}

/** "know 30% of OLL algorithms": the verb sits right before the share ("you know about 30%"), not earlier in the sentence ("you know full OLL, but 12% of cases are slow"). */
const KNOWS =
  /\b(?:know|knows|knew|knowing|solve|solves|solving|learn|learned|learnt|learning|memori[sz]e|memori[sz]ed|have|has|use|uses|using)\s+(?:(?:about|around|roughly|only|just|nearly|almost|approximately|over|under|maybe|perhaps|probably|already|really|well|at most|at least)\s+)*$/i;
const OF_ALGORITHMS =
  /^\s+of\s+(?:the\s+|your\s+|all\s+)?(?:(?:(?:OLL|PLL)\s+)?(?:algorithms|algs|cases|OLLs|PLLs)\b|(?:OLL|PLL)\b(?!\s+(?:attempts|solves|times|slow|share)))/i;
/** "Only 12% of your OLL algorithms are known": the same misreading, said the other way round. */
const KNOWN_AFTER =
  /^\s+of\s+(?:the\s+|your\s+)?(?:(?:OLL|PLL)\s+)?(?:algorithms|algs|cases|OLLs|PLLs)\s+(?:are|is|have been|you (?:know|have))\s+(?:\w+\s+)?(?:known|learned|learnt|memori[sz]ed|covered|solid|down)\b/i;
const misread = (text: string, start: number, end: number) =>
  (KNOWS.test(text.slice(Math.max(0, start - 45), start)) &&
    OF_ALGORITHMS.test(text.slice(end, end + 40))) ||
  KNOWN_AFTER.test(text.slice(end, end + 70));

/** What comes before a number that is a cut-off or a target. */
const THRESHOLD =
  /\b(?:below|under|until|over|above|beat|beats|reach|reaches|reaching|hit|hits|hitting|drops? (?:to|below|under)|gets? (?:to|below|under)|down to|less than|more than|faster than|slower than|at least|at most|aim(?:s|ing)? (?:for|at)|targets?|targeting|(?:cut|shave|bring|take|drop|get|push|pull|lower|trim|reduce)\b[^.,;]{0,25}?\bto)\s+(?:[\w']+\s+){0,3}$/i;

const INSPECTION = /\binspect/i;

const STATED =
  /(?<![\w.])(\d+):(\d{2}(?:\.\d+)?)|(?<![A-Za-z0-9.])(\d+(?:\.\d+)?)(?:\s*(%|percent\b|ms\b|milliseconds?\b|(?:secs?|seconds?|s)(?![A-Za-z0-9])|turns\s*(?:\/|per)\s*(?:s|sec|second)\b|tps\b))?/gi;

/**
 * The numbers in a text that are claims about data: times ("1:05.3"), numbers
 * with a unit (seconds, a percent, turns per second) and any decimal. A whole
 * number with no unit ("ten drills", "sub-12", "2-look") is not one.
 */
export function statedNumbers(text: string): Stated[] {
  const out: Stated[] = [];
  for (const match of text.matchAll(STATED)) {
    const start = match.index!;
    const end = start + match[0].length;
    if (match[1] !== undefined) {
      out.push({
        value: Number(match[1]) * 60 + Number(match[2]),
        dim: "s",
        decimals: match[2]!.split(".")[1]?.length ?? 0,
        start,
        end,
        text: match[0],
        threshold: THRESHOLD.test(text.slice(Math.max(0, start - 40), start)),
        inspection: INSPECTION.test(text.slice(Math.max(0, start - 50), end + 50)),
        misread: false,
      });
      continue;
    }
    const decimals = match[3]!.split(".")[1]?.length ?? 0;
    const unit = match[4]?.toLowerCase().replace(/\s+/g, "");
    if (!unit && (decimals === 0 || /[A-Za-z]/.test(text[end] ?? ""))) continue;
    const milli = unit === "ms" || unit?.startsWith("millisecond");
    const dim: Dim = !unit
      ? ""
      : unit === "%" || unit === "percent"
        ? "%"
        : unit.startsWith("turns") || unit === "tps"
          ? "rate"
          : "s";
    out.push({
      value: milli ? Number(match[3]) / 1000 : Number(match[3]),
      dim,
      decimals: milli ? 3 : decimals,
      start,
      end,
      text: match[0].trim(),
      threshold: THRESHOLD.test(text.slice(Math.max(0, start - 40), start)),
      inspection: INSPECTION.test(text.slice(Math.max(0, start - 50), end + 50)),
      misread: dim === "%" && misread(text, start, end),
    });
  }
  return out;
}

/** Every number in a text, plain ones included, as seconds for m:ss times. */
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

interface Known {
  value: number;
  dim: Dim;
  /** From a "likely 1.50–1.88 s" range: where a value may sit, not a goal to give. */
  range?: boolean;
  /** The rule book's inspection numbers: only for a sentence about inspection. */
  inspection?: boolean;
}

/**
 * The differences a coach may work out for itself from one profile line: a
 * number against its goal, and against where it was ("1.89 s → 1.69 s").
 */
function gapsIn(system: string): Known[] {
  const gaps: Known[] = [];
  for (const line of system.split("\n")) {
    const head = /^- [^:]+: (\d+(?:\.\d+)?) ?(s|%|turns\/s)/.exec(line);
    if (!head) continue;
    const dim: Dim = head[2] === "s" ? "s" : head[2] === "%" ? "%" : "rate";
    const value = Number(head[1]);
    const goal = /goal (?:under|over) (\d+(?:\.\d+)?)/.exec(line)?.[1];
    const before = /(\d+(?:\.\d+)?) ?(?:s|%|turns\/s) → /.exec(line)?.[1];
    for (const other of [goal, before]) {
      if (other !== undefined) gaps.push({ value: Math.abs(value - Number(other)), dim });
    }
  }
  return gaps;
}

/** Everything a reply may state: the data's numbers, the gaps between them, and the person's own numbers. */
function knownNumbers(check: Pick<ReplyCheck, "system" | "said">): Known[] {
  const ranges = [...check.system.matchAll(/\(likely [^)]*\)/g)].map((found) => [
    found.index!,
    found.index! + found[0].length,
  ]);
  const known: Known[] = statedNumbers(check.system).map(({ value, dim, start }) => ({
    value,
    dim,
    range: ranges.some(([from, to]) => start >= from! && start < to!),
  }));
  known.push(...gapsIn(check.system));
  // Inspection is 15 s, with calls at 8 s and 12 s: the sport's own numbers, not the person's data.
  for (const value of [8, 12, 15]) known.push({ value, dim: "s", inspection: true });
  for (const said of check.said) {
    for (const value of numbersIn(said)) known.push({ value, dim: "" });
  }
  return known;
}

function isGrounded(item: Stated, known: readonly Known[]): boolean {
  // "1.3" for 1.33 is rounding; a different number is not.
  const tolerance = Math.max(0.5 * 10 ** -item.decimals, 0.01) + 1e-9;
  if (item.misread) return false;
  return known.some(
    (other) =>
      !(item.threshold && other.range) &&
      !(other.inspection && !item.inspection) &&
      (other.dim === item.dim || other.dim === "" || item.dim === "") &&
      Math.abs(other.value - item.value) <= tolerance,
  );
}

/** The numbers in `text` that nothing the model was told backs up. */
export function ungroundedStated(
  text: string,
  check: Pick<ReplyCheck, "system" | "said">,
): Stated[] {
  const known = knownNumbers(check);
  return statedNumbers(text).filter((item) => !isGrounded(item, known));
}

/** Sentences, keeping what each one ends with. */
function sentencesOf(text: string): string[] {
  const out: string[] = [];
  for (const part of text.split(/(?<=[.!?])\s+|\n+/).filter((one) => one.trim())) {
    // A list's "2." belongs to its item: it goes with the item or not at all.
    if (/^\s*\d{1,2}[.)]$/.test(out.at(-1) ?? "")) out[out.length - 1] += ` ${part}`;
    else out.push(part);
  }
  return out;
}

/**
 * Takes out the claims no data backs up: a number that sits alone in
 * brackets goes with its brackets, and any other sentence with one goes
 * whole (a softer sentence would still be built on a number nobody gave).
 * `removed` lists the numbers as written.
 */
export function groundNumbers(
  text: string,
  check: Pick<ReplyCheck, "system" | "said">,
): { text: string; removed: string[] } {
  const known = knownNumbers(check);
  const removed: string[] = [];
  let changed = false;
  const kept: string[] = [];
  for (const sentence of sentencesOf(text)) {
    const bad = statedNumbers(sentence).filter((item) => !isGrounded(item, known));
    if (bad.length === 0) {
      kept.push(sentence);
      continue;
    }
    changed = true;
    removed.push(...bad.map((item) => item.text));
    const brackets = [...sentence.matchAll(/\s*\([^()]*\)/g)];
    const inside = (item: Stated) =>
      brackets.some(
        (group) => item.start >= group.index! && item.end <= group.index! + group[0].length,
      );
    if (bad.every(inside)) {
      let softened = sentence;
      for (const group of brackets
        .filter((one) =>
          bad.some((item) => item.start >= one.index! && item.end <= one.index! + one[0].length),
        )
        .reverse()) {
        softened = softened.slice(0, group.index!) + softened.slice(group.index! + group[0].length);
      }
      kept.push(softened);
    }
  }
  return { text: changed ? kept.join(" ") : text, removed };
}

// ---------------------------------------------------------------------------
// Kind words
// ---------------------------------------------------------------------------

const KIND_WORDS = ["pack", "lesson", "drill", "test", "set", "unit"] as const;
const KIND_WORD = KIND_WORDS.join("|");

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const keyOf = (text: string) =>
  text
    .toLowerCase()
    .replace(/[-_\s]+/g, " ")
    .trim();

interface KindIndex {
  /** Normalised id or title to the kinds the catalogue gives it. */
  kinds: Map<string, Set<string>>;
  /** One pattern per key, naming the key and the kind word on either side of it. */
  patterns: { key: string; after: RegExp; before: RegExp }[];
}

const kindIndexes = new WeakMap<readonly CatalogueEntry[], KindIndex>();

function kindIndex(catalogue: readonly CatalogueEntry[]): KindIndex {
  const cached = kindIndexes.get(catalogue);
  if (cached) return cached;
  const kinds = new Map<string, Set<string>>();
  for (const entry of catalogue) {
    for (const text of [entry.id, entry.title]) {
      const key = keyOf(text);
      // One word on its own ("lookahead", "F2L", "inspection") is as often the topic as the thing.
      if (!key.includes(" ")) continue;
      kinds.set(key, (kinds.get(key) ?? new Set()).add(entry.kind));
    }
  }
  const patterns = [...kinds.keys()].map((key) => {
    const words = key.split(" ").map(escapeRegExp).join("[-_\\s]+");
    return {
      key,
      after: new RegExp(`(?<![\\w-])(${words})(["')]?)(\\s+)(${KIND_WORD})\\b`, "gi"),
      before: new RegExp(
        `\\b(${KIND_WORD})(\\s+(?:called\\s+|named\\s+)?["'(]?)(${words})(?![\\w-])`,
        "gi",
      ),
    };
  });
  const built = { kinds, patterns };
  kindIndexes.set(catalogue, built);
  return built;
}

/** Kind words that are also verbs: only a noun after "the", "this", "of"... is read as naming a thing. */
const VERBISH = new Set(["drill", "test", "set", "pack"]);
const NOUN_LEAD =
  /\b(?:the|this|that|your|a|an|its|our|each|another|next|these|those|of|in|from|with|using|via|into|called|named)\s+$/i;

const matchCase = (word: string, like: string) =>
  like[0] === like[0]!.toUpperCase() && like[0] !== like[0]!.toLowerCase()
    ? word[0]!.toUpperCase() + word.slice(1)
    : word;

/**
 * Fixes a kind word that doesn't fit the thing it sits next to ("the
 * first-lookahead lesson" when it is a pack). A name that is itself a
 * catalogue entry with that word in it ("F2L test") is left alone.
 */
export function fixKindWords(
  text: string,
  catalogue: readonly CatalogueEntry[],
): { text: string; fixes: string[] } {
  const { kinds, patterns } = kindIndex(catalogue);
  const fixes: string[] = [];
  let out = text;
  const fit = (key: string, word: string) => {
    const own = kinds.get(key)!;
    const right = [...own][0]!;
    if (own.has(word.toLowerCase()) || kinds.has(`${key} ${word.toLowerCase()}`)) return null;
    return right;
  };
  /** "the Learning full PLL pack": "full PLL" (a set) ends a pack's own title there, so its kind word is the pack's. */
  const inLonger = (key: string, near: string, side: "end" | "start") =>
    [...kinds.keys()].some((other) => {
      if (other === key || !other.includes(key)) return false;
      const name = escapeRegExp(other);
      return new RegExp(side === "end" ? `(?:^|\\W)${name}$` : `^${name}(?!\\w)`).test(keyOf(near));
    });
  for (const { key, after, before } of patterns) {
    if (!out.toLowerCase().includes(key.split(" ")[0]!)) continue;
    out = out.replace(
      after,
      (whole, name: string, close: string, gap: string, word: string, at: number) => {
        const right = fit(key, word);
        if (
          !right ||
          !KIND_WORDS.includes(word.toLowerCase() as (typeof KIND_WORDS)[number]) ||
          inLonger(key, out.slice(Math.max(0, at - 60), at + name.length), "end")
        )
          return whole;
        fixes.push(`${word.toLowerCase()} → ${right}: ${name}`);
        return `${name}${close}${gap}${matchCase(right, word)}`;
      },
    );
    out = out.replace(before, (whole, word: string, gap: string, name: string, at: number) => {
      // "Drill pair recognition for ten minutes" is a verb and a topic, not a mislabelled thing.
      if (
        VERBISH.has(word.toLowerCase()) &&
        !/[-_]/.test(name) &&
        !NOUN_LEAD.test(out.slice(Math.max(0, at - 12), at))
      )
        return whole;
      const right = fit(key, word);
      const from = at + word.length + gap.length;
      if (!right || inLonger(key, out.slice(from, from + 80), "start")) return whole;
      fixes.push(`${word.toLowerCase()} → ${right}: ${name}`);
      return `${matchCase(right, word)}${gap}${name}`;
    });
  }
  return { text: out, fixes };
}

// ---------------------------------------------------------------------------
// Advice: sets to learn
// ---------------------------------------------------------------------------

interface Topic {
  /** How the person's own words name it. */
  pattern: RegExp;
  /** How the coach names it back. */
  name: string;
  /** Refs ("pack:oll-algorithms") that teach it: wrong to point a person who knows it to. */
  teaches: string[];
  /** Its page in the algorithm bank ("set:oll"): fine to look a case up in, wrong to send a person away from when it is to be left alone. */
  page: string[];
}

const topic = (pattern: string, name: string, teaches: string[], page: string[]): Topic => ({
  pattern: new RegExp(pattern, "i"),
  name,
  teaches,
  page,
});

const TOPICS: Record<string, Topic> = {
  oll: topic(
    "\\b(?:(?:full|all|complete|entire)\\s+(?:the\\s+)?(?:57\\s+)?OLLs?|57\\s+OLLs?|all\\s+57|(?:the\\s+)?(?:full|complete|entire)\\s+set\\s+of\\s+(?:the\\s+)?(?:57\\s+)?OLLs?|every\\s+(?:single\\s+)?OLL)\\b",
    "full OLL",
    ["pack:oll-algorithms"],
    ["set:oll"],
  ),
  pll: topic(
    "\\b(?:(?:full|all|complete|entire)\\s+(?:the\\s+)?(?:21\\s+)?PLLs?|21\\s+PLLs?|all\\s+21|(?:the\\s+)?(?:full|complete|entire)\\s+set\\s+of\\s+(?:the\\s+)?(?:21\\s+)?PLLs?|every\\s+(?:single\\s+)?PLL)\\b",
    "full PLL",
    ["pack:pll-algorithms"],
    ["set:pll"],
  ),
  "two-look-oll": topic(
    "\\b(?:2|two)[- ]look\\s+OLL\\b",
    "2-look OLL",
    ["pack:two-look-oll"],
    ["set:two-look-oll"],
  ),
  "two-look-pll": topic(
    "\\b(?:2|two)[- ]look\\s+PLL\\b",
    "2-look PLL",
    ["pack:two-look-pll"],
    ["set:two-look-pll"],
  ),
  coll: topic("\\bCOLLs?\\b", "COLL", [], ["set:coll"]),
  zbll: topic("\\bZBLL\\b", "ZBLL", [], ["set:zbll"]),
  "winter-variation": topic(
    "\\bwinter\\s+variation\\b|\\bWV\\b",
    "Winter Variation",
    [],
    ["set:winter-variation"],
  ),
};

/** Bank sets a person who says they know PLL or OLL "all" or "two-look" already has. */
export const KNOWN_BY_LEVEL: Record<"pll" | "oll", Record<string, string[]>> = {
  pll: { all: ["pll", "two-look-pll"], "two-look": ["two-look-pll"] },
  oll: { all: ["oll", "two-look-oll"], "two-look": ["two-look-oll"] },
};

/** What a level's "leave alone" sentence names, in the order to try. A "beyond" sentence names what is allowed. */
const LEAVE_ALONE: [RegExp, string[]][] = [
  [/\bZBLL\b/i, ["zbll"]],
  [/\bCOLL\b/i, ["coll"]],
  [/\bwinter\s+variation\b/i, ["winter-variation"]],
  [/\bfull OLL and PLL\b/i, ["oll", "pll"]],
  [/\bfull OLL\b/i, ["oll"]],
  [/\bfull PLL\b/i, ["pll"]],
];

export function leaveAloneSets(items: readonly string[]): string[] {
  const out = new Set<string>();
  for (const item of items) {
    if (/\bbeyond\b/i.test(item)) continue;
    for (const [pattern, ids] of LEAVE_ALONE) {
      if (pattern.test(item)) ids.forEach((id) => out.add(id));
    }
  }
  return [...out];
}

const LEARN_BASE =
  /\b(?:learn|study|start|begin|master|memori[sz]e|pick up|go for|go with|dive into|take up|tackle|add|prioriti[sz]e|focus on|work on|move on to|choose|try)\b/gi;
/** "by learning", "worth learning": a recommendation. "Learning ZBLL adds complexity" is a statement about it. */
const LEARN_ING =
  /\b(?:by|about|worth|for|keep|consider|considering)\s+(?:learn|study|master|memori[sz]|start|add|work)ing\b/gi;
/** "Mastering all 57 will give you speed", "learning full PLL is next": a recommendation said as a benefit. */
const GERUND = /\b(?:learn|study|master|memori[sz])ing\b[^.]{0,40}$/i;
const BENEFIT =
  /^[^.]{0,40}\b(?:will|would|can|could|should)\s+(?:help|give|improve|boost|make|speed|unlock|get you)|^[^.]{0,20}\bis\s+(?:next|the next|the best|your best|worth|key|a good|a great)/i;
const EXCUSE =
  /\b(?:not|no (?:need|point|reason|rush|hurry)|never|skip|avoid|leave|ignore|wait|later|yet|until|once|optional|can wait|hold off|instead|rather than|before)\b|n't/i;
/** After the set is named: "learn COLL once your F2L is fixed" puts it off. */
const PUT_OFF = /\b(?:later|yet|until|once|after|for now|can wait|eventually)\b/i;

/** "Focus on lookahead, since you already know full OLL": the set is named as something they have, not told to them. */
const KNOWLEDGE_CLAUSE =
  /\b(?:since|because|given|now that|already|know|knows|knew|have|has|having|though|although|while|when|if|as you|as they)\b/i;
/** "Focus on using full OLL": for a set they know, using it is the advice, not learning it. */
const USING = /\b(?:use|uses|using|apply|applying)\b/i;
/** "Focus on the 2-look sets you already know well", "work on full OLL execution": said of the set after it is named. */
const KNOWN_AFTER_SET =
  /^[^.]{0,40}\b(?:you|they)\s+(?:already\s+)?(?:know|have|use)\b|^[^.]{0,20}\balready\b|^\s+(?:execution|recognition|speed|fluency|timing|times?)\b/i;
/** "I recommend full OLL", "Your next step is full PLL": the set follows with nothing in between. */
const DIRECT =
  /\b(?:recommend|suggest|advise|(?:next|first) step is|time for|ready for|move (?:on )?to|switch to|jump (?:in)?to)\s+(?:the\s+)?$/i;
/** "Full OLL is the next thing for you": the set first, then why it is next. */
const NEXT_IS =
  /^\s+(?:is|would be|will be)\s+(?:the\s+|your\s+)?(?:next|best|right|a good|a great|worth|where to start)\b/i;

/** The set this sentence tells the person to learn, among `ids`; null when it only mentions it, or puts it off. */
function recommended(sentence: string, ids: readonly string[], known = false): string | null {
  for (const id of ids) {
    const named = TOPICS[id];
    if (!named) continue;
    for (const found of sentence.matchAll(new RegExp(named.pattern.source, "gi"))) {
      const before = sentence.slice(Math.max(0, found.index - 60), found.index);
      const after = sentence.slice(found.index + found[0].length);
      const verb = [...before.matchAll(LEARN_BASE), ...before.matchAll(LEARN_ING)]
        .sort((a, b) => a.index! - b.index!)
        .at(-1);
      const direct = DIRECT.exec(before);
      if (!verb && !direct) {
        if (
          ((GERUND.test(before) && BENEFIT.test(after)) ||
            (!before.trim() && NEXT_IS.test(after))) &&
          !PUT_OFF.test(after)
        )
          return id;
        continue;
      }
      const at = (verb ?? direct)!.index!;
      // What sits between the verb and the set: a clause about what they know is not advice to learn it.
      const between = before.slice(at + (verb ?? direct)![0].length);
      if (
        KNOWLEDGE_CLAUSE.test(between) ||
        (known && (USING.test(between) || KNOWN_AFTER_SET.test(after)))
      )
        continue;
      const from = Math.max(0, found.index - 60 + at - 30);
      const window = sentence.slice(from, found.index);
      if (!EXCUSE.test(window) && !PUT_OFF.test(after)) return id;
    }
  }
  return null;
}

/** Whether `text` names this set (the person's own words, to see if they asked about it). */
function names(text: string, id: string): boolean {
  const named = TOPICS[id];
  return named ? named.pattern.test(text) : false;
}

export interface AdviceResult {
  text: string;
  /** What was taken out, e.g. "known: oll". */
  removed: string[];
}

/**
 * Replaces any sentence that tells the person to learn a set they already
 * know, or one their level says to leave alone, with a plain statement of
 * why not.
 */
export function guardAdvice(text: string, facts: SetFacts): AdviceResult {
  const removed: string[] = [];
  const kept: string[] = [];
  let changed = false;
  for (const sentence of sentencesOf(text)) {
    // A question ("When should I learn full OLL?") is one they may ask, not advice.
    if (/\?\s*$/.test(sentence)) {
      kept.push(sentence);
      continue;
    }
    const known = recommended(sentence, facts.knownSets, true);
    const alone = known ? null : recommended(sentence, facts.leaveAloneSets);
    const slip = known ?? alone;
    if (!slip) {
      kept.push(sentence);
      continue;
    }
    changed = true;
    removed.push(`${known ? "known" : "leave alone"}: ${slip}`);
    const said = known
      ? `You already know ${TOPICS[slip]!.name}, so there is nothing new to learn there.`
      : `${TOPICS[slip]!.name} can wait at your level.`;
    if (!kept.includes(said)) kept.push(said);
  }
  return { text: changed ? kept.join(" ") : text, removed };
}

/** The refs ("pack:oll-algorithms") that teach a set the person knows or should leave alone: left out of what the coach may point to. */
export function taughtRefs(facts: SetFacts): Set<string> {
  return new Set(
    [...facts.knownSets, ...facts.leaveAloneSets].flatMap((id) => TOPICS[id]?.teaches ?? []),
  );
}

/**
 * Refs that teach a set the person already knows, or that point at a set
 * their level says to leave alone (unless their own question named it). A
 * known set's page in the algorithm bank stays: it is where cases are looked up.
 */
export function refSlips(
  refs: readonly { kind: string; id: string }[],
  facts: SetFacts,
  asked = "",
): { kept: { kind: string; id: string }[]; removed: string[] } {
  const known = new Set(facts.knownSets.flatMap((id) => TOPICS[id]?.teaches ?? []));
  const alone = new Set(
    facts.leaveAloneSets
      .filter((id) => !names(asked, id))
      .flatMap((id) => [...(TOPICS[id]?.teaches ?? []), ...(TOPICS[id]?.page ?? [])]),
  );
  const kept: { kind: string; id: string }[] = [];
  const removed: string[] = [];
  for (const ref of refs) {
    const key = `${ref.kind}:${ref.id}`;
    if (known.has(key)) removed.push(`known: ${ref.id}`);
    else if (alone.has(key)) removed.push(`leave alone: ${ref.id}`);
    else kept.push({ kind: ref.kind, id: ref.id });
  }
  return { kept, removed };
}

// ---------------------------------------------------------------------------
// All of it, on one text
// ---------------------------------------------------------------------------

export interface GuardedText {
  text: string;
  /** Numbers taken out because no data backs them. */
  ungrounded: string[];
  /** Kind words changed, as "lesson → pack: first-lookahead". */
  kindFixes: string[];
  /** Sentences replaced for advising a known or leave-alone set. */
  badAdvice: string[];
}

/** What the person sees when every sentence of a reply had to go. */
export const NOTHING_LEFT =
  "I can't answer that reliably from your data. Ask me about one part of your solve, such as F2L or OLL, and I will use your numbers.";

/** The "[pack]" the catalogue puts after each title: a model copies it into its prose ("using pack cross-into-f2l [pack]"). */
const KIND_TAG = /\s*\[(?:pack|lesson|drill|test|set|unit)\]/gi;

interface IdIndex {
  /** Lower-case id, or its words ("pair recognition"), to its entries (a pack and a set can share one). */
  byId: Map<string, CatalogueEntry[]>;
  /** An optional determiner, then an id, or its words in title case before a kind word ("Pair Recognition pack"). */
  pattern: RegExp;
}

const idIndexes = new WeakMap<readonly CatalogueEntry[], IdIndex>();

function idIndex(catalogue: readonly CatalogueEntry[]): IdIndex {
  const cached = idIndexes.get(catalogue);
  if (cached) return cached;
  const byId = new Map<string, CatalogueEntry[]>();
  const add = (key: string, entry: CatalogueEntry) =>
    byId.set(key, [...(byId.get(key) ?? []), entry]);
  for (const entry of catalogue) {
    // Only ids written like ids ("f2l-efficiency", "cross_only"): a plain word ("lookahead") is as often the topic.
    if (!/[-_]/.test(entry.id)) continue;
    add(entry.id.toLowerCase(), entry);
    add(entry.id.toLowerCase().replace(/[-_]+/g, " "), entry);
  }
  const longest = (keys: string[]) =>
    keys.sort((a, b) => b.length - a.length).map((key) => escapeRegExp(key).replace(/ /g, "\\s+"));
  const ids = longest([...byId.keys()].filter((key) => !key.includes(" ")));
  const words = longest([...byId.keys()].filter((key) => key.includes(" ")));
  const pattern = new RegExp(
    `(\\b(?:the|a|an|your|this)\\s+)?(?<![\\w-])(?:(${ids.join("|")})|(${words.join("|")})(?=['"’”)]?\\s+(?:${KIND_WORD})\\b))(?![\\w-])`,
    "gi",
  );
  const built = { byId, pattern };
  idIndexes.set(catalogue, built);
  return built;
}

/** "Pair Recognition", "Last Pair into OLL": an id's words capitalised as a name, not "pair recognition" in a sentence. */
const titleCased = (words: string) => !/^[a-z]|\s[a-z]\S*$/.test(words);

/**
 * The catalogue's ids written in prose ("take the cross_only test") become
 * their titles ("take the Cross test"), and its "[kind]" tags go: ids belong
 * in refs, never in what the person reads. The word after an id picks between
 * entries that share it; a title that ends in that word ("Cross test"), starts
 * with its own determiner ("Your first lookahead") or was copied after the id
 * ("turning-calm: Calm is faster than hard") isn't doubled. An id's words
 * capitalised as a name before a kind word ("the Pair Recognition pack") are
 * read as the id too.
 */
export function idsToTitles(text: string, catalogue: readonly CatalogueEntry[]): string {
  const { byId, pattern } = idIndex(catalogue);
  const source = text.replace(KIND_TAG, "");
  let out = "";
  let from = 0;
  pattern.lastIndex = 0;
  for (let found = pattern.exec(source); found; found = pattern.exec(source)) {
    const [whole, lead = "", id, spaced] = found;
    if (spaced && !titleCased(spaced)) continue;
    const entries = byId.get((id ?? spaced!).toLowerCase().replace(/\s+/g, " "))!;
    let end = found.index + whole.length;
    let entry = entries.find((one) =>
      new RegExp(`^:\\s*${escapeRegExp(one.title)}(?![\\w-])`, "i").test(source.slice(end)),
    );
    if (entry) end += /^:\s*/.exec(source.slice(end))![0].length + entry.title.length;
    // The word after it, maybe past a closing quote: "the 'cross_only' test".
    const next = /^(['"’”)]?)\s+([a-z]+)\b/i.exec(source.slice(end));
    const word = next?.[2]!.toLowerCase();
    entry ??=
      entries.find((one) => one.kind === word) ??
      entries.reduce((short, one) => (one.title.length < short.title.length ? one : short));
    let title = entry.title;
    if (next && title.toLowerCase().endsWith(` ${word}`)) {
      title += next[1];
      end += next[0].length;
    }
    out += source.slice(from, found.index);
    out += (/^(?:the|a|an|your)\s/i.test(title) ? "" : lead) + title;
    from = end;
    pattern.lastIndex = end;
  }
  return out + source.slice(from);
}

/**
 * While a reply streams, a word at the very end may be the start of an id
 * ("the f2l-eff"): it waits for the rest, so a half id never shows.
 */
export function holdPartialId(text: string, catalogue: readonly CatalogueEntry[]): string {
  const tail = /[\w-]+$/.exec(text)?.[0];
  if (!tail) return text;
  const key = tail.toLowerCase();
  const { byId } = idIndex(catalogue);
  if (byId.has(key) || ![...byId.keys()].some((id) => id.startsWith(key))) return text;
  return text.slice(0, -tail.length);
}

/** Advice first (it adds only plain sentences), then numbers, then kind words; the catalogue's "[kind]" tags are never shown. */
export function guardText(
  text: string,
  catalogue: readonly CatalogueEntry[],
  check: ReplyCheck,
): GuardedText {
  const advice = guardAdvice(text.replace(KIND_TAG, ""), check);
  const numbers = groundNumbers(advice.text, check);
  const kinds = fixKindWords(numbers.text, catalogue);
  return {
    text: kinds.text,
    ungrounded: numbers.removed,
    kindFixes: kinds.fixes,
    badAdvice: advice.removed,
  };
}
