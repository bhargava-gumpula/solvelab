"use client";

/*
 * Draft only: three more ways to lay out the Learning Hub's front page, each a
 * different idea rather than a restyle of Focus, Roadmap or Board.
 *
 *   Trail    — the course as a winding trail of stops, like a level map: you
 *              stand on one glowing stop with its lesson; passed stops fold away,
 *              the finish flag at the end is the target time.
 *   Plan     — the course as a training plan towards a time: your average and
 *              the target on one line, today's lesson, then the next sessions.
 *   Chapter  — one lesson on stage at a time: a story bar of every unit across
 *              the top, the lesson in the middle, what's next peeking in.
 *
 * All three keep the Hub's test ids (course-hero, course-title, course-progress,
 * continue-lesson, course-path with one section per unit) and use only the
 * course state the Hub already computes.
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Clock, Flag, Sparkles, Trophy } from "lucide-react";
import { ProgressRing } from "@/components/fx/progress-ring";
import {
  courseTargetMs,
  type CourseState,
  type Placement,
  type UnitPick,
  type UnitState,
} from "@/lib/hub/path";
import { lessonHref, unitHref, type UnitLesson } from "@/lib/hub/units";
import { cn } from "@/lib/utils";
import { plainReason } from "./reason";

export interface HubLayoutProps {
  state: CourseState;
  averageMs: number | null;
  placedBy: Placement["source"] | null;
}

/* ───────────── shared ───────────── */

export function placedByText(source: Placement["source"] | null): string {
  if (!source) return "";
  return `placed by your ${source === "average" ? "timer average" : source === "answer" ? "answers" : "goal"}`;
}

export function formatSeconds(ms: number): string {
  if (ms >= 60_000) {
    const minutes = Math.floor(ms / 60_000);
    const rest = Math.round((ms % 60_000) / 1000);
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

/** The one primary action on every layout. */
export function StartLessonButton({
  state,
  size = "lg",
  className,
}: {
  state: CourseState;
  size?: "lg" | "xl";
  className?: string;
}) {
  const next = state.next;
  if (!next) return null;
  return (
    <Link
      href={lessonHref(next.unit.unit.id, next.lessonId)}
      data-testid="continue-lesson"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_var(--primary)] transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        size === "xl" ? "h-14 px-8 text-[17px]" : "h-12 px-7 text-[16px]",
        className,
      )}
    >
      Start lesson <ArrowRight className="size-5" aria-hidden />
    </Link>
  );
}

export function PickLabel({ pick }: { pick: UnitPick | null }) {
  if (!pick) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary">
      <Sparkles className="size-3" aria-hidden />
      {pick.source === "said" ? "You flagged this" : "Picked for you"}
    </span>
  );
}

function minutesOf(unit: UnitState) {
  return unit.unit.lessons.reduce((sum, lesson) => sum + (lesson.minutes ?? 0), 0);
}

interface Upcoming {
  unit: UnitState;
  lesson: UnitLesson;
  /** 1-based position in its unit. */
  number: number;
}

/** The lessons still to read, in path order, starting with the next one. */
function upcomingLessons(state: CourseState, count: number): Upcoming[] {
  const next = state.next;
  if (!next) return [];
  const start = state.units.indexOf(next.unit);
  const order = [...state.units.slice(start), ...state.units.slice(0, start)];
  const out: Upcoming[] = [];
  for (const unit of order) {
    if (unit.done) continue;
    const lessons = unit.unit.lessons;
    const from =
      unit === next.unit ? lessons.findIndex((lesson) => lesson.id === next.lessonId) : 0;
    for (let index = Math.max(0, from); index < lessons.length; index++) {
      if (unit.isLessonDone(lessons[index].id)) continue;
      out.push({ unit, lesson: lessons[index], number: index + 1 });
      if (out.length >= count) return out;
    }
  }
  return out;
}

function nextLesson(state: CourseState): Upcoming | null {
  return upcomingLessons(state, 1)[0] ?? null;
}

