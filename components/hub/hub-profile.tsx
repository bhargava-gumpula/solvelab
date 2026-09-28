"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Bot, CircleHelp, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { PaceBadge } from "@/components/coach/pace-badge";
import { SolveProfileView } from "@/components/stats/solve-profile";
import { Button } from "@/components/ui/button";
import { useHub } from "@/hooks/use-hub";
import { compareWithProfile } from "@/lib/hub/intro";

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
