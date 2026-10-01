"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useIsPresent,
  useMotionValue,
  usePresenceData,
  useTransform,
  type PanInfo,
} from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Hand,
  Lightbulb,
  RotateCcw,
  PlayCircle,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { Magnetic } from "@/components/fx/magnetic";
import { EASE_OUT_EXPO, RevealText } from "@/components/fx/reveal";
import { Button } from "@/components/ui/button";
import { setPackItemDone } from "@/hooks/use-training-progress";
import { completeMethodLesson, useHub } from "@/hooks/use-hub";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { reshuffled, type LessonStep, type QuizStep } from "@/lib/hub/steps";
import { lessonHref } from "@/lib/hub/units";
import { cn } from "@/lib/utils";
import { Burst } from "./burst";
import { CubePlayer } from "./cube-player";
import { celebrate } from "./fx";
import { recallGuess } from "./guess-memory";
import { LessonCube } from "./lesson-cube";
import { movesInText } from "./lesson-preview";

interface LessonPlayerProps {
  unitId: string;
  unitTitle: string;
  lessonId: string;
  /** Set for pack lessons, whose progress is kept per pack. */
  packId: string | null;
  steps: LessonStep[];
  backHref: string;
  next: { href: string; title: string } | null;
  /** Where "Back to your path" goes. */
  pathHref: string;
}

/*
 * Forward, the top card is turned off the pile and the sheet beneath (already
 * written on, fully opaque) rises into its place, so the text crossfades and
 * the card is never blank. Back, the card you left slides back over from the
 * left while this one sinks into the pile. A card leans with its own sideways
 * travel, so a flick tips it like paper.
 */
const CARD = {
  enter: (direction: number) =>
    direction > 0
      ? { opacity: 1, y: 11, scale: 0.968, x: 0 }
      : { opacity: 0, x: -90, y: 0, scale: 1 },
  centre: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: (direction: number) =>
    direction > 0
      ? { opacity: 0, x: -150, y: 0, scale: 1 }
      : { opacity: 0, y: 11, scale: 0.968, x: 0 },
};

const KIND_LABEL: Record<LessonStep["kind"], string> = {
  intro: "Opening",
  read: "Read",
  watch: "Watch",
  example: "Example",
  quiz: "Quick check",
  try: "Try it",
  done: "Done",
};

