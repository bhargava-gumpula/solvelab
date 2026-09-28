import type { TestId } from "@/data/exercises";
import type { AspectId } from "@/lib/coach/aspects";

/** A link to where the idea comes from. Same shape as the coach's tips. */
export interface TrainingSource {
  label: string;
  url: string;
}

/**
 * A piece of teaching. Lessons explain how something works and why it is slow;
 * they are meant to be read once and understood, not repeated.
 */
export interface PackLesson {
  id: string;
  title: string;
  /** The one thing to walk away with. */
  takeaway: string;
  minutes: number;
  /** The lesson itself, one paragraph per entry. */
  body: string[];
  /** Optional worked example: a case, the moves, and what to notice. */
  examples?: PackExample[];
  /** How you know you have it. */
  checkpoint?: string;
}

/**
 * A question that checks the lesson went in: it asks about the idea, not
 * about the wording, and says why the answer is right.
 */
export interface LessonQuiz {
  question: string;
  /** Three or four options. */
  options: string[];
  /** Index of the right option. */
  answer: number;
  /** Why it's right, shown after answering either way. */
  why: string;
}

export interface PackExample {
  label: string;
  /** Cube notation; a unit test checks it parses. */
  moves?: string;
  /**
   * The algorithm bank case these moves solve. When set, a unit test checks the
   * moves are one of that case's verified algorithms, so a lesson can't quote a
   * wrong one.
   */
  caseId?: string;
  /**
   * The slot these moves put a pair into. When set, a unit test checks the
   * moves touch only that slot and the top layer.
   */
  slot?: "FR" | "FL" | "BR" | "BL";
  note: string;
}

/**
 * A drill is practice with a rule attached. The rule is the point: it forces
 * the skill the lesson describes, which ordinary solving lets you avoid.
 */
export interface PackDrill {
  id: string;
  title: string;
  /** What the rule is for. */
  purpose: string;
  /** How to run it. */
  rules: string[];
  /** How much of it, and for how long. */
  dose: string;
  /** What improvement looks like, so you can tell it is working. */
  signal: string;
  /** A test whose scrambles and timer this drill can borrow, when one fits. */
  exerciseId?: TestId;
}

interface PackBase {
  id: string;
  title: string;
  /** One line for the card. */
  summary: string;
  /** Roughly where this pack starts to matter, as milestone ids. */
  levels: string[];
  /** Why this part is usually slow — the diagnosis, before any advice. */
  why: string;
  lessons: PackLesson[];
  drills: PackDrill[];
  /** Things people do that keep this part slow. */
  mistakes: string[];
  sources: TrainingSource[];
}

/** A pack about one part of the solve profile: these are what the profile recommends. */
export interface AspectPack extends PackBase {
  aspectId: AspectId;
}

/** A pack written for a stretch of the road rather than one part of the solve. */
export interface LevelPack extends PackBase {
  aspectId?: never;
}

export type TrainingPack = AspectPack | LevelPack;

/** Reading time for a pack, from its lessons. */
export function packMinutes(pack: TrainingPack): number {
  return pack.lessons.reduce((total, lesson) => total + lesson.minutes, 0);
}
