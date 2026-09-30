import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainerPage } from "@/components/algorithms/trainer-page";
import { PageHeading } from "@/components/layout/page-heading";
import { algorithmSets } from "@/data/algorithms/sets";
import { ALGORITHM_SETS } from "@/lib/algorithms/catalog";
import { ZBLL_SET_ID } from "@/lib/algorithms/zbll";

/** Every set with cases can be practised; Fundamentals has triggers, not cases. */
const TRAINABLE = [...ALGORITHM_SETS.map((set) => set.id), ZBLL_SET_ID];

export function generateStaticParams() {
  return TRAINABLE.map((setId) => ({ setId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}): Promise<Metadata> {
  const { setId } = await params;
  const name = algorithmSets.find((entry) => entry.id === setId)?.name ?? "Algorithms";
  return { title: `Practise ${name}` };
}

export default async function TrainAlgorithmsPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  if (!TRAINABLE.includes(setId)) notFound();
  const name = algorithmSets.find((entry) => entry.id === setId)?.name ?? setId;
  return (
    <>
      <PageHeading
        eyebrow="Algorithms"
        title={`Practise ${name}`}
        description="A scramble sets up a case, you solve it with your algorithm on your cube, and the time goes against the case. Cases you haven't done yet, and your slowest ones, come round more often."
      />
      <TrainerPage setId={setId} />
    </>
  );
}
