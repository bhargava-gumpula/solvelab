"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PackCard } from "@/components/train/pack-card";
import {
  LEVEL_BANDS,
  TRAINING_PACKS,
  bandLabel,
  bandsForPack,
  isMadeFor,
  type LevelBand,
} from "@/data/training";
import type { PackProgress } from "@/lib/training/progress";
import type { PackRecommendation } from "@/lib/training/recommend";

const ALL_LEVELS = "all";

/**
 * The packs worth your time now, and — behind See all — every other pack,
 * filterable by stretch of the road.
 */
export function PackLibrary({
  recommended,
  band,
  byPack,
}: {
  recommended: PackRecommendation[];
  band: LevelBand | null;
  byPack: Record<string, PackProgress>;
}) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<string>(ALL_LEVELS);

  const fromModel = recommended.some((entry) => entry.source !== "level");
  const chosen = new Set(recommended.map((entry) => entry.pack.id));
  const others = TRAINING_PACKS.filter((pack) => !chosen.has(pack.id));
  const filterBand = LEVEL_BANDS.find((entry) => entry.id === filter) ?? null;
  const shown = filterBand
    ? others
        .filter((pack) => bandsForPack(pack).some((entry) => entry.id === filterBand.id))
        .sort((a, b) => Number(isMadeFor(b, filterBand)) - Number(isMadeFor(a, filterBand)))
    : others;

  return (
    <section id="packs" aria-labelledby="packs-heading" className="grid scroll-mt-24 gap-4">
      <div>
        <h2 id="packs-heading" className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden /> Recommended for you
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground" data-testid="packs-why">
          {fromModel ? (
            <>
              The coach model picked these from your test results
              {band ? `, then the packs written for your level, ${bandLabel(band)}` : ""}.
            </>
          ) : band ? (
            <>
              The packs written for your level, {bandLabel(band)}.{" "}
              <Link href="/coach/" className="underline underline-offset-4">
                Take the tests on Coach
              </Link>{" "}
              and the coach model will add the parts of your solve that need a pack most.
            </>
          ) : (
            <>
              Nothing to go on yet.{" "}
              <Link href="/coach/" className="underline underline-offset-4">
                Set a goal and take the tests on Coach
              </Link>
              , or do some timed solves, and the packs that fit you will show here.
            </>
          )}
        </p>
      </div>

      {recommended.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="packs-recommended">
          {recommended.map(({ pack, reason, aspect }) => (
            <PackCard
              key={pack.id}
              pack={pack}
              progress={byPack[pack.id]}
              reason={reason}
              tag={aspect?.tag ?? null}
              testIdPrefix="rec"
            />
          ))}
        </div>
      ) : null}

      <div>
        <Button
          variant="outline"
          onClick={() => setShowAll((open) => !open)}
          aria-expanded={showAll}
          data-testid="see-all"
        >
          {showAll ? (
            <>
              <ChevronUp /> Hide the other packs
            </>
          ) : (
            <>
              <ChevronDown /> See all packs ({others.length} more)
            </>
          )}
        </Button>
      </div>

      {showAll ? (
        <div className="grid gap-4" data-testid="packs-all">
          <div>
            <h3 className="text-sm font-semibold">Every other pack</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Filter by stretch of the road. Packs written for that stretch come first.
            </p>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex-wrap justify-start"
            aria-label="Filter by level"
            value={filter}
            onValueChange={(value) => value && setFilter(value)}
          >
            <ToggleGroupItem value={ALL_LEVELS} className="px-3" data-testid="filter-band-all">
              All levels
            </ToggleGroupItem>
            {LEVEL_BANDS.map((entry) => (
              <ToggleGroupItem
                key={entry.id}
                value={entry.id}
                className="px-3 whitespace-nowrap"
                data-testid={`filter-band-${entry.id}`}
              >
                {bandLabel(entry)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {shown.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((pack) => (
                <PackCard key={pack.id} pack={pack} progress={byPack[pack.id]} testIdPrefix="all" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Every pack for this stretch is already in your recommendations above.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