/**
 * A lesson, one card at a time, from a small pile: read, watch it on a cube,
 * answer a question, try it on your own cube, and finish. Move with Continue,
 * the arrow keys, by flicking the card sideways, or by jumping back along the
 * card track at the top. The lesson is saved as read once its question is
 * answered right: a wrong answer shows why and offers another go, and skipping
 * the question leaves the lesson unread.
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
  const { reducedMotion } = useAppearance();
  const [[index, direction], setPosition] = useState<[number, number]>([0, 1]);
  const [reached, setReached] = useState(0);
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

  const goTo = (target: number) => {
    const clamped = Math.min(steps.length - 1, Math.max(0, target));
    if (clamped === index) return;
    setPosition([clamped, clamped > index ? 1 : -1]);
    setReached((value) => Math.max(value, clamped));
  };
  const go = (delta: number) => {
    if (delta > 0 && (blocked || last)) return;
    goTo(index + delta);
  };

  useEffect(() => {
    if (step.kind !== "done" || !checked || saved.current) return;
    saved.current = true;
    if (packId) setPackItemDone(packId, "lesson", lessonId, true);
    else completeMethodLesson(lessonId);
    // The big celebration is kept for a unit passed on its measure; a lesson
    // ends with the ring's own small burst.
    celebrate("small");
  }, [step.kind, checked, packId, lessonId]);

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

  const answer = (choice: number) => {
    if (step.kind !== "quiz" || answers[index] !== undefined) return;
    if (choice >= step.options.length) return;
    setAnswers((current) => ({ ...current, [index]: choice }));
  };

  // Arrow keys inside something with its own keys (a cube's move strip) stay there.
  const ownKeys = (event: KeyboardEvent) =>
    event.target instanceof Element && Boolean(event.target.closest("[data-own-keys]"));
  useHotkeys([
    { key: "ArrowRight", run: (event) => !ownKeys(event) && go(1) },
    { key: "ArrowLeft", run: (event) => !ownKeys(event) && go(-1) },
    ...[1, 2, 3, 4].map((number) => ({ key: String(number), run: () => answer(number - 1) })),
  ]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const flick = info.offset.x + info.velocity.x * 0.2;
    if (flick < -110) go(1);
    else if (flick > 110) go(-1);
  };
  // Cards with their own gestures (the cube player, the question) don't flick.
  const draggable = !reducedMotion && step.kind !== "watch" && !blocked;
  const ahead = Math.min(2, steps.length - 1 - index);
  // The pile's sheets are as tall as the card on top, so none pokes out below a short card.
  const stack = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  useEffect(() => {
    const node = stack.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setCardHeight(Math.round(entry.contentRect.height));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-[44rem] flex-col md:justify-center"
      data-testid="lesson-player"
    >
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" className="rounded-full">
          <Link href={backHref} aria-label={`Close lesson, back to ${unitTitle}`}>
            <X />
          </Link>
        </Button>
        <nav aria-label="Lesson cards" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1">
            {steps.map((entry, at) => {
              const seen = at <= reached;
              const here = at === index;
              return (
                <li key={at} className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => seen && goTo(at)}
                    disabled={!seen || here}
                    aria-current={here ? "step" : undefined}
                    aria-label={`Card ${at + 1} of ${steps.length}: ${KIND_LABEL[entry.kind]}${seen ? "" : " (not reached yet)"}`}
                    className="group block w-full py-2 disabled:cursor-default"
                  >
                    <span className="relative block h-[5px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_26%,transparent)]">
                      <motion.span
                        className={cn(
                          "absolute inset-0 origin-left rounded-full",
                          here ? "bg-primary" : "bg-foreground/70 group-hover:bg-foreground",
                        )}
                        initial={false}
                        animate={{ scaleX: seen ? 1 : 0 }}
                        transition={{ type: "spring", stiffness: 180, damping: 26 }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <span
          className="min-w-11 text-right tabular text-[14px] font-medium whitespace-nowrap text-foreground/80"
          data-testid="lesson-step-count"
        >
          <span className="sr-only md:not-sr-only">Step </span>
          {index + 1}
          <span className="max-md:hidden"> of </span>
          <span className="md:hidden">/</span>
          {steps.length}
        </span>
      </div>

      <div className="relative max-md:flex-1">
        <div ref={stack} className="relative">
          {/* The pile underneath: one sheet edge for each card still to come (up to two). */}
          {cardHeight
            ? Array.from({ length: ahead }, (_, sheet) => (
                <motion.span
                  key={sheet}
                  aria-hidden
                  className="lesson-sheet pointer-events-none tile absolute inset-x-0 top-0"
                  initial={false}
                  animate={{ height: cardHeight }}
                  transition={{ type: "spring", stiffness: 260, damping: 32 }}
                  style={{
                    // Scaled from the bottom, so each sheet shows as a thin edge under the card.
                    transformOrigin: "50% 100%",
                    y: (sheet + 1) * 8,
                    scale: 1 - (sheet + 1) * 0.035,
                    opacity: 0.6 - sheet * 0.22,
                    zIndex: 0,
                  }}
                />
              ))
            : null}
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <Card
              key={index}
              draggable={draggable}
              onDragEnd={onDragEnd}
              testId={`lesson-step-${step.kind}`}
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
                unitId={unitId}
                lessonId={lessonId}
              />
            </Card>
          </AnimatePresence>
        </div>
      </div>

      <div className="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 mt-8 flex items-center justify-between gap-3 rounded-full p-1.5 liquid-glass md:bottom-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => go(-1)}
          disabled={index === 0}
          className={cn("rounded-full", index === 0 && "invisible")}
        >
          <ArrowLeft /> Back
        </Button>
        <p className="hidden text-[14px] font-medium text-foreground/80 md:block" aria-hidden>
          {blocked ? "Pick an answer (1–4)" : "← → or flick the card"}
        </p>
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
          <Magnetic>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                size="lg"
                onClick={() => go(1)}
                disabled={blocked}
                className="rounded-full px-8"
                data-testid="lesson-continue"
              >
                {step.kind === "intro" ? "Next" : "Continue"} <ArrowRight />
              </Button>
            </motion.div>
          </Magnetic>
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

