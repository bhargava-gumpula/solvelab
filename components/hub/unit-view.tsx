"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, Timer, Trophy } from "lucide-react";
import { PackDetail } from "@/components/train/pack-detail";
import { Button } from "@/components/ui/button";
import { PaceBadge } from "@/components/coach/pace-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { testHref } from "@/data/exercises";
import { useHub } from "@/hooks/use-hub";
import { formatMeasureValue, formatPassLine, passedHow, waitingOn } from "@/lib/hub/measure-format";
import { courseState, type CourseState } from "@/lib/hub/path";
import { usePackProgress } from "@/hooks/use-training-progress";
import { COURSES } from "@/data/hub/courses";
import {
  RECOGNITION_LABEL,
  courseHref,
  coursesWithUnit,
  getUnit,
  lessonHref,
  recognitionHref,
  type RecognitionSet,
  type Unit,
  type UnitLesson,
} from "@/lib/hub/units";
import { cn } from "@/lib/utils";

/**
 * A unit: its lessons as a list you can open in the player, then — for a
 * training pack — everything the pack holds: the diagnosis, drills, mistakes
 * to avoid, the retest and its sources.
 */
export function UnitView({ unitId }: { unitId: string }) {
  const unit = getUnit(unitId)!;
  const courses = coursesWithUnit(unit.id);
  const hue = courses[0]?.hue ?? COURSES[0]!.hue;
  return (
    <div className="grid grid-cols-1 gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/hub/">
          <ArrowLeft /> Your path
        </Link>
      </Button>
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 text-white md:p-8"
        style={{
          background: `linear-gradient(135deg, oklch(0.56 0.17 ${hue}), oklch(0.36 0.13 ${hue + 45}))`,
        }}
      >
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase opacity-80">
          {unit.kind === "method" ? "Method lessons" : "Unit"}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl" data-testid="unit-title">
          {unit.title}
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">{unit.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={courseHref(course)}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30"
            >
              {course.title} course
            </Link>
          ))}
        </div>
      </motion.header>

      <UnitMeasure unit={unit} />
      {unit.kind === "pack" ? <PackLessons unit={unit} /> : <MethodLessons unit={unit} />}
      {unit.recognition ? <RecognitionLink unitId={unit.id} set={unit.recognition} /> : null}
      {unit.recognition ? <TrainerLink set={unit.recognition} /> : null}
      {unit.kind === "pack" ? (
        <section aria-label="Everything in this pack">
          <PackDetail pack={unit.pack} />
        </section>
      ) : null}
    </div>
  );
}

/** The unit's on-screen drill, unless your course leaves it out at your level. */
function RecognitionLink({ unitId, set }: { unitId: string; set: RecognitionSet }) {
  const { current } = useHub();
  const inCourse = current?.units.find((state) => state.unit.id === unitId)?.unit;
  if (inCourse && !inCourse.recognition) return null;
  return (
    <Link
      href={recognitionHref(set)}
      className="group flex items-center gap-4 rounded-2xl p-5 glass transition-transform hover:-translate-y-0.5"
      data-testid="unit-recognition"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
        <Eye className="size-6" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">
          {set === "f2l"
            ? "Recognition drill: pick the algorithm for each F2L pair"
            : `Recognition drill: name ${RECOGNITION_LABEL[set]} cases on sight`}
        </span>
        <span className="block text-sm text-muted-foreground">
          {set === "f2l"
            ? "Twelve pairs, timed. Finds the ones you’re slowest to spot."
            : set.startsWith("two-look") || set === "coll"
              ? "Twelve cases, timed. Finds the ones you’re slowest to spot."
              : "Twelve cases from two sides, timed. Finds the ones you’re slowest to spot."}
        </span>
      </span>
      <ArrowRight className="size-5 text-primary" />
    </Link>
  );
}

