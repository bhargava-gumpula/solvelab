"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Eye, RotateCcw, Timer, Trophy, Zap } from "lucide-react";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { Button } from "@/components/ui/button";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { recognitionDeck, seededRandom, type RecognitionCard } from "@/lib/hub/recognition";
import { MAX_RECOGNITION_MS, recognitionStats } from "@/lib/hub/recognition-stats";
import type { RecognitionSet } from "@/lib/hub/units";
import { getRepositories } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { celebrate, CountUp } from "./fx";

const DECK_SIZE = 12;

interface Result {
  card: RecognitionCard;
  chosen: number;
  ms: number;
}

/** The words that depend on what the answers are: case names or algorithms. */
export interface RecognitionCopy {
  /** What to do with each case, finished by "with a tap or the keys 1–4". */
  task: string;
  /** The summary's average-time label. */
  timeLabel: string;
  /** The question the case diagram asks. */
  prompt: string;
  /**
   * Show all four sides. The 2-look drills do, because their lessons read cases
   * by turning the top to look; reading from two sides alone comes later.
   */
  allSides?: boolean;
}

/** What you see holding the cube: the back and left rows are out of view. */
const OUT_OF_VIEW = ["B", "L"] as const;

/**
 * Answer each case as fast as you can. You see the top and the front and right
 * sides, as you would holding the cube, and each answer is timed from the
 * moment the case appears.
 */
