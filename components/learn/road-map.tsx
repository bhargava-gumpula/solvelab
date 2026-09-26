"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { LevelDetails } from "@/components/learn/level-details";
import { LEVELS, currentLevel } from "@/data/training/levels";
import { packHref, packsForIds } from "@/data/training";
import { getLesson } from "@/data/learning/lessons";
import { useTimeFormat } from "@/hooks/use-time-format";
import { cn } from "@/lib/utils";

/**
 * The whole road, two minutes to sub-10, with the rung you are on opened.
 * Each rung says where the time actually is and what to leave alone, because
 * most wasted practice is good advice applied at the wrong level.
 */
export function RoadMap({
  average,
  here,
}: {
  average: number | null;
  here: ReturnType<typeof currentLevel>;
}) {
  const { formatAverage } = useTimeFormat();

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        {here?.source === "average" && average !== null
          ? `Your average is ${formatAverage(average)}, which puts you here.`
          : here
            ? "No timer average yet, so this opens at the stretch that leads to your goal."
            : "Do a few timed solves and this will open at where you are."}
      </p>
      <Accordion type="multiple" defaultValue={here ? [here.level.id] : []} className="grid gap-3">
        {LEVELS.map((level) => {
          const isHere = level.id === here?.level.id;
          return (
            <AccordionItem
              key={level.id}
              value={level.id}
              data-testid={`level-${level.id}`}
              className={cn(
                "rounded-2xl border px-5 last:border-b",
                isHere && "border-primary/50 bg-primary/[0.03]",
              )}
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                  {isHere ? (
                    <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                  <span className="font-medium">{level.label}</span>
                  <span className="text-sm font-normal text-muted-foreground">{level.range}</span>
                  {isHere ? <Badge variant="outline">You are here</Badge> : null}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <p className="text-base font-medium">{level.headline}</p>
                <LevelDetails level={level} />
                <div className="mt-5 flex flex-wrap gap-2">
                  {packsForIds(level.packs).map((pack) => (
                    <Link
                      key={pack.id}
                      href={packHref(pack)}
                      className="rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {pack.title}
                    </Link>
                  ))}
                  {(level.lessons ?? []).map((lessonId) => {
                    const lesson = getLesson(lessonId);
                    return lesson ? (
                      <Link
                        key={lessonId}
                        href={`/learn/#lesson-${lessonId}`}
                        data-testid={`road-lesson-${lessonId}`}
                        className="bg-surface-sunken rounded-full px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {lesson.title}
                      </Link>
                    ) : null;
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
