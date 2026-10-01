"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Dumbbell, Flag, Plus, Target, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { TestTimerCard } from "@/components/tests/test-timer-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PackDrill } from "@/data/training/types";
import { useSettings } from "@/hooks/use-local-data";
import { setPackItemDone } from "@/hooks/use-training-progress";
import {
  drillExercise,
  drillHoldNote,
  lastSession,
  summarise,
  summariseRun,
} from "@/lib/hub/drills";
import { getRepositories } from "@/lib/storage";
import { formatTime } from "@/lib/timer/format";
import { cn } from "@/lib/utils";
import type { DrillRun } from "@/types/domain";
import { celebrate } from "./fx";

function secondsText(ms: number | null): string {
  return ms === null ? "—" : `${formatTime(ms, "round", 2)} s`;
}

/**
 * A drill: the rule stays on screen the whole time, every attempt is kept,
 * and at the end the session sits next to the last one. The drill's own
 * signal says what "better" means, since for some drills slower and cleaner
 * is the point. A drill with nothing to time counts rounds instead.
 */
export function DrillSession({
  packId,
  packTitle,
  drill,
  backHref,
}: {
  packId: string;
  packTitle: string;
  drill: PackDrill;
  backHref: string;
}) {
  const settings = useSettings();
  const ready = useStorageStatus().status === "ready";
  const runs = useLiveQuery(
    async () => (ready ? await getRepositories().drills.forDrill(packId, drill.id) : undefined),
    [ready, packId, drill.id],
  );
  const [times, setTimes] = useState<number[]>([]);
  const [rounds, setRounds] = useState(0);
  const [saved, setSaved] = useState<DrillRun | null>(null);
  const exercise = drillExercise(drill);
  const holdNote = drill.untimed ? null : drillHoldNote(exercise);
  const untimed = Boolean(drill.untimed);

  if (!settings || !runs) return <Skeleton className="h-[32rem] rounded-3xl" />;

  const previous = lastSession(runs, saved?.id);
  const today = summarise(times, untimed ? rounds : undefined);
  const before = previous ? summariseRun(previous) : null;
  const canFinish = untimed ? rounds > 0 : times.length > 0;
  const count = (summary: { count: number }) =>
    `${summary.count} ${untimed ? (summary.count === 1 ? "round" : "rounds") : "attempts"}`;

  const finish = async () => {
    try {
      const run = await getRepositories().drills.save(
        packId,
        drill.id,
        times,
        undefined,
        untimed ? rounds : undefined,
      );
      setSaved(run);
      setPackItemDone(packId, "drill", drill.id, true);
      // The big celebration is kept for a unit passed on its measure.
      celebrate("small");
    } catch {
      toast.error("Couldn’t save this session.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5" data-testid="drill-session">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href={backHref}>
          <ArrowLeft /> {packTitle}
        </Link>
      </Button>
      <header>
        <p className="flex items-center gap-2 eyebrow text-primary">
          <Dumbbell className="size-4" /> Drill
        </p>
        <h1 className="mt-1 font-display text-[2.9rem] leading-[0.98]">{drill.title}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">{drill.purpose}</p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 content-start gap-3">
          {/* On a phone the rules would sit below the timer, out of sight; keep them in view. */}
          <div className="tile p-4 lg:hidden" aria-label="The rules" role="group">
            <RuleChecklist rules={drill.rules} />
          </div>
          {holdNote && !saved ? (
            <p className="text-sm text-muted-foreground" data-testid="drill-hold">
              {holdNote}
            </p>
          ) : null}
          {saved ? (
            <SessionSummaryCard
              today={today}
              before={before}
              signal={drill.signal}
              untimed={untimed}
            />
          ) : untimed ? (
            <RoundCounter rounds={rounds} onRound={() => setRounds((current) => current + 1)} />
          ) : (
            <TestTimerCard
              test={exercise}
              settings={settings}
              enabled={!saved}
              lastTimeMs={times.at(-1) ?? null}
              onAttempt={(ms) => setTimes((current) => [...current, ms])}
              onDeleteLast={() => setTimes((current) => current.slice(0, -1))}
            />
          )}
          <AttemptStrip times={times} />
        </div>

        <aside className="grid content-start gap-3">
          <section className="tile hidden p-5 lg:block" data-testid="drill-rules">
            <p className="flex items-center gap-2 eyebrow">
              <Flag className="size-3.5" /> The rule is the point
            </p>
            <RuleChecklist rules={drill.rules} />
          </section>
          <section className="grid gap-2 border-y border-[var(--hairline)] py-3 text-sm">
            <p>
              <span className="text-xs text-muted-foreground">How much · </span>
              {drill.dose}
            </p>
            <p>
              <span className="text-xs text-muted-foreground">It&apos;s working when · </span>
              {drill.signal}
            </p>
          </section>
          <section className="grid grid-cols-2 gap-2 text-center">
            <Stat
              label="This session"
              value={untimed ? String(today.count) : secondsText(today.meanMs)}
              note={untimed ? (today.count === 1 ? "round" : "rounds") : count(today)}
            />
            <Stat
              label="Last session"
              value={before ? (untimed ? String(before.count) : secondsText(before.meanMs)) : "—"}
              note={
                before
                  ? untimed
                    ? before.count === 1
                      ? "round"
                      : "rounds"
                    : count(before)
                  : "None yet"
              }
            />
          </section>
          {saved ? (
            <Button asChild size="lg" className="rounded-full">
              <Link href={backHref}>
                <Check /> Done
              </Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!canFinish}
                onClick={() =>
                  untimed
                    ? setRounds((current) => Math.max(0, current - 1))
                    : setTimes((current) => current.slice(0, -1))
                }
              >
                <Undo2 /> Undo last
              </Button>
              <Button
                className="flex-1 rounded-full"
                disabled={!canFinish}
                onClick={finish}
                data-testid="drill-finish"
              >
                Finish session
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {untimed
              ? "Nothing here is timed: the session just remembers how many rounds you did."
              : "Drill times never touch your timer averages or your solve profile."}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="tile p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display tabular text-[1.7rem] leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

/** An untimed drill's session: count the rounds, and stop when the dose is done. */
function RoundCounter({ rounds, onRound }: { rounds: number; onRound: () => void }) {
  return (
    <section
      className="tile grid place-items-center gap-4 p-8 text-center"
      data-testid="drill-rounds"
    >
      <p className="text-xs text-muted-foreground">Rounds this session</p>
      <p className="tabular text-6xl font-semibold">{rounds}</p>
      <Button size="lg" className="rounded-full px-8" onClick={onRound} data-testid="drill-round">
        <Plus /> Done one round
      </Button>
      <p className="max-w-sm text-sm text-muted-foreground">
        No timer for this drill. Do a round as the rules say, count it, and finish the session when
        you have done the dose.
      </p>
    </section>
  );
}

/**
 * The drill's rules as a checklist you tick off while you run it (kept for
 * this visit only): a small, physical way to keep the rule in mind.
 */
function RuleChecklist({ rules }: { rules: readonly string[] }) {
  const [ticked, setTicked] = useState<ReadonlySet<number>>(new Set());
  return (
    <ol className="mt-2 grid gap-0.5 text-sm">
      {rules.map((rule, index) => {
        const done = ticked.has(index);
        return (
          <li key={rule}>
            <button
              type="button"
              aria-pressed={done}
              onClick={() =>
                setTicked((current) => {
                  const next = new Set(current);
                  if (next.has(index)) next.delete(index);
                  else next.add(index);
                  return next;
                })
              }
              className="group flex w-full items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]"
            >
              <span
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-200",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground/25",
                )}
              >
                <motion.svg
                  viewBox="0 0 16 16"
                  className={cn("size-2.5 transition-opacity", !done && "opacity-0")}
                  aria-hidden
                >
                  <motion.path
                    d="M3.5 8.5l3 3 6-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: done ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.svg>
              </span>
              <span className={cn("transition-colors", done && "text-muted-foreground")}>
                <span className="mr-1 tabular text-xs text-muted-foreground">{index + 1}.</span>
                {rule}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Every attempt of this session as a bar that springs up as you finish it,
 * scaled to the slowest so far, with the session mean as a hairline.
 */
function AttemptStrip({ times }: { times: number[] }) {
  const slowest = Math.max(1, ...times);
  const mean = times.length ? times.reduce((sum, ms) => sum + ms, 0) / times.length : null;
  return (
    <div className="tile px-4 pt-4 pb-3">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span>This session</span>
        <span className="tabular">
          {times.length
            ? `${times.length} ${times.length === 1 ? "attempt" : "attempts"}`
            : "Your attempts appear here"}
        </span>
      </div>
      <div className="relative mt-3 h-24">
        {times.length === 0 ? (
          <p className="absolute inset-0 grid place-items-center border-b border-dashed border-[var(--hairline)] text-center text-xs text-muted-foreground">
            Each attempt lands here as a bar, so you can see the session take shape.
          </p>
        ) : null}
        {mean !== null ? (
          <motion.span
            aria-hidden
            className="absolute inset-x-0 border-t border-dashed border-primary/60"
            initial={false}
            animate={{ bottom: `${(mean / slowest) * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
          />
        ) : null}
        <ol
          className="absolute inset-0 no-scrollbar flex items-end gap-1.5 overflow-x-auto"
          aria-label="This session's times"
          data-testid="drill-times"
        >
          <AnimatePresence initial={false}>
            {times.map((ms, index) => (
              <motion.li
                key={`${index}-${ms}`}
                className="group relative flex h-full w-7 shrink-0 flex-col justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                title={`${formatTime(ms, "round", 2)} s`}
              >
                <motion.span
                  className={cn(
                    "block w-full origin-bottom rounded-t-md rounded-b-sm",
                    index === times.length - 1 ? "bg-primary" : "bg-foreground/70",
                  )}
                  style={{ height: `${Math.max(6, (ms / slowest) * 100)}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                />
                <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-foreground px-1 tabular text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                  {formatTime(ms, "round", 2)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </div>
    </div>
  );
}

function SessionSummaryCard({
  today,
  before,
  signal,
  untimed,
}: {
  today: ReturnType<typeof summarise>;
  before: ReturnType<typeof summarise> | null;
  signal: string;
  untimed: boolean;
}) {
  const change =
    before?.meanMs != null && today.meanMs != null ? today.meanMs - before.meanMs : null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="tile grid gap-4 p-7 text-center"
      data-testid="drill-summary"
    >
      <motion.span
        className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      >
        <Target className="size-6" />
      </motion.span>
      <h2 className="font-display text-[2.4rem] leading-none">
        Session <em className="text-primary">saved</em>
      </h2>
      {untimed ? (
        <>
          <p className="font-display tabular text-[3.4rem] leading-none text-primary">
            {today.count} {today.count === 1 ? "round" : "rounds"}
          </p>
          <p className="text-sm text-muted-foreground">
            {before ? `${before.count} last session` : "Your first session of this drill"}
          </p>
        </>
      ) : (
        <>
          <p className="font-display tabular text-[3.4rem] leading-none">
            {secondsText(today.meanMs)}
          </p>
          <p className="text-sm text-muted-foreground">
            Mean of {today.count} · best {secondsText(today.bestMs)}
            {change !== null
              ? ` · ${change <= 0 ? "" : "+"}${(change / 1000).toFixed(2)} s against last session`
              : " · your first session of this drill"}
          </p>
        </>
      )}
      <p className="mx-auto max-w-md border-l-2 border-primary pl-3 text-left text-sm">
        <span className="font-medium">What to look for:</span> {signal}
      </p>
    </motion.section>
  );
}