export function RecognitionDrill({
  set,
  title,
  copy,
  backHref,
}: {
  set: RecognitionSet;
  title: string;
  copy: RecognitionCopy;
  backHref: string;
}) {
  const [deck, setDeck] = useState<RecognitionCard[] | null>(null);
  const [position, setPosition] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  // When the card on screen appeared; set wherever a new card is dealt.
  const [shownAt, setShownAt] = useState(0);
  // The deck whose answers have been saved, so a deck is saved once.
  const savedDeck = useRef<RecognitionCard[] | null>(null);
  const ready = useStorageStatus().status === "ready";
  const attempts = useLiveQuery(
    async () => (ready ? await getRepositories().algorithms.recognitionAttempts() : undefined),
    [ready],
  );
  // What earlier decks showed: which cases you know, and which need more goes.
  const stats = useMemo(() => recognitionStats(attempts ?? [], set), [attempts, set]);

  const start = () => {
    setDeck(recognitionDeck(set, DECK_SIZE, seededRandom(Date.now()), stats));
    setPosition(0);
    setResults([]);
    setChosen(null);
    setShownAt(performance.now());
  };

  const card = deck?.[position] ?? null;
  const finished = deck !== null && position >= deck.length;

  useEffect(() => {
    if (!finished || savedDeck.current === deck) return;
    savedDeck.current = deck;
    const right = results.filter((result) => result.chosen === result.card.answer).length;
    // The big celebration is kept for a unit passed on its measure.
    if (right / results.length >= 0.8) celebrate("small");
    void getRepositories()
      .algorithms.recordRecognition(
        results
          // Over half a minute means the person walked away, not that the case is slow.
          .filter((result) => result.ms <= MAX_RECOGNITION_MS)
          .map((result) => ({
            caseId: result.card.caseId,
            variantId: result.card.variantId,
            successful: result.chosen === result.card.answer,
            recognitionMs: result.ms,
          })),
      )
      .catch(() => toast.error("Couldn’t save this deck’s answers."));
  }, [finished, results, deck]);

  const answer = useCallback(
    (choice: number) => {
      if (!card || chosen !== null) return;
      const ms = performance.now() - shownAt;
      setChosen(choice);
      setResults((current) => [...current, { card, chosen: choice, ms }]);
      window.setTimeout(
        () => {
          setChosen(null);
          setPosition((current) => current + 1);
          setShownAt(performance.now());
        },
        choice === card.answer ? 450 : 1100,
      );
    },
    [card, chosen, shownAt],
  );

  useHotkeys(
    [1, 2, 3, 4].map((number) => ({ key: String(number), run: () => answer(number - 1) })),
  );

  if (!deck) {
    return (
      <Shell title={title} backHref={backHref}>
        <div className="grid gap-5 text-center" data-testid="recognition-intro">
          <motion.span
            className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
          >
            <Eye className="size-6" />
          </motion.span>
          <h1 className="font-display text-[2.9rem] leading-[0.98]">{title}</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            {DECK_SIZE} cases, one at a time.{" "}
            {copy.allSides
              ? "You see the top and all four sides, as if you had turned the top to look."
              : "You see the top and the front and right sides — what you see holding the cube."}{" "}
            {copy.task}, with a tap or the keys 1–4.
          </p>
          <div>
            <Button
              size="lg"
              className="rounded-full px-8"
              onClick={start}
              data-testid="recognition-start"
            >
              <Zap /> Start
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (finished) {
    const right = results.filter((result) => result.chosen === result.card.answer);
    const averageMs = results.reduce((total, result) => total + result.ms, 0) / results.length;
    const slowest = [...results].sort((a, b) => b.ms - a.ms).slice(0, 3);
    const missed = results.filter((result) => result.chosen !== result.card.answer);
    return (
      <Shell title={title} backHref={backHref}>
        <div className="grid gap-6" data-testid="recognition-summary">
          <div className="text-center">
            <motion.span
              className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
            >
              <Trophy className="size-8" />
            </motion.span>
            <h1 className="mt-4 font-display text-[2.9rem] leading-[0.98]">
              {right.length} of {results.length} right
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Accuracy">
              <CountUp value={Math.round((right.length / results.length) * 100)} suffix="%" />
            </Stat>
            <Stat label={copy.timeLabel}>
              <CountUp value={Math.round(averageMs / 10) / 100} decimals={2} suffix=" s" />
            </Stat>
          </div>
          <p className="text-center text-sm text-muted-foreground" data-testid="recognition-known">
            You know {stats.known} of {stats.total} cases on sight. A case is known once you get it
            right twice running.
          </p>
          <CaseRow title="Slowest to spot" results={slowest} allSides={copy.allSides} />
          {missed.length ? (
            <CaseRow title="Missed" results={missed} allSides={copy.allSides} />
          ) : null}
          <div className="flex justify-center gap-2">
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href={backHref}>Done</Link>
            </Button>
            <Button
              size="lg"
              className="rounded-full"
              onClick={start}
              data-testid="recognition-again"
            >
              <RotateCcw /> Again
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={title} backHref={backHref}>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(position / deck.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          />
        </div>
        <span className="tabular text-xs text-muted-foreground">
          {position + 1}/{deck.length}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={position}
          // Quick in and out: the clock starts as the card is dealt.
          initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -12 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          className="grid gap-5"
          data-testid="recognition-card"
        >
          <div className="relative mx-auto w-56">
            <div className="tile p-4">
              <CaseDiagram
                facelets={card!.facelets}
                kind={card!.kind}
                showArrows={false}
                hiddenSides={copy.allSides ? [] : OUT_OF_VIEW}
                title={copy.prompt}
              />
            </div>
            {/* How long that one took, the moment you answer. */}
            <AnimatePresence>
              {chosen !== null && results.length ? (
                <motion.span
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "absolute -top-3 -right-3 rounded-full px-2.5 py-1 font-figures tabular text-xs shadow-[var(--shadow-tile)]",
                    chosen === card!.answer
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground text-background",
                  )}
                  aria-live="polite"
                >
                  {(results[results.length - 1]!.ms / 1000).toFixed(2)} s
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {card!.options.map((option, choice) => {
              const answered = chosen !== null;
              const isAnswer = choice === card!.answer;
              return (
                <motion.button
                  key={option}
                  type="button"
                  onClick={() => answer(choice)}
                  disabled={answered}
                  data-testid={`recognition-option-${choice}`}
                  data-correct={isAnswer ? "true" : undefined}
                  whileTap={{ scale: 0.95 }}
                  animate={
                    answered && choice === chosen && !isAnswer ? { x: [0, -8, 8, -4, 0] } : {}
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-colors",
                    !answered &&
                      "border-[var(--hairline)] hover:border-foreground/30 hover:bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)]",
                    answered && isAnswer && "border-primary bg-primary/10",
                    answered && choice === chosen && !isAnswer && "border-foreground/60",
                    answered && choice !== chosen && !isAnswer && "opacity-45",
                  )}
                >
                  <span className="grid size-6 place-items-center rounded-lg border text-xs">
                    {choice + 1}
                  </span>
                  {option}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Timer className="size-3.5" /> Timed from when the case appears
      </p>
    </Shell>
  );
}

function Shell({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href={backHref} aria-label={`Leave ${title}`}>
          <ArrowLeft /> Back
        </Link>
      </Button>
      <section className="tile p-6 md:p-8">{children}</section>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--tile-strong)] p-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display tabular text-[2rem] leading-tight">{children}</p>
    </div>
  );
}

function CaseRow({
  title,
  results,
  allSides,
}: {
  title: string;
  results: Result[];
  allSides?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="grid grid-cols-3 gap-2">
        {results.map((result, index) => (
          <div
            key={`${result.card.caseId}-${index}`}
            className="rounded-2xl border border-[var(--hairline)] bg-[var(--tile-strong)] p-2 text-center"
          >
            <CaseDiagram
              facelets={result.card.facelets}
              kind={result.card.kind}
              hiddenSides={allSides ? [] : OUT_OF_VIEW}
            />
            <p className="mt-1 text-xs font-semibold">{result.card.options[result.card.answer]}</p>
            <p className="tabular text-[11px] text-muted-foreground">
              {(result.ms / 1000).toFixed(2)} s
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
