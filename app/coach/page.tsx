import type { Metadata } from "next";
import { Repeat2, ScanLine, Target, Timer } from "lucide-react";
import { FeatureCard } from "@/components/layout/feature-card";
import { PageHeading } from "@/components/layout/page-heading";
import { CoachDashboard } from "@/components/coach/coach-dashboard";
import { milestones } from "@/data/milestones";

export const metadata: Metadata = { title: "Coach" };

const steps = [
  { icon: Timer, name: "Establish your baseline", detail: "Normal solves give a starting point." },
  {
    icon: ScanLine,
    name: "Investigate the slowdown",
    detail: "Focused tests separate planning, recognition, execution and transitions.",
  },
  {
    icon: Target,
    name: "Practice what matters",
    detail: "A targeted plan follows the evidence from your tests.",
  },
  { icon: Repeat2, name: "Retest and adjust", detail: "Measure the change, then update the plan." },
];

export default function CoachPage() {
  return (
    <>
      <PageHeading
        eyebrow="Evidence before advice"
        title="Know what to practice next."
        description="A coach that runs experiments on your solving instead of guessing — entirely on this device."
      />
      <CoachDashboard />

      <h2 className="mt-8 mb-4 text-lg font-semibold tracking-tight">How coaching works</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <FeatureCard
            key={step.name}
            icon={step.icon}
            title={step.name}
            description={step.detail}
            badge={`0${index + 1}`}
          />
        ))}
      </div>

      <section className="mt-6 rounded-2xl p-5 glass">
        <h2 className="text-base font-semibold">Milestones</h2>
        <ol className="mt-4 flex flex-wrap gap-2" aria-label="Milestones from beginner to sub-10">
          {milestones.map((item) => (
            <li
              key={item.id}
              className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground"
            >
              {item.label}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          Progress uses sustained performance from your real solves — never a single lucky time.
        </p>
      </section>
    </>
  );
}
