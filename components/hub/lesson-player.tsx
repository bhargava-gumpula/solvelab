"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Hand,
  Lightbulb,
  PartyPopper,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { setPackItemDone } from "@/hooks/use-training-progress";
import { completeMethodLesson, useHub } from "@/hooks/use-hub";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { reshuffled, type LessonStep, type QuizStep } from "@/lib/hub/steps";
import { lessonHref } from "@/lib/hub/units";
import { cn } from "@/lib/utils";
import { CubePlayer } from "./cube-player";
import { celebrate } from "./fx";

interface LessonPlayerProps {
  unitId: string;
  unitTitle: string;
  lessonId: string;
  /** Set for pack lessons, whose progress is kept per pack. */
  packId: string | null;
  steps: LessonStep[];
  backHref: string;
  /**
   * The next lesson in the unit's full order. When your course teaches only
   * part of the unit and holds this lesson, its order takes over.
   */
  next: { href: string; title: string } | null;
  /** Where "Back to your path" goes. */
  pathHref: string;
}

const SLIDE = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 60, scale: 0.98 }),
  centre: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -60, scale: 0.98 }),
};

/**
 * A lesson, one card at a time: read, watch it on a cube, answer a question,
 * try it on your own cube. Arrow keys move between cards. The lesson is saved
 * as read once its question is answered right: a wrong answer shows why and
 * offers another go, and skipping the question leaves the lesson unread.
 */