function Card({
  ref,
  draggable,
  onDragEnd,
  testId,
  children,
}: {
  /** AnimatePresence's popLayout needs the card's node to lift the leaving card out of the flow. */
  ref?: React.Ref<HTMLElement>;
  draggable: boolean;
  onDragEnd: (event: unknown, info: PanInfo) => void;
  testId: string;
  children: React.ReactNode;
}) {
  // Each card owns its travel, so the card leaving and the one arriving never share it.
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-5, 0, 5]);
  const controls = useDragControls();
  // The latest direction, also for a card that is already leaving.
  const direction = (usePresenceData() as number | undefined) ?? 1;
  const present = useIsPresent();
  // Forward, the leaving card stays on top as it's turned away; back, it sinks under.
  const zIndex = present ? 10 : direction > 0 ? 20 : 5;
  return (
    <motion.section
      ref={ref}
      custom={direction}
      variants={CARD}
      initial="enter"
      animate="centre"
      exit="exit"
      transition={{ type: "spring", stiffness: 240, damping: 28, mass: 0.9 }}
      drag={draggable ? "x" : false}
      dragListener={false}
      dragControls={controls}
      onPointerDown={(event) => {
        // A cube on the card turns in your hand; everywhere else flicks the card.
        const target = event.target as Element;
        if (!draggable || target.closest("[data-no-flick]")) return;
        // No text selection from a flick (buttons and links still get their click).
        if (!target.closest("button, a")) event.preventDefault();
        controls.start(event);
      }}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.22}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
      style={{ x, rotate, zIndex }}
      className={cn(
        "lesson-card tile relative p-7 md:p-11",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
      data-testid={testId}
    >
      {children}
    </motion.section>
  );
}

/** A small live cube beside a card that names moves (see movesInText). */
function StepCube({ moves, label, own }: { moves: string; label: string; own: boolean }) {
  // The hint goes once the cube has been turned; the caption sits above, never under the dock.
  const [touched, setTouched] = useState(false);
  return (
    <figure
      data-no-flick
      onPointerDownCapture={() => setTouched(true)}
      className="cube-stage mx-auto w-full max-w-[17rem] rounded-[1.3rem] px-3 pt-3 pb-2 md:max-w-[15rem]"
    >
      <figcaption className="text-center text-[11px] leading-snug text-balance text-muted-foreground">
        {own ? "The moves in the text" : label}
        <span
          className={cn(
            "block text-muted-foreground/80 transition-opacity duration-300",
            touched && "opacity-0",
          )}
        >
          Drag to turn
        </span>
      </figcaption>
      <LessonCube key={moves} moves={moves} stageClassName="max-w-[10.5rem] md:max-w-[12.5rem]" />
    </figure>
  );
}