function CourseDone({ state }: { state: CourseState }) {
  return (
    <div className="tile p-7">
      <p className="text-[13px] font-semibold tracking-[0.12em] text-primary uppercase">
        Course complete
      </p>
      <h2 className="mt-2 font-display text-[2.2rem] leading-tight">
        Every unit in {state.course.title} is done.
      </h2>
      <Link
        href="/hub/library/"
        className="mt-3 inline-block text-[15px] text-primary hover:underline"
      >
        Pick your next course
      </Link>
    </div>
  );
}

/** Every unit as a section, in path order (the Hub's course-path contract). */
function UnitOutline({ state }: { state: CourseState }) {
  return (
    <div data-testid="course-path" className="grid gap-1.5">
      {state.units.map((unit, index) => (
        <section
          key={unit.unit.id}
          data-testid={`unit-${unit.unit.id}`}
          aria-label={unit.unit.title}
          className="flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
        >
          <span
            className={cn(
              "grid size-7 flex-none place-items-center rounded-full border text-[12px] font-semibold",
              unit.done
                ? "border-primary bg-primary text-primary-foreground"
                : "border-hairline text-muted-foreground",
            )}
          >
            {unit.done ? <Check className="size-3.5" aria-hidden /> : index + 1}
          </span>
          <Link href={unitHref(unit.unit)} className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-medium">{unit.unit.title}</span>
            <span className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted-foreground">
              {unit.status === "passed" && unit.lessonsDone < unit.lessonTotal
                ? "Passed by your tests"
                : `${unit.lessonsDone} of ${unit.lessonTotal} lessons`}
              <PickLabel pick={unit.pick} />
            </span>
          </Link>
        </section>
      ))}
    </div>
  );
}

function Fold({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="tile p-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-medium"
      >
        {label}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div hidden={!open} className="px-1 pb-2">
        {children}
      </div>
    </div>
  );
}

/* ───────────── D. Trail ───────────── */

/** Horizontal sway of each stop, in px: a slow S down the page. */
const SWAY = [0, 48, 80, 64, 22, -8, 0, 36];
const NODE = { now: 68, done: 36, later: 46, fold: 36 } as const;

type TrailStop =
  | { kind: "unit"; unit: UnitState; index: number; status: "done" | "now" | "later" }
  | { kind: "passed"; units: { unit: UnitState; index: number }[] }
  | { kind: "more"; units: { unit: UnitState; index: number }[] };

function trailStops(state: CourseState, showAll: boolean, openPassed: boolean): TrailStop[] {
  const nowId = state.next?.unit.unit.id;
  const stops: TrailStop[] = [];
  let run: { unit: UnitState; index: number }[] = [];
  const flush = () => {
    if (run.length >= 2 && !openPassed) stops.push({ kind: "passed", units: run });
    else
      run.forEach(({ unit, index }) => stops.push({ kind: "unit", unit, index, status: "done" }));
    run = [];
  };
  let laterShown = 0;
  const hiddenLater: { unit: UnitState; index: number }[] = [];
  state.units.forEach((unit, index) => {
    if (unit.done) {
      run.push({ unit, index });
      return;
    }
    flush();
    const status = unit.unit.id === nowId ? "now" : "later";
    if (status === "later") {
      laterShown += 1;
      if (!showAll && laterShown > 3) {
        hiddenLater.push({ unit, index });
        return;
      }
    }
    stops.push({ kind: "unit", unit, index, status });
  });
  flush();
  if (hiddenLater.length) stops.push({ kind: "more", units: hiddenLater });
  return stops;
}

