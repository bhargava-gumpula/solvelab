"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Dumbbell,
  Eye,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { PaceBadge } from "@/components/coach/pace-badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { testHref, testTitle } from "@/data/exercises";
import type { CourseState, UnitState } from "@/lib/hub/path";
import { drillHref } from "@/lib/hub/drills";
import { RECOGNITION_LABEL, lessonHref, recognitionHref, unitHref } from "@/lib/hub/units";
import { cn } from "@/lib/utils";

/** The sideways swing of the path, in px, so it winds down the page. */
const SWING = [0, 44, 72, 44, 0, -44, -72, -44];

type NodeState = "done" | "next" | "open";

interface PathNode {
  key: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  href: string;
  action: string;
  state: NodeState;
}

function nodesFor(state: UnitState, nextLessonId: string | null): PathNode[] {
  const { unit } = state;
  const nodes: PathNode[] = unit.lessons.map((lesson) => {
    const done = state.isLessonDone(lesson.id);
    return {
      key: lesson.id,
      icon: done ? Check : lesson.id === nextLessonId ? Star : BookOpen,
      title: lesson.title,
      detail: `Lesson · ${lesson.minutes} min`,
      href: lessonHref(unit.id, lesson.id),
      action: done ? "Read it again" : "Start lesson",
      state: done ? "done" : lesson.id === nextLessonId ? "next" : "open",
    };
  });
  if (unit.recognition) {
    nodes.push({
      key: "recognise",
      icon: Eye,
      title:
        unit.recognition === "f2l"
          ? "Recognise F2L cases"
          : `Recognise ${RECOGNITION_LABEL[unit.recognition]} cases`,
      detail:
        unit.recognition === "f2l"
          ? "On-screen drill · pick the algorithm for the pair"
          : unit.recognition.startsWith("two-look")
            ? "On-screen drill · name the case"
            : "On-screen drill · name the case from two sides",
      href: recognitionHref(unit.recognition),
      action: "Start drill",
      state: "open",
    });
  }
  if (unit.kind === "pack") {
    for (const drill of unit.drills) {
      nodes.push({
        key: `drill-${drill.id}`,
        icon: Dumbbell,
        title: drill.title,
        detail: `Drill · ${drill.dose}`,
        href: drillHref(unit.id, drill.id),
        action: "Run a timed session",
        state: "open",
      });
    }
  }
  const test = state.aspect?.nextTest ?? state.aspect?.definition.tests[0] ?? null;
  if (test) {
    nodes.push({
      key: "test",
      icon: Trophy,
      title: state.testedOut ? "Passed" : "Unit test",
      detail: testTitle(test),
      href: testHref(test),
      action: state.aspect?.tag ? "Retake the test" : "Take the test",
      state: state.testedOut ? "done" : "open",
    });
  }
  return nodes;
}

