"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookMarked,
  Bot,
  ClipboardList,
  Compass,
  Dumbbell,
  GraduationCap,
  Rocket,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { PaceBadge } from "@/components/coach/pace-badge";
import { DailyCheckCard } from "@/components/tests/daily-check-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COURSES, getCourse, nextCourse, type CourseDefinition } from "@/data/hub/courses";
import { testHref, testTitle } from "@/data/exercises";
import { useHub } from "@/hooks/use-hub";
import { PROFILE_HREF } from "@/lib/config/navigation";
import type { SolveProfile } from "@/lib/coach/profile";
import { beatenCourse, courseState, courseTargetMs, type CourseState } from "@/lib/hub/path";
import { courseHref, lessonHref } from "@/lib/hub/units";
import { cn } from "@/lib/utils";
import { CoursePath } from "./course-path";
import { CountUp } from "./fx";

const START_HREF = "/hub/start/";

function seconds(ms: number): number {
  return Math.round(ms / 100) / 10;
}

function HubSkeleton() {
  return (
    <div className="grid gap-5">
      <Skeleton className="h-52 rounded-3xl" />
      <Skeleton className="h-12 rounded-full" />
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}

/** The Hub's front page: your course, what's next, and the path to get there. */
export function HubHome() {
  const hub = useHub();
  if (!hub.loaded) return <HubSkeleton />;
  if (!hub.placement || !hub.current) return <Welcome />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid min-w-0 grid-cols-1 content-start gap-6">
        {!hub.intro?.completedAt ? <SetupBanner answered={Boolean(hub.intro)} /> : null}
        <CourseHero
          state={hub.current}
          average={hub.average}
          placedBy={hub.placement.source}
          current
        />
        <CourseSwitcher currentId={hub.current.course.id} activeId={hub.current.course.id} />
        <CoursePath state={hub.current} />
      </div>
      <aside className="grid content-start gap-4 lg:sticky lg:top-28">
        {hub.profile ? (
          <ProfileSnapshot
            profile={hub.profile}
            nextTest={hub.testPlan?.testId ?? hub.profile.nextTest}
          />
        ) : null}
        <DailyCheckCard />
        <SideLink
          href="/hub/ask/"
          icon={Bot}
          title="Ask your AI coach"
          text="Claude, ChatGPT or Gemini, told what your profile shows."
        />
        <SideLink
          href="/train/"
          icon={Dumbbell}
          title="Your practice"
          text="Drills you chose to practise, with their rules and timer."
        />
        <SideLink
          href="/hub/library/"
          icon={BookMarked}
          title="Library"
          text="Every course, pack, lesson, test and algorithm set."
        />
      </aside>
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
  if (!hub.loaded || !state) return <HubSkeleton />;
  const isCurrent = hub.placement?.course.id === course.id;
  return (
    <div className="grid grid-cols-1 gap-6">
      <CourseHero
        state={state}
        average={hub.average}
        placedBy={isCurrent ? hub.placement!.source : null}
        current={isCurrent}
      />
      <CourseSwitcher currentId={hub.placement?.course.id ?? null} activeId={course.id} />
      <CoursePath state={state} />
    </div>
  );
}

function Welcome() {
  const steps = [
    { icon: ClipboardList, title: "Tell us where you are", text: "A few quick questions." },
    { icon: Timer, title: "Show us", text: "Some timer solves and short tests." },
    { icon: Compass, title: "Get your path", text: "A course built around your weak spots." },
  ];
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-8 text-center glass md:p-14"
      data-testid="hub-welcome"
    >
      <motion.span
        className="mx-auto grid size-20 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-[0_0_60px_-8px_var(--glow)]"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
      >
        <GraduationCap className="size-10" />
      </motion.span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
        Welcome to the Learning Hub
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        Courses from sub-60 to sub-10, built from what&apos;s actually slowing you down. First, a
        few minutes to find your level.
      </p>
      <div className="mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.12, type: "spring", stiffness: 160 }}
            className="rounded-2xl border bg-background/40 p-4 text-left"
          >
            <step.icon className="size-5 text-primary" />
            <p className="mt-2 font-semibold">
              {index + 1}. {step.title}
            </p>
            <p className="text-sm text-muted-foreground">{step.text}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="mt-8 inline-block"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button asChild size="lg" className="rounded-full px-8 text-base" data-testid="find-level">
          <Link href={START_HREF}>
            Find my level <Rocket />
          </Link>
        </Button>
      </motion.div>
      <p className="mt-4 text-sm text-muted-foreground">
        Or{" "}
        <Link href="/hub/library/" className="text-primary underline-offset-4 hover:underline">
          browse everything
        </Link>{" "}
        first.
      </p>
    </section>
  );
}