export function LessonPlayer({
  unitId,
  unitTitle,
  lessonId,
  packId,
  steps,
  backHref,
  next,
  pathHref,
}: LessonPlayerProps) {
  const [[index, direction], setPosition] = useState<[number, number]>([0, 1]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  // How many goes each question has had, and the ones passed over.
  const [retries, setRetries] = useState<Record<number, number>>({});
  const [skipped, setSkipped] = useState<ReadonlySet<number>>(new Set());
  const saved = useRef(false);
  const shown = (position: number): LessonStep => {
    const item = steps[position]!;
    return item.kind === "quiz" ? reshuffled(item, retries[position] ?? 0) : item;
  };
  const step = shown(index);
  const last = index === steps.length - 1;
  const isRight = (position: number) => {
    const item = shown(position);
    return item.kind === "quiz" && answers[position] === item.answer;
  };
  const blocked = step.kind === "quiz" && !isRight(index) && !skipped.has(index);
  // Every question answered right: the lesson counts as read.
  const checked = steps.every((item, position) => item.kind !== "quiz" || isRight(position));
  const firstOpenQuiz = steps.findIndex(
    (item, position) => item.kind === "quiz" && !isRight(position),
  );
  const following = useCourseNext(unitId, lessonId, next);

  const go = (delta: number) => {
    const target = Math.min(steps.length - 1, Math.max(0, index + delta));
    if (target !== index) setPosition([target, delta]);
  };

  useEffect(() => {
    if (step.kind !== "done" || !checked || saved.current) return;
    saved.current = true;
    if (packId) setPackItemDone(packId, "lesson", lessonId, true);
    else completeMethodLesson(lessonId);
    // The big celebration is kept for a unit passed on its measure.
    celebrate("small");
  }, [step.kind, checked, packId, lessonId]);

  const answer = (choice: number) => {
    if (step.kind !== "quiz" || answers[index] !== undefined) return;
    setAnswers((current) => ({ ...current, [index]: choice }));
    if (choice === step.answer) celebrate("small");
  };

  /** Another go at a card's question, with the options in a new order. */
  const retryAt = (position: number) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[position];
      return next;
    });
    setRetries((current) => ({ ...current, [position]: (current[position] ?? 0) + 1 }));
    setSkipped((current) => new Set([...current].filter((item) => item !== position)));
  };
  const retry = () => retryAt(index);

  const skip = () => {
    setSkipped((current) => new Set(current).add(index));
    go(1);
  };

  useHotkeys([
    { key: "ArrowRight", run: () => !blocked && !last && go(1) },
    { key: "ArrowLeft", run: () => go(-1) },
    ...[1, 2, 3, 4].map((number) => ({ key: String(number), run: () => answer(number - 1) })),
  ]);

  const progress = (index + 1) / steps.length;

  return (
    <div
      className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-2xl flex-col"
      data-testid="lesson-player"
    >
      <div className="mb-5 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" className="rounded-full">
          <Link href={backHref} aria-label={`Close lesson, back to ${unitTitle}`}>
            <X />
          </Link>
        </Button>
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={index + 1}
        >
          <motion.div
            className="h-full rounded-full bg-primary shadow-[0_0_16px_var(--glow)]"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          />
        </div>
        <span className="tabular text-xs text-muted-foreground" data-testid="lesson-step-count">
          {index + 1}/{steps.length}
        </span>
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={index}
            custom={direction}
            variants={SLIDE}
            initial="enter"
            animate="centre"
            exit="exit"
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="rounded-3xl p-6 glass md:p-8"
            data-testid={`lesson-step-${step.kind}`}
          >
            <StepBody
              step={step}
              chosen={answers[index]}
              onAnswer={answer}
              onRetry={retry}
              onSkip={skip}
              checked={checked}
              onBackToQuestion={() => {
                retryAt(firstOpenQuiz);
                setPosition([firstOpenQuiz, -1]);
              }}
              unitTitle={unitTitle}
            />
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-24 z-20 mt-6 flex items-center justify-between gap-3 rounded-full p-1.5 glass md:bottom-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="rounded-full"
        >
          <ArrowLeft /> Back
        </Button>
        {last ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href={pathHref}>Your path</Link>
            </Button>
            {following ? (
              <Button asChild size="lg" className="rounded-full" data-testid="next-lesson">
                <Link href={following.href}>
                  Next lesson <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="rounded-full">
                <Link href={backHref}>
                  Finish unit <Trophy />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <motion.div whileTap={{ scale: 0.96 }}>
            <Button
              size="lg"
              onClick={() => go(1)}
              disabled={blocked}
              className="rounded-full px-8"
              data-testid="lesson-continue"
            >
              {step.kind === "intro" ? "Start" : "Continue"} <ArrowRight />
            </Button>
          </motion.div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        Card {index + 1} of {steps.length} in {unitId}
      </p>
    </div>
  );
}

/**
 * The lesson after this one. A course can teach only part of a unit, so when
 * your course holds this lesson its order decides; otherwise the unit's own.
 */
function useCourseNext(
  unitId: string,
  lessonId: string,
  fallback: LessonPlayerProps["next"],
): LessonPlayerProps["next"] {
  const { current } = useHub();
  const lessons = current?.units.find((state) => state.unit.id === unitId)?.unit.lessons;
  const position = lessons?.findIndex((lesson) => lesson.id === lessonId) ?? -1;
  if (!lessons || position < 0) return fallback;
  const next = lessons[position + 1];
  return next ? { href: lessonHref(unitId, next.id), title: next.title } : null;
}

function StepBody({
  step,
  chosen,
  onAnswer,
  onRetry,
  onSkip,
  checked,
  onBackToQuestion,
  unitTitle,
}: {
  step: LessonStep;
  chosen: number | undefined;
  onAnswer: (choice: number) => void;
  onRetry: () => void;
  onSkip: () => void;
  /** Every question in the lesson is answered right. */
  checked: boolean;
  onBackToQuestion: () => void;
  unitTitle: string;
}) {
  switch (step.kind) {
    case "intro":
      return (
        <div className="grid gap-5 text-center">
          <motion.span
            className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_40px_-8px_var(--glow)]"
            initial={{ rotate: -12, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 12 }}
          >
            <BookOpen className="size-8" />
          </motion.span>
          <p className="eyebrow text-primary">{unitTitle}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{step.title}</h1>
          <div className="mx-auto max-w-lg rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left">
            <p className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Lightbulb className="size-4" /> The one thing to walk away with
            </p>
            <p className="mt-1.5 leading-relaxed">{step.takeaway}</p>
          </div>
          <p className="text-sm text-muted-foreground">About {step.minutes} min</p>
        </div>
      );
    case "read":
      return (
        <div className="grid gap-4">
          <p className="eyebrow">
            {step.heading ?? "Read"} · {step.index + 1} of {step.of}
          </p>
          <p className="text-lg leading-relaxed text-pretty md:text-xl">{step.text}</p>
        </div>
      );
    case "watch":
      return (
        <div className="grid gap-4">
          <p className="flex items-center gap-2 eyebrow text-primary">
            <PlayCircle className="size-4" /> Watch it
          </p>
          <h2 className="text-xl font-semibold">{step.label}</h2>
          <CubePlayer moves={step.moves} caseKind={step.caseKind} />
          <p className="font-mono text-sm tracking-wide">{step.moves}</p>
          <p className="leading-relaxed text-muted-foreground">{step.note}</p>
        </div>
      );
    case "example":
      return (
        <div className="grid gap-3">
          <p className="flex items-center gap-2 eyebrow text-primary">
            <Sparkles className="size-4" /> Example
          </p>
          <h2 className="text-xl font-semibold">{step.label}</h2>
          <p className="text-lg leading-relaxed">{step.note}</p>
        </div>
      );
    case "quiz":
      return (
        <Quiz step={step} chosen={chosen} onAnswer={onAnswer} onRetry={onRetry} onSkip={onSkip} />
      );
    case "try":
      return (
        <div className="grid gap-4 text-center">
          <motion.span
            className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary"
            animate={{ rotate: [0, -10, 10, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.6 }}
          >
            <Hand className="size-8" />
          </motion.span>
          <p className="eyebrow text-primary">Try it on your cube</p>
          <p className="text-lg leading-relaxed text-balance">{step.prompt}</p>
          <p className="text-sm text-muted-foreground">
            Pick up your cube and check before moving on. Nothing is timed here.
          </p>
        </div>
      );
    case "done":
      if (!checked) {
        return (
          <div className="grid gap-5 text-center" data-testid="lesson-unchecked">
            <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-muted text-muted-foreground">
              <Lightbulb className="size-10" />
            </span>
            <h2 className="text-3xl font-semibold tracking-tight">One question to go</h2>
            <p className="mx-auto max-w-md leading-relaxed text-muted-foreground">
              The lesson counts as read once its question is answered right. It takes a moment, and
              the answer is in what you just read.
            </p>
            <div>
              <Button
                size="lg"
                className="rounded-full"
                onClick={onBackToQuestion}
                data-testid="back-to-question"
              >
                <RotateCcw /> Back to the question
              </Button>
            </div>
          </div>
        );
      }
      return (
        <div className="grid gap-5 text-center">
          <motion.span
            className="mx-auto grid size-20 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-[0_0_60px_-6px_var(--glow)]"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          >
            <PartyPopper className="size-10" />
          </motion.span>
          <h2 className="text-3xl font-semibold tracking-tight">Lesson complete</h2>
          <p className="mx-auto max-w-md leading-relaxed text-muted-foreground">{step.takeaway}</p>
        </div>
      );
  }
}

function Quiz({
  step,
  chosen,
  onAnswer,
  onRetry,
  onSkip,
}: {
  step: QuizStep;
  chosen: number | undefined;
  onAnswer: (choice: number) => void;
  onRetry: () => void;
  onSkip: () => void;
}) {
  const answered = chosen !== undefined;
  const right = chosen === step.answer;
  // After a wrong answer the right one stays hidden, so another go means something.
  const reveal = answered && right;
  return (
    <div className="grid gap-4">
      <p className="eyebrow text-primary">Quick check</p>
      <h2 className="text-xl font-semibold text-balance">{step.question}</h2>
      <div className="grid gap-2.5">
        {step.options.map((option, choice) => {
          const isAnswer = choice === step.answer;
          const isChosen = choice === chosen;
          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => onAnswer(choice)}
              disabled={answered}
              data-testid={`quiz-option-${choice}`}
              data-correct={isAnswer ? "true" : undefined}
              whileHover={answered ? undefined : { scale: 1.015 }}
              whileTap={answered ? undefined : { scale: 0.98 }}
              animate={
                answered && isChosen && !isAnswer
                  ? { x: [0, -10, 10, -6, 6, 0] }
                  : reveal && isAnswer
                    ? { scale: [1, 1.04, 1] }
                    : {}
              }
              transition={{ duration: 0.45 }}
              className={cn(
                "flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left text-sm leading-relaxed transition-colors",
                !answered && "hover:border-primary/60 hover:bg-primary/5",
                reveal && isAnswer && "border-[var(--known)] bg-[var(--known)]/15",
                answered && isChosen && !isAnswer && "border-destructive bg-destructive/10",
                answered && !isChosen && !(reveal && isAnswer) && "opacity-50",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-lg border text-xs font-semibold",
                  reveal && isAnswer && "border-transparent bg-[var(--known)] text-white",
                )}
              >
                {reveal && isAnswer ? <Check className="size-3.5" /> : choice + 1}
              </span>
              {option}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl p-3 text-sm font-medium",
              right ? "bg-[var(--known)]/15" : "bg-destructive/10",
            )}
            data-testid="quiz-feedback"
          >
            <span className="block">{right ? "Exactly right." : "Not quite."}</span>
            <span className="mt-1 block font-normal">{step.explain}</span>
          </motion.p>
        ) : null}
      </AnimatePresence>
      {answered && !right ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRetry} className="rounded-full" data-testid="quiz-retry">
            <RotateCcw /> Try again
          </Button>
          <Button variant="ghost" onClick={onSkip} className="rounded-full" data-testid="quiz-skip">
            Skip for now
          </Button>
        </div>
      ) : null}
    </div>
  );
}
