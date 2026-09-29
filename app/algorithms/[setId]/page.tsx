import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CaseBrowser } from "@/components/algorithms/case-browser";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { algorithmSets } from "@/data/algorithms/sets";
import { SET_SOURCES } from "@/data/algorithms/sources";
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
      {SET_SOURCES[set.id]?.length ? (
        <p className="-mt-2 mb-4 text-xs text-muted-foreground" data-testid="set-sources">
          Published by{" "}
          {SET_SOURCES[set.id]!.map((source, index) => (
            <span key={source.url}>
              {index ? " · " : null}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {source.label}
              </a>
            </span>
          ))}
          . Every algorithm here is also checked against SolveLab&apos;s own cube.
        </p>
      ) : null}
      <CaseBrowser set={set} />
    </>
  );
}