export function CoursePath({ state }: { state: CourseState }) {
  const nextLessonId = state.next?.lessonId ?? null;
  const nextUnitId = state.next?.unit.unit.id ?? null;
  // A fast-end course has well over a hundred steps. Show the unit you're on
  // and the one after it; the rest open when you ask.
  const [open, setOpen] = useState<ReadonlySet<string>>(() => {
    const next = state.units.findIndex((unit) => unit.unit.id === nextUnitId);
    const from = next === -1 ? 0 : next;
    return new Set(state.units.slice(from, from + 2).map((unit) => unit.unit.id));
  });
  const toggle = (unitId: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  let swing = 0;
  return (
    <div className="grid gap-10" data-testid="course-path">
      {state.units.map((unitState, unitIndex) => {
        const nodes = nodesFor(unitState, unitState.unit.id === nextUnitId ? nextLessonId : null);
        const expanded = open.has(unitState.unit.id);
        return (
          <section key={unitState.unit.id} data-testid={`unit-${unitState.unit.id}`}>
            <UnitBanner state={unitState} index={unitIndex} hue={state.course.hue} />
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => toggle(unitState.unit.id)}
                aria-expanded={expanded}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                data-testid={`unit-toggle-${unitState.unit.id}`}
              >
                <ChevronDown
                  className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                />
                {expanded ? "Hide steps" : `Show ${nodes.length} steps`}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.ol
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-5 overflow-visible pt-12"
                >
                  {nodes.map((node) => {
                    const offset = SWING[swing++ % SWING.length]!;
                    return (
                      <li key={node.key} style={{ transform: `translateX(${offset}px)` }}>
                        <PathNodeButton
                          node={node}
                          hue={state.course.hue}
                          testId={`${unitState.unit.id}-${node.key}`}
                        />
                      </li>
                    );
                  })}
                </motion.ol>
              ) : null}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}

function UnitBanner({ state, index, hue }: { state: UnitState; index: number; hue: number }) {
  const { unit, pick, aspect } = state;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lg"
      style={{
        background: `linear-gradient(135deg, oklch(0.55 0.17 ${hue}), oklch(0.42 0.15 ${hue + 40}))`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase opacity-80">
            Unit {index + 1}
            {unit.optional ? (
              <span
                className="ml-2 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 tracking-normal normal-case"
                data-testid={`optional-${unit.id}`}
              >
                Optional
              </span>
            ) : null}
            {pick ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 tracking-normal normal-case">
                <Sparkles className="size-3" />
                {pick.source === "said" ? "You flagged this" : "Picked for you"}
              </span>
            ) : null}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{unit.title}</h2>
          <p className="mt-1 text-sm opacity-85">{pick?.reason ?? unit.summary}</p>
        </div>
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="shrink-0 rounded-full bg-white/90 text-black hover:bg-white"
        >
          <Link href={unitHref(unit)} data-testid={`open-unit-${unit.id}`}>
            Open
          </Link>
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/25">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: 0 }}
            whileInView={{
              width: `${state.lessonTotal ? (state.lessonsDone / state.lessonTotal) * 100 : 0}%`,
            }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.15 }}
          />
        </div>
        <span className="tabular text-xs opacity-90">
          {state.lessonsDone}/{state.lessonTotal}
        </span>
        {aspect?.tag ? <PaceBadge tag={aspect.tag} /> : null}
        {state.testedOut ? (
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">Passed</span>
        ) : null}
      </div>
    </motion.div>
  );
}

function PathNodeButton({ node, hue, testId }: { node: PathNode; hue: number; testId: string }) {
  const Icon = node.icon;
  const colour =
    node.state === "open"
      ? undefined
      : { background: `oklch(0.62 0.18 ${hue})`, boxShadow: `0 6px 0 oklch(0.45 0.15 ${hue})` };
  return (
    <Popover>
      <div className="relative">
        {node.state === "next" ? (
          <motion.span
            className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 rounded-xl border bg-background px-3 py-1 text-xs font-bold tracking-wide text-primary shadow-lg"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            START
          </motion.span>
        ) : null}
        <PopoverTrigger asChild>
          <motion.button
            type="button"
            aria-label={`${node.title}: ${node.detail}`}
            data-testid={`path-node-${testId}`}
            data-state={node.state}
            initial={{ scale: 0.3, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92, y: 4 }}
            transition={{ type: "spring", stiffness: 320, damping: 16 }}
            className={cn(
              "relative grid size-16 place-items-center rounded-full text-white",
              node.state === "open" &&
                "border-2 border-border bg-muted text-muted-foreground shadow-[0_6px_0_var(--border)]",
            )}
            style={colour}
          >
            {node.state === "next" ? (
              <motion.span
                aria-hidden
                className="absolute -inset-2 rounded-full border-4"
                style={{ borderColor: `oklch(0.62 0.18 ${hue} / 0.5)` }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.9, 0.2, 0.9] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            ) : null}
            <Icon className="size-7" strokeWidth={2.4} />
          </motion.button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-64 rounded-2xl" side="bottom">
        <p className="text-xs text-muted-foreground">{node.detail}</p>
        <p className="mt-1 font-semibold">{node.title}</p>
        <Button asChild className="mt-3 w-full rounded-full">
          <Link href={node.href} data-testid={`path-node-go-${testId}`}>
            {node.action}
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
