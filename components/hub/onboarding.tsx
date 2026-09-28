"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Eye,
  FlaskConical,
  PartyPopper,
  Rocket,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PaceBadge } from "@/components/coach/pace-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COURSES } from "@/data/hub/courses";
import { CORE_TESTS, testHref, testTitle } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { saveHubIntro, useHub } from "@/hooks/use-hub";
import { MIN_TIMER_SOLVES } from "@/lib/coach/profile";
import {
  AVERAGE_CHOICES,
  KNOWN_CHOICES,
  METHOD_CHOICES,
  PRACTICE_CHOICES,
  SLOW_CHOICES,
  averageAgreement,
  compareWithProfile,
  rungForAnswer,
  type Choice,
} from "@/lib/hub/intro";
import { courseForRung } from "@/data/hub/courses";
import { cn } from "@/lib/utils";
import type { CubingMethod, HubIntro, KnownAlgorithms } from "@/types/domain";
import { celebrate, CountUp } from "./fx";

type Step =
  | "welcome"
  | "average"
  | "method"
  | "algorithms"
  | "slow"
  | "goal"
  | "practice"
  | "solves"
  | "tests"
  | "results";

const STEPS: Step[] = [
  "welcome",
  "average",
  "method",
  "algorithms",
  "slow",
  "goal",
  "practice",
  "solves",
  "tests",
  "results",
];

const QUESTIONS: Step[] = ["average", "method", "algorithms", "slow", "goal", "practice"];

interface Draft {
  average: string | null;
  method: CubingMethod | null;
  pll: KnownAlgorithms | null;
  oll: KnownAlgorithms | null;
  slowParts: string[];
  goal: string | null;
  practice: string | null;
}

/** Goals offered: the target of every course. */
const GOALS = COURSES.map((course) => ({
  id: course.targetId,
  label: milestones.find((milestone) => milestone.id === course.targetId)?.label ?? course.title,
}));

function suggestedGoal(average: string | null): string | null {
  return courseForRung(rungForAnswer(average))?.targetId ?? null;
}

/**
 * Finding your level: a few questions about where you think you are, then the
 * timer and the tests show where you actually are, and the results set the
 * two side by side.
 */
export function Onboarding() {
  const hub = useHub();
  if (!hub.loaded || !hub.profile || !hub.settings) {
    return <Skeleton className="mx-auto h-[28rem] max-w-2xl rounded-3xl" />;
  }
  return <OnboardingFlow hub={hub} />;
}

type Hub = ReturnType<typeof useHub>;

