"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Layers,
  Play,
  Settings2,
  Turtle,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { LabelToggleItem } from "@/components/algorithms/label-style";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { TestTimerCard } from "@/components/tests/test-timer-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getExercise } from "@/data/exercises";
import type { AlgorithmSetData } from "@/data/algorithms/types";
import { algorithmActions, useAlgorithmProgress } from "@/hooks/use-algorithms";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useSettings } from "@/hooks/use-local-data";
import { caseScramble } from "@/lib/algorithms/case-scramble";
import { groupCases, kindFor } from "@/lib/algorithms/catalog";
import { EXTRA_CHUNKS_FOR_SET, useExtraAlgorithms } from "@/lib/algorithms/extras";
import { CASE_LABELS, type CaseLabel } from "@/lib/algorithms/labels";
import { casePicture } from "@/lib/algorithms/orientation";
import {
  caseTimes,
  nextCard,
  nextCase,
  KNOWN_AFTER_RECALLS,
  recallRecords,
  type RecallRecord,
  slowestCases,
  trainerCases,
  type TrainerCase,
  type TrainerMode,
} from "@/lib/algorithms/trainer";
import { HOLD_RULE } from "@/lib/config/cube";
import { loadBundledCubing, type GeneratedScramble } from "@/lib/scramble";
import { getRepositories } from "@/lib/storage";
import { formatTime } from "@/lib/timer/format";
import type { ExerciseDefinition } from "@/types/domain";

/** How many cases "Just your slowest" takes. */
const SLOWEST_COUNT = 5;

/** The trainer times plain solves of a set-up case: no inspection. */
const TRAINER_TIMER: ExerciseDefinition = { ...getExercise("normal_solves")!, inspection: "none" };

const seconds = (ms: number | null | undefined) =>
  ms === null || ms === undefined ? "—" : `${formatTime(ms, "round", 2)} s`;

/**
 * Practise a set's algorithms on a real cube. Pick which cases (by label and
 * by group), then each round deals one: a scramble sets it up, you solve it
 * with your algorithm, and the time goes against the case. New and slow cases
 * come round more often.
 */
