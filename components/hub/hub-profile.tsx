"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, Bot, CircleHelp, Eye, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { PaceBadge } from "@/components/coach/pace-badge";
import { SolveProfileView } from "@/components/stats/solve-profile";
import { useHub } from "@/hooks/use-hub";
import { caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { caseTimes, slowestOnTheCube } from "@/lib/algorithms/trainer";
import { getRepositories } from "@/lib/storage";
import { compareWithProfile } from "@/lib/hub/intro";
import { caseLabel } from "@/lib/hub/recognition";
import { recognitionStats, type RecognitionStats } from "@/lib/hub/recognition-stats";
import { Button } from "@/components/ui/button";
import { RECOGNITION_LABEL, recognitionHref, type RecognitionSet } from "@/lib/hub/units";
import type { AlgorithmAttempt } from "@/types/domain";
import { features } from "@/lib/config/features";

const RECOGNITION_SETS: readonly RecognitionSet[] = [
  "two-look-oll",
  "two-look-pll",
  "pll",
  "oll",
  "coll",
  "f2l",
];

const WORDS = {
  agreed: "You said it's slow, and it is.",
  fine: "Felt slow, but it measures on pace.",
  hidden: "Didn't feel slow, but it is.",
  unmeasured: "You said it's slow; not measured yet.",
} as const;

/**
 * The solve profile, with what you told the Hub about yourself set against
 * what the tests measured.
 */
export function HubProfile() {
  const hub = useHub();
  const rows = hub.profile && hub.intro ? compareWithProfile(hub.intro, hub.profile) : [];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {hub.loaded && !hub.intro?.completedAt ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[var(--hairline)] py-3"
          data-testid="profile-setup-banner"
        >
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          <p className="flex-1 text-sm text-muted-foreground">
            {hub.intro
              ? "You're partway through finding your level."
              : "Answer a few questions so your path fits you."}
          </p>
          <Link
            href="/hub/start/"
            className="group inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            {hub.intro ? "Continue" : "Find my level"}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      ) : null}
      <SolveProfileView />
      {rows.length ? (
        <section className="tile p-6 md:p-7" data-testid="said-vs-measured">
          <p className="eyebrow">Your answers against the tests</p>
          <h2 className="mt-1.5 font-display text-[2rem] leading-none">
            What you said, and what we <em className="text-primary">measured</em>
          </h2>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
            {rows.map((row, index) => (
              <motion.li
                key={row.aspectId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 border-t border-[var(--hairline)] py-3 text-sm"
              >
                {row.agreement === "fine" ? (
                  <TrendingUp className="size-4 shrink-0 text-primary" />
                ) : row.agreement === "unmeasured" ? (
                  <CircleHelp className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <TrendingDown className="size-4 shrink-0 text-foreground" />
                )}
                <span className="flex-1">
                  <span className="font-medium">{row.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {WORDS[row.agreement]}
                  </span>
                </span>
                {row.tag ? <PaceBadge tag={row.tag} quiet /> : null}
              </motion.li>
            ))}
          </ul>
        </section>
      ) : null}
      <SlowestCases attempts={hub.attempts} />
      <SlowestOnTheCube />
      <Link
        href="/hub/ask/"
        className="group tile flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
        data-testid="profile-ask-ai"
      >
        <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary transition-transform group-hover:-rotate-6">
          <Bot className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">
            {features.coachChat ? "Ask your AI coach about this profile" : "Get the Mac app"}
          </span>
          <span className="block text-xs text-muted-foreground">
            {features.coachChat
              ? "Runs on your Mac. Only numbers from your profile are used, and none leave this Mac."
              : "Its AI coach runs on your Mac and reads this profile, privately."}
          </span>
        </span>
        <ArrowRight className="size-4 text-primary" />
      </Link>
    </div>
  );
}

/**
 * For every recognition drill you have answered: how many of its cases you
 * know on sight, and the ones to work on, slowest and missed first.
 */
/** Your slowest cases in the algorithm trainer, whatever the set. */
function SlowestOnTheCube() {
  const ready = useStorageStatus().status === "ready";
  const attempts = useLiveQuery(
    async () => (ready ? await getRepositories().algorithms.trainerAttempts() : undefined),
    [ready],
  );
  const rows = slowestOnTheCube(caseTimes(attempts ?? []));
  if (!rows.length) return null;
  return (
    <section className="tile p-5 md:p-6" data-testid="slowest-on-the-cube">
      <h2 className="text-sm font-semibold">Slowest on your cube</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        From the algorithm trainer: the median of your times for each case.
      </p>
      <ul className="mt-3 grid gap-2">
        {rows.map((row) => (
          <li key={row.caseId} className="flex flex-wrap items-center gap-2 text-sm">
            <Timer className="size-4 text-primary" />
            <span className="flex-1">{row.name}</span>
            <span className="font-mono tabular">
              {(row.times.medianMs! / 1000).toFixed(2)} s{" "}
              <span className="text-muted-foreground">× {row.times.count}</span>
            </span>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href={`/algorithms/${row.setId}/train/`}>
                Practise <ArrowRight />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SlowestCases({ attempts }: { attempts: readonly AlgorithmAttempt[] }) {
  const drilled = RECOGNITION_SETS.map((set) => recognitionStats(attempts, set)).filter((stats) =>
    [...stats.cases.values()].some((entry) => entry.seen > 0),
  );
  if (!drilled.length) return null;
  return (
    <section className="tile p-5 md:p-6" data-testid="slowest-cases">
      <h2 className="text-sm font-semibold">Cases you know on sight</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        From the recognition drills. A case is known once you get it right twice running.
      </p>
      <ul className="mt-3 grid gap-3">
        {drilled.map((stats) => (
          <SetRow key={stats.set} stats={stats} />
        ))}
      </ul>
    </section>
  );
}

function SetRow({ stats }: { stats: RecognitionStats }) {
  const data = getAlgorithmSet(stats.set);
  // Missed cases first, then the slowest known ones; three is enough to act on.
  const work = [...new Set([...stats.missed, ...stats.slowest])].slice(0, 3);
  return (
    <li className="rounded-xl border bg-background/40 p-3" data-testid={`known-${stats.set}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Eye className="size-4 text-primary" />
        <span className="flex-1 text-sm font-medium">
          {RECOGNITION_LABEL[stats.set]}: {stats.known} of {stats.total} known
        </span>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href={recognitionHref(stats.set)}>
            Drill <ArrowRight />
          </Link>
        </Button>
      </div>
      {data && work.length ? (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {work.map((caseId) => {
            const entry = data.cases.find((item) => item.id === caseId);
            if (!entry) return null;
            const kind = kindFor(data, entry);
            const timing = stats.cases.get(caseId);
            return (
              <li key={caseId} className="rounded-lg border p-2 text-center">
                <CaseDiagram
                  facelets={caseStateFor(entry, kind)}
                  kind={kind}
                  showArrows={false}
                  className="mx-auto max-w-20"
                  title={caseLabel(entry, stats.set)}
                />
                <p className="mt-1 truncate text-xs font-medium">{caseLabel(entry, stats.set)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {timing?.missed
                    ? "missed last time"
                    : timing?.medianMs
                      ? `${(timing.medianMs / 1000).toFixed(1)} s`
                      : ""}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}