function OnboardingFlow({ hub }: { hub: Hub }) {
  const router = useRouter();
  const profile = hub.profile!;
  const settings = hub.settings!;
  const solvesCount = hub.solves.length;
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => ({
    average: hub.intro?.average ?? null,
    method: settings.method === "unknown" ? null : settings.method,
    pll: hub.intro?.pll ?? null,
    oll: hub.intro?.oll ?? null,
    slowParts: hub.intro?.slowParts ?? [],
    goal: settings.targetMilestone,
    practice: hub.intro?.practice ?? null,
  }));
  // Pick up where they left off: after the questions, the solves, then the tests.
  const [step, setStep] = useState<Step>(() =>
    !hub.intro
      ? "welcome"
      : hub.intro.completedAt || profile.complete
        ? "results"
        : solvesCount < MIN_TIMER_SOLVES
          ? "solves"
          : "tests",
  );

  const index = STEPS.indexOf(step);
  const go = (to: Step) => {
    setDirection(STEPS.indexOf(to) >= index ? 1 : -1);
    setStep(to);
  };
  const forward = () => go(STEPS[index + 1]!);
  const back = () => go(STEPS[Math.max(0, index - 1)]!);
  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });

  const finish = async () => {
    if (hub.intro) await saveHubIntro({ ...hub.intro, completedAt: new Date().toISOString() });
    router.push("/hub/");
  };

  const questionNumber = QUESTIONS.indexOf(step);

  return (
    <div className="mx-auto max-w-2xl" data-testid="onboarding">
      <div className="mb-5 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          onClick={back}
          disabled={index === 0}
          aria-label="Back"
        >
          <ArrowLeft />
        </Button>
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {STEPS.slice(1).map((item, dot) => (
            <motion.span
              key={item}
              className="h-2 flex-1 rounded-full"
              initial={false}
              animate={{
                backgroundColor: dot < index ? "var(--primary)" : "var(--muted)",
                scaleY: dot === index - 1 ? 1.4 : 1,
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.section
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="rounded-3xl p-6 glass md:p-8"
          data-testid={`onboarding-${step}`}
        >
          {questionNumber >= 0 ? (
            <p className="mb-2 eyebrow text-primary">
              Question {questionNumber + 1} of {QUESTIONS.length}
            </p>
          ) : null}

          {step === "welcome" ? (
            <Intro onStart={forward} />
          ) : step === "average" ? (
            <Question
              title="Roughly what's your average right now?"
              hint="Your best guess is fine; the timer will check it."
            >
              <Choices
                choices={AVERAGE_CHOICES}
                value={draft.average}
                onPick={(average) => {
                  update({ average, goal: draft.goal ?? suggestedGoal(average) });
                  forward();
                }}
                columns={3}
              />
            </Question>
          ) : step === "method" ? (
            <Question title="Which method do you use?">
              <Choices
                choices={METHOD_CHOICES}
                value={draft.method}
                onPick={(method) => {
                  update({ method });
                  forward();
                }}
              />
            </Question>
          ) : step === "algorithms" ? (
            <Question
              title="How much of the last layer do you know?"
              hint="PLL moves pieces round; OLL turns them to face up."
            >
              <p className="mb-2 text-sm font-medium">PLL</p>
              <Choices
                choices={KNOWN_CHOICES}
                value={draft.pll}
                onPick={(pll) => update({ pll })}
                columns={4}
                testPrefix="pll"
              />
              <p className="mt-4 mb-2 text-sm font-medium">OLL</p>
              <Choices
                choices={KNOWN_CHOICES}
                value={draft.oll}
                onPick={(oll) => update({ oll })}
                columns={4}
                testPrefix="oll"
              />
              <NextButton onClick={forward} disabled={!draft.pll || !draft.oll} />
            </Question>
          ) : step === "slow" ? (
            <Question
              title="What feels slow?"
              hint="Pick as many as you like. We'll test whether you're right."
            >
              <Choices
                choices={SLOW_CHOICES}
                value={draft.slowParts}
                multiple
                onPick={(id) =>
                  update({
                    slowParts: draft.slowParts.includes(id)
                      ? draft.slowParts.filter((item) => item !== id)
                      : [...draft.slowParts, id],
                  })
                }
                columns={2}
              />
              <NextButton
                onClick={forward}
                label={draft.slowParts.length ? "Next" : "Nothing yet — next"}
              />
            </Question>
          ) : step === "goal" ? (
            <Question
              title="What time are you chasing?"
              hint="We picked the next step from your answer. Change it if you like."
            >
              <Choices
                choices={GOALS}
                value={draft.goal}
                onPick={(goal) => {
                  update({ goal });
                  forward();
                }}
                columns={4}
              />
            </Question>
          ) : step === "practice" ? (
            <Question title="How long do you practise on a typical day?">
              <Choices
                choices={PRACTICE_CHOICES}
                value={draft.practice}
                onPick={(practice) => {
                  const next = { ...draft, practice };
                  setDraft(next);
                  saveAnswersFrom(next);
                  go("solves");
                }}
                columns={2}
              />
            </Question>
          ) : step === "solves" ? (
            <SolvesStep
              count={solvesCount}
              average={hub.average}
              averageChoice={draft.average}
              onNext={forward}
            />
          ) : step === "tests" ? (
            <TestsStep
              taken={profile.testsTaken}
              nextTest={hub.testPlan?.testId ?? profile.nextTest}
              picked={hub.testPlan?.source === "model"}
              enough={hub.testPlan?.enough ?? false}
              coreDone={profile.coreDone}
              coreTotal={profile.coreTotal}
              onSkip={forward}
            />
          ) : (
            <Results hub={hub} onStart={finish} />
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );

  function saveAnswersFrom(next: Draft) {
    const intro: HubIntro = {
      average: next.average,
      slowParts: next.slowParts,
      pll: next.pll,
      oll: next.oll,
      practice: next.practice,
      answeredAt: hub.intro?.answeredAt ?? new Date().toISOString(),
      completedAt: hub.intro?.completedAt ?? null,
    };
    void saveHubIntro(intro, {
      targetMilestone: next.goal ?? hub.settings?.targetMilestone ?? null,
      ...(next.method ? { method: next.method } : {}),
    });
  }
}

function Intro({ onStart }: { onStart: () => void }) {
  const parts = [
    { icon: CircleHelp, text: "Six quick questions about where you think you are" },
    { icon: Timer, text: "A dozen timer solves for your real average" },
    { icon: FlaskConical, text: "Short tests that time each part of your solve" },
    { icon: Eye, text: "What you said and what we measured, side by side" },
  ];
  return (
    <div className="grid gap-5">
      <h1 className="text-3xl font-semibold tracking-tight">Let&apos;s find your level</h1>
      <ul className="grid gap-2.5">
        {parts.map((part, index) => (
          <motion.li
            key={part.text}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="flex items-center gap-3 rounded-2xl border bg-background/40 p-3"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <part.icon className="size-4.5" />
            </span>
            <span className="text-sm">{part.text}</span>
          </motion.li>
        ))}
      </ul>
      <NextButton onClick={onStart} label="Let's go" testId="onboarding-start" />
    </div>
  );
}

function Question({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Choices<Id extends string>({
  choices,
  value,
  onPick,
  multiple = false,
  columns = 1,
  testPrefix = "choice",
}: {
  choices: readonly Choice<Id>[];
  value: Id | null | readonly string[];
  onPick: (id: Id) => void;
  multiple?: boolean;
  columns?: 1 | 2 | 3 | 4;
  testPrefix?: string;
}) {
  const isChosen = (id: Id) => (Array.isArray(value) ? value.includes(id) : value === id);
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
      )}
      role={multiple ? "group" : "radiogroup"}
    >
      {choices.map((choice, index) => {
        const chosen = isChosen(choice.id);
        return (
          <motion.button
            key={choice.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={chosen}
            onClick={() => onPick(choice.id)}
            data-testid={`${testPrefix}-${choice.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative flex min-h-12 items-center gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
              chosen
                ? "border-primary bg-primary/15 text-foreground shadow-[0_0_24px_-10px_var(--glow)]"
                : "border-border bg-background/40 hover:border-primary/50",
            )}
          >
            <span className="flex-1">
              {choice.label}
              {choice.detail ? (
                <span className="block text-xs font-normal text-muted-foreground">
                  {choice.detail}
                </span>
              ) : null}
            </span>
            <AnimatePresence>
              {chosen ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="size-3.5" />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

function NextButton({
  onClick,
  disabled,
  label = "Next",
  testId = "onboarding-next",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  testId?: string;
}) {
  return (
    <div className="mt-6 flex justify-end">
      <motion.div whileTap={{ scale: 0.96 }}>
        <Button
          size="lg"
          className="rounded-full px-7"
          onClick={onClick}
          disabled={disabled}
          data-testid={testId}
        >
          {label} <ArrowRight />
        </Button>
      </motion.div>
    </div>
  );
}

function SolvesStep({
  count,
  average,
  averageChoice,
  onNext,
}: {
  count: number;
  average: number | null;
  averageChoice: string | null;
  onNext: () => void;
}) {
  const enough = count >= MIN_TIMER_SOLVES && average !== null;
  const agreement = averageAgreement(averageChoice, average);
  const said = AVERAGE_CHOICES.find((choice) => choice.id === averageChoice)?.label;
  return (
    <div className="grid gap-5">
      <p className="eyebrow text-primary">Step 2 · the timer</p>
      {enough ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Your timer says</h1>
          <p className="text-6xl font-bold tracking-tight text-primary">
            <CountUp value={Math.round(average / 100) / 10} decimals={1} suffix=" s" />
          </p>
          {said && agreement ? (
            <p className="text-muted-foreground" data-testid="average-agreement">
              You said {said.toLowerCase()}.{" "}
              {agreement === "inside"
                ? "Spot on."
                : agreement === "faster"
                  ? "You're faster than you think."
                  : "The timer has you a little slower — that's normal; averages hide the bad solves."}
            </p>
          ) : null}
          <NextButton onClick={onNext} label="On to the tests" />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            Do {MIN_TIMER_SOLVES - count} more {MIN_TIMER_SOLVES - count === 1 ? "solve" : "solves"}{" "}
            on the timer
          </h1>
          <p className="text-muted-foreground">
            Your average from normal solves is the most honest measure there is. We need{" "}
            {MIN_TIMER_SOLVES}; you have {count}.
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(count / MIN_TIMER_SOLVES) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={onNext} data-testid="skip-solves">
              Skip for now
            </Button>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/timer/">
                <Timer /> Go to the timer
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Come back to the Learning Hub when you&apos;re done; it picks up here.
          </p>
        </>
      )}
    </div>
  );
}

function TestsStep({
  taken,
  nextTest,
  picked,
  enough,
  coreDone,
  coreTotal,
  onSkip,
}: {
  taken: string[];
  nextTest: string | null;
  /** The coach model chose the next test. */
  picked: boolean;
  /** The model has seen enough to place you. */
  enough: boolean;
  coreDone: number;
  coreTotal: number;
  onSkip: () => void;
}) {
  return (
    <div className="grid gap-4">
      <p className="eyebrow text-primary">Step 3 · the tests</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {coreDone === coreTotal ? "Every test done" : `${coreDone} of ${coreTotal} tests done`}
      </h1>
      <p className="text-muted-foreground">
        Each test times one part of your solve on its own, a few attempts each.
        {picked
          ? " The coach model picks each next test to clear up the most doubt about your solve, so you only take the ones it needs."
          : " Together they show exactly where your time goes."}
      </p>
      {enough ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[var(--known)]/50 bg-[var(--known)]/10 p-3 text-sm"
          data-testid="tests-enough"
        >
          The coach model has seen enough to place you. More tests sharpen your profile, but your
          results are ready now.
        </motion.p>
      ) : null}
      <ol className="grid gap-2">
        {CORE_TESTS.map((testId, index) => {
          const done = taken.includes(testId);
          return (
            <motion.li
              key={testId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                done && "border-[var(--known)]/50 bg-[var(--known)]/10",
              )}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full border text-xs",
                  done && "border-transparent bg-[var(--known)] text-white",
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="flex-1">{testTitle(testId)}</span>
              {!done && testId === nextTest ? (
                <span className="text-xs font-semibold text-primary">
                  {picked ? "Model's pick" : "Next"}
                </span>
              ) : null}
            </motion.li>
          );
        })}
      </ol>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onSkip} data-testid="skip-tests">
          {nextTest ? "See results so far" : "See my results"}
        </Button>
        {nextTest ? (
          <Button asChild size="lg" className="rounded-full" data-testid="take-next-test">
            <Link href={testHref(nextTest)}>
              Take the {testTitle(nextTest).toLowerCase()} <ArrowRight />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Results({ hub, onStart }: { hub: ReturnType<typeof useHub>; onStart: () => void }) {
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    celebrate("big");
  }, []);
  if (!hub.profile) return null;
  const agreements = compareWithProfile(hub.intro, hub.profile);
  const course = hub.placement?.course ?? null;
  const measured = hub.profile.aspects.filter((aspect) => aspect.tag && !aspect.definition.outcome);

  return (
    <div className="grid gap-6">
      <div className="text-center">
        <motion.span
          className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground"
          initial={{ scale: 0, rotate: -120 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          <PartyPopper className="size-8" />
        </motion.span>
        <p className="mt-4 eyebrow text-primary">Your course</p>
        <motion.h1
          className="mt-1 text-5xl font-bold tracking-tight"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 220, damping: 14 }}
          data-testid="result-course"
        >
          {course?.title ?? "Pick any course"}
        </motion.h1>
        {course ? <p className="mt-2 text-muted-foreground">{course.tagline}</p> : null}
      </div>

      {agreements.length ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold">What you said, and what we measured</h2>
          <ul className="grid gap-2" data-testid="agreements">
            {agreements.map((row, index) => (
              <motion.li
                key={row.aspectId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.08 }}
                className="flex items-center gap-3 rounded-xl border bg-background/40 px-3 py-2 text-sm"
              >
                {row.agreement === "fine" ? (
                  <TrendingUp className="size-4 text-[var(--known)]" />
                ) : row.agreement === "unmeasured" ? (
                  <CircleHelp className="size-4 text-muted-foreground" />
                ) : (
                  <TrendingDown className="size-4 text-destructive" />
                )}
                <span className="flex-1">
                  <span className="font-medium">{row.label}</span>{" "}
                  <span className="text-muted-foreground">
                    {row.agreement === "agreed"
                      ? "— you were right, it's slow."
                      : row.agreement === "fine"
                        ? "— felt slow, but it's on pace. Good news."
                        : row.agreement === "hidden"
                          ? "— didn't feel slow, but it is."
                          : "— you said it's slow; not measured yet."}
                  </span>
                </span>
                {row.tag ? <PaceBadge tag={row.tag} /> : null}
              </motion.li>
            ))}
          </ul>
        </section>
      ) : measured.length === 0 ? (
        <p className="rounded-xl border bg-background/40 p-3 text-sm text-muted-foreground">
          Nothing measured yet, so your course comes from your answers. Take the tests any time from
          your profile and the path will re-order itself around what they find.
        </p>
      ) : null}

      <div className="flex justify-center">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Button
            size="lg"
            className="rounded-full px-8 text-base"
            onClick={onStart}
            data-testid="start-path"
          >
            Start my path <Rocket />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
