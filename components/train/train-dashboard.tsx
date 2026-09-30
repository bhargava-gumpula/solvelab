"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PackCard } from "@/components/train/pack-card";
import { DrillBlock } from "@/components/train/pack-detail";
import { TRAINING_PACKS, bandLabel } from "@/data/training";
import { levelContext } from "@/lib/training/level";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { setPackItemDone, useTrainingProgress } from "@/hooks/use-training-progress";
import { algorithmSets } from "@/data/algorithms/sets";
import { useAlgorithmProgress } from "@/hooks/use-algorithms";
import { setIdOfCase } from "@/lib/algorithms/case-ids";

/**
 * Train is what you're working on now: the drills you chose to practise and
 * the packs you've started. Reading, and what to read next, is on Learn; this
 * page is for the session in front of you.
 */
export function TrainDashboard() {
  const { loaded, profile, settings } = useSolveProfile();
  const { loaded: progressLoaded, byPack } = useTrainingProgress();

  if (!loaded || !profile || !progressLoaded) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { band } = levelContext(profile, settings?.targetMilestone);

  const drills = TRAINING_PACKS.flatMap((pack) =>
    pack.drills
      .filter((drill) => byPack[pack.id]?.isDrillDone(drill.id))
      .map((drill) => ({ pack, drill })),
  );
  const started = TRAINING_PACKS.filter(
    (pack) => byPack[pack.id]?.started && !byPack[pack.id]?.complete,
  );
  const nothingYet = drills.length === 0 && started.length === 0;

  return (
    <div className="grid gap-8">
      <section
        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6 glass"
        data-testid="train-intro"
      >
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {band ? (
              <>
                You&apos;re on the{" "}
                <span className="font-medium text-foreground">{bandLabel(band)}</span> stretch.
              </>
            ) : (
              "Take the tests on Coach and this page will know where you are."
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The packs recommended for you — and every other one — are on Learn.
          </p>
        </div>
        <Button asChild>
          <Link href="/learn/#packs" data-testid="train-browse-learn">
            <BookOpen /> Your recommended packs <ArrowRight />
          </Link>
        </Button>
      </section>

      <AlgorithmsToPractise />

      {nothingYet ? (
        <section className="rounded-3xl border border-dashed p-6" data-testid="train-empty">
          <h2 className="text-base font-semibold">Nothing on the go yet.</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Open a pack on Learn, read a lesson, and choose <em>Practise this</em> on a drill — it
            lands here, with its rules and a timer, ready for your next session.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/learn/#packs">See your recommended packs</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/coach/">Take the tests on Coach</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {drills.length > 0 ? (
        <section aria-labelledby="drills-heading" data-testid="train-drills">
          <h2 id="drills-heading" className="text-base font-semibold">
            Your drills
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            What you chose to practise. Untick one when it has done its job.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {drills.map(({ pack, drill }) => (
              <DrillBlock
                key={`${pack.id}/${drill.id}`}
                packId={pack.id}
                pack={pack}
                drill={drill}
                done
                loaded
                onToggle={() => setPackItemDone(pack.id, "drill", drill.id, false)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {started.length > 0 ? (
        <section aria-labelledby="started-heading" data-testid="train-started">
          <h2 id="started-heading" className="mb-3 text-base font-semibold">
            Packs you&apos;ve started
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {started.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                progress={byPack[pack.id]}
                testIdPrefix="started"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/**
 * The algorithm cases you've marked as learning, by set, each set with a way
 * into its trainer (which starts with the cases you're learning).
 */
function AlgorithmsToPractise() {
  const { loaded, labels } = useAlgorithmProgress();
  if (!loaded) return null;
  const bySet = new Map<string, number>();
  for (const [caseId, label] of labels) {
    if (label !== "learning") continue;
    const setId = setIdOfCase(caseId);
    if (setId) bySet.set(setId, (bySet.get(setId) ?? 0) + 1);
  }
  if (!bySet.size) return null;
  return (
    <section aria-labelledby="algorithms-heading" data-testid="train-algorithms">
      <h2 id="algorithms-heading" className="text-base font-semibold">
        Algorithms you&apos;re learning
      </h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        Practise them on your cube: a scramble sets up each case and the time is kept.
      </p>
      <div className="flex flex-wrap gap-2">
        {algorithmSets
          .filter((set) => bySet.has(set.id))
          .map((set) => (
            <Button key={set.id} asChild variant="outline" size="sm">
              <Link
                href={`/algorithms/${set.id}/train/`}
                data-testid={`train-algorithms-${set.id}`}
              >
                <Timer /> {set.name} · {bySet.get(set.id)} learning
              </Link>
            </Button>
          ))}
      </div>
    </section>
  );
}
