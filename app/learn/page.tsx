import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { LearnDashboard } from "@/components/learn/learn-dashboard";
import { LearnLibrary } from "@/components/learn/learn-library";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <>
      <PageHeading
        eyebrow="Learn"
        title="The road from two minutes to sub-10."
        description="What is costing you time at each stage, what to leave alone until later, and a pack for everything worth learning on the way."
      />
      <div className="grid gap-10">
        <LearnLibrary />
        <section aria-labelledby="lessons-heading">
          <h2 id="lessons-heading" className="mb-1 text-base font-semibold">
            The method itself
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Short lessons for learning to solve the cube and then learning CFOP. If you already
            solve comfortably, the packs above are the more useful read.
          </p>
          <LearnDashboard />
        </section>
      </div>
    </>
  );
}
