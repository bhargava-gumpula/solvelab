"use client";

/*
 * The Learning Hub as a calm, hands-on magazine: your course's masthead (its
 * cover is the one that morphs in from the shelf), the next lesson beside a
 * live cube that plays its moves, where your time goes with a target you can
 * drag, the course as one spine with a sticky preview, a pocket question that
 * flips, and the shelf of every course to flick through.
 */
import { useMemo, useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight, TrendingUp, Trophy } from "lucide-react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { Magnetic } from "@/components/fx/magnetic";
import { ProgressRing } from "@/components/fx/progress-ring";
import { EASE_OUT_EXPO, Reveal, RevealText } from "@/components/fx/reveal";
import { Tile } from "@/components/fx/tile";
import { Tilt } from "@/components/fx/tilt";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { testHref, testTitle } from "@/data/exercises";
import { COURSES, getCourse, nextCourse, type CourseDefinition } from "@/data/hub/courses";
import { useHub } from "@/hooks/use-hub";
import { beatenCourse, courseState, courseTargetMs, type CourseState } from "@/lib/hub/path";
import { courseHref, courseUnits, lessonHref, unitHref } from "@/lib/hub/units";
import { HubVariant } from "./hub-variants";
import { cn } from "@/lib/utils";
import { CoursePath } from "./course-path";
import { courseCoverName, CourseShelf } from "./course-shelf";
import { CoverArt } from "./cover-art";
import { CountUp } from "./fx";
import { LessonCube } from "./lesson-cube";
import { previewMoves } from "./lesson-preview";
import { pocketEyebrow, PocketFace, usePocketQuestions } from "./pocket-check";
import { plainReason } from "./reason";
import { StageBudget, useStageBudget } from "./stage-budget";

const START_HREF = "/hub/start/";

function seconds(ms: number): number {
  return Math.round(ms / 100) / 10;
}

const issueNumber = (course: CourseDefinition) =>
  `Nº ${String(COURSES.findIndex((entry) => entry.id === course.id) + 1).padStart(2, "0")}`;

function courseSize(course: CourseDefinition) {
  const units = courseUnits(course);
  return {
    units: units.length,
    lessons: units.reduce((total, unit) => total + unit.lessons.length, 0),
  };
}

function HubSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading the Learning Hub">
      <Skeleton className="h-4 w-72 rounded-full" />
      <Skeleton className="h-28 w-2/3 rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="h-72 rounded-[var(--tile-radius)]" />
        <Skeleton className="h-72 rounded-[var(--tile-radius)]" />
      </div>
    </div>
  );
}

/** The Hub's front page: your course, what's next, and the path to get there. */
export function HubHome() {
  const hub = useHub();
  if (!hub.loaded) return <HubSkeleton />;
  if (!hub.placement || !hub.current) return <Welcome />;

  return (
    <div className="grid grid-cols-1 gap-8">
      {!hub.intro?.completedAt ? <SetupBanner answered={Boolean(hub.intro)} /> : null}
      <HubVariant state={hub.current} averageMs={hub.average} placedBy={hub.placement.source} />
    </div>
  );
}

/** Any course, laid out for you, even one you're not in. */
export function CourseView({ courseId }: { courseId: string }) {
  const hub = useHub();
  const course = getCourse(courseId)!;
  const state = useMemo(
    () => (hub.input ? courseState(course, hub.input) : null),
    [course, hub.input],
  );
  const ready = hub.loaded && state;
  const isCurrent = hub.placement?.course.id === course.id;
  // The masthead renders straight away (it needs only the course), so the
  // cover you opened on the shelf has somewhere to land.
  return (
    <div className="grid grid-cols-1 gap-12 md:gap-16">
      <div className="grid gap-8 md:gap-10">
        <Masthead
          course={course}
          state={ready ? state : null}
          average={hub.average}
          placedBy={isCurrent ? hub.placement!.source : null}
          current={isCurrent}
        />
        {ready ? (
          <Feature state={state} />
        ) : (
          <Skeleton className="h-72 rounded-[var(--tile-radius)]" />
        )}
      </div>
      {ready ? <CourseSection state={state} /> : null}
      <CourseShelf activeId={course.id} currentId={hub.placement?.course.id ?? null} />
    </div>
  );
}

/* ───────────── Welcome: before you've found your level ───────────── */

