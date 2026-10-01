"use client";

import { useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Eye,
  Lightbulb,
  Timer,
  Trophy,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { getAlgorithmSet, progressIdFor } from "@/lib/algorithms/catalog";
import { caseTimes, setOnTheCube } from "@/lib/algorithms/trainer";
import { getRepositories } from "@/lib/storage";
import { formatMeasureValue, formatPassLine, passedHow, waitingOn } from "@/lib/hub/measure-format";
import { courseState, type CourseState } from "@/lib/hub/path";
import { PackDetail } from "@/components/train/pack-detail";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PaceBadge } from "@/components/coach/pace-badge";
import { testHref } from "@/data/exercises";
import { useHub } from "@/hooks/use-hub";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePackProgress } from "@/hooks/use-training-progress";
import { COURSES } from "@/data/hub/courses";
import {
  RECOGNITION_LABEL,
  type RecognitionSet,
  type Unit,
  type UnitLesson,
  courseHref,
  courseUnits,
  coursesWithUnit,
  getUnit,
  lessonHref,
  recognitionHref,
} from "@/lib/hub/units";
import { cn, plural } from "@/lib/utils";
import { Magnetic } from "@/components/fx/magnetic";
import { EASE_OUT_EXPO } from "@/components/fx/reveal";
import { Tilt } from "@/components/fx/tilt";
import { CoverArt } from "./cover-art";
import { unitCoverName } from "./course-path";
import { lessonTakeaway } from "./lesson-preview";
import { openedFrom } from "./unit-context";

/**
 * A unit: its lessons as a list you can open in the player, then — for a
 * training pack — everything the pack holds: the diagnosis, drills, mistakes
 * to avoid, the retest and its sources.
 */
export function UnitView({ unitId }: { unitId: string }) {
  const unit = getUnit(unitId)!;
  const hub = useHub();
  const courses = coursesWithUnit(unit.id);
  // Wear the cover of the course you came from, so the morph lands on the same
  // art; opened directly, the course you're placed in (if it has this unit).
  const from = openedFrom(unit.id);
  const placedId = hub.placement?.course.id;
  const course =
    courses.find((entry) => entry.id === from?.courseId) ??
    courses.find((entry) => entry.id === placedId) ??
    courses[0];
  // Opened directly, the cover waits for your course so it never changes colour in front of you.
  const coverSettled = Boolean(from) || hub.loaded;
  const hue = course?.hue ?? COURSES[0]!.hue;
  const unitIndex =
    from && course?.id === from.courseId
      ? from.index
      : Math.max(0, course ? courseUnits(course).findIndex((entry) => entry.id === unit.id) : 0);
  const unitCount = course ? courseUnits(course).length : 0;
  return (
    <div className="grid grid-cols-1 gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/hub/">
          <ArrowLeft /> Your path
        </Link>
      </Button>
      <header className="grid items-end gap-6 border-b border-[var(--hairline)] pb-8 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-10">
        <div
          className={cn(
            "w-36 transition-opacity duration-300 sm:w-auto",
            coverSettled ? "opacity-100" : "opacity-0",
          )}
        >
          <Tilt className="morph-lift rounded-[1.4rem] shadow-[var(--shadow-float)]">
            <ViewTransition name={unitCoverName(unit.id)} share="morph" default="none">
              <CoverArt
                hue={hue}
                index={unitIndex}
                number={String(unitIndex + 1).padStart(2, "0")}
                label={course ? `${course.title} · ${unitIndex + 1} of ${unitCount}` : "Unit"}
                className="aspect-square rounded-[1.4rem]"
              />
            </ViewTransition>
          </Tilt>
        </div>
        <div className="min-w-0">
          <p className="eyebrow">
            {unit.kind === "method" ? "Method lessons" : "Unit"} ·{" "}
            {plural(unit.lessons.length, "lesson")} · about{" "}
            {unit.lessons.reduce((total, lesson) => total + lesson.minutes, 0)} min
          </p>
          <h1
            className="mt-3 font-display text-[3rem] leading-[0.95] text-balance md:text-[4.6rem]"
            data-testid="unit-title"
          >
            {unit.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] text-pretty text-muted-foreground">
            {unit.summary}
          </p>
          <UnitCourses courses={courses} />
        </div>
      </header>

      <UnitMeasure unit={unit} />
      {unit.kind === "pack" ? <PackLessons unit={unit} /> : <MethodLessons unit={unit} />}
      {unit.recognition ? <RecognitionLink unitId={unit.id} set={unit.recognition} /> : null}
      {unit.recognition ? <TrainerLink set={unit.recognition} /> : null}
      {unit.kind === "pack" ? (
        <section aria-label="Everything in this pack" className="mt-6">
          <PackDetail pack={unit.pack} variant="unit" />
        </section>
      ) : null}
    </div>
  );
}

