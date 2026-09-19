"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Flame, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { PaceBadge } from "@/components/coach/pace-badge";
import { TestTimerCard } from "@/components/tests/test-timer-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getExercise, testTitle } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { useDailyChecks } from "@/hooks/use-daily-checks";
import { useSettings } from "@/hooks/use-local-data";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { useTimeFormat } from "@/hooks/use-time-format";
import {
  checkForDay,
  compareDaily,
  DAILY_ATTEMPTS,
  DAILY_TESTS,
  dailyHistory,
  dailyProfile,
  dailyProgress,
  dailyStreak,
  localDay,
  nextDailyTest,
  type DailyComparison,
} from "@/lib/coach/daily-check";
import { formatAspectValue } from "@/lib/coach/profile-format";
import { getRepositories } from "@/lib/storage";
import type { TimeDecimals } from "@/lib/timer/format";
import { cn } from "@/lib/utils";
import type { DailyCheck, UserSettings } from "@/types/domain";

const PROFILE_HREF = "/stats/profile/";

/** Two attempts of each test, compared with the solve profile. */
export function DailyCheckView() {
  const settings = useSettings();
  const checks = useDailyChecks();
  const [today] = useState(() => localDay());

  if (!settings || !checks) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }
  const current = checkForDay(checks, today);
  // Keyed by the check it opens with; writes to that check don't restart the page.
  return (
    <DailyCheckBody
      key={current?.id ?? "new"}
      checks={checks}
      initial={current ?? null}
      today={today}
      settings={settings}
    />
  );
}

