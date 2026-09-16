import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { PhaseNotice } from "@/components/layout/phase-notice";
import { AlgorithmCatalog } from "@/components/algorithms/algorithm-catalog";
import { upcoming } from "@/lib/config/features";

export const metadata: Metadata = { title: "Algorithms" };

export default function AlgorithmsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Recognize. Recall. Execute."
        title="Build a repertoire you can rely on."
        description="Browse the sets we will train. Drills and tracking come later."
      />
      <AlgorithmCatalog />
      <PhaseNotice phase={upcoming.algorithms}>
        Case diagrams, variants, timed drills, and mastery tracking are planned for{" "}
        {upcoming.algorithms}. You can browse the set list now.
      </PhaseNotice>
    </>
  );
}
