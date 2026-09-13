import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { FeatureCard } from "@/components/layout/feature-card";
import { PageHeading } from "@/components/layout/page-heading";
import { PhaseNotice } from "@/components/layout/phase-notice";
import { learningPaths } from "@/data/learning/paths";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <>
      <PageHeading
        eyebrow="Understanding makes it faster"
        title="The next thing worth learning."
        description="A path for where you are now, with room for where you’re going."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {learningPaths.map((path) => (
          <FeatureCard
            key={path.id}
            icon={BookOpen}
            title={path.name}
            description={path.description}
            badge={path.level}
            footer="Outline · lessons not yet available"
          >
            <ol className="my-4 divide-y text-sm">
              {path.topics.map((topic, index) => (
                <li key={topic} className="flex gap-3 py-2">
                  <span className="font-mono tabular text-xs text-muted-foreground">
                    0{index + 1}
                  </span>
                  {topic}
                </li>
              ))}
            </ol>
          </FeatureCard>
        ))}
      </div>
      <PhaseNotice phase="a later phase">
        These are curriculum outlines. Coaching will focus on CFOP first; the timer works with any
        method.
      </PhaseNotice>
    </>
  );
}