function DailyCheckBody({
  checks,
  initial,
  today,
  settings,
}: {
  checks: DailyCheck[];
  initial: DailyCheck | null;
  today: string;
  settings: UserSettings;
}) {
  const router = useRouter();
  const [checkId, setCheckId] = useState<string | null>(initial?.id ?? null);
  const [attempts, setAttempts] = useState<Record<string, number[]>>(initial?.attempts ?? {});
  const [skipped, setSkipped] = useState<string[]>(initial?.skipped ?? []);
  const [view, setView] = useState<"intro" | "session" | "results">(
    !initial ? "intro" : initial.completedAt ? "results" : "session",
  );
  const [finishing, setFinishing] = useState(false);
  // The time just recorded stays on the display when the next test comes up.
  const [lastRecorded, setLastRecorded] = useState<number | null>(null);
  const latest = useRef({ attempts, skipped, checkId });
  useEffect(() => {
    latest.current = { attempts, skipped, checkId };
  }, [attempts, skipped, checkId]);
  const writes = useRef<Promise<unknown>>(Promise.resolve());

  const queue = (write: () => Promise<unknown>) => {
    writes.current = writes.current.then(write).catch((error: unknown) => {
      console.error(error);
      toast.error("Couldn’t save the daily check. Check that site storage is allowed.");
    });
    return writes.current;
  };

  const start = async () => {
    const check = await getRepositories().coach.startDailyCheck(localDay());
    setCheckId(check.id);
    setAttempts({});
    setSkipped([]);
    setView("session");
    window.scrollTo({ top: 0 });
  };

  const finish = async () => {
    const id = latest.current.checkId;
    if (!id || finishing) return;
    setFinishing(true);
    await queue(() => getRepositories().coach.completeDailyCheck(id));
    setFinishing(false);
    setView("results");
    window.scrollTo({ top: 0 });
  };

  const setTimes = (testId: string, times: number[]) => {
    const next = { ...latest.current.attempts, [testId]: times };
    const nextSkipped = latest.current.skipped.filter((id) => id !== testId);
    latest.current = { ...latest.current, attempts: next, skipped: nextSkipped };
    setAttempts(next);
    setSkipped(nextSkipped);
    const id = latest.current.checkId;
    if (id) void queue(() => getRepositories().coach.saveDailyAttempts(id, testId, times));
    return { attempts: next, skipped: nextSkipped };
  };

  const addAttempt = (testId: string, ms: number) => {
    const times = [...(latest.current.attempts[testId] ?? []), ms];
    setLastRecorded(ms);
    const state = setTimes(testId, times);
    if (times.length >= DAILY_ATTEMPTS) {
      const next = nextDailyTest(state);
      if (next)
        toast.success(`${testTitle(testId)} done`, { description: `Next: ${testTitle(next)}` });
      else void finish();
    }
  };

  const deleteAttempt = (testId: string, index: number) => {
    const current = latest.current.attempts[testId] ?? [];
    const removed = current[index];
    if (removed === undefined) return;
    setTimes(
      testId,
      current.filter((_, i) => i !== index),
    );
    toast("Attempt deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          const restored = [...(latest.current.attempts[testId] ?? [])];
          restored.splice(Math.min(index, restored.length), 0, removed);
          setTimes(testId, restored);
        },
      },
    });
  };

  const skip = (testId: string) => {
    const id = latest.current.checkId;
    const nextSkipped = [...latest.current.skipped, testId];
    latest.current = { ...latest.current, skipped: nextSkipped };
    setSkipped(nextSkipped);
    if (id) void queue(() => getRepositories().coach.skipDailyTest(id, testId));
    if (!nextDailyTest({ attempts: latest.current.attempts, skipped: nextSkipped })) void finish();
  };

  const saveAndExit = async () => {
    await writes.current;
    router.push("/coach/");
  };

  if (view === "intro") {
    return <DailyIntro checks={checks} today={today} settings={settings} onStart={start} />;
  }

  const check: DailyCheck = {
    ...(checks.find((entry) => entry.id === checkId) ?? {
      id: checkId ?? "pending",
      day: today,
      createdAt: initial?.createdAt ?? "",
    }),
    attempts,
    skipped,
  };

  if (view === "results") {
    return (
      <DailyResults
        check={check}
        checks={checks}
        today={today}
        settings={settings}
        onDelete={deleteAttempt}
        onStartAnother={start}
      />
    );
  }

  const testId = nextDailyTest({ attempts, skipped });
  const test = testId ? getExercise(testId) : undefined;
  const progress = dailyProgress({ attempts, skipped });
  const index = testId ? DAILY_TESTS.indexOf(testId) : DAILY_TESTS.length - 1;

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl p-5 glass md:p-6" data-focus-hide>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl min-w-0">
            <p className="eyebrow text-primary">
              Daily check · test {index + 1} of {DAILY_TESTS.length}
            </p>
            <h1
              className="mt-1 text-2xl font-semibold tracking-tight"
              data-testid="daily-test-title"
            >
              {testId ? testTitle(testId) : "All done"}
            </h1>
            {test ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {test.instructions.join(" ")} Two attempts.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void saveAndExit()} disabled={finishing}>
              <ArrowLeft /> Save and exit
            </Button>
            {testId ? (
              <Button variant="secondary" onClick={() => skip(testId)} disabled={finishing}>
                <SkipForward /> Skip this test
              </Button>
            ) : null}
          </div>
        </div>
        <ol
          className="mt-4 flex gap-1"
          aria-label={`${progress.done} of ${progress.total} tests done`}
        >
          {DAILY_TESTS.map((id) => {
            const count = attempts[id]?.length ?? 0;
            const done = count >= DAILY_ATTEMPTS || skipped.includes(id);
            return (
              <li
                key={id}
                title={testTitle(id)}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  id === testId
                    ? "bg-primary/60"
                    : done
                      ? skipped.includes(id) && count < DAILY_ATTEMPTS
                        ? "bg-muted-foreground/40"
                        : "bg-primary"
                      : "bg-muted",
                )}
              />
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground" data-testid="daily-progress">
          {progress.done} of {progress.total} tests done
        </p>
      </section>

      {test && testId ? (
        <TestTimerCard
          key={testId}
          test={test}
          settings={settings}
          enabled={!finishing}
          lastTimeMs={attempts[testId]?.at(-1) ?? lastRecorded}
          onAttempt={(ms) => addAttempt(testId, ms)}
          onDeleteLast={() => {
            const times = latest.current.attempts[testId] ?? [];
            if (times.length > 0) deleteAttempt(testId, times.length - 1);
          }}
        />
      ) : null}

      <DailyAttempts
        attempts={attempts}
        skipped={skipped}
        current={testId}
        onDelete={deleteAttempt}
      />
    </div>
  );
}

