"use client";

/*
 * The pocket check, now the other side of the Next up card: one question from
 * the lesson you're about to read (a guess before you read helps it stick),
 * else from one you've read. The front shows the question as a teaser; "Guess"
 * turns the card's text over to the options; pick one and the right answer
 * fills blue with the explanation underneath. Focus follows every turn.
 */
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { EASE_OUT_EXPO } from "@/components/fx/reveal";
import type { CourseState } from "@/lib/hub/path";
import { lessonSteps, type QuizStep } from "@/lib/hub/steps";
import { lessonContent, lessonHref } from "@/lib/hub/units";
import { cn } from "@/lib/utils";
import { rememberGuess } from "./guess-memory";

export interface PocketQuestion {
  unitId: string;
  lessonId: string;
  lessonTitle: string;
  read: boolean;
  quiz: QuizStep;
}

function quizzesOf(unitId: string, lessonId: string, read: boolean): PocketQuestion[] {
  const content = lessonContent(unitId, lessonId);
  if (!content) return [];
  return lessonSteps(content)
    .filter((step): step is QuizStep => step.kind === "quiz")
    .map((quiz) => ({ unitId, lessonId, lessonTitle: content.lesson.title, read, quiz }));
}

/** The next lesson's questions first (a guess), then ones from lessons you've read. */
export function usePocketQuestions(state: CourseState): PocketQuestion[] {
  return useMemo(() => {
    const found: PocketQuestion[] = [];
    if (state.next) found.push(...quizzesOf(state.next.unit.unit.id, state.next.lessonId, false));
    for (const unit of state.units)
      for (const lesson of unit.unit.lessons)
        if (unit.isLessonDone(lesson.id)) found.push(...quizzesOf(unit.unit.id, lesson.id, true));
    return found;
  }, [state]);
}

const LETTERS = ["A", "B", "C", "D", "E"];

export const pocketEyebrow = (question: PocketQuestion) =>
  question.read ? "Quick check" : "Before you read, a guess";

/** The question side: options, then the answer and why, in place. */
export function PocketFace({
  question,
  hasMore,
  onAnother,
  onBack,
}: {
  question: PocketQuestion;
  hasMore: boolean;
  onAnother: () => void;
  onBack: () => void;
}) {
  const { quiz } = question;
  const [chosen, setChosen] = useState<number | null>(null);
  const after = useRef<HTMLButtonElement>(null);
  const right = chosen === quiz.answer;

  const answer = (choice: number) => {
    if (chosen !== null) return;
    setChosen(choice);
    // A guess before reading: the lesson's Quick check calls back to it.
    if (!question.read) rememberGuess(question.lessonId, quiz.question, choice);
    window.setTimeout(() => after.current?.focus({ preventScroll: true }), 520);
  };

  return (
    <div className="flex h-full flex-col" data-testid="pocket-check">
      <p className="eyebrow">
        <span className="text-primary">{pocketEyebrow(question)}</span> ·{" "}
        <span className="text-foreground">{question.lessonTitle}</span>
      </p>
      <h3 className="mt-2 font-display text-[1.5rem] leading-[1.1] text-balance md:text-[1.65rem]">
        {quiz.question}
      </h3>
      <div className="mt-4 grid gap-1.5" role="group" aria-label="Answers">
        {quiz.options.map((option, choice) => {
          const isChosen = chosen === choice;
          const isAnswer = choice === quiz.answer;
          return (
            <motion.button
              key={option}
              type="button"
              data-first-option={choice === 0 || undefined}
              onClick={() => answer(choice)}
              disabled={chosen !== null}
              animate={
                isChosen && !isAnswer
                  ? { x: [0, -7, 7, -4, 4, 0] }
                  : isChosen
                    ? { scale: [1, 1.02, 1] }
                    : {}
              }
              transition={{ duration: 0.42 }}
              className={cn(
                "pocket-option group relative flex items-start gap-3 overflow-hidden rounded-xl border px-3 py-2 text-left text-[13.5px] leading-snug transition-[border-color,opacity] duration-200",
                chosen === null &&
                  "border-[var(--hairline)] hover:border-foreground/30 hover:bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)]",
                chosen !== null && isAnswer && "border-primary",
                isChosen && !isAnswer && "border-foreground/50",
                chosen !== null && !isAnswer && !isChosen && "opacity-45",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "pocket-sweep absolute inset-0 origin-left bg-primary/10",
                  chosen !== null && isAnswer ? "scale-x-100" : "scale-x-0",
                )}
              />
              <span
                className={cn(
                  "relative grid size-5 shrink-0 place-items-center rounded-md border text-[10px] font-semibold transition-colors",
                  chosen !== null &&
                    isAnswer &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                {chosen !== null && isAnswer ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : isChosen ? (
                  <X className="size-3" strokeWidth={3} />
                ) : (
                  LETTERS[choice]
                )}
              </span>
              <span className="relative">{option}</span>
            </motion.button>
          );
        })}
      </div>
      <div aria-live="polite">
        <AnimatePresence initial={false}>
          {chosen !== null ? (
            <motion.p
              key="why"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.25 }}
              className="pt-3 text-sm text-pretty text-muted-foreground"
            >
              <span className={cn("font-medium", right ? "text-primary" : "text-foreground")}>
                {right ? "Exactly right. " : "Not quite. "}
              </span>
              {quiz.explain}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-sm">
        <button
          ref={after}
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to the lesson
        </button>
        {chosen !== null && hasMore ? (
          <button
            type="button"
            onClick={onAnother}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> Another
          </button>
        ) : null}
        {chosen !== null && question.read ? (
          <Link
            href={lessonHref(question.unitId, question.lessonId)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Read it again <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
