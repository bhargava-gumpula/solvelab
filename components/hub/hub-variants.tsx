"use client";

/*
 * Draft only: three ways to lay out the Learning Hub's front page, for the
 * owner to compare. All three answer the same question first, "what do I do
 * next?", with one primary button, and use plain words.
 *
 *   (The three newer layouts, Trail, Plan and Chapter, live in hub-layouts-new.tsx.)
 *
 *   Focus    — one big "up next" lesson, your current unit, the next few; the rest folded.
 *   Roadmap  — the course as a road of numbered stops; pick a stop to see its lessons.
 *   Board    — every unit as a card with its progress; your current unit is the big one.
 *
 * The site ships the Trail. The other layouts stay reachable for comparison with
 * ?hub=plan|chapter|focus|roadmap|board (the owner hid the switch row before release 5).
 */
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Check, ChevronDown, Clock, Dumbbell, Library } from "lucide-react";
import { Tile } from "@/components/fx/tile";
import { useHub } from "@/hooks/use-hub";
import type { CourseState, Placement, UnitState } from "@/lib/hub/path";
import { lessonHref, unitHref } from "@/lib/hub/units";
import { cn } from "@/lib/utils";
import { NEW_LAYOUTS, placedByText } from "./hub-layouts-new";
import { StageBudget, useStageBudget } from "./stage-budget";

export type HubLayout = "trail" | "plan" | "chapter" | "focus" | "roadmap" | "board";
const LAYOUTS: { id: HubLayout; label: string; group: "new" | "earlier" }[] = [
  { id: "trail", label: "Trail", group: "new" },
  { id: "plan", label: "Plan", group: "new" },
  { id: "chapter", label: "Chapter", group: "new" },
  { id: "focus", label: "Focus", group: "earlier" },
  { id: "roadmap", label: "Roadmap", group: "earlier" },
  { id: "board", label: "Board", group: "earlier" },
];
const DEFAULT_LAYOUT: HubLayout = "trail";
const listeners = new Set<() => void>();

function isLayout(value: string | null): value is HubLayout {
  return LAYOUTS.some((option) => option.id === value);
}