function DailyIntro({
  checks,
  today,
  settings,
  onStart,
}: {
  checks: DailyCheck[];
  today: string;
  settings: UserSettings;
  onStart: () => Promise<void>;
}) {
  const [starting, setStarting] = useState(false);
  const streak = dailyStreak(checks, today);
  const last = [...checks]
    .filter((check) => check.completedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl p-6 glass md:p-8" data-testid="daily-intro">
        <p className="eyebrow text-primary">About 5 minutes</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Daily check</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Two attempts of each test, one after another. You’ll see how today compares with your
          solve profile. Two attempts are a quick read, so your profile only changes when you take
          the full tests.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tests in the daily check">
          {DAILY_TESTS.map((testId) => (
            <li key={testId} className="rounded-lg border bg-background/40 px-2.5 py-1 text-xs">
              {testTitle(testId)}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button
            size="lg"
            disabled={starting}
            onClick={() => {
              setStarting(true);
              void onStart().finally(() => setStarting(false));
            }}
          >
            Start daily check
          </Button>
          <p className="text-sm text-muted-foreground">
            {last
              ? `Last check: ${dayLabel(last.day, today)}${streak > 1 ? ` · ${streak}-day streak` : ""}`
              : "Your first check."}
          </p>
        </div>
      </section>
      <ReminderToggle settings={settings} />
    </div>
  );
}

export function ReminderToggle({ settings }: { settings: UserSettings }) {
  return (
    <section className="flex items-start justify-between gap-6 rounded-3xl p-5 glass">
      <div>
        <Label htmlFor="daily-reminder" className="text-sm font-medium">
          Remind me each day
        </Label>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Puts a dot on Coach in the menu until you’ve done that day’s check.
        </p>
      </div>
      <Switch
        id="daily-reminder"
        checked={settings.dailyCheckReminder}
        onCheckedChange={(on) => void getRepositories().settings.update({ dailyCheckReminder: on })}
      />
    </section>
  );
}

function DailyAttempts({
  attempts,
  skipped,
  current,
  onDelete,
}: {
  attempts: Record<string, number[]>;
  skipped: string[];
  current: string | null;
  onDelete: (testId: string, index: number) => void;
}) {
  const { formatTime } = useTimeFormat();
  return (
    <section
      aria-labelledby="daily-attempts-heading"
      className="rounded-3xl p-4 glass md:p-5"
      data-focus-hide
    >
      <h2 id="daily-attempts-heading" className="text-sm font-semibold">
        Your attempts
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {DAILY_TESTS.map((testId) => {
          const times = attempts[testId] ?? [];
          const isSkipped = skipped.includes(testId) && times.length < DAILY_ATTEMPTS;
          return (
            <li
              key={testId}
              data-testid={`daily-attempts-${testId}`}
              className={cn(
                "rounded-xl border px-3 py-2",
                testId === current ? "border-primary/50 bg-primary/5" : "bg-background/30",
              )}
            >
              <p className="flex items-center justify-between gap-2 text-xs font-medium">
                {testTitle(testId).replace(/ test$/, "")}
                {times.length >= DAILY_ATTEMPTS ? (
                  <Check className="size-3.5 text-primary" aria-label="Done" />
                ) : isSkipped ? (
                  <span className="text-[11px] font-normal text-muted-foreground">Skipped</span>
                ) : null}
              </p>
              <div className="mt-1 flex min-h-7 flex-wrap gap-1">
                {times.map((ms, index) => (
                  <button
                    key={`${index}-${ms}`}
                    type="button"
                    onClick={() => onDelete(testId, index)}
                    aria-label={`Delete ${testTitle(testId)} attempt ${index + 1}, ${formatTime(ms)}`}
                    className="rounded-md border bg-background/40 px-1.5 py-0.5 font-mono tabular text-xs transition-colors hover:border-destructive/60 hover:text-destructive"
                  >
                    {formatTime(ms)} ✕
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Started one by accident? Tap it to delete it, or press Backspace for the last one. That test
        comes back up.
      </p>
    </section>
  );
}

function DailyResults({
  check,
  checks,
  today,
  settings,
  onDelete,
  onStartAnother,
}: {
  check: DailyCheck;
  checks: DailyCheck[];
  today: string;
  settings: UserSettings;
  onDelete: (testId: string, index: number) => void;
  onStartAnother: () => Promise<void>;
}) {
  const { decimals } = useTimeFormat();
  const { profile } = useSolveProfile();
  const goal = milestones.find((m) => m.id === settings.targetMilestone) ?? null;
  const todayProfile = dailyProfile(check, settings.targetMilestone);
  const rows = compareDaily(todayProfile, profile);
  const compared = rows.filter((row) => row.change !== null);
  const better = compared.filter((row) => row.change === "better").length;
  const history = dailyHistory(checks, settings.targetMilestone);
  const streak = dailyStreak(checks, today);

  return (
    <div className="grid gap-4" data-testid="daily-results">
      <section className="rounded-3xl p-6 glass md:p-8">
        <p className="eyebrow text-primary">Daily check done · {dayLabel(check.day, today)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {compared.length === 0
            ? "Here’s today’s read."
            : `Better than your profile on ${better} of ${compared.length} parts.`}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Two attempts per test is a quick read: one fumble can swing a number. Look for parts that
          stay better or worse over several days.
          {compared.length === 0 ? " Finish the full tests to have a profile to compare with." : ""}
        </p>
        {streak > 0 ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
            <Flame className="size-4" aria-hidden /> {streak}-day streak
          </p>
        ) : null}
      </section>

      <section aria-labelledby="daily-compare-heading" className="rounded-3xl p-4 glass md:p-5">
        <h2 id="daily-compare-heading" className="px-1 text-base font-semibold">
          Today vs your profile
        </h2>
        <div className="mt-2 hidden grid-cols-[minmax(0,1fr)_6rem_6rem_7rem_5rem] gap-3 px-1 text-xs text-muted-foreground sm:grid">
          <span>Part</span>
          <span>Today</span>
          <span>Profile</span>
          <span>Change</span>
          <span>Trend</span>
        </div>
        <ul className="mt-1 divide-y">
          {rows.map((row) => (
            <DailyRow
              key={row.id}
              row={row}
              decimals={decimals}
              trend={history.map((entry) => entry.values[row.id] ?? null)}
              tag={todayProfile.aspects.find((aspect) => aspect.id === row.id)?.tag ?? null}
              goalLabel={goal?.label ?? null}
            />
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-3xl p-5 glass">
        <Button asChild size="lg">
          <Link href={PROFILE_HREF}>See your solve profile</Link>
        </Button>
        <Button size="lg" variant="ghost" onClick={() => void onStartAnother()}>
          <RotateCcw /> Do another check
        </Button>
      </section>

      <DailyAttempts
        attempts={check.attempts}
        skipped={check.skipped}
        current={null}
        onDelete={onDelete}
      />
      <ReminderToggle settings={settings} />
    </div>
  );
}

function DailyRow({
  row,
  decimals,
  trend,
  tag,
  goalLabel,
}: {
  row: DailyComparison;
  decimals: TimeDecimals;
  trend: (number | null)[];
  tag: "slow" | "average" | "fast" | null;
  goalLabel: string | null;
}) {
  return (
    <li
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-1 py-2.5 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_7rem_5rem]"
      data-testid={`daily-row-${row.id}`}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        {row.label}
        {tag && goalLabel ? <PaceBadge tag={tag} /> : null}
      </p>
      <p className="text-right font-mono tabular text-sm font-semibold sm:text-left">
        {formatAspectValue(row.kind, row.today, decimals)}
      </p>
      <p className="font-mono tabular text-xs text-muted-foreground">
        <span className="sm:hidden">Profile </span>
        {formatAspectValue(row.kind, row.profile, decimals)}
      </p>
      <p
        className={cn(
          "text-right text-xs font-medium sm:text-left",
          row.change === "better" && "text-emerald-600 dark:text-emerald-400",
          row.change === "worse" && "text-destructive",
          (row.change === "same" || row.change === null) && "text-muted-foreground",
        )}
        data-change={row.change ?? "none"}
      >
        {row.change === "better"
          ? "Better"
          : row.change === "worse"
            ? "Worse"
            : row.change === "same"
              ? "About the same"
              : "—"}
      </p>
      <Sparkline values={trend} higherIsBetter={row.kind === "speed"} />
    </li>
  );
}

/** A tiny trend line of past daily checks. */
function Sparkline({
  values,
  higherIsBetter,
}: {
  values: (number | null)[];
  higherIsBetter: boolean;
}) {
  const points = values
    .map((value, index) => (value === null ? null : { index, value }))
    .filter((point): point is { index: number; value: number } => point !== null);
  if (points.length < 2) {
    return <span className="hidden text-xs text-muted-foreground sm:block">—</span>;
  }
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const span = max - min || 1;
  const width = 72;
  const height = 20;
  const x = (index: number) => (index / Math.max(1, values.length - 1)) * width;
  // Draw "better" as up for every kind.
  const y = (value: number) => {
    const t = (value - min) / span;
    return higherIsBetter ? height - t * height : t * height;
  };
  const path = points.map(
    (p, i) => `${i ? "L" : "M"}${x(p.index).toFixed(1)},${y(p.value).toFixed(1)}`,
  );
  return (
    <svg
      viewBox={`-2 -2 ${width + 4} ${height + 4}`}
      className="hidden h-5 w-18 text-primary sm:block"
      role="img"
      aria-label={`Trend over your last ${points.length} checks`}
    >
      <path d={path.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function dayLabel(day: string, today: string): string {
  if (day === today) return "today";
  const yesterday = new Date(`${today}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === localDay(yesterday)) return "yesterday";
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
