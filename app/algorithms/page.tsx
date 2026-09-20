import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { AlgorithmSetList } from "@/components/algorithms/set-list";

export const metadata: Metadata = { title: "Algorithms" };

export default function AlgorithmsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Algorithms"
        title="Every case, every algorithm that works."
        description="Mark what you know, what you're learning and what you don't, and pick the algorithm your fingers like. Each one is checked against a cube."
      />
      <AlgorithmSetList />
    </>
  );
}