function TryHand({ small = false }: { small?: boolean }) {
  return (
    <motion.span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary/10 text-primary",
        small ? "size-7" : "mx-auto size-16",
      )}
      animate={{ rotate: [0, -8, 8, -4, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.4 }}
    >
      <Hand className={small ? "size-3.5" : "size-7"} />
    </motion.span>
  );
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
  unitId,
  lessonId,
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
  unitId: string;
  lessonId: string;
}) {
  const named = useMemo(
    () =>
      step.kind === "read"
        ? movesInText(step.text, unitId, lessonId)
        : step.kind === "try"
          ? movesInText(step.prompt, unitId, lessonId)
          : null,
    [step, unitId, lessonId],
  );
  switch (step.kind) {
    case "intro":
      return (
        <div className="grid gap-5 text-center">
          <p className="eyebrow">{unitTitle}</p>
          <h1 className="font-display text-[2.8rem] leading-[0.98] text-balance md:text-[3.8rem]">
            {step.title}
          </h1>
          <div className="mx-auto max-w-lg border-l-2 border-primary py-1 pl-5 text-left">
            <p className="flex items-center gap-2 eyebrow !text-[13px] text-primary">
              <Lightbulb className="size-4" /> The one thing to walk away with
            </p>
            <p className="mt-2 text-[1.3rem] leading-relaxed text-pretty text-foreground/90 md:text-[1.45rem]">
              {step.takeaway}
            </p>
          </div>
          <p className="text-[15px] text-foreground/70">About {step.minutes} min</p>
        </div>
      );
    case "read":
      return (
        <div
          className={cn(
            "grid gap-6",
            named && "md:grid-cols-[minmax(0,1fr)_13.5rem] md:items-center md:gap-8",
          )}
        >
          <div className="grid gap-4">
            <p className="eyebrow">
              {step.heading ?? "Read"} · {step.index + 1} of {step.of}
            </p>
            <p className="text-[1.15rem] leading-relaxed text-pretty first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[3.6rem] first-letter:leading-[0.8] first-letter:text-primary md:text-[1.25rem]">
              {step.text}
            </p>
          </div>
          {named ? <StepCube {...named} /> : null}
        </div>
      );
    case "watch":
      return (
        <div className="grid gap-4">
          <p className="flex items-center gap-2 eyebrow !text-[13px] text-primary">
            <PlayCircle className="size-4" /> Watch it
          </p>
          <h2 className="font-display text-[2rem] leading-tight">{step.label}</h2>
          <CubePlayer moves={step.moves} caseKind={step.caseKind} />
          <p className="font-mono text-sm tracking-wide">{step.moves}</p>
          <p className="leading-relaxed text-muted-foreground">{step.note}</p>
        </div>
      );
    case "example":
      return (
        <div className="grid gap-3">
          <p className="flex items-center gap-2 eyebrow !text-[13px] text-primary">
            <Sparkles className="size-4" /> Example
          </p>
          <h2 className="font-display text-[2rem] leading-tight">{step.label}</h2>
          <p className="text-lg leading-relaxed">{step.note}</p>
        </div>
      );
    case "quiz":
      return (
        <Quiz
          step={step}
          chosen={chosen}
          onAnswer={onAnswer}
          onRetry={onRetry}
          onSkip={onSkip}
          lessonId={lessonId}
        />
      );
    case "try":
      // With a cube, text and cube sit side by side (like a read card), so the card fits a laptop screen.
      return named ? (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_13.5rem] md:items-center md:gap-8">
          <div className="grid gap-4">
            <p className="flex items-center gap-2.5 eyebrow text-primary">
              <TryHand small /> Try it on your cube
            </p>
            <p className="font-display text-[1.7rem] leading-snug text-balance">{step.prompt}</p>
            <p className="text-sm text-muted-foreground">
              Pick up your cube and check before moving on. Nothing is timed here.
            </p>
          </div>
          <StepCube {...named} />
        </div>
      ) : (
        <div className="grid gap-4 text-center">
          <TryHand />
          <p className="eyebrow text-primary">Try it on your cube</p>
          <p className="font-display text-[1.7rem] leading-snug text-balance">{step.prompt}</p>
          <p className="text-sm text-muted-foreground">
            Pick up your cube and check before moving on. Nothing is timed here.
          </p>
        </div>
      );
    case "done":
      if (!checked) {
        return (
          <div className="grid gap-5 text-center" data-testid="lesson-unchecked">
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] text-muted-foreground">
              <Lightbulb className="size-9" />
            </span>
            <h2 className="font-display text-[2.6rem] leading-none">One question to go</h2>
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
          <span className="relative mx-auto grid size-20 place-items-center">
            <Burst delay={0.95} arc={[-Math.PI * 1.12, Math.PI * 0.12]} />
            <svg viewBox="0 0 80 80" className="absolute inset-0 z-10 -rotate-90" aria-hidden>
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                strokeWidth="3"
                stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="var(--primary)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.1 }}
              />
            </svg>
            <svg viewBox="0 0 24 24" className="relative z-10 size-8 text-primary" aria-hidden>
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.85 }}
              />
            </svg>
          </span>
          <h2 className="relative z-10 font-display text-[3.2rem] leading-none">
            <RevealText text="Lesson" delay={0.35} />{" "}
            <em className="text-primary">
              <RevealText text="complete" delay={0.5} />
            </em>
          </h2>
          <p className="relative z-10 mx-auto max-w-md leading-relaxed text-muted-foreground">
            {step.takeaway}
          </p>
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
  lessonId,
}: {
  step: QuizStep;
  chosen: number | undefined;
  onAnswer: (choice: number) => void;
  onRetry: () => void;
  onSkip: () => void;
  lessonId: string;
}) {
  const answered = chosen !== undefined;
  const right = chosen === step.answer;
  // After a wrong answer the right one stays hidden, so another go means something.
  const reveal = answered && right;
  // The guess made on the Next up card before reading, if this was its question.
  const [guess] = useState(() => recallGuess(lessonId, step.question));
  const guessed = guess !== null ? step.options[guess] : undefined;
  return (
    <div className="grid gap-4">
      <p className="eyebrow text-primary">Quick check</p>
      <h2 className="font-display text-[2rem] leading-tight text-balance">{step.question}</h2>
      {guessed ? (
        <p className="-mt-1 text-sm text-muted-foreground" data-testid="quiz-guess">
          Before you read, you guessed{" "}
          <span className="text-foreground">&ldquo;{guessed}&rdquo;</span>. {answered ? "" : "Now?"}
        </p>
      ) : null}
      <div className="grid gap-2">
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
              whileHover={answered ? undefined : { x: 3 }}
              whileTap={answered ? undefined : { scale: 0.985 }}
              animate={
                answered && isChosen && !isAnswer
                  ? { x: [0, -9, 9, -5, 5, 0] }
                  : reveal && isAnswer
                    ? { scale: [1, 1.02, 1] }
                    : { x: 0 }
              }
              transition={{ duration: 0.45 }}
              className={cn(
                "relative flex items-start gap-3 overflow-hidden rounded-2xl border p-3.5 text-left text-sm leading-relaxed transition-[border-color,opacity] duration-200",
                !answered && "border-[var(--hairline)] hover:border-foreground/30",
                reveal && isAnswer && "border-primary",
                answered && isChosen && !isAnswer && "border-foreground/60",
                answered && !isChosen && !(reveal && isAnswer) && "opacity-45",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "pocket-sweep absolute inset-0 origin-left bg-primary/10",
                  reveal && isAnswer ? "scale-x-100" : "scale-x-0",
                )}
              />
              <span
                className={cn(
                  "relative grid size-6 shrink-0 place-items-center rounded-lg border text-xs font-semibold transition-colors",
                  reveal && isAnswer && "border-transparent bg-primary text-primary-foreground",
                  answered &&
                    isChosen &&
                    !isAnswer &&
                    "border-transparent bg-foreground text-background",
                )}
              >
                {reveal && isAnswer ? <Burst count={14} radius={[12, 26]} /> : null}
                {reveal && isAnswer ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : answered && isChosen ? (
                  <X className="size-3.5" strokeWidth={3} />
                ) : (
                  choice + 1
                )}
              </span>
              <span className="relative">{option}</span>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered ? (
          <motion.div
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.15 }}
            className={cn("border-l-2 py-1 pl-4", right ? "border-primary" : "border-foreground")}
            data-testid="quiz-feedback"
          >
            <p
              className={cn(
                "font-display text-[1.35rem] leading-tight",
                right ? "text-primary" : "text-foreground",
              )}
            >
              {right ? "Exactly right." : "Not quite."}
              {right && guess !== null ? (
                <span className="ml-2 font-sans text-sm text-muted-foreground not-italic">
                  {guess === step.answer
                    ? "You called it before you read."
                    : "Reading it changed your answer."}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">{step.explain}</p>
            {!right ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={onRetry} className="rounded-full" data-testid="quiz-retry">
                  <RotateCcw /> Try again
                </Button>
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="rounded-full"
                  data-testid="quiz-skip"
                >
                  Skip for now
                </Button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
