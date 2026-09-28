"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye } from "lucide-react";
import { PackDetail } from "@/components/train/pack-detail";
import { Button } from "@/components/ui/button";
import { PaceBadge } from "@/components/coach/pace-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { testHref } from "@/data/exercises";
import { useHub } from "@/hooks/use-hub";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { getAspect } from "@/lib/coach/aspects";
import { formatAspectValue } from "@/lib/coach/profile-format";
import { sinceStarted } from "@/lib/hub/path";
import { usePackProgress } from "@/hooks/use-training-progress";
import { COURSES } from "@/data/hub/courses";
import {
  courseHref,
  coursesWithUnit,
  getUnit,
  lessonHref,
  recognitionHref,
  type Unit,
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

      {unit.kind === "pack" && unit.pack.aspectId ? <UnitMeasure unit={unit} /> : null}
      {unit.kind === "pack" ? <PackLessons unit={unit} /> : <MethodLessons unit={unit} />}
      {unit.recognition ? (
        <Link
          href={recognitionHref(unit.recognition)}
          className="group flex items-center gap-4 rounded-2xl p-5 glass transition-transform hover:-translate-y-0.5"
          data-testid="unit-recognition"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
            <Eye className="size-6" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">
              Recognition drill: name {unit.recognition.toUpperCase()} cases on sight
            </span>
            <span className="block text-sm text-muted-foreground">
              Twelve cases from two sides, timed. Finds the ones you&apos;re slowest to spot.
            </span>
          </span>
          <ArrowRight className="size-5 text-primary" />
        </Link>
      ) : null}
      {unit.kind === "pack" ? (
        <section aria-label="Everything in this pack">
          <PackDetail pack={unit.pack} />
        </section>
      ) : null}
    </div>
  );
}

function LessonList({ unit, isDone }: { unit: Unit; isDone: (lessonId: string) => boolean }) {
  const firstOpen = unit.lessons.find((lesson) => !isDone(lesson.id));
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
 * The number this unit is meant to move: where it stands, and how it has
 * changed since you started the unit, with the test that measures it.
 */
function UnitMeasure({ unit }: { unit: Extract<Unit, { kind: "pack" }> }) {
  const aspectId = unit.pack.aspectId!;
  const definition = getAspect(aspectId);
  const { loaded, profile, snapshots } = useSolveProfile({
    withSolves: definition.measuredBy === "timer",
  });
  const { progress } = usePackProgress(unit.pack);
  if (!loaded || !profile) return <Skeleton className="h-28 rounded-2xl" />;
  const aspect = profile.aspects.find((item) => item.id === aspectId)!;
  const change = sinceStarted(aspect, progress.startedAt, snapshots);
  const test = aspect.nextTest ?? definition.tests[0] ?? null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-4 rounded-2xl p-5 glass"
      data-testid="unit-measure"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">What this unit is meant to move</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 font-semibold">
          {aspect.value === null
            ? definition.label
            : `${definition.label}: ${formatAspectValue(definition.kind, aspect.value)}`}
          {aspect.tag ? <PaceBadge tag={aspect.tag} /> : null}
        </p>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="unit-since">
          {aspect.value === null
            ? "Not measured yet. Take the test to get a starting number."
            : !change
              ? "Start a lesson or drill, then retest to see it move."
              : change.before === null
                ? "Nothing measured from before you started. Your next retest is the one to beat."
                : `${formatAspectValue(definition.kind, change.before)} when you started → ${formatAspectValue(definition.kind, change.now)} now${
                    change.better === null
                      ? ""
                      : change.better
                        ? ". Moving the right way."
                        : ". Not moved yet: keep at the drills."
                  }`}
        </p>
      </div>
      {test ? (
        <Button asChild className="rounded-full" data-testid="unit-retest">
          <Link href={testHref(test)}>
            {aspect.value === null ? "Take the test" : "Retest"} <ArrowRight />
          </Link>
        </Button>
      ) : null}
    </motion.section>
  );
}

function PackLessons({ unit }: { unit: Extract<Unit, { kind: "pack" }> }) {
  const { progress } = usePackProgress(unit.pack);
  return <LessonList unit={unit} isDone={progress.isLessonDone} />;
}

function MethodLessons({ unit }: { unit: Unit }) {
  const hub = useHub();
  const done = hub.input?.methodDone;
  return <LessonList unit={unit} isDone={(id) => done?.has(id) ?? false} />;
}
