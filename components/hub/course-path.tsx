"use client";

/*
 * A course's units on one spine. The spine draws itself in ink as you scroll;
 * each unit is a node on it (ink when done, blue where you are). On desktops a
 * sticky preview beside the spine follows the unit in the middle of the
 * screen, or the one you point at or tab to, with its cover, its lessons and
 * the takeaway of the lesson under your pointer. Contents open in place.
 * Up and down arrows move between units.
 */
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  ViewTransition,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Dumbbell,
  Eye,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { Magnetic } from "@/components/fx/magnetic";
import { EASE_OUT_EXPO } from "@/components/fx/reveal";
import { ProgressRing } from "@/components/fx/progress-ring";
import { Tilt } from "@/components/fx/tilt";
import { Button } from "@/components/ui/button";
import { testHref, testTitle } from "@/data/exercises";
import type { CourseState, UnitState } from "@/lib/hub/path";
import { drillHref } from "@/lib/hub/drills";
import { formatMeasureValue, formatPassLine } from "@/lib/hub/measure-format";
import { RECOGNITION_LABEL, lessonHref, recognitionHref, unitHref } from "@/lib/hub/units";
import { cn } from "@/lib/utils";
import { CoverArt } from "./cover-art";
import { lessonTakeaway } from "./lesson-preview";
import { rememberUnitCourse } from "./unit-context";

type NodeState = "done" | "next" | "open";

interface PathNode {
  key: string;
  icon: LucideIcon;
  kind: string;
  title: string;
  detail: string;
  href: string;
  action: string;
  state: NodeState;
  /** Set for lessons, so the preview can show the takeaway. */
  lessonId?: string;
}

export const unitCoverName = (unitId: string) => `unit-cover-${unitId}`;

const noSubscribe = () => () => {};
/** Scroll-driven CSS animations draw the spine off the main thread where supported. */
const useScrollTimeline = () =>
  useSyncExternalStore(
    noSubscribe,
    () => typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()"),
    () => false,
  );
/** On phones the path folds after the unit you're on and the next two. */
const FOLD_AFTER = 2;

function nodesFor(state: UnitState, nextLessonId: string | null): PathNode[] {
  const { unit } = state;
  const nodes: PathNode[] = unit.lessons.map((lesson) => {
    const done = state.isLessonDone(lesson.id);
    return {
      key: lesson.id,
      icon: done ? Check : BookOpen,
      kind: "Lesson",
      title: lesson.title,
      detail: `${lesson.minutes} min`,
      href: lessonHref(unit.id, lesson.id),
      action: done ? "Read it again" : "Start lesson",
      state: done ? "done" : lesson.id === nextLessonId ? "next" : "open",
      lessonId: lesson.id,
    };
  });
  const { measure } = state;
  const passed = state.passed !== null;
  if (unit.recognition) {
    // When the drill is the unit's measure, its node carries the pass.
    const measured = measure?.spec.kind === "recognition" && measure.spec.set === unit.recognition;
    const how =
      unit.recognition === "f2l"
        ? "pick the algorithm for the pair"
        : unit.recognition.startsWith("two-look")
          ? "name the case"
          : "name the case from two sides";
    nodes.push({
      key: "recognise",
      icon: measured && passed ? Trophy : Eye,
      kind: "Drill",
      title:
        unit.recognition === "f2l"
          ? "Recognise F2L cases"
          : `Recognise ${RECOGNITION_LABEL[unit.recognition]} cases`,
      detail: measured
        ? `On screen · ${formatMeasureValue(measure, measure.value)} known`
        : `On screen · ${how}`,
      href: recognitionHref(unit.recognition),
      action: "Start drill",
      state: measured && passed ? "done" : "open",
    });
  }
  if (unit.kind === "pack") {
    for (const drill of unit.drills) {
      const done = state.isDrillDone(drill.id);
      nodes.push({
        key: `drill-${drill.id}`,
        icon: Dumbbell,
        kind: "Drill",
        title: drill.title,
        detail: `${drill.dose}${done ? " · done once" : ""}`,
        href: drillHref(unit.id, drill.id),
        action: drill.untimed
          ? done
            ? "Do it again"
            : "Start drill"
          : done
            ? "Run another session"
            : "Run a session",
        state: done ? "done" : "open",
      });
    }
  }
  const next = measure?.next;
  if (measure && next && next.kind !== "recognition") {
    const line = formatPassLine(measure);
    const what = next.kind === "test" ? testTitle(next.testId) : measure.label;
    nodes.push({
      key: "test",
      icon: Trophy,
      kind: next.kind === "test" ? "Test" : "Timer",
      title: passed
        ? `Passed · ${formatMeasureValue(measure, state.passed!.value ?? measure.value)}`
        : next.kind === "test"
          ? "Unit test"
          : "Timer solves",
      detail: line && !passed ? `${what} · pass line ${line}` : what,
      href: next.kind === "test" ? testHref(next.testId) : "/timer/",
      action:
        next.kind === "timer"
          ? "Open the timer"
          : measure.value === null
            ? "Take the test"
            : "Retake the test",
      state: passed ? "done" : "open",
    });
  }
  return nodes;
}