/** The set's algorithm trainer: its cases on a real cube, timed from a set-up scramble. */
function TrainerLink({ set }: { set: RecognitionSet }) {
  return (
    <Link
      href={`/algorithms/${set}/train/`}
      className="group flex items-center gap-4 rounded-2xl p-5 glass transition-transform hover:-translate-y-0.5"
      data-testid="unit-trainer"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
        <Timer className="size-6" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">Practise {RECOGNITION_LABEL[set]} on your cube</span>
        <span className="block text-sm text-muted-foreground">
          A scramble sets up each case; you solve it with your algorithm and the time is kept. Your
          slowest cases come round more often.
        </span>
      </span>
      <ArrowRight className="size-5 text-primary" />
    </Link>
  );
}

/** Your course's cut of this unit's lessons, when the unit is in your course. */
function lessonsInCourse(current: CourseState | null, unitId: string): UnitLesson[] | undefined {
  return current?.units.find((state) => state.unit.id === unitId)?.unit.lessons;
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
  const open = (lesson: UnitLesson) => !isDone(lesson.id);
  const firstOpen = courseLessons?.find(open) ?? unit.lessons.find(open);
  return (
    <section aria-labelledby="unit-lessons">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="unit-lessons" className="text-base font-semibold">
          Lessons
        </h2>
        {firstOpen ? (
          <Button asChild className="rounded-full" data-testid="unit-start">
            <Link href={lessonHref(unit.id, firstOpen.id)}>
              {unit.lessons.some((lesson) => isDone(lesson.id)) ? "Continue" : "Start"}{" "}
              <ArrowRight />
            </Link>
          </Button>
        ) : null}
      </div>
      <ol className="grid gap-2">
        {unit.lessons.map((lesson, index) => {
          const done = isDone(lesson.id);
          return (
            <motion.li
              key={lesson.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={lessonHref(unit.id, lesson.id)}
                data-testid={`unit-lesson-${lesson.id}`}
                className="group flex items-center gap-3 rounded-2xl p-4 glass transition-transform hover:-translate-y-0.5"
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-full border-2 transition-transform group-hover:scale-110",
                    done
                      ? "border-transparent bg-[var(--known)] text-white"
                      : "border-primary/40 text-primary",
                  )}
                >
                  {done ? <Check className="size-5" /> : <BookOpen className="size-5" />}
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{lesson.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    Lesson {index + 1} · {lesson.minutes} min{done ? " · done" : ""}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * What shows this unit worked: its measure against a course's pass line, how
 * it has moved since you started, and what to do to move it. The course is
 * yours when it has the unit, else the first course that teaches it.
 */
function UnitMeasure({ unit }: { unit: Unit }) {
  const hub = useHub();
  if (!hub.loaded || !hub.input) return <Skeleton className="h-28 rounded-2xl" />;
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
        className="rounded-2xl p-5 glass"
        data-testid="unit-measure"
      >
        <p className="text-xs text-muted-foreground">How this unit is finished</p>
        <p className="mt-0.5 font-semibold">
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
      className="flex flex-wrap items-center gap-4 rounded-2xl p-5 glass"
      data-testid="unit-measure"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          What shows this unit worked{line ? ` · ${course.title} pass line: ${line}` : ""}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 font-semibold">
          {measure.value === null
            ? measure.label
            : `${measure.label}: ${formatMeasureValue(measure, measure.value)}`}
          {measure.tag ? <PaceBadge tag={measure.tag} /> : null}
          {passed ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground"
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
        <Button asChild className="rounded-full" data-testid="unit-retest">
          <Link href={testHref(next.testId)}>
            {measure.value === null ? "Take the test" : "Retest"} <ArrowRight />
          </Link>
        </Button>
      ) : next?.kind === "timer" ? (
        <Button asChild className="rounded-full" data-testid="unit-retest">
          <Link href="/timer/">
            Open the timer <ArrowRight />
          </Link>
        </Button>
      ) : next?.kind === "recognition" ? (
        <Button asChild className="rounded-full" data-testid="unit-retest">
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
