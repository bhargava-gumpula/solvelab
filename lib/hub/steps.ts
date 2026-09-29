/**
 * Turns a lesson into the steps the lesson player shows one at a time: an
 * opening card, the reading split into bite-sized cards, worked examples you
 * can watch on a moving cube, a question to check it stuck, something to try
 * on your own cube, and the finish.
 */
import { lessons as METHOD_LESSONS } from "@/data/learning/lessons";
import { TRAINING_PACKS } from "@/data/training";
import { LESSON_QUIZZES } from "@/data/training/quizzes";
import type { LessonQuiz, PackExample } from "@/data/training/types";
import { ALGORITHM_SETS, kindFor } from "@/lib/algorithms/catalog";
import type { CaseKind } from "@/lib/cube/case-check";
import type { LessonContent } from "./units";

export interface QuizStep {
  kind: "quiz";
  question: string;
  options: string[];
  /** Index of the right option. */
  answer: number;
  /** Shown after answering, right or wrong. */
  explain: string;
}

export type LessonStep =
  | { kind: "intro"; title: string; takeaway: string; minutes: number }
  | { kind: "read"; heading: string | null; text: string; index: number; of: number }
  | {
      kind: "watch";
      label: string;
      moves: string;
      note: string;
      /** How the bank draws the case, when the moves solve one. */
      caseKind: CaseKind | null;
    }
  | { kind: "example"; label: string; note: string }
  | QuizStep
  | { kind: "try"; prompt: string }
  | { kind: "done"; takeaway: string };

/** A small stable hash, so a lesson's quiz is the same on every visit. */
function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * "Which of these is this lesson's point?", with the other options taken from
 * other lessons. Telling your lesson's idea apart from neighbouring ones is a
 * real check that it went in, and it needs no extra writing per lesson.
 */
export function recallQuiz(key: string, correct: string, pool: readonly string[]): QuizStep {
  const others = [...new Set(pool.filter((item) => item !== correct))]
    .map((item) => ({ item, order: hash(`${key}|${item}`) }))
    .sort((a, b) => a.order - b.order)
    .slice(0, 3)
    .map(({ item }) => item);
  const answer = hash(key) % (others.length + 1);
  const options = [...others];
  options.splice(answer, 0, correct);
  return {
    kind: "quiz",
    question: "Which of these is the big idea of this lesson?",
    options,
    answer,
    explain: correct,
  };
}

/**
 * A lesson's written questions, with the options in a stable shuffled order so
 * the right answer isn't always in the same place.
 */
export function writtenQuizzes(lessonId: string): QuizStep[] {
  return (LESSON_QUIZZES[lessonId] ?? []).map((quiz: LessonQuiz, index) => {
    const order = quiz.options
      .map((option, position) => ({ position, key: hash(`${lessonId}|${index}|${option}`) }))
      .sort((a, b) => a.key - b.key)
      .map(({ position }) => position);
    return {
      kind: "quiz",
      question: quiz.question,
      options: order.map((position) => quiz.options[position]!),
      answer: order.indexOf(quiz.answer),
      explain: quiz.why,
    };
  });
}

/** The lesson's written questions, or a recall question when it has none. */
function quizzesFor(lessonId: string, fallback: () => QuizStep): QuizStep[] {
  const written = writtenQuizzes(lessonId);
  return written.length ? written : [fallback()];
}

const PACK_TAKEAWAYS = TRAINING_PACKS.flatMap((pack) =>
  pack.lessons.map((lesson) => lesson.takeaway),
);
const METHOD_SUMMARIES = METHOD_LESSONS.map((lesson) => lesson.summary);

/** Which set a bank case is from, so the player can grey out what doesn't matter. */
function caseKindOf(caseId: string | undefined): CaseKind | null {
  if (!caseId) return null;
  for (const set of ALGORITHM_SETS) {
    const entry = set.cases.find((item) => item.id === caseId);
    if (entry) return kindFor(set, entry);
  }
  return null;
}

/** Worked examples: played on the 3D cube when they have moves, read otherwise. */
function exampleSteps(examples: readonly PackExample[] | undefined): LessonStep[] {
  return (examples ?? []).map((example): LessonStep =>
    example.moves
      ? {
          kind: "watch",
          label: example.label,
          moves: example.moves,
          note: example.note,
          caseKind: caseKindOf(example.caseId),
        }
      : { kind: "example", label: example.label, note: example.note },
  );
}

export function lessonSteps(content: LessonContent): LessonStep[] {
  if (content.kind === "method") {
    const { lesson } = content;
    return [
      { kind: "intro", title: lesson.title, takeaway: lesson.summary, minutes: lesson.minutes },
      ...lesson.steps.map((step, index) => ({
        kind: "read" as const,
        heading: step.title,
        text: step.body,
        index,
        of: lesson.steps.length,
      })),
      ...exampleSteps(lesson.examples),
      ...quizzesFor(lesson.id, () => recallQuiz(lesson.id, lesson.summary, METHOD_SUMMARIES)),
      ...(lesson.practiceHint ? [{ kind: "try" as const, prompt: lesson.practiceHint }] : []),
      { kind: "done", takeaway: lesson.summary },
    ];
  }

  const { lesson } = content;
  return [
    { kind: "intro", title: lesson.title, takeaway: lesson.takeaway, minutes: lesson.minutes },
    ...lesson.body.map((text, index) => ({
      kind: "read" as const,
      heading: null,
      text,
      index,
      of: lesson.body.length,
    })),
    ...exampleSteps(lesson.examples),
    ...quizzesFor(lesson.id, () =>
      recallQuiz(`${content.unit.id}/${lesson.id}`, lesson.takeaway, PACK_TAKEAWAYS),
    ),
    ...(lesson.checkpoint ? [{ kind: "try" as const, prompt: lesson.checkpoint }] : []),
    { kind: "done", takeaway: lesson.takeaway },
  ];
}