export function AlgorithmTrainer({
  set,
  backHref,
  startWith = null,
}: {
  set: AlgorithmSetData;
  backHref: string;
  /** A case to start on straight away, on its own (from "Practise this case"). */
  startWith?: string | null;
}) {
  const settings = useSettings();
  const ready = useStorageStatus().status === "ready";
  const { loaded, progress, labels } = useAlgorithmProgress();
  useExtraAlgorithms(EXTRA_CHUNKS_FOR_SET[set.id] ?? []);
  const attempts = useLiveQuery(
    async () => (ready ? await getRepositories().algorithms.trainerAttempts() : undefined),
    [ready],
  );
  const times = useMemo(() => caseTimes(attempts ?? []), [attempts]);

  const groups = useMemo(() => groupCases(set.cases).map((group) => group.group), [set]);
  const [chosenLabels, setChosenLabels] = useState<CaseLabel[] | null>(null);
  const [chosenGroups, setChosenGroups] = useState<string[]>([]);
  const [mode, setMode] = useState<TrainerMode>("execution");
  const [running, setRunning] = useState(Boolean(startWith));
  // "Your slowest" or one case: a session of just those, whatever the choice above says.
  const [only, setOnly] = useState<readonly string[] | null>(startWith ? [startWith] : null);

  // Start with the cases you're learning, when there are any.
  const learning = [...labels.values()].includes("learning");
  const labelsInUse = chosenLabels ?? (learning ? ["learning" as const] : []);
  const everyCase = loaded ? trainerCases(set, { labels: [], groups: [] }, labels, progress) : [];
  const chosen = loaded
    ? trainerCases(set, { labels: labelsInUse, groups: chosenGroups }, labels, progress)
    : [];
  const cases = only ? everyCase.filter((item) => only.includes(item.caseId)) : chosen;
  const slowest = slowestCases(everyCase, times, SLOWEST_COUNT);

  if (!loaded || attempts === undefined || !settings) return <Skeleton className="h-72" />;

  return (
    <div className="grid gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href={backHref}>
          <ArrowLeft /> Back to {set.name}
        </Link>
      </Button>
      {running && mode === "recall" ? (
        <FlashcardSession
          set={set}
          cases={cases}
          records={recallRecords(attempts)}
          labels={labels}
          onStop={() => setRunning(false)}
        />
      ) : running && mode !== "recall" ? (
        <TrainerSession
          set={set}
          cases={cases}
          mode={mode}
          times={times}
          settings={settings}
          onStop={() => setRunning(false)}
        />
      ) : (
        <section className="grid gap-4 rounded-2xl p-4 glass" data-testid="trainer-setup">
          <div>
            <p className="text-sm font-medium">Which cases?</p>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              className="mt-2"
              aria-label="Cases by label"
              value={labelsInUse}
              onValueChange={(value) => setChosenLabels(value as CaseLabel[])}
            >
              {CASE_LABELS.map((option) => (
                <LabelToggleItem
                  key={option.id}
                  label={option.id}
                  value={option.id}
                  className="px-2 sm:px-3"
                  data-testid={`trainer-label-${option.id}`}
                />
              ))}
            </ToggleGroup>
            <p className="mt-1 text-xs text-muted-foreground">
              None picked means every case, whatever its label.
            </p>
          </div>
          {groups.length > 1 ? (
            <div>
              <p className="text-sm font-medium">Which groups?</p>
              <div className="mt-2 flex flex-wrap gap-1.5" data-testid="trainer-groups">
                {groups.map((group) => {
                  const on = chosenGroups.includes(group);
                  return (
                    <Button
                      key={group}
                      size="sm"
                      variant={on ? "default" : "outline"}
                      aria-pressed={on}
                      className="h-7 px-2.5 text-xs"
                      onClick={() =>
                        setChosenGroups((current) =>
                          on ? current.filter((item) => item !== group) : [...current, group],
                        )
                      }
                    >
                      {group}
                    </Button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">None picked means every group.</p>
            </div>
          ) : null}
          <div>
            <p className="text-sm font-medium">How</p>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              className="mt-2"
              value={mode}
              onValueChange={(value) => value && setMode(value as TrainerMode)}
            >
              <ToggleGroupItem
                value="execution"
                className="gap-1.5 px-3"
                data-testid="trainer-mode-execution"
              >
                <Eye className="size-3.5" /> Shown first
              </ToggleGroupItem>
              <ToggleGroupItem
                value="combined"
                className="gap-1.5 px-3"
                data-testid="trainer-mode-combined"
              >
                <EyeOff className="size-3.5" /> Recognise it yourself
              </ToggleGroupItem>
              <ToggleGroupItem
                value="recall"
                className="gap-1.5 px-3"
                data-testid="trainer-mode-recall"
              >
                <Layers className="size-3.5" /> Flashcards
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setOnly(null);
                setRunning(true);
              }}
              disabled={chosen.length === 0}
              data-testid="trainer-start"
            >
              <Play /> Start
            </Button>
            <p className="text-sm text-muted-foreground" data-testid="trainer-count">
              {chosen.length === 0
                ? "No cases match. Pick other labels or groups."
                : `${chosen.length} ${chosen.length === 1 ? "case" : "cases"}`}
            </p>
            {slowest.length >= 2 ? (
              <Button
                variant="outline"
                onClick={() => {
                  setOnly(slowest.map((row) => row.item.caseId));
                  setRunning(true);
                }}
                data-testid="trainer-slowest-start"
              >
                <Turtle /> Just your {slowest.length} slowest
              </Button>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

function TrainerSession({
  set,
  cases,
  mode,
  times,
  settings,
  onStop,
}: {
  set: AlgorithmSetData;
  cases: TrainerCase[];
  mode: Exclude<TrainerMode, "recall">;
  times: ReturnType<typeof caseTimes>;
  settings: NonNullable<ReturnType<typeof useSettings>>;
  onStop: () => void;
}) {
  // Each deal is numbered, so a scramble is only ever shown for the deal it was made for.
  const [dealt, setDealt] = useState<{ item: TrainerCase | null; round: number }>(() => ({
    item: nextCase(cases, times, null, Math.random),
    round: 0,
  }));
  const current = dealt.item;
  const [made, setMade] = useState<{ round: number; value: GeneratedScramble } | null>(null);
  const scramble = made?.round === dealt.round ? made.value : null;
  const [last, setLast] = useState<{ item: TrainerCase; ms: number; id: string } | null>(null);
  const [session, setSession] = useState<number[]>([]);

  // A scramble that sets up the current case, found by the solver in the background.
  useEffect(() => {
    if (!dealt.item) return;
    let live = true;
    const round = dealt.round;
    void caseScramble(dealt.item.algorithm.moves, loadBundledCubing).then((result) => {
      if (!live) return;
      setMade({
        round,
        value: {
          event: "333",
          scramble: result.scramble,
          providerId: result.fromSolver ? "cubing.js" : "case-setup",
          randomState: result.fromSolver,
        },
      });
    });
    return () => {
      live = false;
    };
  }, [dealt]);

  const deal = (previous: string | null) =>
    setDealt((now) => ({
      item: nextCase(cases, times, previous, Math.random),
      round: now.round + 1,
    }));

  const onAttempt = async (ms: number) => {
    if (!current) return;
    try {
      const id = await getRepositories().algorithms.recordExecution({
        caseId: current.caseId,
        variantId: current.algorithm.id,
        totalMs: ms,
        mode,
      });
      setLast({ item: current, ms, id });
      setSession((list) => [...list, ms]);
      deal(current.caseId);
    } catch {
      toast.error("Couldn’t save that time.");
    }
  };

  const onDeleteLast = async () => {
    if (!last) return;
    await getRepositories().algorithms.removeAttempt(last.id);
    setSession((list) => list.slice(0, -1));
    setLast(null);
    toast("Last time removed");
  };

  const slowest = slowestCases(cases, times, 5);
  const mean = session.length ? session.reduce((sum, ms) => sum + ms, 0) / session.length : null;

  return (
    <div className="grid gap-4" data-testid="trainer-session">
      <section className="grid gap-3 rounded-2xl p-4 glass sm:grid-cols-[auto_1fr] sm:items-center">
        {current && mode === "execution" ? (
          <>
            <CaseDiagram
              facelets={
                casePicture(current.entry, kindFor(set, current.entry), current.algorithm.moves)
                  .facelets
              }
              kind={kindFor(set, current.entry)}
              className="w-20"
              title={`${current.entry.name}, seen from above`}
            />
            <div className="min-w-0">
              <p className="text-lg font-semibold" data-testid="trainer-case">
                {current.entry.name}
              </p>
              <p className="font-mono text-sm break-words" data-testid="trainer-algorithm">
                {current.algorithm.moves}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground sm:col-span-2" data-testid="trainer-hidden">
            Recognise the case yourself, then solve it. Its name shows after you stop the timer.
          </p>
        )}
        <p className="text-xs text-muted-foreground sm:col-span-2">{HOLD_RULE}</p>
      </section>

      <TestTimerCard
        test={TRAINER_TIMER}
        settings={settings}
        enabled={Boolean(current)}
        lastTimeMs={last?.ms ?? null}
        onAttempt={(ms) => void onAttempt(ms)}
        onDeleteLast={() => void onDeleteLast()}
        scramble={{ value: scramble, onNext: () => deal(current?.caseId ?? null) }}
      />

      <section className="grid gap-3 rounded-2xl p-4 glass" data-testid="trainer-stats">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            This session: <span className="font-mono tabular">{session.length}</span> solved, mean{" "}
            <span className="font-mono tabular">{seconds(mean)}</span>
          </p>
          <div className="flex gap-2">
            {last ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void onDeleteLast()}
                data-testid="trainer-undo"
              >
                <Undo2 /> Remove last
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={onStop} data-testid="trainer-stop">
              <Settings2 /> Change cases
            </Button>
          </div>
        </div>
        {last ? (
          <p className="text-sm" data-testid="trainer-last">
            Last: <span className="font-medium">{last.item.entry.name}</span> in{" "}
            <span className="font-mono tabular">{seconds(last.ms)}</span>
            <span className="text-muted-foreground"> · {last.item.algorithm.moves}</span>
          </p>
        ) : null}
        {slowest.length ? (
          <div>
            <p className="text-xs text-muted-foreground">Slowest so far (median of your times)</p>
            <ol className="mt-1 grid gap-1 text-sm" data-testid="trainer-slowest">
              {slowest.map(({ item, times: own }) => (
                <li key={item.caseId} className="flex justify-between gap-3">
                  <span>{item.entry.name}</span>
                  <span className="font-mono tabular">
                    {seconds(own.medianMs)}{" "}
                    <span className="text-muted-foreground">× {own.count}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>
    </div>
  );
}

/**
 * Flashcards: the case as your algorithm starts it; recall the algorithm, then
 * turn the card over and say whether you knew it. Missed cards come round again
 * sooner.
 */
function FlashcardSession({
  set,
  cases,
  records,
  labels,
  onStop,
}: {
  set: AlgorithmSetData;
  cases: TrainerCase[];
  records: ReadonlyMap<string, RecallRecord>;
  labels: ReadonlyMap<string, CaseLabel>;
  onStop: () => void;
}) {
  const [dealt, setDealt] = useState(() => ({
    item: nextCard(cases, records, null, Math.random),
    round: 0,
  }));
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ known: 0, missed: 0 });
  const current = dealt.item;

  const answer = async (known: boolean) => {
    if (!current) return;
    try {
      await getRepositories().algorithms.recordRecall({
        caseId: current.caseId,
        variantId: current.algorithm.id,
        known,
      });
    } catch {
      toast.error("Couldn’t save that card.");
    }
    // Known several cards running, and not marked known yet: offer to mark it.
    const running = known ? (records.get(current.caseId)?.knownRunning ?? 0) + 1 : 0;
    if (running >= KNOWN_AFTER_RECALLS && labels.get(current.caseId) !== "known") {
      const { caseId, entry } = current;
      toast(`${entry.name}: known ${running} times running`, {
        action: {
          label: "Mark it known",
          onClick: () =>
            void algorithmActions
              .setLabel(caseId, "known")
              .then(() => toast.success(`${entry.name} marked as known`))
              .catch(() => toast.error("Couldn’t mark it known.")),
        },
      });
    }
    setTally((now) =>
      known ? { ...now, known: now.known + 1 } : { ...now, missed: now.missed + 1 },
    );
    setRevealed(false);
    setDealt((now) => ({
      item: nextCard(cases, records, current.caseId, Math.random),
      round: now.round + 1,
    }));
  };

  useHotkeys(
    revealed
      ? [
          { key: "1", run: () => void answer(true) },
          { key: "2", run: () => void answer(false) },
        ]
      : [{ key: "Enter", run: () => setRevealed(true) }],
    Boolean(current),
  );

  if (!current) return null;
  const kind = kindFor(set, current.entry);

  return (
    <div className="grid gap-4" data-testid="flashcards">
      <section className="grid justify-items-center gap-4 rounded-2xl p-6 text-center glass">
        <CaseDiagram
          key={dealt.round}
          facelets={casePicture(current.entry, kind, current.algorithm.moves).facelets}
          kind={kind}
          className="w-36"
          title="The case, as your algorithm starts it"
        />
        {revealed ? (
          <div className="grid gap-1" data-testid="flash-back">
            <p className="text-lg font-semibold">{current.entry.name}</p>
            <p className="font-mono text-base break-words">{current.algorithm.moves}</p>
            <div className="mt-3 flex justify-center gap-2">
              <Button onClick={() => void answer(true)} data-testid="flash-known">
                <Check /> Knew it
              </Button>
              <Button
                variant="outline"
                onClick={() => void answer(false)}
                data-testid="flash-missed"
              >
                <X /> Missed it
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Keys: 1 knew it · 2 missed it</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              What&apos;s your algorithm for this case, from this angle?
            </p>
            <Button onClick={() => setRevealed(true)} data-testid="flash-reveal">
              <Eye /> Show it
            </Button>
            <p className="text-xs text-muted-foreground">Or press Enter</p>
          </div>
        )}
      </section>
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 glass">
        <p className="text-sm" data-testid="flash-tally">
          This session: <span className="font-mono tabular">{tally.known}</span> known,{" "}
          <span className="font-mono tabular">{tally.missed}</span> missed
        </p>
        <Button variant="outline" size="sm" onClick={onStop} data-testid="trainer-stop">
          <Settings2 /> Change cases
        </Button>
      </section>
    </div>
  );
}