function TrailLayout({ state, averageMs, placedBy }: HubLayoutProps) {
  const [showAll, setShowAll] = useState(false);
  const [openPassed, setOpenPassed] = useState(false);
  const target = courseTargetMs(state.course);
  const stops = trailStops(state, showAll, openPassed);
  const upNext = nextLesson(state);

  const size = (stop: TrailStop) => (stop.kind === "unit" ? NODE[stop.status] : NODE.fold);
  // Stop i sits centred on this x (px from the left); the finish flag is stop stops.length.
  const base = 18;
  const centre = (i: number) => base + SWAY[i % SWAY.length] + 34;

  return (
    <div className="grid gap-8">
      <header data-testid="course-hero" className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] text-muted-foreground">
            Your course{placedBy ? ` · ${placedByText(placedBy)}` : ""}
          </p>
          <h1
            data-testid="course-title"
            className="font-display text-[2.6rem] leading-none md:text-[3.2rem]"
          >
            {state.course.title}
          </h1>
        </div>
        <p className="text-[14px] text-muted-foreground">
          <span data-testid="course-progress" className="font-semibold text-foreground">
            {state.lessonsDone}/{state.lessonTotal}
          </span>{" "}
          lessons · {state.unitsFinished} of {state.units.length} stops passed
        </p>
        <p className="text-[13px] text-muted-foreground" data-testid="course-units">
          {state.unitsFinished} of {state.unitTotal} units finished
          {state.awaiting.length
            ? ` · ${state.awaiting.length} read and waiting on a test or a drill`
            : ""}
        </p>
      </header>

      {!state.next ? <CourseDone state={state} /> : null}

      <ol
        data-testid="course-path"
        aria-label="Your trail"
        className="mx-auto grid w-full max-w-3xl md:pl-[8%]"
      >
        {stops.map((stop, i) => {
          const s = size(stop);
          const fromX = centre(i);
          const toX = centre(i + 1);
          const walked = stop.kind === "passed" || (stop.kind === "unit" && stop.status === "done");
          return (
            <li
              key={stop.kind === "unit" ? stop.unit.unit.id : `${stop.kind}-${i}`}
              className="relative"
            >
              {stop.kind === "unit" && stop.status === "now" ? (
                // Down from the big stop, past its card, to where the trail curves on.
                <span
                  aria-hidden
                  className="absolute bottom-0 w-0 border-l-[3px] border-dotted border-[color-mix(in_oklab,var(--foreground)_28%,transparent)]"
                  style={{ left: fromX - 1.5, top: s + 6 }}
                />
              ) : null}
              <div className="flex items-start gap-4" style={{ paddingLeft: centre(i) - s / 2 }}>
                {stop.kind === "unit" ? (
                  <TrailUnit stop={stop} size={s} state={state} upNext={upNext} />
                ) : stop.kind === "passed" ? (
                  <button
                    type="button"
                    onClick={() => setOpenPassed(true)}
                    className="flex items-center gap-4 text-left"
                    data-testid="path-show-passed"
                  >
                    <span
                      className="grid flex-none place-items-center rounded-full bg-primary/85 text-primary-foreground"
                      style={{ width: s, height: s }}
                    >
                      <Check className="size-4" aria-hidden />
                    </span>
                    <span className="text-[14px] text-muted-foreground">
                      {stop.units.length} stops already passed ·{" "}
                      <span className="text-primary">show them</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="flex items-center gap-4 text-left"
                  >
                    <span
                      className="border-hairline grid flex-none place-items-center rounded-full border-2 border-dashed text-[12px] text-muted-foreground"
                      style={{ width: s, height: s }}
                    >
                      +{stop.units.length}
                    </span>
                    <span className="text-[14px] text-muted-foreground">
                      {stop.units.length} more stops ·{" "}
                      <span className="text-primary">show the rest</span>
                    </span>
                  </button>
                )}
              </div>
              {stop.kind !== "unit"
                ? stop.units.map(({ unit }) => (
                    <section
                      key={unit.unit.id}
                      data-testid={`unit-${unit.unit.id}`}
                      aria-label={unit.unit.title}
                      hidden
                    />
                  ))
                : null}
              {/* The trail from this stop to the next. */}
              <svg
                aria-hidden
                className="block h-10 w-full overflow-visible"
                preserveAspectRatio="none"
              >
                <path
                  d={`M ${fromX} 0 C ${fromX} 22, ${toX} 18, ${toX} 40`}
                  fill="none"
                  stroke={
                    walked
                      ? "var(--primary)"
                      : "color-mix(in oklab, var(--foreground) 28%, transparent)"
                  }
                  strokeWidth={walked ? 4 : 3}
                  strokeDasharray={walked ? undefined : "2 9"}
                  strokeLinecap="round"
                  opacity={walked ? 0.7 : 1}
                />
              </svg>
            </li>
          );
        })}
        <li className="flex items-center gap-4" style={{ paddingLeft: centre(stops.length) - 26 }}>
          <span className="grid size-[52px] flex-none place-items-center rounded-2xl border-2 border-primary/60 bg-background text-primary">
            <Flag className="size-5" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold">
              Finish: {state.course.title}
              {target !== null ? ` · under ${formatSeconds(target)}` : ""}
            </span>
            <span className="text-[13px] text-muted-foreground">
              {averageMs !== null
                ? `Your average today: ${formatSeconds(averageMs)}`
                : "Time a few solves to see how far you are."}
            </span>
          </span>
        </li>
      </ol>
    </div>
  );
}

