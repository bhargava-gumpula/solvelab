"use client";

import { useState } from "react";
import { Layers3, Search } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureCard } from "@/components/layout/feature-card";
import { algorithmSets } from "@/data/algorithms/sets";
import { upcoming } from "@/lib/config/features";
import type { AlgorithmSetDefinition } from "@/types/domain";

const LEVELS = [
  { value: "all", label: "All sets" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "CFOP" },
  { value: "advanced", label: "Advanced" },
] as const;

function matchesLevel(set: AlgorithmSetDefinition, level: string) {
  if (level === "all") return true;
  if (level === "advanced") return set.difficulty === "advanced" || set.difficulty === "expert";
  return set.difficulty === level;
}

export function AlgorithmCatalog() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const normalized = query.toLowerCase().trim();
  const sets = algorithmSets.filter(
    (set) =>
      matchesLevel(set, level) &&
      `${set.name} ${set.description} ${set.category}`.toLowerCase().includes(normalized),
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={level} onValueChange={setLevel}>
          <TabsList aria-label="Algorithm level">
            {LEVELS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search algorithm sets"
            placeholder="Search sets…"
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      <p className="mb-3 text-xs text-muted-foreground" role="status">
        {sets.length} planned {sets.length === 1 ? "set" : "sets"}
      </p>
      {sets.length === 0 ? (
        <Empty className="rounded-2xl glass">
          <EmptyHeader>
            <EmptyTitle>No matching sets</EmptyTitle>
            <EmptyDescription>Try a broader name or choose a different level.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sets.map((set) => (
            <FeatureCard
              key={set.id}
              icon={Layers3}
              title={set.name}
              description={set.description}
              badge={set.difficulty}
              footer={`Cases and drills coming in ${upcoming.algorithms}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
