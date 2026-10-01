"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, ChevronDown, CircleAlert, Dumbbell, Timer } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PaceBadge } from "@/components/coach/pace-badge";
import type { PackDrill, PackLesson, TrainingPack } from "@/data/training/types";
import { packBandLabel } from "@/data/training/bands";
import { packHref } from "@/data/training";
import { testHref, testTitle } from "@/data/exercises";
import { getAspect } from "@/lib/coach/aspects";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { usePackProgress } from "@/hooks/use-training-progress";
import { drillHref } from "@/lib/hub/drills";
import { cn } from "@/lib/utils";

export function PackDetail({
  pack,
  variant = "full",
}: {
  pack: TrainingPack;
  /**
   * "unit" is the Hub unit page, which already shows the lessons as cards and
   * the retest in its own header: no second lesson list or retest here, and
   * the drills as one compact list with one open at a time.
   */
  variant?: "full" | "unit";
}) {
  const unitPage = variant === "unit";
  const { loaded, progress, setDone } = usePackProgress(pack);
  // A pack written for a level rather than one part of the solve has no
  // measurement of its own to show.
  const definition = pack.aspectId ? getAspect(pack.aspectId) : null;
  // Only the full-solve and consistency parts come from timer solves; every
  // other pack needs just the test results, so the solve history stays unread.
  const { profile } = useSolveProfile({
    withSolves: definition?.measuredBy === "timer",
    enabled: definition !== null,
  });
  const aspect = definition
    ? (profile?.aspects.find((entry) => entry.id === definition.id) ?? null)
    : null;
  const readPercent = progress.lessonTotal
    ? Math.round((progress.lessonsDone / progress.lessonTotal) * 100)
    : 0;

  return (
    <div className={cn("grid", unitPage ? "gap-12" : "gap-6")}>
      <section className={unitPage ? "border-b border-[var(--hairline)] pb-10" : "tile p-6 md:p-8"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Calling it "why this is slow" would be wrong for someone whose own
              measurement says this part is fine. */}
          <p className="eyebrow">
            {!definition
              ? `Why it matters at ${packBandLabel(pack)}`
              : aspect?.tag && aspect.tag !== "slow"
                ? "What this is about"
                : "Why this is slow"}
          </p>
          {definition && aspect?.tag && !unitPage ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              Your {definition.label.toLowerCase()} <PaceBadge tag={aspect.tag} />
            </span>
          ) : null}
        </div>
        <p className="mt-3 max-w-3xl font-display text-[1.45rem] leading-snug text-pretty md:text-[1.65rem]">
          {pack.why}
        </p>
        {loaded ? (
          <div className="mt-5 flex items-center gap-3">
            <Progress value={readPercent} className="h-1 max-w-xs" aria-label="Lessons read" />
            <span
              className="text-xs whitespace-nowrap text-muted-foreground"
              data-testid="pack-progress"
            >
              {progress.lessonsDone}/{progress.lessonTotal} lessons read
            </span>
          </div>
        ) : (
          <Skeleton className="mt-5 h-4 w-56" />
        )}
      </section>

      {unitPage ? null : (
        <section aria-labelledby="lessons-heading">
          <h2 id="lessons-heading" className="mb-3 font-display text-[2rem] leading-none">
            Lessons
          </h2>
          <Accordion type="multiple" className="grid gap-3">
            {pack.lessons.map((lesson) => (
              <LessonBlock
                key={lesson.id}
                lesson={lesson}
                done={progress.isLessonDone(lesson.id)}
                loaded={loaded}
                onToggle={(done) => setDone("lesson", lesson.id, done)}
              />
            ))}
          </Accordion>
        </section>
      )}

      {unitPage ? (
        <UnitDrills
          packId={pack.id}
          drills={pack.drills}
          loaded={loaded}
          isDone={progress.isDrillDone}
          onToggle={(id, done) => setDone("drill", id, done)}
        />
      ) : (
        <section aria-labelledby="drills-heading">
          <h2 id="drills-heading" className="mb-1 font-display text-[2rem] leading-none">
            Drills
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Practice with a rule attached. The rule is the point — it forces the thing the lessons
            describe, which ordinary solving lets you avoid. Choose <em>Practise this</em> and the
            drill goes on your{" "}
            <Link href="/train/" className="underline underline-offset-4">
              Train
            </Link>{" "}
            page.
          </p>
          <div className="grid gap-3">
            {pack.drills.map((drill) => (
              <DrillBlock
                key={drill.id}
                packId={pack.id}
                drill={drill}
                done={progress.isDrillDone(drill.id)}
                loaded={loaded}
                onToggle={(done) => setDone("drill", drill.id, done)}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="mistakes-heading">
        <h2
          id="mistakes-heading"
          className="flex items-center gap-2 font-display text-[1.6rem] leading-none"
        >
          <CircleAlert className="size-4 text-muted-foreground" aria-hidden /> What keeps this slow
        </h2>
        <ul className="mt-3 grid border-t border-[var(--hairline)] text-sm text-muted-foreground">
          {pack.mistakes.map((mistake) => (
            <li key={mistake} className="border-b border-[var(--hairline)] py-2.5 text-pretty">
              {mistake}
            </li>
          ))}
        </ul>
      </section>

      {aspect?.nextTest && !unitPage ? (
        <section className="tile p-5">
          <h2 className="text-sm font-semibold">
            {aspect.value === null ? "Get a number for this first" : "See whether it worked"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {aspect.value === null
              ? `Take the ${testTitle(aspect.nextTest)} before you start, then again after a couple of weeks of the drills. Without a first number there is nothing to compare against.`
              : `Give the drills a couple of weeks, then retake the ${testTitle(aspect.nextTest)} and compare. The profile keeps your previous number so the change is visible.`}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href={testHref(aspect.nextTest)} data-testid="pack-retest">
              {aspect.value === null ? "Take it" : "Retake it"} <ArrowRight />
            </Link>
          </Button>
        </section>
      ) : null}

      <section>
        <h2 className="text-xs text-muted-foreground">Where this comes from</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Written in our own words from these. Worth reading if you want the longer version.
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {pack.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function LessonBlock({
  lesson,
  done,
  loaded,
  onToggle,
}: {
  lesson: PackLesson;
  done: boolean;
  loaded: boolean;
  onToggle: (done: boolean) => void;
}) {
  return (
    <AccordionItem
      value={lesson.id}
      className={cn("rounded-2xl border px-5 last:border-b", done && "border-primary/40")}
      data-testid={`lesson-${lesson.id}`}
    >
      <AccordionTrigger className="text-left hover:no-underline">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-full border text-xs",
              done ? "border-primary bg-primary/15 text-primary" : "text-muted-foreground",
            )}
            aria-hidden
          >
            {done ? <Check className="size-3.5" /> : lesson.minutes}
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{lesson.title}</span>
            <span className="block text-sm font-normal text-muted-foreground">
              {lesson.takeaway}
            </span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5">
        <div className="grid gap-3 text-sm leading-relaxed">
          {lesson.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {lesson.examples?.length ? (
            <div className="bg-surface-sunken grid gap-3 rounded-xl p-4">
              {lesson.examples.map((example) => (
                <div key={example.label}>
                  <p className="text-xs font-medium">{example.label}</p>
                  {example.moves ? (
                    <p className="mt-0.5 font-mono tabular text-sm">{example.moves}</p>
                  ) : null}
                  <p className="mt-0.5 text-sm text-muted-foreground">{example.note}</p>
                </div>
              ))}
            </div>
          ) : null}
          {lesson.checkpoint ? (
            <p className="rounded-xl border border-dashed px-4 py-3 text-sm">
              <span className="font-medium">You have it when:</span>{" "}
              <span className="text-muted-foreground">{lesson.checkpoint}</span>
            </p>
          ) : null}
        </div>
        <Button
          variant={done ? "secondary" : "outline"}
          size="sm"
          className="mt-4"
          disabled={!loaded}
          onClick={() => onToggle(!done)}
          data-testid={`lesson-done-${lesson.id}`}
        >
          {done ? (
            <>
              <Check /> Read
            </>
          ) : (
            "Mark as read"
          )}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

/** One drill, as shown in its pack and on the Train page. */
export function DrillBlock({
  packId,
  drill,
  done,
  loaded,
  onToggle,
  pack,
}: {
  packId: string;
  drill: PackDrill;
  done: boolean;
  loaded: boolean;
  onToggle: (done: boolean) => void;
  /** On Train, the pack it came from, so the lessons behind it are one click away. */
  pack?: TrainingPack;
}) {
  return (
    <article
      className={cn("rounded-2xl border p-5", done && "border-primary/40")}
      data-testid={`drill-${drill.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {pack ? (
            <Link
              href={packHref(pack)}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {pack.title}
            </Link>
          ) : null}
          <h3 className="font-medium">{drill.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{drill.purpose}</p>
        </div>
        <Button
          variant={done ? "secondary" : "outline"}
          size="sm"
          disabled={!loaded}
          onClick={() => onToggle(!done)}
          data-testid={`drill-done-${drill.id}`}
        >
          {done ? (
            <>
              <Check /> Practising
            </>
          ) : (
            "Practise this"
          )}
        </Button>
      </div>
      <ol className="mt-3 grid gap-1.5 text-sm">
        {drill.rules.map((rule, index) => (
          <li key={rule} className="flex gap-2.5">
            <span className="tabular text-xs text-muted-foreground">{index + 1}.</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="bg-surface-sunken rounded-xl px-3 py-2">
          <dt className="text-xs text-muted-foreground">How much</dt>
          <dd>{drill.dose}</dd>
        </div>
        <div className="bg-surface-sunken rounded-xl px-3 py-2">
          <dt className="text-xs text-muted-foreground">It is working when</dt>
          <dd>{drill.signal}</dd>
        </div>
      </dl>
      <Button asChild size="sm" className="mt-4 rounded-full">
        <Link href={drillHref(packId, drill.id)} data-testid={`drill-run-${drill.id}`}>
          {drill.untimed ? (
            <>
              <Dumbbell /> Start the drill
            </>
          ) : (
            <>
              <Timer /> Run a timed session
            </>
          )}
        </Link>
      </Button>
    </article>
  );
}

/**
 * The Hub unit page's drills: one quiet list, one drill open at a time, one
 * action (run it) on the open drill. Keeps the drill test ids of DrillBlock.
 */
function UnitDrills({
  packId,
  drills,
  loaded,
  isDone,
  onToggle,
}: {
  packId: string;
  drills: readonly PackDrill[];
  loaded: boolean;
  isDone: (drillId: string) => boolean;
  onToggle: (drillId: string, done: boolean) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(drills[0]?.id ?? null);
  if (!drills.length) return null;
  return (
    <section aria-labelledby="drills-heading">
      <div className="mb-4">
        <h2 id="drills-heading" className="font-display text-[2.2rem] leading-none">
          Drills
        </h2>
        <p className="mt-1.5 max-w-2xl text-xs text-muted-foreground">
          Practice with a rule attached: the rule forces what the lessons describe. Tick{" "}
          <em>Practise this</em> and it joins your{" "}
          <Link href="/train/" className="underline underline-offset-4">
            practice
          </Link>
          .
        </p>
      </div>
      <ol className="tile divide-y divide-[var(--hairline)] overflow-hidden">
        {drills.map((drill, index) => {
          const open = drill.id === openId;
          const done = isDone(drill.id);
          return (
            <li key={drill.id} data-testid={`drill-${drill.id}`}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : drill.id)}
                className="group grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)] md:px-6"
              >
                <span className="font-display tabular text-lg leading-none text-muted-foreground italic">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[1.35rem] leading-tight">
                    {drill.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{drill.dose}</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Check className="size-3.5" /> Practising
                    </span>
                  ) : null}
                  <ChevronDown
                    className={cn("size-4 transition-transform duration-300", open && "rotate-180")}
                  />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-4 px-5 pb-5 pl-[3.75rem] md:px-6 md:pl-[4.25rem]">
                      <p className="max-w-2xl text-sm text-pretty">{drill.purpose}</p>
                      <ol className="grid gap-1.5 text-sm">
                        {drill.rules.map((rule, at) => (
                          <li key={rule} className="flex gap-2.5">
                            <span className="tabular text-xs text-muted-foreground">{at + 1}.</span>
                            <span className="text-pretty">{rule}</span>
                          </li>
                        ))}
                      </ol>
                      <p className="max-w-2xl text-xs text-muted-foreground">
                        <span className="text-foreground">It&apos;s working when</span>{" "}
                        {drill.signal}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <Button asChild className="rounded-full">
                          <Link
                            href={drillHref(packId, drill.id)}
                            data-testid={`drill-run-${drill.id}`}
                          >
                            {drill.untimed ? (
                              <>
                                <Dumbbell /> Start the drill
                              </>
                            ) : (
                              <>
                                <Timer /> Run a timed session
                              </>
                            )}
                          </Link>
                        </Button>
                        <button
                          type="button"
                          disabled={!loaded}
                          aria-pressed={done}
                          onClick={() => onToggle(drill.id, !done)}
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          data-testid={`drill-done-${drill.id}`}
                        >
                          {done ? (
                            <>
                              <Check className="size-3.5 text-primary" /> Practising
                            </>
                          ) : (
                            "Practise this"
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