function SetupBanner({ answered }: { answered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4"
      data-testid="setup-banner"
    >
      <Sparkles className="size-5 text-primary" />
      <p className="flex-1 text-sm">
        {answered
          ? "Finish finding your level: a few solves and tests make your path much sharper."
          : "Answer a few questions and take some tests so your path fits you."}
      </p>
      <Button asChild size="sm" className="rounded-full">
        <Link href={START_HREF}>
          {answered ? "Continue" : "Find my level"} <ArrowRight />
        </Link>
      </Button>
    </motion.div>
  );
}

function CourseHero({
  state,
  average,
  placedBy,
  current,
}: {
  state: CourseState;
  average: number | null;
  placedBy: "average" | "answer" | "goal" | null;
  current: boolean;
}) {
  const { course, next } = state;
  const target = courseTargetMs(course);
  const beaten = beatenCourse(course, average);
  const after = nextCourse(course);
  const share = state.lessonTotal ? state.lessonsDone / state.lessonTotal : 0;
  const nextLesson = next?.unit.unit.lessons.find((lesson) => lesson.id === next.lessonId);
  // The test that would settle the most units that are read and waiting.
  const retest = state.retestsDue[0] ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
      className="relative overflow-hidden rounded-3xl p-6 text-white md:p-8"
      style={{
        background: `radial-gradient(120% 140% at 0% 0%, oklch(0.6 0.19 ${course.hue}), oklch(0.32 0.12 ${course.hue + 50}))`,
      }}
      data-testid="course-hero"
    >
      <motion.div
        aria-hidden
        className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-2xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <p className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-80">
        {current ? "Your course" : "Course"}
        {current && placedBy
          ? ` · placed by your ${placedBy === "average" ? "timer average" : placedBy === "answer" ? "answers" : "goal"}`
          : ""}
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl" data-testid="course-title">
            {course.title}
          </h1>
          <p className="mt-1 max-w-md opacity-90">{course.tagline}</p>
        </div>
        <div className="flex gap-6 text-right">
          {average !== null ? (
            <div>
              <p className="text-xs opacity-75">Your average</p>
              <p className="text-2xl font-semibold">
                <CountUp value={seconds(average)} decimals={1} suffix=" s" />
              </p>
            </div>
          ) : null}
          {target !== null ? (
            <div>
              <p className="text-xs opacity-75">Target</p>
              <p className="text-2xl font-semibold">
                <Target className="mr-1 inline size-5 opacity-80" />
                {target >= 60000 ? `${target / 60000}:00` : `${target / 1000} s`}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/25">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${share * 100}%` }}
            transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.2 }}
          />
        </div>
        <span className="tabular text-sm" data-testid="course-progress">
          {state.lessonsDone}/{state.lessonTotal} lessons
        </span>
      </div>
      <p className="mt-2 text-sm opacity-90" data-testid="course-units">
        {state.unitsFinished} of {state.unitTotal} units finished
        {state.awaiting.length
          ? ` · ${state.awaiting.length} read and waiting on a test or a drill`
          : ""}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {next && nextLesson ? (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white px-6 text-base text-black shadow-[0_6px_0_rgb(0_0_0/0.25)] hover:bg-white"
              data-testid="continue-lesson"
            >
              <Link href={lessonHref(next.unit.unit.id, next.lessonId)}>
                {state.lessonsDone ? "Continue" : "Start"}: {nextLesson.title} <ArrowRight />
              </Link>
            </Button>
          </motion.div>
        ) : (
          <p className="rounded-full bg-white/20 px-4 py-2 text-sm" data-testid="course-done">
            {state.awaiting.length
              ? `Every lesson read. ${state.awaiting.length} ${
                  state.awaiting.length === 1 ? "unit waits" : "units wait"
                } on a test or a drill.`
              : "Every unit finished. Keep the timer going until your average is under the target."}
          </p>
        )}
        {retest ? (
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/50 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            data-testid="course-retest"
          >
            <Link href={testHref(retest.testId)}>
              <Trophy /> {testTitle(retest.testId)}
              {retest.units.length > 1 ? ` (settles ${retest.units.length} units)` : ""}
            </Link>
          </Button>
        ) : null}
        {beaten && after ? (
          <Button asChild variant="secondary" className="rounded-full" data-testid="move-on">
            <Link href={courseHref(after)}>
              <TrendingUp /> You&apos;re under it: try {after.title}
            </Link>
          </Button>
        ) : null}
      </div>
    </motion.section>
  );
}

