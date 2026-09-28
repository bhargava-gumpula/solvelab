"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Dumbbell, Flag, Target, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { TestTimerCard } from "@/components/tests/test-timer-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PackDrill } from "@/data/training/types";
import { useSettings } from "@/hooks/use-local-data";
import { setPackItemDone } from "@/hooks/use-training-progress";
import { drillExercise, lastSession, summarise } from "@/lib/hub/drills";
import { getRepositories } from "@/lib/storage";
import { formatTime } from "@/lib/timer/format";
import type { DrillRun } from "@/types/domain";
import { celebrate } from "./fx";

function secondsText(ms: number | null): string {
  return ms === null ? "—" : `${formatTime(ms, "round", 2)} s`;
}

/**
 * A drill, run with a timer: the rule stays on screen the whole time, every
 * attempt is kept, and at the end the session sits next to the last one. The
 * drill's own signal says what "better" means, since for some drills slower
 * and cleaner is the point.
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
  const [saved, setSaved] = useState<DrillRun | null>(null);
  const exercise = drillExercise(drill);

  if (!settings || !runs) return <Skeleton className="h-[32rem] rounded-3xl" />;

  const previous = lastSession(runs, saved?.id);
  const today = summarise(times);
  const before = previous ? summarise(previous.timesMs) : null;

  const finish = async () => {
    try {
      const run = await getRepositories().drills.save(packId, drill.id, times);
      setSaved(run);
      setPackItemDone(packId, "drill", drill.id, true);
      celebrate("big");
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
          {saved ? (
            <SessionSummaryCard today={today} before={before} signal={drill.signal} />
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
              value={secondsText(today.meanMs)}
              note={`${today.count} attempts`}
            />
            <Stat
              label="Last session"
              value={secondsText(before?.meanMs ?? null)}
              note={before ? `${before.count} attempts` : "None yet"}
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
                disabled={!times.length}
                onClick={() => setTimes((current) => current.slice(0, -1))}
              >
                <Undo2 /> Undo last
              </Button>
              <Button
                className="flex-1 rounded-full"
                disabled={!times.length}
                onClick={finish}
                data-testid="drill-finish"
              >
                Finish session
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Drill times never touch your timer averages or your solve profile.
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

function SessionSummaryCard({
  today,
  before,
  signal,
}: {
  today: ReturnType<typeof summarise>;
  before: ReturnType<typeof summarise> | null;
  signal: string;
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
      <p className="tabular text-4xl font-bold text-primary">{secondsText(today.meanMs)}</p>
      <p className="text-sm text-muted-foreground">
        Mean of {today.count} · best {secondsText(today.bestMs)}
        {change !== null
          ? ` · ${change <= 0 ? "" : "+"}${(change / 1000).toFixed(2)} s against last session`
          : " · your first session of this drill"}
      </p>
      <p className="mx-auto max-w-md rounded-xl bg-background/40 p-3 text-sm">
        <span className="font-medium">What to look for:</span> {signal}
      </p>
    </motion.section>
  );
}