function TrailUnit({
  stop,
  size,
  state,
  upNext,
}: {
  stop: Extract<TrailStop, { kind: "unit" }>;
  size: number;
  state: CourseState;
  upNext: Upcoming | null;
}) {
  const { unit, index, status } = stop;
  if (status === "now") {
    return (
      <section
        data-testid={`unit-${unit.unit.id}`}
        aria-label={unit.unit.title}
        className="flex min-w-0 flex-1 items-start gap-4"
      >
        <span
          className="relative grid flex-none place-items-center"
          style={{ width: size, height: size }}
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/30 motion-safe:animate-[ping_2.6s_ease-out_infinite]"
          />
          <span className="relative grid size-full place-items-center rounded-full bg-primary font-display text-[1.7rem] text-primary-foreground shadow-[0_0_0_7px_color-mix(in_oklab,var(--primary)_22%,transparent)]">
            {index + 1}
          </span>
        </span>
        <div className="tile relative min-w-0 flex-1 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-semibold text-primary">
              You are here
            </span>
            {unit.unit.optional ? (
              <span
                className="rounded-full border border-[var(--hairline)] px-2 py-0.5 text-muted-foreground"
                data-testid={`optional-${unit.unit.id}`}
              >
                Optional
              </span>
            ) : null}
            <span className="text-muted-foreground">
              Stop {index + 1} · {unit.unit.title}
            </span>
          </div>
          {upNext ? (
            <>
              <h2 className="mt-3 font-display text-[1.9rem] leading-[1.05] text-balance md:text-[2.4rem]">
                {upNext.lesson.title}
              </h2>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                Lesson {upNext.number} of {unit.lessonTotal}
                {upNext.lesson.minutes ? ` · about ${upNext.lesson.minutes} min` : ""}
              </p>
            </>
          ) : null}
          <div
            className="mt-4 flex items-center gap-1.5"
            aria-label={`${unit.lessonsDone} of ${unit.lessonTotal} lessons done`}
          >
            {unit.unit.lessons.map((lesson) => (
              <span
                key={lesson.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  unit.isLessonDone(lesson.id)
                    ? "bg-primary"
                    : lesson.id === upNext?.lesson.id
                      ? "bg-primary/40"
                      : "bg-muted",
                )}
              />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <StartLessonButton state={state} />
            <PickLabel pick={unit.pick} />
          </div>
          {unit.pick ? (
            <p className="mt-3 text-[13.5px] text-pretty text-muted-foreground">
              {plainReason(unit.pick.reason)}
            </p>
          ) : null}
        </div>
      </section>
    );
  }
  const done = status === "done";
  return (
    <section
      data-testid={`unit-${unit.unit.id}`}
      aria-label={unit.unit.title}
      className="flex min-w-0 items-center gap-4"
    >
      <Link
        href={unitHref(unit.unit)}
        aria-label={`Stop ${index + 1}: ${unit.unit.title}`}
        className={cn(
          "grid flex-none place-items-center rounded-full text-[14px] font-semibold transition-transform hover:scale-105",
          done
            ? "bg-primary/85 text-primary-foreground"
            : "border-hairline border-2 bg-background/60 text-muted-foreground backdrop-blur",
        )}
        style={{ width: size, height: size }}
      >
        {done ? <Check className="size-4" aria-hidden /> : index + 1}
      </Link>
      <Link href={unitHref(unit.unit)} className="flex min-w-0 flex-col">
        <span className={cn("text-[15px] font-medium", done && "text-muted-foreground")}>
          {unit.unit.title}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted-foreground">
          {done
            ? unit.status === "passed" && unit.lessonsDone < unit.lessonTotal
              ? "Passed by your tests"
              : "Done"
            : `${unit.lessonTotal} lessons · ${minutesOf(unit)} min`}
          {unit.unit.optional ? (
            <span
              className="rounded-full border border-[var(--hairline)] px-1.5 py-px"
              data-testid={`optional-${unit.unit.id}`}
            >
              Optional
            </span>
          ) : null}
          {unit.status === "passed" ? (
            <span
              className="inline-flex items-center gap-1 text-primary"
              data-testid={`status-${unit.unit.id}`}
            >
              <Trophy className="size-3" /> Passed
            </span>
          ) : unit.status === "practised" || unit.status === "read" ? (
            <span data-testid={`status-${unit.unit.id}`}>
              {unit.status === "practised" ? "Practised" : "Read"}
            </span>
          ) : null}
          <PickLabel pick={unit.pick} />
        </span>
      </Link>
    </section>
  );
}

/* ───────────── E. Plan ───────────── */

function PlanLayout({ state, averageMs, placedBy }: HubLayoutProps) {
  const target = courseTargetMs(state.course);
  const sessions = upcomingLessons(state, 6);
  const today = sessions[0] ?? null;
  const rest = sessions.slice(1);
  const remaining = state.lessonTotal - state.lessonsDone;
  const share = state.lessonTotal ? state.lessonsDone / state.lessonTotal : 0;

  // The time line runs from a little above your average down to the target.
  let line: { from: number; to: number; you: number; toGo: number } | null = null;
  if (target !== null && averageMs !== null) {
    const top = Math.max(averageMs, target) * 1.15;
    const you = Math.min(1, Math.max(0, (top - averageMs) / (top - target)));
    line = { from: top, to: target, you, toGo: averageMs - target };
  }

  return (
    <div className="grid gap-8">
      <header
        data-testid="course-hero"
        className="tile grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6 md:p-8"
      >
        <div className="flex min-w-0 flex-col gap-3 md:gap-4">
          <p className="text-[13px] text-muted-foreground">
            Your plan{placedBy ? ` · ${placedByText(placedBy)}` : ""}
          </p>
          <h1 className="flex flex-wrap items-baseline gap-x-3 font-display text-[2.3rem] leading-none md:text-[3rem]">
            <span data-testid="course-title">{state.course.title}</span>
            {line ? (
              <span className="text-[1.1rem] text-muted-foreground md:text-[1.3rem]">
                {line.toGo > 0 ? `${formatSeconds(line.toGo)} to go` : "you're already under"}
              </span>
            ) : null}
          </h1>
          {line ? (
            <div className="grid gap-2">
              <div className="relative h-3 rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/40 to-primary"
                  style={{ width: `${line.you * 100}%` }}
                />
                <span
                  className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-primary"
                  style={{ left: `${line.you * 100}%` }}
                  aria-hidden
                />
                <Flag
                  className="absolute top-1/2 -right-1 size-4 -translate-y-1/2 text-primary"
                  aria-hidden
                />
              </div>
              <div className="flex justify-between text-[13px] text-muted-foreground">
                <span>
                  You:{" "}
                  <span className="font-semibold text-foreground">{formatSeconds(averageMs!)}</span>
                </span>
                <span>
                  Target:{" "}
                  <span className="font-semibold text-foreground">{formatSeconds(target!)}</span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-muted-foreground">
              Time a few solves on the timer and your plan shows how far you are from{" "}
              {target !== null ? formatSeconds(target) : "the target"}.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 md:flex-col md:items-center">
          <ProgressRing
            value={share}
            size={92}
            stroke={9}
            label={`${Math.round(share * 100)}% of lessons done`}
            className="max-md:hidden"
          >
            <span aria-hidden className="font-display text-[1.35rem]">
              {Math.round(share * 100)}%
            </span>
          </ProgressRing>
          <span className="text-[13px] text-muted-foreground md:text-center">
            <span data-testid="course-progress" className="font-semibold text-foreground">
              {state.lessonsDone}/{state.lessonTotal}
            </span>{" "}
            lessons · {state.unitsFinished} of {state.units.length} units
          </span>
        </div>
      </header>

      {today ? (
        <section aria-labelledby="plan-today" className="grid gap-4">
          <h2
            id="plan-today"
            className="text-[13px] font-semibold tracking-[0.12em] text-primary uppercase"
          >
            Today
          </h2>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-[14px] text-muted-foreground">
                Session {state.lessonsDone + 1} · {today.unit.unit.title}
              </p>
              <p className="font-display text-[2.4rem] leading-[1.02] text-balance md:text-[3.2rem]">
                {today.lesson.title}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted-foreground">
                {today.lesson.minutes ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden /> About {today.lesson.minutes} min
                  </span>
                ) : null}
                <PickLabel pick={today.unit.pick} />
              </p>
            </div>
            <StartLessonButton state={state} size="xl" className="flex-none" />
          </div>
        </section>
      ) : (
        <CourseDone state={state} />
      )}

      {rest.length ? (
        <section aria-labelledby="plan-next" className="grid gap-3">
          <h2
            id="plan-next"
            className="text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
          >
            Your next sessions
          </h2>
          <ol className="relative grid">
            <span aria-hidden className="bg-hairline absolute top-4 bottom-4 left-[15px] w-px" />
            {rest.map((item, i) => {
              const newUnit = item.unit !== (i === 0 ? today?.unit : rest[i - 1].unit);
              return (
                <li key={`${item.unit.unit.id}-${item.lesson.id}`} className="relative">
                  {newUnit ? (
                    <p className="ml-11 pt-3 pb-1 text-[12.5px] text-muted-foreground">
                      Then:{" "}
                      <span className="font-medium text-foreground">{item.unit.unit.title}</span>
                    </p>
                  ) : null}
                  <Link
                    href={lessonHref(item.unit.unit.id, item.lesson.id)}
                    className="flex items-center gap-4 rounded-xl py-2.5 pr-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="border-hairline relative grid size-8 flex-none place-items-center rounded-full border bg-background text-[12px] text-muted-foreground">
                      {state.lessonsDone + 2 + i}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px]">{item.lesson.title}</span>
                    {item.lesson.minutes ? (
                      <span className="flex-none text-[13px] text-muted-foreground">
                        {item.lesson.minutes} min
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
          {remaining > sessions.length ? (
            <p className="ml-12 text-[13px] text-muted-foreground">
              …and {remaining - sessions.length} more sessions to {state.course.title}.
            </p>
          ) : null}
        </section>
      ) : null}

      <Fold label={`The whole plan, unit by unit (${state.units.length})`}>
        <UnitOutline state={state} />
      </Fold>
    </div>
  );
}

/* ───────────── F. Chapter ───────────── */

function ChapterLayout({ state, placedBy }: HubLayoutProps) {
  const upcoming = upcomingLessons(state, 3);
  const [now, after, later] = upcoming;
  const current = state.next?.unit ?? null;
  const currentIndex = current ? state.units.indexOf(current) : -1;

  return (
    <div className="grid gap-8">
      <header data-testid="course-hero" className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <p>
            <span data-testid="course-title" className="font-display text-[1.6rem] text-foreground">
              {state.course.title}
            </span>
            {placedBy ? <span className="ml-2">{placedByText(placedBy)}</span> : null}
          </p>
          <p>
            <span data-testid="course-progress" className="font-semibold text-foreground">
              {state.lessonsDone}/{state.lessonTotal}
            </span>{" "}
            lessons
          </p>
        </div>
        {/* The story bar: one segment per unit. */}
        <div
          className="flex gap-1"
          aria-label={`${state.unitsFinished} of ${state.units.length} units done`}
          role="img"
        >
          {state.units.map((unit, index) => {
            const share = unit.lessonTotal ? unit.lessonsDone / unit.lessonTotal : 0;
            const fill = unit.done ? 1 : index === currentIndex ? Math.max(share, 0.08) : 0;
            return (
              <span
                key={unit.unit.id}
                title={unit.unit.title}
                className={cn(
                  "relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted",
                  index === currentIndex && "h-2.5 -translate-y-0.5",
                )}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{ width: `${fill * 100}%` }}
                />
              </span>
            );
          })}
        </div>
        {current ? (
          <p className="text-[13px] text-muted-foreground">
            Unit {currentIndex + 1} of {state.units.length} ·{" "}
            <span className="text-foreground">{current.unit.title}</span>
          </p>
        ) : null}
      </header>

      {now ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] md:overflow-visible md:px-0">
          <article className="tile relative flex w-[86%] flex-none snap-start flex-col justify-between gap-8 overflow-hidden p-7 md:w-auto md:p-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full opacity-40 blur-3xl"
              style={{ background: `oklch(0.7 0.14 ${state.course.hue})` }}
            />
            <div className="relative flex flex-col gap-3">
              <p className="text-[13px] text-muted-foreground">
                Now · lesson {now.number} of {now.unit.lessonTotal}
                {now.lesson.minutes ? ` · about ${now.lesson.minutes} min` : ""}
              </p>
              <h2 className="font-display text-[2.6rem] leading-[0.98] text-balance md:text-[4.2rem]">
                {now.lesson.title}
              </h2>
              <p className="max-w-[52ch] text-[15px] text-pretty text-muted-foreground">
                {now.unit.pick ? plainReason(now.unit.pick.reason) : now.unit.unit.summary}
              </p>
            </div>
            <div className="relative flex flex-wrap items-center gap-4">
              <StartLessonButton state={state} size="xl" />
              <PickLabel pick={now.unit.pick} />
            </div>
          </article>
          <div className="flex w-[70%] flex-none snap-start flex-col gap-4 md:w-auto">
            {[after, later].map((item, i) =>
              item ? (
                <Link
                  key={`${item.unit.unit.id}-${item.lesson.id}`}
                  href={lessonHref(item.unit.unit.id, item.lesson.id)}
                  className={cn(
                    "tile flex flex-1 flex-col justify-between gap-4 p-6 transition-opacity hover:opacity-100",
                    i === 0 ? "opacity-80" : "opacity-55",
                  )}
                >
                  <p className="text-[12.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    {i === 0 ? "Up after" : "Then"}
                  </p>
                  <div>
                    <p className="font-display text-[1.5rem] leading-tight">{item.lesson.title}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {item.unit === now.unit ? "Same unit" : item.unit.unit.title}
                      {item.lesson.minutes ? ` · ${item.lesson.minutes} min` : ""}
                    </p>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        </div>
      ) : (
        <CourseDone state={state} />
      )}

      <Fold label={`Course outline · ${state.units.length} units`}>
        <UnitOutline state={state} />
      </Fold>
    </div>
  );
}

export const NEW_LAYOUTS = {
  trail: TrailLayout,
  plan: PlanLayout,
  chapter: ChapterLayout,
} as const;
