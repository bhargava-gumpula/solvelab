"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Bot, CircleHelp, Eye, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { PaceBadge } from "@/components/coach/pace-badge";
import { SolveProfileView } from "@/components/stats/solve-profile";
import { Button } from "@/components/ui/button";
import { useHub } from "@/hooks/use-hub";
import { caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { compareWithProfile } from "@/lib/hub/intro";
import { caseLabel } from "@/lib/hub/recognition";
import { recognitionStats, type RecognitionStats } from "@/lib/hub/recognition-stats";
import { RECOGNITION_LABEL, recognitionHref, type RecognitionSet } from "@/lib/hub/units";
import type { AlgorithmAttempt } from "@/types/domain";

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
    <div className="grid gap-5">
      {hub.loaded && !hub.intro?.completedAt ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4"
          data-testid="profile-setup-banner"
        >
          <Sparkles className="size-5 text-primary" />
          <p className="flex-1 text-sm">
            {hub.intro
              ? "You're partway through finding your level."
              : "Answer a few questions so your path fits you."}
          </p>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/hub/start/">
              {hub.intro ? "Continue" : "Find my level"} <ArrowRight />
            </Link>
          </Button>
        </motion.div>
      ) : null}
      {rows.length ? (
        <section className="rounded-2xl p-5 glass" data-testid="said-vs-measured">
          <h2 className="text-sm font-semibold">What you said, and what we measured</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {rows.map((row, index) => (
              <motion.li
                key={row.aspectId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 rounded-xl border bg-background/40 px-3 py-2 text-sm"
              >
                {row.agreement === "fine" ? (
                  <TrendingUp className="size-4 shrink-0 text-[var(--known)]" />
                ) : row.agreement === "unmeasured" ? (
                  <CircleHelp className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <TrendingDown className="size-4 shrink-0 text-destructive" />
                )}
                <span className="flex-1">
                  <span className="font-medium">{row.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {WORDS[row.agreement]}
                  </span>
                </span>
                {row.tag ? <PaceBadge tag={row.tag} /> : null}
              </motion.li>
            ))}
          </ul>
        </section>
      ) : null}
      <SlowestCases attempts={hub.attempts} />
      <Link
        href="/hub/ask/"
        className="group flex items-center gap-3 rounded-2xl p-4 glass transition-transform hover:-translate-y-0.5"
        data-testid="profile-ask-ai"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:rotate-6">
          <Bot className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">Ask your AI coach about this profile</span>
          <span className="block text-xs text-muted-foreground">
            With your own Claude, ChatGPT or Gemini, or sign in with OpenRouter to chat here.
          </span>
        </span>
        <ArrowRight className="size-4 text-primary" />
      </Link>
      <SolveProfileView />
    </div>
  );
}

/**
 * For every recognition drill you have answered: how many of its cases you
 * know on sight, and the ones to work on, slowest and missed first.
 */
function SlowestCases({ attempts }: { attempts: readonly AlgorithmAttempt[] }) {
  const drilled = RECOGNITION_SETS.map((set) => recognitionStats(attempts, set)).filter((stats) =>
    [...stats.cases.values()].some((entry) => entry.seen > 0),
  );
  if (!drilled.length) return null;
  return (
    <section className="rounded-2xl p-5 glass" data-testid="slowest-cases">
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
