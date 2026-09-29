"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarCheck,
  Dumbbell,
  FlaskConical,
  Layers3,
  Map as MapIcon,
  MessagesSquare,
  Search,
} from "lucide-react";
import { DAILY_HREF } from "@/components/tests/daily-check-card";
import { Input } from "@/components/ui/input";
import { COURSES } from "@/data/hub/courses";
import { TEST_ORDER, testHref, testTitle } from "@/data/exercises";
import { ALGORITHM_SETS } from "@/lib/algorithms/catalog";
import { ALL_UNITS, courseHref, courseUnits, coursesWithUnit, unitHref } from "@/lib/hub/units";
import { cn } from "@/lib/utils";

/** Everything in the Learning Hub, to browse freely. */
export function Library() {
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);

  const units = useMemo(() => {
    const inCourse = courseId
      ? courseUnits(COURSES.find((course) => course.id === courseId)!)
      : ALL_UNITS;
    const words = query.trim().toLowerCase();
    return inCourse.filter(
      (unit) =>
        !words ||
        unit.title.toLowerCase().includes(words) ||
        unit.summary.toLowerCase().includes(words) ||
        unit.lessons.some((lesson) => lesson.title.toLowerCase().includes(words)),
    );
  }, [query, courseId]);

  return (
    <div className="grid grid-cols-1 gap-10">
      <section aria-labelledby="library-courses">
        <h2 id="library-courses" className="mb-3 text-base font-semibold">
          Courses
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COURSES.map((course, index) => {
            // Count the main line; optional units are off it, so they're shown apart.
            const courseUnitList = courseUnits(course);
            const mainLine = courseUnitList.filter((unit) => !unit.optional);
            const optional = courseUnitList.length - mainLine.length;
            const lessons = mainLine.reduce((total, unit) => total + unit.lessons.length, 0);
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, rotate: -0.5 }}
              >
                <Link
                  href={courseHref(course)}
                  data-testid={`library-course-${course.id}`}
                  className="flex h-full flex-col rounded-3xl p-5 text-white shadow-lg"
                  style={{
                    background: `linear-gradient(145deg, oklch(0.58 0.18 ${course.hue}), oklch(0.36 0.13 ${course.hue + 45}))`,
                  }}
                >
                  <span className="text-2xl font-bold tracking-tight">{course.title}</span>
                  <span className="mt-1 text-sm opacity-90">{course.tagline}</span>
                  <span className="mt-auto pt-4 text-xs opacity-80">
                    {mainLine.length} units · {lessons} lessons
                    {optional ? ` · +${optional} optional` : null}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="library-units">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="library-units" className="text-base font-semibold">
            Every unit <span className="text-muted-foreground">({units.length})</span>
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lessons"
              className="rounded-full pl-9"
              aria-label="Search units and lessons"
              data-testid="library-search"
            />
          </div>
        </div>
        <div className="mb-4 no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={courseId === null} onClick={() => setCourseId(null)}>
            All
          </FilterChip>
          {COURSES.map((course) => (
            <FilterChip
              key={course.id}
              active={courseId === course.id}
              onClick={() => setCourseId(course.id)}
              hue={course.hue}
              testId={`library-filter-${course.id}`}
            >
              {course.title}
            </FilterChip>
          ))}
        </div>
        <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {units.map((unit) => (
              <motion.div
                key={unit.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
              >
                <Link
                  href={unitHref(unit)}
                  data-testid={`library-unit-${unit.id}`}
                  className="flex h-full flex-col rounded-2xl p-4 glass transition-transform hover:-translate-y-0.5"
                >
                  <span className="font-semibold">{unit.title}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{unit.summary}</span>
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-3">
                    {coursesWithUnit(unit.id).map((course) => (
                      <span
                        key={course.id}
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                        style={{ background: `oklch(0.47 0.14 ${course.hue})` }}
                      >
                        {course.title}
                      </span>
                    ))}
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {unit.lessons.length} {unit.lessons.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <section aria-labelledby="library-more" className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 id="library-more" className="mb-3 text-base font-semibold">
            Tools and pages
          </h2>
          <div className="grid gap-2">
            <ToolLink
              href="/learn/"
              icon={MapIcon}
              title="The road, 2:00 to sub-10"
              text="Every level: where the time goes, what to do, and what to leave alone."
            />
            <ToolLink
              href="/coach/"
              icon={MessagesSquare}
              title="Coach"
              text="Pick a goal, take tests one at a time, and get tips for every part."
            />
            <ToolLink
              href={DAILY_HREF}
              icon={CalendarCheck}
              title="Daily check"
              text="Two attempts of each test, compared with your profile."
            />
            <ToolLink
              href="/train/"
              icon={Dumbbell}
              title="Your practice"
              text="The drills you chose to practise."
            />
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold">Algorithm sets</h2>
          <div className="grid grid-cols-2 gap-2">
            {ALGORITHM_SETS.map((set) => (
              <ToolLink
                key={set.id}
                href={`/algorithms/${set.id}/`}
                icon={Layers3}
                title={set.name}
                text={`${set.cases.length} cases`}
              />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="library-tests">
        <h2 id="library-tests" className="mb-3 text-base font-semibold">
          Tests
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TEST_ORDER.map((testId) => (
            <ToolLink
              key={testId}
              href={testHref(testId)}
              icon={FlaskConical}
              title={testTitle(testId)}
              text="Times one part of your solve"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  hue,
  testId,
  children,
}: {
  active: boolean;
  onClick: () => void;
  hue?: number;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-pressed={active}
      data-testid={testId}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? cn("border-transparent", hue === undefined ? "text-primary-foreground" : "text-white")
          : "bg-background/40 text-muted-foreground hover:text-foreground",
      )}
      style={
        active
          ? { background: hue === undefined ? "var(--primary)" : `oklch(0.5 0.16 ${hue})` }
          : undefined
      }
    >
      {children}
    </motion.button>
  );
}

function ToolLink({
  href,
  icon: Icon,
  title,
  text,
}: {
  href: string;
  icon: typeof Layers3;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl p-3.5 glass transition-transform hover:-translate-y-0.5"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:rotate-6">
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </Link>
  );
}
