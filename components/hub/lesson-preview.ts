/*
 * Lesson previews for the Hub. The moves the live cube plays for a lesson: the
 * lesson's own worked example when it has one, else the first one in its
 * unit, else a short sequence picked for the unit's topic (a trigger for
 * finger tricks, a pair for F2L, a slow pair with a held beat for lookahead).
 * Units about practice, set-up or nerves get no moves: the Hub shows their
 * cover instead of a cube playing something unrelated. UI only; it reads the
 * lesson content, never writes.
 */
import { lessonSteps } from "@/lib/hub/steps";
import { getUnit, lessonContent } from "@/lib/hub/units";
import { parseAlgorithm } from "@/lib/cube/notation";

export interface MovePreview {
  moves: string;
  label: string;
  /** Where the moves came from, for the caption. */
  source: "lesson" | "unit" | "topic";
  /** Slow playback, for lessons about seeing rather than turning. */
  tempo?: "slow";
  /** Hold for a beat after these moves (0-based move index), shown as a gap in the strip. */
  pauseAfter?: readonly number[];
}

type Topic = Omit<MovePreview, "source">;

const TRIGGER: Topic = { moves: "R U R' U'", label: "The trigger most algorithms are made of" };
const PAIR: Topic = { moves: "U' R U' R' U R U R'", label: "A pair joined, then dropped in" };
const SUNE: Topic = { moves: "R U R' U R U2 R'", label: "Sune, in one flowing motion" };
const OLL_EDGES: Topic = { moves: "F R U R' U' F'", label: "Edges first: F, the trigger, F'" };
const T_PERM: Topic = {
  moves: "R U R' U' R' F R2 U' R' U' R U R' F'",
  label: "The T-perm at full speed",
};
const SLOW_PAIR: Topic = {
  moves: "U R U' R' U' F' U F",
  label: "A slow pair: eyes on the next piece during the pause",
  tempo: "slow",
  pauseAfter: [3],
};

/** A sequence that shows what each unit is about, when its lessons have none of their own. */
const TOPICS: Partial<Record<string, Topic>> = {
  inspection: {
    moves: "D R' D' F' U' F",
    label: "A cross edge, then the pair you tracked in inspection",
    pauseAfter: [2],
  },
  "cross-into-f2l": {
    moves: "R' D' R U R U' R'",
    label: "The last cross edge flowing straight into the first pair",
  },
  "f2l-efficiency": PAIR,
  "pair-recognition": { moves: "R U2 R' U' R U R'", label: "Both pieces on top, one case" },
  lookahead: SLOW_PAIR,
  "first-lookahead": SLOW_PAIR,
  "past-the-first-pair": {
    moves: "R U' R' U F' U F",
    label: "Two pairs in one look",
    pauseAfter: [2],
  },
  "last-pair-into-oll": {
    moves: "U R U' R' F R U R' U' F'",
    label: "The last pair, then OLL without a pause",
    pauseAfter: [3],
  },
  "oll-execution": SUNE,
  "oll-algorithms": OLL_EDGES,
  "oll-into-pll": { moves: "R U2 R' U' R U' R'", label: "Antisune: read the sides as it ends" },
  "pll-execution": T_PERM,
  "pll-algorithms": { moves: "R U' R U R U R U' R' U' R2", label: "Ua perm: three edges cycle" },
  "two-look-pll": { moves: "R' F R' B2 R F' R' B2 R2", label: "Corners: the A-perm" },
  "turning-technique": TRIGGER,
  "speed-you-can-use": { moves: "R U R' U' R U R' U'", label: "The trigger, twice, at speed" },
  "choosing-the-next-pair": { moves: "U R U' R'", label: "A free pair: four moves" },
  "auf-both-ends": { moves: "U R U R' U R U2 R' U", label: "Sune with a turn before and after" },
  "xcross-properly": { moves: "R' D' R D F' D F", label: "Cross edge and pair in one go" },
  "last-layer-at-the-top": SUNE,
  "method-beginner": TRIGGER,
  "method-cfop": OLL_EDGES,
  "method-advanced": PAIR,
};

function watchMoves(unitId: string, lessonId: string): { moves: string; label: string } | null {
  const content = lessonContent(unitId, lessonId);
  if (!content) return null;
  for (const step of lessonSteps(content)) {
    if (step.kind === "watch" && parseAlgorithm(step.moves).ok) {
      return { moves: step.moves, label: step.label };
    }
  }
  return null;
}

/** What the lesson cube plays for a lesson, or null when the unit is not about turning. */
export function previewMoves(unitId: string, lessonId: string): MovePreview | null {
  const own = watchMoves(unitId, lessonId);
  if (own) return { ...own, source: "lesson" };
  for (const lesson of getUnit(unitId)?.lessons ?? []) {
    const found = watchMoves(unitId, lesson.id);
    if (found) return { ...found, source: "unit" };
  }
  const topic = TOPICS[unitId];
  return topic ? { ...topic, source: "topic" } : null;
}

/*
 * Moves named in a lesson's own words. A run of three or more moves in a row
 * ("R U R′ U′", "(U R U′ R′ U′ F′ U F / mirror)") is played as written; a
 * sentence naming two or more different moves ("U and U′ with the index
 * fingers, R and R′ …") gets the unit's own sequence. Anything else (a lone
 * "D layer", an "L-shape") gets no cube.
 */
const MOVE_TOKEN = /^[RLUDFB]w?[2']?$/;

export function movesInText(
  text: string,
  unitId: string,
  lessonId: string,
): { moves: string; label: string; own: boolean } | null {
  const words = text.replace(/[′’]/g, "'").split(/\s+/);
  let best: string[] = [];
  let run: string[] = [];
  const named = new Set<string>();
  const end = () => {
    if (run.length > best.length) best = run;
    run = [];
  };
  for (const raw of words) {
    const lead = /^[(“"]*/.exec(raw)![0];
    const trail = /[).,;:!?”"]*$/.exec(raw)![0];
    const core = raw.slice(lead.length, raw.length - trail.length || undefined);
    if (!MOVE_TOKEN.test(core)) {
      end();
      continue;
    }
    named.add(core);
    if (lead) end();
    run.push(core);
    if (trail) end();
  }
  end();
  if (best.length >= 3) {
    const moves = best.join(" ");
    if (parseAlgorithm(moves).ok) return { moves, label: "As written", own: true };
  }
  if (named.size >= 2) {
    const preview = previewMoves(unitId, lessonId);
    if (preview) return { moves: preview.moves, label: preview.label, own: false };
  }
  return null;
}

/** The one thing to walk away with from a lesson, for hover previews and flip cards. */
export function lessonTakeaway(unitId: string, lessonId: string): string | null {
  const content = lessonContent(unitId, lessonId);
  if (!content) return null;
  return content.kind === "pack" ? content.lesson.takeaway : content.lesson.summary;
}
