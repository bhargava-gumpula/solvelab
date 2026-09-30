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
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{drill.title}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">{drill.purpose}</p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 content-start gap-3">
          {/* On a phone the rules would sit below the timer, out of sight; keep them in view. */}
          <ol
            className="grid gap-1 rounded-2xl border-2 border-primary/40 bg-primary/5 p-3 text-sm lg:hidden"
            aria-label="The rules"
          >
            {drill.rules.map((rule, index) => (
              <li key={rule} className="flex gap-2">
                <span className="tabular text-xs text-muted-foreground">{index + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
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
          <ol
            className="flex flex-wrap gap-1.5"
            aria-label="This session's times"
            data-testid="drill-times"
          >
            <AnimatePresence initial={false}>
              {times.map((ms, index) => (
                <motion.li
                  key={`${index}-${ms}`}
                  initial={{ opacity: 0, scale: 0.6, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="rounded-full border bg-background/40 px-2.5 py-1 tabular text-xs"
                >
                  {formatTime(ms, "round", 2)}
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </div>

        <aside className="grid content-start gap-3">
          <section
            className="hidden rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 lg:block"
            data-testid="drill-rules"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Flag className="size-4" /> The rule is the point
            </p>
            <ol className="mt-2 grid gap-1.5 text-sm">
              {drill.rules.map((rule, index) => (
                <li key={rule} className="flex gap-2">
                  <span className="tabular text-xs text-muted-foreground">{index + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="grid gap-2 rounded-2xl p-4 text-sm glass">
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
    <div className="rounded-2xl border bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 tabular text-lg font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

/** An untimed drill's session: count the rounds, and stop when the dose is done. */
function RoundCounter({ rounds, onRound }: { rounds: number; onRound: () => void }) {
  return (
    <section
      className="grid place-items-center gap-4 rounded-3xl p-8 text-center glass"
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid gap-4 rounded-3xl p-6 text-center glass"
      data-testid="drill-summary"
    >
      <motion.span
        className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"
        initial={{ rotate: -90, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        <Target className="size-7" />
      </motion.span>
      <h2 className="text-2xl font-semibold">Session saved</h2>
      {untimed ? (
        <>
          <p className="tabular text-4xl font-bold text-primary">
            {today.count} {today.count === 1 ? "round" : "rounds"}
          </p>
          <p className="text-sm text-muted-foreground">
            {before ? `${before.count} last session` : "Your first session of this drill"}
          </p>
        </>
      ) : (
        <>
          <p className="tabular text-4xl font-bold text-primary">{secondsText(today.meanMs)}</p>
          <p className="text-sm text-muted-foreground">
            Mean of {today.count} · best {secondsText(today.bestMs)}
            {change !== null
              ? ` · ${change <= 0 ? "" : "+"}${(change / 1000).toFixed(2)} s against last session`
              : " · your first session of this drill"}
          </p>
        </>
      )}
      <p className="mx-auto max-w-md rounded-xl bg-background/40 p-3 text-sm">
        <span className="font-medium">What to look for:</span> {signal}
      </p>
    </motion.section>
  );
}