/** A row under the lessons: an on-screen drill or the trainer, in the unit page's hairline style. */
function UnitRowLink({
  href,
  icon: Icon,
  title,
  detail,
  extra,
  testId,
}: {
  href: string;
  icon: typeof Eye;
  title: string;
  detail: string;
  extra?: React.ReactNode;
  testId: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 border-y border-[var(--hairline)] py-4"
      data-testid={testId}
    >
      <Icon className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[1.35rem] leading-tight">{title}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
        {extra}
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** The unit's on-screen drill, unless your course leaves it out at your level. */
function RecognitionLink({ unitId, set }: { unitId: string; set: RecognitionSet }) {
  const { current } = useHub();
  const inCourse = current?.units.find((state) => state.unit.id === unitId)?.unit;
  if (inCourse && !inCourse.recognition) return null;
  return (
    <UnitRowLink
      href={recognitionHref(set)}
      icon={Eye}
      testId="unit-recognition"
      title={
        set === "f2l"
          ? "Recognition drill: pick the algorithm for each F2L pair"
          : `Recognition drill: name ${RECOGNITION_LABEL[set]} cases on sight`
      }
      detail={
        set === "f2l"
          ? "Twelve pairs, timed. Finds the ones you’re slowest to spot."
          : set.startsWith("two-look") || set === "coll"
            ? "Twelve cases, timed. Finds the ones you’re slowest to spot."
            : "Twelve cases from two sides, timed. Finds the ones you’re slowest to spot."
      }
    />
  );
}

/** The set's algorithm trainer: its cases on a real cube, timed from a set-up scramble. */
function TrainerLink({ set }: { set: RecognitionSet }) {
  const ready = useStorageStatus().status === "ready";
  const attempts = useLiveQuery(
    async () => (ready ? await getRepositories().algorithms.trainerAttempts() : undefined),
    [ready],
  );
  const caseIds = [
    ...new Set((getAlgorithmSet(set)?.cases ?? []).map((entry) => progressIdFor(entry))),
  ];
  const onCube = setOnTheCube(caseIds, caseTimes(attempts ?? []));
  return (
    <UnitRowLink
      href={`/algorithms/${set}/train/`}
      icon={Timer}
      testId="unit-trainer"
      title={`Practise ${RECOGNITION_LABEL[set]} on your cube`}
      detail="A scramble sets up each case; you solve it with your algorithm and the time is kept. Your slowest cases come round more often."
      extra={
        onCube.typicalMs !== null ? (
          <span className="mt-1 block text-sm" data-testid="unit-trainer-number">
            Your typical case:{" "}
            <span className="font-figures tabular">{(onCube.typicalMs / 1000).toFixed(2)} s</span>{" "}
            <span className="text-muted-foreground">
              ({onCube.timed} of {onCube.total} cases timed)
            </span>
          </span>
        ) : null
      }
    />
  );
}

/** Your course's cut of this unit's lessons, when the unit is in your course. */
function lessonsInCourse(current: CourseState | null, unitId: string): UnitLesson[] | undefined {
  return current?.units.find((state) => state.unit.id === unitId)?.unit.lessons;
}

/** One quiet line for the courses that hold this unit; the list opens on demand. */
function UnitCourses({ courses }: { courses: ReturnType<typeof coursesWithUnit> }) {
  if (!courses.length) return null;
  if (courses.length === 1) {
    return (
      <Link
        href={courseHref(courses[0]!)}
        className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        Part of the {courses[0]!.title} course <ArrowUpRight className="size-3.5" />
      </Link>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          data-testid="unit-courses"
        >
          In {courses.length} courses, {courses[0]!.title} to {courses[courses.length - 1]!.title}
          <ChevronDown className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        <ul className="grid">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={courseHref(course)}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]"
              >
                {course.title} course <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function LessonList({
  unit,
  isDone,
  courseLessons,
}: {
  unit: Unit;
  isDone: (lessonId: string) => boolean;
  /** Where "Start" and "Continue" look first; the rest of the unit stays listed. */
  courseLessons: UnitLesson[] | undefined;
}) {
  const phone = useMediaQuery("(max-width: 639px)");
  const open = (lesson: UnitLesson) => !isDone(lesson.id);
  const firstOpen = courseLessons?.find(open) ?? unit.lessons.find(open);
  return (
    <section aria-labelledby="unit-lessons">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="unit-lessons" className="font-display text-[2.2rem] leading-none">
            Lessons
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {phone
              ? "Open a lesson's arrow for the one thing it teaches."
              : "Turn a card over for the one thing it teaches."}
          </p>
        </div>
        {firstOpen ? (
          <Magnetic>
            <Button asChild className="rounded-full" data-testid="unit-start">
              <Link href={lessonHref(unit.id, firstOpen.id)}>
                {unit.lessons.some((lesson) => isDone(lesson.id)) ? "Continue" : "Start"}{" "}
                <ArrowRight />
              </Link>
            </Button>
          </Magnetic>
        ) : null}
      </div>
      {/* Phones: hairline rows, the takeaway opens in place. Wider: one grid of
          cards that never leaves an orphan (4 → 4-up, 3 → 3-up, else pairs). */}
      {phone ? (
        <ol className="border-t border-[var(--hairline)]">
          {unit.lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              unitId={unit.id}
              lesson={lesson}
              number={index + 1}
              done={isDone(lesson.id)}
              next={lesson.id === firstOpen?.id}
            />
          ))}
        </ol>
      ) : (
        <ol
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            unit.lessons.length % 4 === 0
              ? "xl:grid-cols-4"
              : unit.lessons.length % 3 === 0
                ? "lg:grid-cols-3"
                : null,
          )}
        >
          {unit.lessons.map((lesson, index) => (
            <motion.li
              key={lesson.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: 0.08 + index * 0.05 }}
            >
              <LessonCard
                unitId={unit.id}
                lesson={lesson}
                number={index + 1}
                done={isDone(lesson.id)}
                next={lesson.id === firstOpen?.id}
              />
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * A lesson as a card: the front opens it; "The one thing" turns it over to
 * show the takeaway, and "Back" turns it face up again (focus follows).
 */
function LessonCard({
  unitId,
  lesson,
  number,
  done,
  next,
}: {
  unitId: string;
  lesson: Unit["lessons"][number];
  number: number;
  done: boolean;
  next: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const peek = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const takeaway = lessonTakeaway(unitId, lesson.id);
  const href = lessonHref(unitId, lesson.id);
  const turn = (value: boolean) => {
    setFlipped(value);
    window.setTimeout(() => (value ? back : peek).current?.focus({ preventScroll: true }), 380);
  };
  return (
    <div className="lesson-card h-full [perspective:1400px]">
      <motion.div
        className="grid h-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
      >
        <div
          className={cn(
            "lesson-card-face group tile relative flex min-h-[9.5rem] flex-col p-5 [backface-visibility:hidden] [grid-area:1/1]",
          )}
          inert={flipped}
          aria-hidden={flipped}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "font-display tabular text-[2.6rem] leading-none italic",
                done ? "text-primary" : "text-foreground/80",
              )}
            >
              {String(number).padStart(2, "0")}
            </span>
            {done ? (
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                <Check className="size-3.5" /> Read
              </span>
            ) : next ? (
              <span className="mt-1 text-xs text-primary">Up next</span>
            ) : null}
          </div>
          <h3 className="mt-3 font-display text-[1.5rem] leading-[1.08] text-balance">
            <Link
              href={href}
              data-testid={`unit-lesson-${lesson.id}`}
              className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none"
            >
              {lesson.title}
            </Link>
          </h3>
          <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" /> {lesson.minutes} min
            </span>
            {takeaway ? (
              <button
                ref={peek}
                type="button"
                onClick={() => turn(true)}
                aria-label={`The one thing ${lesson.title} teaches: turn the card over`}
                title="The one thing it teaches"
                className="relative z-10 -mr-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-muted-foreground transition-colors duration-200 hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] hover:text-foreground"
                data-testid={`lesson-peek-${lesson.id}`}
              >
                <Lightbulb className="size-3.5" /> The one thing
              </button>
            ) : null}
          </div>
        </div>
        <div
          className="tile flex min-h-[9.5rem] [transform:rotateY(180deg)] flex-col p-5 [backface-visibility:hidden] [grid-area:1/1]"
          inert={!flipped}
          aria-hidden={!flipped}
        >
          <p className="flex items-center gap-1.5 eyebrow text-primary">
            <Lightbulb className="size-3.5" /> The one thing
          </p>
          <p className="mt-2 font-display text-[1.2rem] leading-snug text-pretty italic">
            {takeaway}
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <button
              ref={back}
              type="button"
              onClick={() => turn(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Turn back
            </button>
            <Link
              href={href}
              tabIndex={flipped ? 0 : -1}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              {done ? "Read again" : "Start"} <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** A lesson on a phone: one hairline row; the arrow opens the takeaway in place. */
function LessonRow({
  unitId,
  lesson,
  number,
  done,
  next,
}: {
  unitId: string;
  lesson: Unit["lessons"][number];
  number: number;
  done: boolean;
  next: boolean;
}) {
  const [open, setOpen] = useState(false);
  const takeaway = lessonTakeaway(unitId, lesson.id);
  return (
    <li className="border-b border-[var(--hairline)]">
      <div className="flex items-center gap-3 py-3">
        <span
          className={cn(
            "w-7 shrink-0 font-display tabular text-[1.35rem] leading-none italic",
            done ? "text-primary" : "text-foreground/70",
          )}
        >
          {String(number).padStart(2, "0")}
        </span>
        <Link
          href={lessonHref(unitId, lesson.id)}
          data-testid={`unit-lesson-${lesson.id}`}
          className="min-w-0 flex-1"
        >
          <span className="block text-[15px] leading-snug font-medium">{lesson.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {lesson.minutes} min
            {done ? (
              <span className="inline-flex items-center gap-1 text-primary">
                · <Check className="size-3" /> Read
              </span>
            ) : next ? (
              <span className="text-primary">· Up next</span>
            ) : null}
          </span>
        </Link>
        {takeaway ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={`The one thing ${lesson.title} teaches`}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
            data-testid={`lesson-peek-${lesson.id}`}
          >
            <ChevronDown
              className={cn("size-4 transition-transform duration-300", open && "rotate-180")}
            />
          </button>
        ) : null}
      </div>
      <AnimatePresence initial={false}>
        {open && takeaway ? (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            className="overflow-hidden"
          >
            <span className="mb-3 ml-10 block border-l-2 border-primary pl-3 font-display text-[1.1rem] leading-snug italic">
              {takeaway}
            </span>
          </motion.p>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

/**
 * What shows this unit worked: its measure against a course's pass line, how
 * it has moved since you started, and what to do to move it. The course is
 * yours when it has the unit, else the first course that teaches it.
 */
function UnitMeasure({ unit }: { unit: Unit }) {
  const hub = useHub();
  // Holds the space quietly while it loads (a cover morphing in lands on a calm page, not a skeleton).
  if (!hub.loaded || !hub.input) return <div aria-busy="true" className="h-28" />;
  const inCourse = hub.current?.units.find((state) => state.unit.id === unit.id);
  const course = inCourse ? hub.current!.course : coursesWithUnit(unit.id)[0];
  const state =
    inCourse ??
    (course
      ? courseState(course, hub.input).units.find((item) => item.unit.id === unit.id)
      : undefined);
  if (!state || !course) return null;
  const { measure, passed } = state;

  if (!measure) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="tile p-6"
        data-testid="unit-measure"
      >
        <p className="eyebrow">How this unit is finished</p>
        <p className="mt-2 font-display text-[1.7rem] leading-tight">
          {state.done ? "Finished" : "Read it, then run each drill"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          There&apos;s no fair number for this unit, so it&apos;s finished once you&apos;ve read its
          lessons and run each of its drills.
        </p>
      </motion.section>
    );
  }

  const line = formatPassLine(measure);
  const next = measure.next;
  const started = state.status !== "open";
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="tile flex flex-wrap items-center gap-4 p-6"
      data-testid="unit-measure"
    >
      <div className="min-w-0 flex-1">
        <p className="eyebrow">
          What shows this unit worked{line ? ` · ${course.title} pass line: ${line}` : ""}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 font-display text-[1.7rem] leading-tight">
          {measure.value === null
            ? measure.label
            : `${measure.label}: ${formatMeasureValue(measure, measure.value)}`}
          {measure.tag ? <PaceBadge tag={measure.tag} /> : null}
          {passed ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-sans text-xs text-primary-foreground"
              data-testid="unit-passed"
            >
              <Trophy className="size-3" /> Passed
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="unit-since">
          {passed
            ? `${passedHow(passed.via, course)}${
                passed.passedAt
                  ? ` Passed on ${new Date(passed.passedAt).toLocaleDateString()}.`
                  : ""
              }`
            : (waitingOn(measure) ??
              (measure.value === null
                ? next?.kind === "timer"
                  ? "Not enough timer solves yet to say."
                  : "Not measured yet. Take the test to get a starting number."
                : !started
                  ? "Start a lesson or drill, then retest to see it move."
                  : measure.before === null
                    ? "Nothing measured from before you started. Meet the line, or beat this number clearly on a retest."
                    : `${formatMeasureValue(measure, measure.before)} when you started → ${formatMeasureValue(measure, measure.value)} now. It passes at the line, or once it is clearly better than when you started.`))}
        </p>
      </div>
      {next?.kind === "test" ? (
        <Button asChild variant="outline" className="rounded-full" data-testid="unit-retest">
          <Link href={testHref(next.testId)}>
            {measure.value === null ? "Take the test" : "Retest"} <ArrowRight />
          </Link>
        </Button>
      ) : next?.kind === "timer" ? (
        <Button asChild variant="outline" className="rounded-full" data-testid="unit-retest">
          <Link href="/timer/">
            Open the timer <ArrowRight />
          </Link>
        </Button>
      ) : next?.kind === "recognition" ? (
        <Button asChild variant="outline" className="rounded-full" data-testid="unit-retest">
          <Link href={recognitionHref(next.set)}>
            Run the drill <ArrowRight />
          </Link>
        </Button>
      ) : null}
    </motion.section>
  );
}

function PackLessons({ unit }: { unit: Extract<Unit, { kind: "pack" }> }) {
  const { progress } = usePackProgress(unit.pack);
  const { current } = useHub();
  return (
    <LessonList
      unit={unit}
      isDone={progress.isLessonDone}
      courseLessons={lessonsInCourse(current, unit.id)}
    />
  );
}

function MethodLessons({ unit }: { unit: Unit }) {
  const hub = useHub();
  const done = hub.input?.methodDone;
  return (
    <LessonList
      unit={unit}
      isDone={(id) => done?.has(id) ?? false}
      courseLessons={lessonsInCourse(hub.current, unit.id)}
    />
  );
}
