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
      <Accordion
        type="multiple"
        defaultValue={here ? [here.level.id] : []}
        className="relative grid gap-1"
      >
        <span
          aria-hidden
          className="absolute top-6 bottom-6 left-[1.35rem] w-px bg-[linear-gradient(to_bottom,var(--hairline),color-mix(in_oklab,var(--primary)_40%,var(--hairline)),var(--hairline))]"
        />
        {LEVELS.map((level, index) => {
          const isHere = level.id === here?.level.id;
          return (
            <AccordionItem
              key={level.id}
              value={level.id}
              data-testid={`level-${level.id}`}
              className={cn(
                "relative rounded-[1.4rem] border-b-0 pr-4 pl-16 transition-colors",
                isHere &&
                  "bg-[var(--tile)] shadow-[var(--shadow-tile)] ring-1 ring-[var(--hairline)]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-3.5 left-0 grid size-11 place-items-center rounded-full border font-display text-lg italic",
                  isHere
                    ? "border-transparent bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_var(--primary)]"
                    : "border-[var(--hairline)] bg-[var(--tile-strong)] text-muted-foreground",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-[1.55rem] leading-tight font-normal md:text-[1.8rem]">
                    {level.label}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">{level.range}</span>
                  {isHere ? (
                    <Badge className="gap-1 rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                      <MapPin className="size-3" aria-hidden />
                      You are here
                    </Badge>
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <p className="font-display text-[1.35rem] leading-snug text-balance italic">
                  {level.headline}
                </p>
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