function CourseSwitcher({ currentId, activeId }: { currentId: string | null; activeId: string }) {
  const active = useRef<HTMLAnchorElement>(null);
  // Keep the course you're looking at in view on narrow screens.
  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeId]);
  return (
    <nav aria-label="Courses" className="-mx-1 no-scrollbar overflow-x-auto px-1 pb-1">
      <ol className="flex w-max gap-2">
        {COURSES.map((course: CourseDefinition, index) => {
          const isActive = course.id === activeId;
          const here = course.id === currentId;
          return (
            <motion.li
              key={course.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link
                ref={isActive ? active : undefined}
                href={here ? "/hub/" : courseHref(course)}
                aria-current={isActive ? "page" : undefined}
                data-testid={`course-chip-${course.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5",
                  isActive
                    ? "border-transparent text-white shadow-md"
                    : "bg-background/40 text-muted-foreground hover:text-foreground",
                )}
                style={isActive ? { background: `oklch(0.5 0.16 ${course.hue})` } : undefined}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: `oklch(0.7 0.18 ${course.hue})` }}
                />
                {course.title}
                {here ? <span className="text-[10px] opacity-80">· you</span> : null}
              </Link>
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

function ProfileSnapshot({
  profile,
  nextTest,
}: {
  profile: SolveProfile;
  nextTest: string | null;
}) {
  const measured = profile.aspects.filter((aspect) => aspect.tag && !aspect.definition.outcome);
  const slow = measured.filter((aspect) => aspect.tag === "slow").slice(0, 3);
  const fast = measured.filter((aspect) => aspect.tag === "fast").slice(0, 2);
  return (
    <section className="rounded-2xl p-4 glass" data-testid="profile-snapshot">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Your solve profile</p>
        <span className="tabular text-xs text-muted-foreground">
          {profile.coreDone}/{profile.coreTotal} tests
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(profile.coreDone / Math.max(1, profile.coreTotal)) * 100}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </div>
      {measured.length ? (
        <ul className="mt-3 grid gap-1.5 text-sm">
          {slow.map((aspect) => (
            <li key={aspect.id} className="flex items-center gap-2">
              <TrendingDown className="size-3.5 text-destructive" />
              <span className="flex-1">{aspect.definition.label}</span>
              <PaceBadge tag="slow" />
            </li>
          ))}
          {fast.map((aspect) => (
            <li key={aspect.id} className="flex items-center gap-2">
              <TrendingUp className="size-3.5 text-[var(--known)]" />
              <span className="flex-1">{aspect.definition.label}</span>
              <PaceBadge tag="fast" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing measured yet. Each test times one part of your solve.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {nextTest ? (
          <Button asChild size="sm" className="rounded-full" data-testid="snapshot-next-test">
            <Link href={testHref(nextTest)}>{testTitle(nextTest)}</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href={PROFILE_HREF}>Full profile</Link>
        </Button>
      </div>
    </section>
  );
}

function SideLink({
  href,
  icon: Icon,
  title,
  text,
}: {
  href: string;
  icon: typeof Dumbbell;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl p-4 glass transition-transform hover:-translate-y-0.5"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:rotate-6">
        <Icon className="size-4.5" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </Link>
  );
}
