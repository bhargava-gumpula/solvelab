"use client";

import { useMemo, useState, ViewTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarCheck,
  Dumbbell,
  FlaskConical,
  Layers3,
  Map as MapIcon,
  MessagesSquare,
  Search,
} from "lucide-react";
import { ProgressRing } from "@/components/fx/progress-ring";
import { Reveal } from "@/components/fx/reveal";
import { Tilt } from "@/components/fx/tilt";
import { DAILY_HREF } from "@/components/tests/daily-check-card";
import { useAlgorithmProgress } from "@/hooks/use-algorithms";
import { countLabels } from "@/lib/algorithms/labels";
import { Input } from "@/components/ui/input";
import { COURSES } from "@/data/hub/courses";
import { TEST_ORDER, testHref, testTitle } from "@/data/exercises";
import { ALGORITHM_SETS, progressIdFor } from "@/lib/algorithms/catalog";
import { ALL_UNITS, courseHref, courseUnits, coursesWithUnit, unitHref } from "@/lib/hub/units";
import { cn, plural } from "@/lib/utils";
import { CoverArt } from "./cover-art";
import { courseCoverName } from "./course-shelf";

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
        <SectionTitle id="library-courses" kicker="The shelf" title="Courses" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {COURSES.map((course, index) => {
            // Count the main line; optional units are off it, so they're shown apart.
            const courseUnitList = courseUnits(course);
            const mainLine = courseUnitList.filter((unit) => !unit.optional);
            const optional = courseUnitList.length - mainLine.length;
            const lessons = mainLine.reduce((total, unit) => total + unit.lessons.length, 0);
            return (
              <Reveal key={course.id} delay={index * 0.04}>
                <Link
                  href={courseHref(course)}
                  data-testid={`library-course-${course.id}`}
                  className="group block"
                >
                  <Tilt className="morph-lift rounded-[1.3rem] shadow-[var(--shadow-tile)] transition-shadow duration-500 group-hover:shadow-[var(--shadow-float)]">
                    <ViewTransition name={courseCoverName(course.id)} share="morph" default="none">
                      <CoverArt
                        hue={course.hue}
                        index={index * 3 + 1}
                        number={`Nº ${String(index + 1).padStart(2, "0")}`}
                        label={`${mainLine.length} units · ${lessons} lessons${optional ? ` · +${optional} optional` : ""}`}
                        className="aspect-square rounded-[1.3rem]"
                      />
                    </ViewTransition>
                  </Tilt>
                  <span className="mt-3 block font-display text-[1.6rem] leading-none md:text-[1.9rem]">
                    {course.title}
                  </span>
                  <span className="mt-1.5 block text-sm text-pretty text-muted-foreground">
                    {course.tagline}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="library-units">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            id="library-units"
            kicker="The index"
            title={
              <>
                Every unit{" "}
                <span className="font-figures text-lg text-muted-foreground">{units.length}</span>
              </>
            }
            className="mb-0"
          />
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
                  className="tile flex h-full flex-col p-5 transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <span className="font-display text-[1.45rem] leading-tight">{unit.title}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{unit.summary}</span>
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-3">
                    {coursesWithUnit(unit.id).map((course) => (
                      <span
                        key={course.id}
                        className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full"
                          style={{ background: `oklch(0.6 0.17 ${course.hue})` }}
                        />
                        {course.title}
                      </span>
                    ))}
                    <span className="rounded-full px-1 py-0.5 text-[11px] text-muted-foreground">
                      {plural(unit.lessons.length, "lesson")}
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
          <SectionTitle id="library-more" kicker="Around the studio" title="Tools and pages" />
          <div className="tile divide-y divide-[var(--hairline)] px-1">
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
          <SectionTitle kicker="Your collection" title="Algorithm sets" />
          <AlgorithmShelf />
        </div>
      </section>

      <section aria-labelledby="library-tests">
        <SectionTitle id="library-tests" kicker="Measure" title="Tests" />
        <div className="tile grid divide-y divide-[var(--hairline)] px-1 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
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
        "relative flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-300",
        active
          ? "border-transparent text-background"
          : "border-[var(--hairline)] bg-[var(--tile)] text-muted-foreground hover:text-foreground",
      )}
    >
      {/* One ink pill slides to whichever filter is on. */}
      {active ? (
        <motion.span
          layoutId="library-filter-pill"
          className="absolute inset-0 -z-0 rounded-full bg-foreground"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}
      {hue !== undefined ? (
        <span
          aria-hidden
          className="relative size-2 rounded-full"
          style={{ background: `oklch(0.6 0.17 ${hue})` }}
        />
      ) : null}
      <span className="relative">{children}</span>
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
      className="group flex items-start gap-3 rounded-[1.2rem] px-4 py-3.5 transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:-rotate-6">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function SectionTitle({
  id,
  kicker,
  title,
  className,
}: {
  id?: string;
  kicker: string;
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      <p className="eyebrow">{kicker}</p>
      <h2 id={id} className="mt-1.5 font-display text-[2.1rem] leading-none md:text-[2.5rem]">
        {title}
      </h2>
    </div>
  );
}

/** Each algorithm set as a ring: how much of it you know, and how much you're learning. */
function AlgorithmShelf() {
  const { labels } = useAlgorithmProgress();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ALGORITHM_SETS.map((set) => {
        const counts = countLabels(
          set.cases.map((entry) => progressIdFor(entry)),
          labels,
        );
        const known = counts.total ? counts.known / counts.total : 0;
        return (
          <Link
            key={set.id}
            href={`/algorithms/${set.id}/`}
            className="group tile flex flex-col items-center gap-2 px-3 py-4 text-center transition-transform duration-300 hover:-translate-y-0.5"
          >
            <ProgressRing
              value={known}
              size={58}
              stroke={4}
              label={`${set.name}: ${counts.known} of ${counts.total} known`}
            >
              <span className="font-figures tabular text-[13px] font-semibold">
                {counts.known}
                <span className="text-muted-foreground">/{counts.total}</span>
              </span>
            </ProgressRing>
            <span className="text-sm leading-tight font-semibold">{set.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {counts.learning ? `${counts.learning} learning` : `${set.cases.length} cases`}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