function Welcome() {
  const steps = [
    { title: "Tell us where you are", text: "A few quick questions about your times and method." },
    { title: "Show us", text: "Some timer solves and short tests, one part of the solve each." },
    { title: "Get your path", text: "A course built around what is actually slowing you down." },
  ];
  const covers = [COURSES[3]!, COURSES[5]!, COURSES[7]!];
  return (
    <section
      className="grid items-center gap-10 pt-2 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-14 md:pt-6"
      data-testid="hub-welcome"
    >
      <div>
        <p className="eyebrow">Learning Hub</p>
        <h1 className="mt-4 font-display text-[3.4rem] leading-[0.95] md:text-[5.6rem]">
          <RevealText text="Welcome to the" />{" "}
          <em className="text-primary">
            <RevealText text="Learning Hub" delay={0.18} />
          </em>
        </h1>
        <p className="mt-5 max-w-lg text-[17px] text-pretty text-muted-foreground">
          Courses from sub-60 to sub-10, built from what&apos;s actually slowing you down. First, a
          few minutes to find your level.
        </p>
        <ol className="mt-8 grid gap-5 border-t border-[var(--hairline)] pt-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={0.25 + index * 0.08} immediate>
                <span className="font-display text-3xl text-primary italic">{index + 1}.</span>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Magnetic>
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-7 text-base"
              data-testid="find-level"
            >
              <Link href={START_HREF}>
                Find my level <ArrowRight />
              </Link>
            </Button>
          </Magnetic>
          <p className="text-sm text-muted-foreground">
            Or{" "}
            <Link href="/hub/library/" className="text-primary underline-offset-4 hover:underline">
              browse everything
            </Link>{" "}
            first.
          </p>
        </div>
      </div>
      {/* Three covers in a loose stack: point at the stack and they fan out. */}
      <div
        aria-hidden
        className="welcome-fan group/fan relative mx-auto h-[300px] w-full max-w-[440px] md:h-[440px]"
      >
        {covers.map((course, index) => (
          <Reveal
            key={course.id}
            immediate
            delay={0.2 + index * 0.12}
            className="welcome-fan-card absolute"
            style={
              {
                left: `${[0, 38, 16][index]}%`,
                top: `${[2, 16, 44][index]}%`,
                width: "56%",
                zIndex: index,
                "--rest": `${[-8, 6, -2][index]}deg`,
                "--fan": `${[-16, 13, 3][index]}deg`,
                "--fan-x": `${[-14, 14, 0][index]}%`,
                "--fan-y": `${[-4, -8, 6][index]}%`,
              } as React.CSSProperties
            }
          >
            <Tilt className="rounded-[1.4rem] shadow-[var(--shadow-float)]">
              <CoverArt
                hue={course.hue}
                index={index * 2}
                number={course.title}
                label={course.tagline}
                className="aspect-square rounded-[1.4rem]"
              />
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** A quiet line, not a banner: finishing placement sharpens the path. */
function SetupBanner({ answered }: { answered: boolean }) {
  return (
    <Reveal
      immediate
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[var(--hairline)] py-3"
      data-testid="setup-banner"
    >
      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
      <p className="flex-1 text-sm text-muted-foreground">
        {answered
          ? "Finish finding your level: a few solves and tests make your path much sharper."
          : "Answer a few questions and take some tests so your path fits you."}
      </p>
      <Link
        href={START_HREF}
        className="group inline-flex items-center gap-1 text-sm font-medium text-primary"
      >
        {answered ? "Continue" : "Find my level"}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Reveal>
  );
}

/* ───────────── Masthead ───────────── */

function Masthead({
  course,
  state,
  average,
  placedBy,
  current,
}: {
  course: CourseDefinition;
  /** Null while your progress loads; the title and cover don't wait for it. */
  state: CourseState | null;
  average: number | null;
  placedBy: "average" | "answer" | "goal" | null;
  current: boolean;
}) {
  const size = useMemo(() => courseSize(course), [course]);
  const target = courseTargetMs(course);
  const beaten = state ? beatenCourse(course, average) : false;
  const after = nextCourse(course);
  const lessonTotal = state?.lessonTotal ?? size.lessons;
  const share = state && lessonTotal ? state.lessonsDone / lessonTotal : 0;
  const toGo = state && average !== null && target !== null ? average - target : null;
  // The test that would settle the most units that are read and waiting.
  const retest = state?.retestsDue[0] ?? null;

  return (
    <header className="relative" data-testid="course-hero">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
        <div className="min-w-0">
          <p className="eyebrow">
            {current ? <span className="text-primary">Your course</span> : "Course"}
            {current && placedBy
              ? ` · placed by your ${placedBy === "average" ? "timer average" : placedBy === "answer" ? "answers" : "goal"}`
              : ""}
            <span className="hidden sm:inline">
              {" "}
              · {size.units} units · {size.lessons} lessons
            </span>
          </p>
          {/* Set at once (no blur-in), so a cover morphing in lands on a finished page. */}
          <h1
            className="mt-3 font-display text-[clamp(3.9rem,8.4vw,7.5rem)] leading-[0.88] max-md:pr-[6.75rem]"
            data-testid="course-title"
          >
            {course.title}
          </h1>
          <p className="mt-3 max-w-xl font-display text-[1.35rem] leading-snug text-muted-foreground italic md:text-[1.6rem]">
            <RevealText text={course.tagline} stagger={0.035} delay={0.1} />
          </p>
          <dl className="mt-5 grid grid-cols-4 gap-x-3 gap-y-4 border-t border-[var(--hairline)] pt-4 sm:gap-x-4">
            <Figure label="Your average" short="Average">
              {state && average !== null ? (
                <CountUp value={seconds(average)} decimals={1} suffix=" s" />
              ) : (
                "—"
              )}
            </Figure>
            <Figure label="Target">
              {target !== null
                ? target >= 60000
                  ? `${target / 60000}:00`
                  : `${target / 1000} s`
                : "—"}
            </Figure>
            <Figure label={toGo !== null && toGo <= 0 ? "Under by" : "To go"}>
              {toGo !== null ? (
                <span className={toGo <= 0 ? "text-primary" : undefined}>
                  <CountUp value={Math.abs(seconds(toGo))} decimals={1} suffix=" s" />
                </span>
              ) : (
                "—"
              )}
            </Figure>
            <div className="min-w-0">
              <dt className="eyebrow">
                <span className="sm:hidden">Lessons</span>
                <span className="max-sm:hidden">Lessons read</span>
              </dt>
              <dd className="mt-1 flex items-center gap-3">
                <ProgressRing
                  value={share}
                  size={30}
                  stroke={3}
                  label={`${Math.round(share * 100)}% of lessons read`}
                  className="max-sm:hidden"
                />
                <span
                  className="font-display text-[1.5rem] leading-none sm:text-[1.9rem] md:text-[2.2rem]"
                  data-testid="course-progress"
                >
                  {state ? state.lessonsDone : "—"}/{lessonTotal}
                </span>
              </dd>
            </div>
          </dl>
        </div>
        <CoverDrift>
          {/* The shadow and tilt sit outside the named snapshot: only the art flies. */}
          <Tilt className="morph-lift masthead-cover w-[5.75rem] rounded-[1.1rem] shadow-[var(--shadow-float)] md:w-[min(16rem,22vw)] md:rounded-[1.6rem]">
            <ViewTransition name={courseCoverName(course.id)} share="morph" default="none">
              <CoverArt
                hue={course.hue}
                index={COURSES.findIndex((entry) => entry.id === course.id) * 3 + 1}
                number={issueNumber(course)}
                label={`${size.units} units · ${size.lessons} lessons`}
                className="aspect-square rounded-[1.1rem] md:rounded-[1.6rem]"
              />
            </ViewTransition>
          </Tilt>
        </CoverDrift>
      </div>

      {state ? (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="course-units">
          {state.unitsFinished} of {state.unitTotal} units finished
          {state.awaiting.length
            ? ` · ${state.awaiting.length} read and waiting on a test or a drill`
            : ""}
        </p>
      ) : null}
      {state && !state.next ? (
        <p className="mt-2 text-sm" data-testid="course-done">
          {state.awaiting.length
            ? `Every lesson read. ${state.awaiting.length} ${
                state.awaiting.length === 1 ? "unit waits" : "units wait"
              } on a test or a drill.`
            : "Every unit finished. Keep the timer going until your average is under the target."}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {retest ? (
          <Button
            asChild
            variant="outline"
            className="mt-5 rounded-full"
            data-testid="course-retest"
          >
            <Link href={testHref(retest.testId)}>
              <Trophy /> {testTitle(retest.testId)}
              {retest.units.length > 1 ? ` (settles ${retest.units.length} units)` : ""}
            </Link>
          </Button>
        ) : null}
        {beaten && after ? (
          <Button asChild variant="outline" className="mt-5 rounded-full" data-testid="move-on">
            <Link href={courseHref(after)}>
              <TrendingUp /> You&apos;re under it: try {after.title}
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}

/** The masthead cover sinks a little slower than the page as you scroll (depth, not motion for its own sake). */
function CoverDrift({ children }: { children: React.ReactNode }) {
  const { reducedMotion } = useAppearance();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, reducedMotion ? 0 : 70]);
  const rotate = useTransform(scrollY, [0, 700], [0, reducedMotion ? 0 : -2.5]);
  return (
    // On phones a small tile beside the title (the same cover, so the morph still lands).
    <motion.div className="max-md:absolute max-md:top-0 max-md:right-0" style={{ y, rotate }}>
      {children}
    </motion.div>
  );
}

function Figure({
  label,
  short,
  children,
}: {
  label: string;
  /** For phones, where four figures share one row. */
  short?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">
        {short ? (
          <>
            <span className="sm:hidden">{short}</span>
            <span className="max-sm:hidden">{label}</span>
          </>
        ) : (
          label
        )}
      </dt>
      <dd className="mt-1 font-display text-[1.5rem] leading-none whitespace-nowrap sm:text-[1.9rem] md:text-[2.2rem]">
        {children}
      </dd>
    </div>
  );
}

/* ───────────── Feature: next up (with the live cube) + where your time goes ───────────── */

function Feature({ state }: { state: CourseState }) {
  const hub = useHub();
  const rows = useStageBudget(hub.runs, hub.solves, state.course.targetId);
  return (
    <div
      className={cn(
        "grid gap-5",
        rows &&
          "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
      )}
    >
      <NextUp state={state} />
      {rows ? (
        <Tile className="h-full p-6 md:p-7">
          <StageBudget
            rows={rows}
            targetId={state.course.targetId}
            tests={
              hub.profile ? { done: hub.profile.coreDone, total: hub.profile.coreTotal } : null
            }
            average={hub.average}
          />
        </Tile>
      ) : null}
    </div>
  );
}

function NextUp({ state }: { state: CourseState }) {
  const { next } = state;
  const { reducedMotion } = useAppearance();
  const unitIndex = next ? state.units.findIndex((unit) => unit.unit.id === next.unit.unit.id) : -1;
  const lesson = next?.unit.unit.lessons.find((entry) => entry.id === next.lessonId);
  const lessonIndex = next && lesson ? next.unit.unit.lessons.indexOf(lesson) : -1;
  const preview = useMemo(
    () => (next ? previewMoves(next.unit.unit.id, next.lessonId) : null),
    [next],
  );
  const questions = usePocketQuestions(state);
  // The card's text turns over to a question (a guess before you read) and back.
  const [side, setSide] = useState<"lesson" | "guess">("lesson");
  const [turn, setTurn] = useState(0);
  const column = useRef<HTMLDivElement>(null);
  const guessButton = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);

  if (!next || !lesson) {
    return (
      <Tile className="flex flex-col justify-center p-7 md:p-9">
        <p className="eyebrow">Next up</p>
        <p className="mt-3 font-display text-4xl leading-tight">
          Every unit done. <em className="text-primary">Keep the timer going</em> until your average
          is under the target.
        </p>
      </Tile>
    );
  }

  const question = questions.length ? questions[turn % questions.length]! : null;
  const direction = side === "guess" ? 1 : -1;
  const face = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 26 * direction, rotateY: -9 * direction },
        animate: { opacity: 1, x: 0, rotateY: 0 },
        exit: { opacity: 0, x: -26 * direction, rotateY: 9 * direction },
      };
  const turnTo = (next: "lesson" | "guess") => {
    refocus.current = true;
    setSide(next);
  };
  // Focus follows the turn once the new side has arrived: the first answer on
  // the question side, "Guess" back on the lesson.
  const settleFocus = (definition: unknown) => {
    if (!refocus.current || (definition as { opacity?: number }).opacity !== 1) return;
    refocus.current = false;
    const target =
      side === "guess"
        ? column.current?.querySelector<HTMLElement>("[data-first-option]")
        : guessButton.current;
    target?.focus({ preventScroll: true });
  };

  // First-screen content: no reveal of its own (the page transition brings it
  // in), so a page you open never shows it arriving twice.
  return (
    // Phones: the lesson, then the cube right under it, then the guess teaser.
    // Wider: the cube on the left across both rows, the teaser under the lesson.
    <Tile className="grid h-full grid-cols-1 gap-5 p-4 sm:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)] sm:grid-rows-[1fr_auto] sm:p-5 md:gap-x-7">
      <div className="cube-stage order-2 flex min-w-0 flex-col items-center justify-center rounded-[1.3rem] px-3 pt-4 pb-3 sm:order-none sm:row-span-2">
        {preview ? (
          <>
            <LessonCube
              key={preview.moves}
              moves={preview.moves}
              tempo={preview.tempo}
              pauseAfter={preview.pauseAfter}
            />
            <p className="mt-1.5 max-w-[14rem] text-center text-[11px] text-balance text-muted-foreground">
              {preview.source === "lesson"
                ? "From this lesson"
                : preview.source === "unit"
                  ? "From this unit"
                  : preview.label}
              <span className="block text-muted-foreground/70">Drag to turn</span>
            </p>
          </>
        ) : (
          // A lesson about practice or nerves: its unit's cover, not a cube playing something unrelated.
          <Link
            href={unitHref(next.unit.unit)}
            aria-label={`Open ${next.unit.unit.title}`}
            className="block w-full max-w-[13rem] py-2"
          >
            <Tilt className="rounded-[1.3rem] shadow-[var(--shadow-float)]">
              <CoverArt
                hue={state.course.hue}
                index={unitIndex}
                number={String(unitIndex + 1).padStart(2, "0")}
                label={next.unit.unit.title}
                className="aspect-square rounded-[1.3rem]"
              />
            </Tilt>
          </Link>
        )}
      </div>
      <div
        ref={column}
        className={cn(
          "grid min-w-0 pr-2 pb-1 [perspective:1100px] sm:py-3",
          side === "guess" && "sm:row-span-2",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {side === "guess" && question ? (
            <motion.div
              key={`guess-${turn}`}
              {...face}
              transition={{ duration: reducedMotion ? 0.15 : 0.32, ease: EASE_OUT_EXPO }}
              onAnimationComplete={settleFocus}
              className="min-w-0"
            >
              <PocketFace
                question={question}
                hasMore={questions.length > 1}
                onAnother={() => {
                  refocus.current = true;
                  setTurn((value) => value + 1);
                }}
                onBack={() => turnTo("lesson")}
              />
            </motion.div>
          ) : (
            <motion.div
              key="lesson"
              {...face}
              transition={{ duration: reducedMotion ? 0.15 : 0.32, ease: EASE_OUT_EXPO }}
              onAnimationComplete={settleFocus}
              className="flex min-w-0 flex-col"
            >
              <p className="flex flex-wrap items-center gap-x-2 eyebrow">
                <span className="text-primary">Next up</span>
                <span>
                  Unit {unitIndex + 1} · Lesson {lessonIndex + 1} of {next.unit.unit.lessons.length}
                </span>
              </p>
              <h2 className="mt-3 font-display text-[2.3rem] leading-[1.02] text-balance md:text-[2.9rem]">
                {lesson.title}
              </h2>
              {/* The one action sits right under the title, so it is on the first screen. */}
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                <Magnetic>
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full px-6 text-base"
                    data-testid="continue-lesson"
                  >
                    <Link href={lessonHref(next.unit.unit.id, next.lessonId)}>
                      {state.lessonsDone ? "Continue" : "Start"} lesson <ArrowRight />
                    </Link>
                  </Button>
                </Magnetic>
                <span className="text-sm text-muted-foreground">About {lesson.minutes} min</span>
              </div>
              <p className="mt-5 max-w-lg text-[15px] text-pretty text-muted-foreground">
                {next.unit.pick ? plainReason(next.unit.pick.reason) : next.unit.unit.summary}
              </p>
              <Link
                href={unitHref(next.unit.unit)}
                className="mt-2 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                The whole unit: {next.unit.unit.title} <ArrowUpRight className="size-3.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {question && side === "lesson" ? (
          <motion.button
            key="teaser"
            ref={guessButton}
            type="button"
            data-guess
            onClick={() => turnTo("guess")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="group order-3 flex w-full items-center gap-4 self-end border-t border-[var(--hairline)] pt-4 pr-2 pb-1 text-left sm:order-none sm:col-start-2 sm:row-start-2"
            data-testid="pocket-guess"
          >
            <span className="min-w-0 flex-1">
              <span className="block eyebrow">{pocketEyebrow(question)}</span>
              <span className="mt-1 line-clamp-2 block font-display text-[1.2rem] leading-snug text-foreground/85 transition-colors group-hover:text-foreground">
                {question.quiz.question}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--hairline)] px-3 py-1.5 text-xs font-medium transition-[border-color,transform] duration-200 group-hover:-translate-y-px group-hover:border-foreground/30">
              Guess{" "}
              <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </Tile>
  );
}

/* ───────────── The course as one spine ───────────── */

function CourseSection({ state }: { state: CourseState }) {
  return (
    <section aria-labelledby="course-units" className="min-w-0">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-[var(--hairline)] pb-4">
        <h2 id="course-units" className="font-display text-[2.4rem] leading-none md:text-[3rem]">
          In this <em className="text-primary">course</em>
        </h2>
        <p className="pb-1 eyebrow">
          {state.units.length} units · {state.lessonsDone}/{state.lessonTotal} lessons read
        </p>
      </div>
      <CoursePath state={state} />
    </section>
  );
}

/* ───────────── More in the Hub: one quiet row ───────────── */
