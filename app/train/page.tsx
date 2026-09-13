import type { Metadata } from "next";
import { Crosshair, Layers3, Timer } from "lucide-react";
import { FeatureCard } from "@/components/layout/feature-card";
import { PageHeading } from "@/components/layout/page-heading";
import { PhaseNotice } from "@/components/layout/phase-notice";
import { exercises } from "@/data/exercises";

export const metadata: Metadata = { title: "Train" };

const icons = { normal_solves: Timer, cross_first_pair: Crosshair, slow_f2l: Layers3 } as const;

export default function TrainPage() {
  const previews = exercises.filter(
    (item): item is typeof item & { id: keyof typeof icons } => item.id in icons,
  );
  return (
    <>
      <PageHeading
        eyebrow="Practice with a purpose"
        title="Turn focus into progress."
        description="Structured exercises, measured before and after."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {previews.map((item) => (
          <FeatureCard
            key={item.id}
            icon={icons[item.id]}
            title={item.name}
            description={item.description}
            badge={item.category.replace("_", " ")}
            footer={`${item.recommendedSampleCount} suggested repetitions`}
          />
        ))}
      </div>
      <PhaseNotice phase="V2">
        These are exercise definitions, not active drills or a personal recommendation. Every
        training plan will end with a retest.
      </PhaseNotice>
    </>
  );
}
