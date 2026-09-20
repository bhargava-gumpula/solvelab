import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CaseBrowser } from "@/components/algorithms/case-browser";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { algorithmSets } from "@/data/algorithms/sets";
import { ALGORITHM_SETS, getAlgorithmSet } from "@/lib/algorithms/catalog";

export function generateStaticParams() {
  return ALGORITHM_SETS.map((set) => ({ setId: set.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}): Promise<Metadata> {
  const { setId } = await params;
  const set = getAlgorithmSet(setId);
  return { title: set ? set.name : "Algorithms" };
}

export default async function AlgorithmSetPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const set = getAlgorithmSet(setId);
  if (!set) notFound();
  const definition = algorithmSets.find((entry) => entry.id === set.id);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 w-fit">
        <Link href="/algorithms/">
          <ArrowLeft /> All sets
        </Link>
      </Button>
      <PageHeading
        eyebrow="Algorithms"
        title={definition?.name ?? set.name}
        description={definition?.description}
      />
      <CaseBrowser set={set} />
    </>
  );
}