export function CoursePath({ state }: { state: CourseState }) {
  const { reducedMotion } = useAppearance();
  const nextLessonId = state.next?.lessonId ?? null;
  const nextUnitId = state.next?.unit.unit.id ?? null;
  const firstId = state.units[0]?.unit.id ?? null;
  // A fast-end course has well over a hundred steps. Open the unit you're on;
  // the rest open when you ask.
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set([nextUnitId ?? firstId].filter(Boolean) as string[]),
  );
  const [pointed, setPointed] = useState<string | null>(null);
  const [spied, setSpied] = useState<string | null>(null);
  const [lesson, setLesson] = useState<{ unitId: string; lessonId: string } | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const sections = useRef(new Map<string, HTMLElement>());
  const overList = useRef(false);

  // The spine draws in as the list scrolls through the middle of the screen.
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 65%", "end 55%"] });
  const drawn = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const scaleY = useTransform(drawn, (value) => (reducedMotion ? 1 : value));
  const cssDrawn = useScrollTimeline() && !reducedMotion;
  const [unfolded, setUnfolded] = useState(false);
  const currentIndex = Math.max(
    0,
    state.units.findIndex((unit) => unit.unit.id === nextUnitId),
  );
  const foldAt = currentIndex + FOLD_AFTER + 1;
  const folds = !unfolded && state.units.length > foldAt + 1;

  // Which unit sits in the middle band of the screen (desktop preview).
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        const id = hit?.target.getAttribute("data-unit");
        if (!id) return;
        // Scrolling hands the preview back to the unit in the middle of the
        // screen, unless the pointer is on the list (then it follows the pointer).
        // A transition, so the swap never holds up a scroll frame.
        startTransition(() => {
          setSpied(id);
          if (!overList.current) setPointed(null);
        });
      },
      { rootMargin: "-42% 0px -52% 0px" },
    );
    for (const node of sections.current.values()) observer.observe(node);
    return () => observer.disconnect();
  }, [state.units.length]);

  const toggle = (unitId: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });

  const previewId = pointed ?? spied ?? nextUnitId ?? firstId;
  const previewIndex = Math.max(
    0,
    state.units.findIndex((unit) => unit.unit.id === previewId),
  );
  const preview = state.units[previewIndex];

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const target = event.target as HTMLElement;
    if (!target.matches("[data-unit-link]")) return;
    const links = [...(list.current?.querySelectorAll<HTMLElement>("[data-unit-link]") ?? [])];
    const at = links.indexOf(target);
    const next = links[at + (event.key === "ArrowDown" ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    next.focus();
    next.scrollIntoView({ block: "center", behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-14">
      <div
        ref={list}
        className="course-spine relative lg:col-start-2 lg:row-start-1"
        data-testid="course-path"
        // The preview keeps the unit you last pointed at, so you can reach its buttons.
        onPointerEnter={() => {
          overList.current = true;
        }}
        onPointerLeave={() => {
          overList.current = false;
          setLesson(null);
        }}
        onKeyDown={onKeyDown}
      >
        <span aria-hidden className="spine-track absolute top-3 bottom-3 left-[11px] w-px" />
        <motion.span
          aria-hidden
          className="spine-ink absolute top-3 bottom-3 left-[11px] w-px origin-top"
          data-drawn={cssDrawn ? "scroll" : undefined}
          style={cssDrawn ? undefined : { scaleY }}
        />
        {state.units.map((unitState, unitIndex) => {
          const id = unitState.unit.id;
          const nodes = nodesFor(unitState, id === nextUnitId ? nextLessonId : null);
          return (
            <section
              key={id}
              ref={(node) => {
                if (node) sections.current.set(id, node);
                else sections.current.delete(id);
              }}
              data-unit={id}
              data-testid={`unit-${id}`}
              data-current={id === nextUnitId || undefined}
              data-pointed={previewId === id || undefined}
              onPointerEnter={(event) => event.pointerType === "mouse" && setPointed(id)}
              onFocus={() => setPointed(id)}
              className={cn("unit-row relative", folds && unitIndex >= foldAt && "max-lg:hidden")}
            >
              <UnitRow
                state={unitState}
                index={unitIndex}
                hue={state.course.hue}
                current={id === nextUnitId}
                expanded={open.has(id)}
                nodes={nodes}
                onToggle={() => toggle(id)}
                onLesson={(lessonId) => setLesson(lessonId ? { unitId: id, lessonId } : null)}
                courseId={state.course.id}
              />
            </section>
          );
        })}
        {folds ? (
          <div className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 pt-2 pb-1 lg:hidden">
            <span aria-hidden />
            <button
              type="button"
              onClick={() => setUnfolded(true)}
              className="flex w-fit items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-background px-4 py-2 text-sm font-medium"
              data-testid="path-show-all"
            >
              <ChevronDown className="size-4" /> Show all {state.units.length} units
            </button>
          </div>
        ) : null}
      </div>
      {/* After the spine in the DOM (Tab walks the spine first); drawn on the left. */}
      <aside aria-label="Unit preview" className="hidden lg:col-start-1 lg:row-start-1 lg:block">
        <div className="sticky top-28">
          {preview ? (
            <UnitPreview
              state={preview}
              index={previewIndex}
              total={state.units.length}
              hue={state.course.hue}
              current={preview.unit.id === nextUnitId}
              lessonId={lesson?.unitId === preview.unit.id ? lesson.lessonId : null}
              expanded={open.has(preview.unit.id)}
              nextLessonId={preview.unit.id === nextUnitId ? nextLessonId : null}
              courseId={state.course.id}
              courseTitle={state.course.title}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function UnitRow({
  state,
  index,
  hue,
  current,
  expanded,
  nodes,
  onToggle,
  onLesson,
  courseId,
}: {
  state: UnitState;
  index: number;
  courseId: string;
  hue: number;
  current: boolean;
  expanded: boolean;
  nodes: PathNode[];
  onToggle: () => void;
  onLesson: (lessonId: string | null) => void;
}) {
  const { unit, pick, measure, status } = state;
  const share = state.lessonTotal ? state.lessonsDone / state.lessonTotal : 0;
  // Passed on its measure with lessons still unread: a hollow blue check, not the ink "finished" one.
  const testedOut = status === "passed" && state.lessonsDone < state.lessonTotal;
  const finished = state.done && !testedOut;
  return (
    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 py-4 md:gap-x-5 md:py-5">
      <span aria-hidden className="relative flex justify-center pt-[0.6rem] md:pt-3">
        <span
          className={cn(
            "spine-node relative grid size-[23px] place-items-center rounded-full border bg-background transition-transform duration-300",
            finished && "border-foreground bg-foreground text-background",
            testedOut && "border-primary text-primary",
            current && "spine-node-current border-primary",
            !state.done &&
              !current &&
              "border-[color-mix(in_oklab,var(--foreground)_22%,transparent)]",
          )}
        >
          {state.done ? (
            <Check className="size-3" strokeWidth={3} />
          ) : current ? (
            <span className="size-2 rounded-full bg-primary" />
          ) : (
            <span className="font-figures tabular text-[9px] text-muted-foreground">
              {index + 1}
            </span>
          )}
        </span>
      </span>

      <div className="min-w-0">
        <div className="flex items-start gap-4">
          <Link
            href={unitHref(unit)}
            tabIndex={-1}
            aria-hidden
            className="mt-1 block w-16 shrink-0 lg:hidden"
          >
            <CoverArt
              hue={hue}
              index={index}
              number={String(index + 1).padStart(2, "0")}
              className={cn(
                "aspect-square rounded-[0.8rem] shadow-[var(--shadow-tile)]",
                state.done && "saturate-[0.55]",
              )}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 eyebrow">
              <span>Unit {String(index + 1).padStart(2, "0")}</span>
              {unit.optional ? (
                <span
                  className="rounded-full border border-[var(--hairline)] px-1.5 py-px tracking-normal normal-case"
                  data-testid={`optional-${unit.id}`}
                >
                  Optional
                </span>
              ) : null}
              {current ? <span className="text-primary">You are here</span> : null}
              {pick ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Sparkles className="size-3" />
                  {pick.source === "said" ? "You flagged this" : "Picked for you"}
                </span>
              ) : null}
            </p>
            <h3 className="mt-1 font-display text-[1.5rem] leading-[1.06] text-balance md:text-[1.95rem]">
              <Link
                href={unitHref(unit)}
                onClick={() => rememberUnitCourse(unit.id, courseId, index)}
                data-unit-link
                data-testid={`open-unit-${unit.id}`}
                className="unit-link decoration-1 underline-offset-[5px] hover:underline"
              >
                {unit.title}
              </Link>
            </h3>
            <p
              className={cn(
                "mt-1.5 max-w-xl text-sm text-pretty text-muted-foreground",
                !current && "hidden",
              )}
            >
              {unit.summary}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 pt-1">
            {/* How the number stands against the course's line; a pass says it all. */}
            {measure?.tag && status !== "passed" ? (
              <span
                className="text-[11px] text-muted-foreground capitalize"
                data-testid={`pace-${unit.id}`}
              >
                {measure.tag}
              </span>
            ) : null}
            {status === "passed" ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-primary"
                data-testid={`status-${unit.id}`}
              >
                <Trophy className="size-3" /> Passed
              </span>
            ) : status === "practised" || status === "read" ? (
              <span className="text-[11px] text-muted-foreground" data-testid={`status-${unit.id}`}>
                {status === "practised" ? "Practised" : "Read"}
              </span>
            ) : null}
            <ProgressRing
              value={share}
              size={34}
              stroke={3}
              label={`${state.lessonsDone} of ${state.lessonTotal} lessons read`}
            >
              <span className="font-figures tabular text-[9px] font-semibold">
                {state.lessonsDone}/{state.lessonTotal}
              </span>
            </ProgressRing>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="mt-2 flex items-center gap-1.5 rounded-full py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          data-testid={`unit-toggle-${unit.id}`}
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-300", expanded && "rotate-180")}
          />
          {expanded ? "Hide contents" : `Contents · ${nodes.length} steps`}
        </button>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.ol
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="step-list -ml-3 overflow-hidden"
            >
              {nodes.map((node, nodeIndex) => (
                <li
                  key={node.key}
                  onPointerEnter={() => onLesson(node.lessonId ?? null)}
                  onFocus={() => onLesson(node.lessonId ?? null)}
                >
                  <StepRow node={node} number={nodeIndex + 1} testId={`${unit.id}-${node.key}`} />
                </li>
              ))}
            </motion.ol>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function UnitPreview({
  state,
  index,
  total,
  hue,
  current,
  lessonId,
  nextLessonId,
  courseId,
  courseTitle,
  expanded,
}: {
  state: UnitState;
  index: number;
  total: number;
  hue: number;
  current: boolean;
  lessonId: string | null;
  /** Its contents are open on the spine beside it, so the preview doesn't list them again. */
  expanded: boolean;
  nextLessonId: string | null;
  courseId: string;
  courseTitle: string;
}) {
  const { unit } = state;
  const share = state.lessonTotal ? state.lessonsDone / state.lessonTotal : 0;
  const takeaway = lessonId ? lessonTakeaway(unit.id, lessonId) : null;
  const firstOpen = unit.lessons.find((entry) => !state.isLessonDone(entry.id));
  // One preview at a time: the new unit rises in and the old one simply goes
  // (exit animations could pile up under fast scrolling and double-expose).
  return (
    <motion.div
      key={unit.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
      data-testid="unit-preview"
    >
      <Link
        href={unitHref(unit)}
        tabIndex={-1}
        aria-hidden
        className="block"
        onClick={() => rememberUnitCourse(unit.id, courseId, index)}
      >
        <Tilt max={7} className="morph-lift rounded-[1.5rem] shadow-[var(--shadow-float)]">
          <ViewTransition name={unitCoverName(unit.id)} share="morph" default="none">
            <CoverArt
              hue={hue}
              index={index}
              number={String(index + 1).padStart(2, "0")}
              label={`${courseTitle} · ${index + 1} of ${total}`}
              className={cn("aspect-[2/1] rounded-[1.5rem]", state.done && "saturate-[0.6]")}
            />
          </ViewTransition>
        </Tilt>
      </Link>
      <div className="mt-5 flex items-center gap-3">
        <ProgressRing value={share} size={40} stroke={3}>
          <span className="font-figures tabular text-[10px] font-semibold">
            {Math.round(share * 100)}%
          </span>
        </ProgressRing>
        <p className="eyebrow">
          {current ? <span className="text-primary">You are here · </span> : null}
          {state.lessonsDone} of {state.lessonTotal} lessons read
        </p>
      </div>
      <h3 className="mt-3 font-display text-[2.3rem] leading-[1.02] text-balance">{unit.title}</h3>
      <p className="mt-2 text-[15px] text-pretty text-muted-foreground">{unit.summary}</p>
      <ol className={cn("mt-4 grid border-t border-[var(--hairline)]", expanded && "hidden")}>
        {unit.lessons.slice(0, 6).map((entry, at) => {
          const done = state.isLessonDone(entry.id);
          const lit = entry.id === lessonId;
          return (
            <li
              key={entry.id}
              className={cn(
                "flex items-center gap-3 border-b border-[var(--hairline)] py-2 text-sm transition-colors duration-200",
                lit ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="w-5 font-display tabular text-[15px] italic">
                {done ? <Check className="size-3.5 text-primary" /> : at + 1}
              </span>
              <span className={cn("flex-1 truncate", done && "line-through decoration-1")}>
                {entry.title}
              </span>
              {entry.id === nextLessonId ? (
                <span className="text-[11px] text-primary">Up next</span>
              ) : (
                <span className="tabular text-[11px]">{entry.minutes} min</span>
              )}
            </li>
          );
        })}
        {unit.lessons.length > 6 ? (
          <li className="py-2 text-xs text-muted-foreground">and {unit.lessons.length - 6} more</li>
        ) : null}
      </ol>
      <div className="mt-3 min-h-[4.25rem]">
        {takeaway ? (
          <motion.blockquote
            key={lessonId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-primary pl-4 font-display text-[1.2rem] leading-snug italic"
          >
            {takeaway}
          </motion.blockquote>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 pt-1"
          >
            <Magnetic>
              <Button asChild className="h-10 rounded-full px-5">
                <Link
                  href={unitHref(unit)}
                  onClick={() => rememberUnitCourse(unit.id, courseId, index)}
                >
                  Open unit <ArrowUpRight />
                </Link>
              </Button>
            </Magnetic>
            {firstOpen ? (
              <Link
                href={lessonHref(unit.id, firstOpen.id)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {state.lessonsDone ? "Continue" : "Start"} with lesson{" "}
                {unit.lessons.indexOf(firstOpen) + 1}
              </Link>
            ) : null}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function StepRow({ node, number, testId }: { node: PathNode; number: number; testId: string }) {
  const Icon = node.icon;
  return (
    <Link
      href={node.href}
      aria-label={`${node.title}: ${node.kind} · ${node.detail}. ${node.action}`}
      data-testid={`path-node-${testId}`}
      data-state={node.state}
      className={cn(
        "step-row group relative mt-0.5 grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
        node.state === "next"
          ? "bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]"
          : "hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]",
      )}
    >
      <span
        className={cn(
          "font-display tabular text-lg leading-none italic",
          node.state === "next" ? "text-primary" : "text-muted-foreground",
        )}
      >
        {String(number).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-[15px] font-medium",
            node.state === "done" && "text-muted-foreground line-through decoration-1",
          )}
        >
          {node.title}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3" />
          {node.kind} · {node.detail}
        </span>
      </span>
      <span
        className={cn(
          "flex items-center gap-1 text-xs font-medium",
          node.state === "next"
            ? "text-primary"
            : "hidden text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex",
        )}
      >
        {node.state === "next" ? "Up next" : node.action}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
