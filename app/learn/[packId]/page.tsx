import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { PackDetail } from "@/components/train/pack-detail";
import { Button } from "@/components/ui/button";
import { TRAINING_PACKS, getPack, packBandLabel } from "@/data/training";

export function generateStaticParams() {
  return TRAINING_PACKS.map((pack) => ({ packId: pack.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ packId: string }>;
}): Promise<Metadata> {
  const { packId } = await params;
  const pack = getPack(packId);
  return { title: pack ? pack.title : "Learn" };
}

export default async function TrainingPackPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = getPack(packId);
  if (!pack) notFound();

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 w-fit">
        <Link href="/learn/#packs">
          <ArrowLeft /> All packs
        </Link>
      </Button>
      <PageHeading
        eyebrow={`Learn · ${packBandLabel(pack)}`}
        title={pack.title}
        description={pack.summary}
      />
      <PackDetail pack={pack} />
    </>
  );
}