function readLayout(): HubLayout {
  try {
    const fromUrl = new URL(window.location.href).searchParams.get("hub");
    return isLayout(fromUrl) ? fromUrl : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useHubLayout(): [HubLayout, (next: HubLayout) => void] {
  const layout = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    readLayout,
    () => DEFAULT_LAYOUT,
  );
  const set = (next: HubLayout) => {
    try {
      const url = new URL(window.location.href);
      if (next === DEFAULT_LAYOUT) url.searchParams.delete("hub");
      else url.searchParams.set("hub", next);
      window.history.replaceState(null, "", url);
    } catch {}
    listeners.forEach((listener) => listener());
  };
  return [layout, set];
}

/** The draft switch between the six layouts (no longer rendered; kept for the drafts). */
export function HubLayoutSwitch() {
  const [layout, setLayout] = useHubLayout();
  const group = (which: "new" | "earlier") =>
    LAYOUTS.filter((option) => option.group === which).map((option) => (
      <button
        key={option.id}
        type="button"
        role="radio"
        aria-checked={layout === option.id}
        onClick={() => setLayout(option.id)}
        className={cn(
          "rounded-full px-3 py-1 font-medium transition-colors",
          layout === option.id
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted hover:text-foreground",
        )}
      >
        {option.label}
      </button>
    ));
  return (
    <div className="border-hairline flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-dashed px-4 py-2.5 text-[13px] text-muted-foreground">
      <span className="font-medium text-foreground">Draft: compare Hub layouts</span>
      <div role="radiogroup" aria-label="Hub layout" className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[12px]">New</span>
        {group("new")}
        <span aria-hidden className="bg-hairline mx-2 h-4 w-px" />
        <span className="mr-1 text-[12px]">Earlier</span>
        {group("earlier")}
      </div>
    </div>
  );
}

/* ───────────── shared pieces ───────────── */

function unitStatus(state: CourseState, unit: UnitState): "done" | "now" | "later" {
  if (unit.done) return "done";
  if (state.next?.unit.unit.id === unit.unit.id) return "now";
  return "later";
}

function minutesOf(unit: UnitState) {
  return unit.unit.lessons.reduce((sum, lesson) => sum + (lesson.minutes ?? 0), 0);
}

function nextLessonOf(state: CourseState) {
  const next = state.next;
  if (!next) return null;
  const lesson = next.unit.unit.lessons.find((item) => item.id === next.lessonId) ?? null;
  const index = next.unit.unit.lessons.findIndex((item) => item.id === next.lessonId);
  return { unit: next.unit, lesson, index };
}

function CourseProgress({ state, compact = false }: { state: CourseState; compact?: boolean }) {
  const share = state.lessonTotal ? state.lessonsDone / state.lessonTotal : 0;
  return (
    <div className={cn("flex flex-col gap-2", compact ? "min-w-48" : "min-w-0 sm:min-w-64")}>
      <div className="flex items-baseline justify-between gap-3 text-[13px] text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground" data-testid="course-progress">
            {state.lessonsDone}/{state.lessonTotal}
          </span>{" "}
          lessons done
        </span>
        <span>
          {state.unitsFinished} of {state.units.length} units
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Course progress"
        aria-valuemin={0}
        aria-valuemax={state.lessonTotal}
        aria-valuenow={state.lessonsDone}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${Math.max(2, share * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** The one thing to do next, as a big card with one button. */
function UpNextCard({ state, big = true }: { state: CourseState; big?: boolean }) {
  const next = nextLessonOf(state);
  if (!next || !next.lesson) {
    return (
      <div className="tile p-7">
        <p className="text-[13px] font-semibold tracking-[0.12em] text-primary uppercase">
          Course complete
        </p>
        <h2 className="mt-2 font-display text-[2.2rem] leading-tight">
          Every unit in this course is done.
        </h2>
      </div>
    );
  }
  const { unit, lesson, index } = next;
  return (
    <div className={cn("tile flex flex-col gap-5", big ? "p-7 md:p-9" : "p-6")}>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-semibold text-primary">
          Up next
        </span>
        <span className="text-muted-foreground">
          Unit {state.units.indexOf(unit) + 1} · Lesson {index + 1} of {unit.lessonTotal}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h2
          className={cn(
            "font-display leading-[1.02] text-balance",
            big ? "text-[2.4rem] md:text-[3.2rem]" : "text-[1.9rem]",
          )}
        >
          {lesson.title}
        </h2>
        <p className="max-w-[60ch] text-[15px] text-muted-foreground">
          Part of <span className="text-foreground">{unit.unit.title}</span>: {unit.unit.summary}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={lessonHref(unit.unit.id, lesson.id)}
          data-testid="continue-lesson"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          Start lesson <ArrowRight className="size-4" aria-hidden />
        </Link>
        {lesson.minutes ? (
          <span className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground">
            <Clock className="size-4" aria-hidden /> About {lesson.minutes} min
          </span>
        ) : null}
        <Link href={unitHref(unit.unit)} className="text-[14px] text-primary hover:underline">
          See the whole unit
        </Link>
      </div>
    </div>
  );
}

function LessonList({ unit }: { unit: UnitState }) {
  return (
    <ol className="flex flex-col">
      {unit.unit.lessons.map((lesson, index) => {
        const done = unit.isLessonDone(lesson.id);
        return (
          <li key={lesson.id}>
            <Link
              href={lessonHref(unit.unit.id, lesson.id)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors hover:bg-muted"
            >
              <span
                className={cn(
                  "grid size-6 flex-none place-items-center rounded-full border text-[12px]",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-hairline text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">{lesson.title}</span>
              {lesson.minutes ? (
                <span className="text-[13px] text-muted-foreground">{lesson.minutes} min</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function MoreToDo() {
  const links = [
    {
      href: "/train/",
      icon: Dumbbell,
      title: "Practice",
      body: "Timed drills for the part of the solve you want to get faster at.",
    },
    {
      href: "/hub/ask/",
      icon: Bot,
      title: "Ask the coach",
      body: "Ask an AI coach why you are stuck; it sees your solve profile.",
    },
    {
      href: "/hub/library/",
      icon: Library,
      title: "Library",
      body: "Every course and lesson, to browse in any order.",
    },
  ];
  return (
    <section aria-label="More in the Hub" className="grid gap-3 md:grid-cols-3">
      {links.map(({ href, icon: Icon, title, body }) => (
        <Link
          key={href}
          href={href}
          className="group tile flex items-start gap-3 p-5 transition-transform hover:-translate-y-0.5"
        >
          <Icon className="mt-0.5 size-5 text-primary" aria-hidden />
          <span className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold">{title}</span>
            <span className="text-[13px] text-muted-foreground">{body}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}

function CourseHeader({
  state,
  averageS,
  placedBy,
}: {
  state: CourseState;
  averageS: number | null;
  placedBy: Placement["source"] | null;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6" data-testid="course-hero">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] text-muted-foreground">
          Your course
          {placedBy ? ` · ${placedByText(placedBy)}` : ""}
          {averageS !== null ? ` · average ${averageS.toFixed(1)} s` : ""}
        </p>
        <h1
          className="font-display text-[2.6rem] leading-none md:text-[3.4rem]"
          data-testid="course-title"
        >
          {state.course.title}
        </h1>
        <p className="text-[15px] text-muted-foreground">{state.course.tagline}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <CourseProgress state={state} />
        <Link href="/hub/library/" className="text-[13px] text-primary hover:underline">
          Change course
        </Link>
      </div>
    </header>
  );
}

/* ───────────── A. Focus ───────────── */

function FocusLayout({ state }: { state: CourseState }) {
  const [showAll, setShowAll] = useState(false);
  const current = state.next?.unit ?? null;
  const currentIndex = current ? state.units.indexOf(current) : -1;
  const soon = state.units.filter((unit, index) => index > currentIndex && !unit.done).slice(0, 3);
  const later = state.units.filter(
    (unit, index) => index > currentIndex && !unit.done && !soon.includes(unit),
  );
  const done = state.units.filter((unit) => unit.done);
  return (
    <div className="grid grid-cols-1 gap-8">
      <UpNextCard state={state} />
      <section aria-labelledby="focus-path" className="grid grid-cols-1 gap-4">
        <h2 id="focus-path" className="font-display text-[1.9rem]">
          Your path
        </h2>
        {current ? (
          <div className="tile p-5">
            <div className="mb-2 flex items-baseline justify-between gap-3 px-3">
              <h3 className="text-[17px] font-semibold">Now: {current.unit.title}</h3>
              <span className="text-[13px] text-muted-foreground">
                {current.lessonsDone} of {current.lessonTotal} done
              </span>
            </div>
            <LessonList unit={current} />
          </div>
        ) : null}
        {soon.length ? (
          <div className="divide-hairline tile divide-y p-2">
            <p className="px-4 pt-3 pb-2 text-[13px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Coming up
            </p>
            {soon.map((unit) => (
              <UnitRow key={unit.unit.id} state={state} unit={unit} />
            ))}
            {showAll
              ? later.map((unit) => <UnitRow key={unit.unit.id} state={state} unit={unit} />)
              : null}
            {later.length ? (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-[14px] text-primary"
              >
                {showAll ? "Show less" : `Show the ${later.length} units after these`}
                <ChevronDown
                  className={cn("size-4 transition-transform", showAll && "rotate-180")}
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        ) : null}
        {done.length ? (
          <p className="px-1 text-[13px] text-muted-foreground">
            {done.length} {done.length === 1 ? "unit" : "units"} already done or tested out.
          </p>
        ) : null}
      </section>
      <MoreToDo />
    </div>
  );
}

function UnitRow({ state, unit }: { state: CourseState; unit: UnitState }) {
  const number = state.units.indexOf(unit) + 1;
  return (
    <Link
      href={unitHref(unit.unit)}
      className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-muted"
    >
      <span className="border-hairline grid size-8 flex-none place-items-center rounded-full border text-[13px] text-muted-foreground">
        {number}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-medium">{unit.unit.title}</span>
        <span className="truncate text-[13px] text-muted-foreground">{unit.unit.summary}</span>
      </span>
      <span className="flex-none text-[13px] text-muted-foreground">
        {unit.lessonTotal} lessons · {minutesOf(unit)} min
      </span>
    </Link>
  );
}

/* ───────────── B. Roadmap ───────────── */

function RoadmapLayout({ state }: { state: CourseState }) {
  const currentId = state.next?.unit.unit.id ?? state.units[0]?.unit.id;
  const [selectedId, setSelectedId] = useState(currentId);
  const selected = state.units.find((unit) => unit.unit.id === selectedId) ?? state.units[0];
  const selectedIndex = state.units.indexOf(selected);
  return (
    <div className="grid gap-8">
      <UpNextCard state={state} big={false} />
      <section aria-labelledby="road-h" className="tile grid gap-6 p-6 md:p-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="road-h" className="font-display text-[1.9rem]">
            The road to {state.course.title}
          </h2>
          <span className="text-[13px] text-muted-foreground">Pick a stop to see its lessons</span>
        </div>
        <div className="-mx-2 overflow-x-auto pb-2">
          <ol className="relative flex min-w-max items-start gap-0 px-2 pt-2">
            {state.units.map((unit, index) => {
              const status = unitStatus(state, unit);
              const active = unit.unit.id === selected.unit.id;
              return (
                <li key={unit.unit.id} className="relative flex w-[7.5rem] flex-col items-center">
                  {index > 0 ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-5 right-1/2 h-[3px] w-full -translate-y-1/2",
                        status === "later" ? "bg-hairline" : "bg-primary",
                      )}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedId(unit.unit.id)}
                    aria-pressed={active}
                    aria-label={`Unit ${index + 1}: ${unit.unit.title}`}
                    className={cn(
                      "relative z-10 grid size-10 place-items-center rounded-full border-2 text-[14px] font-semibold transition-transform",
                      status === "done" && "border-primary bg-primary text-primary-foreground",
                      status === "now" &&
                        "border-primary bg-background text-primary shadow-[0_0_0_6px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
                      status === "later" && "border-hairline bg-background text-muted-foreground",
                      active && "scale-115",
                    )}
                  >
                    {status === "done" ? <Check className="size-4" aria-hidden /> : index + 1}
                  </button>
                  <span
                    className={cn(
                      "mt-2 line-clamp-2 px-1 text-center text-[12.5px] leading-snug",
                      active ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {unit.unit.title}
                  </span>
                  {status === "now" ? (
                    <span className="mt-1 rounded-full bg-primary/15 px-2 text-[12px] font-semibold text-primary">
                      You are here
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="border-hairline grid gap-4 border-t pt-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-muted-foreground">
              Unit {selectedIndex + 1} of {state.units.length}
            </p>
            <h3 className="font-display text-[1.7rem] leading-tight">{selected.unit.title}</h3>
            <p className="text-[15px] text-muted-foreground">{selected.unit.summary}</p>
            <p className="text-[13px] text-muted-foreground">
              {selected.lessonTotal} lessons · about {minutesOf(selected)} min ·{" "}
              {selected.lessonsDone} done
            </p>
            <Link
              href={unitHref(selected.unit)}
              className="mt-2 text-[14px] text-primary hover:underline"
            >
              Open this unit
            </Link>
          </div>
          <LessonList unit={selected} />
        </div>
      </section>
      <MoreToDo />
    </div>
  );
}

/* ───────────── C. Board ───────────── */

function BoardLayout({ state }: { state: CourseState }) {
  const [filter, setFilter] = useState<"all" | "todo" | "done">("todo");
  const cards = useMemo(
    () =>
      state.units.filter((unit) =>
        filter === "all" ? true : filter === "done" ? unit.done : !unit.done,
      ),
    [state.units, filter],
  );
  return (
    <div className="grid gap-8">
      <section aria-labelledby="board-h" className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="board-h" className="font-display text-[1.9rem]">
            Units in this course
          </h2>
          <div role="radiogroup" aria-label="Show units" className="flex gap-1 text-[13px]">
            {(["todo", "done", "all"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium",
                  filter === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {value === "todo" ? "To do" : value === "done" ? "Done" : "All"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((unit) => {
            const status = unitStatus(state, unit);
            const number = state.units.indexOf(unit) + 1;
            const share = unit.lessonTotal ? unit.lessonsDone / unit.lessonTotal : 0;
            if (status === "now") {
              const next = nextLessonOf(state);
              return (
                <article
                  key={unit.unit.id}
                  className="tile flex flex-col gap-4 p-6 ring-2 ring-primary/60 sm:col-span-2"
                >
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-semibold text-primary">
                      You are here
                    </span>
                    <span className="text-muted-foreground">Unit {number}</span>
                  </div>
                  <h3 className="font-display text-[2rem] leading-tight">{unit.unit.title}</h3>
                  <p className="text-[15px] text-muted-foreground">{unit.unit.summary}</p>
                  {next?.lesson ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <Link
                        href={lessonHref(unit.unit.id, next.lesson.id)}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground"
                      >
                        Start “{next.lesson.title}” <ArrowRight className="size-4" aria-hidden />
                      </Link>
                      <span className="text-[13px] text-muted-foreground">
                        {unit.lessonsDone} of {unit.lessonTotal} lessons done
                      </span>
                    </div>
                  ) : null}
                </article>
              );
            }
            return (
              <Link
                key={unit.unit.id}
                href={unitHref(unit.unit)}
                className="group tile flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                  <span>Unit {number}</span>
                  {status === "done" ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Check className="size-3.5" aria-hidden /> Done
                    </span>
                  ) : (
                    <span>{unit.lessonTotal} lessons</span>
                  )}
                </div>
                <h3 className="text-[17px] leading-snug font-semibold">{unit.unit.title}</h3>
                <p className="line-clamp-2 text-[13px] text-muted-foreground">
                  {unit.unit.summary}
                </p>
                <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${share * 100}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <MoreToDo />
    </div>
  );
}

/** Where your time goes, when your tests measure it; then the rest of the Hub. */
function HubExtras({ state, more }: { state: CourseState; more: boolean }) {
  const hub = useHub();
  const rows = useStageBudget(hub.runs, hub.solves, state.course.targetId);
  return (
    <>
      {rows ? (
        <Tile className="p-6 md:p-7">
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
      {more ? <MoreToDo /> : null}
    </>
  );
}

/** The Hub's front page in the chosen draft layout. */
export function HubVariant({
  state,
  averageMs,
  placedBy,
}: {
  state: CourseState;
  averageMs: number | null;
  placedBy: Placement["source"] | null;
}) {
  const averageS = averageMs === null ? null : averageMs / 1000;
  const [layout] = useHubLayout();
  const isNew = layout === "trail" || layout === "plan" || layout === "chapter";
  const New = isNew ? NEW_LAYOUTS[layout] : null;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-8 md:gap-10" data-hub-layout={layout}>
      {New ? (
        <New state={state} averageMs={averageMs} placedBy={placedBy} />
      ) : (
        <>
          <CourseHeader state={state} averageS={averageS} placedBy={placedBy} />
          {layout === "roadmap" ? (
            <RoadmapLayout state={state} />
          ) : layout === "board" ? (
            <BoardLayout state={state} />
          ) : (
            <FocusLayout state={state} />
          )}
        </>
      )}
      <HubExtras state={state} more={isNew} />
    </div>
  );
}
