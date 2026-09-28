import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DrillSession } from "@/components/hub/drill-session";
import { TRAINING_PACKS, getPack } from "@/data/training";
import { unitHref } from "@/lib/hub/units";

type Props = { params: Promise<{ unitId: string; drillId: string }> };

export function generateStaticParams() {
  return TRAINING_PACKS.flatMap((pack) =>
    pack.drills.map((drill) => ({ unitId: pack.id, drillId: drill.id })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { unitId, drillId } = await params;
  return { title: getPack(unitId)?.drills.find((drill) => drill.id === drillId)?.title ?? "Drill" };
}

export default async function DrillPage({ params }: Props) {
  const { unitId, drillId } = await params;
  const pack = getPack(unitId);
  const drill = pack?.drills.find((item) => item.id === drillId);
  if (!pack || !drill) notFound();
  return (
    <DrillSession packId={pack.id} packTitle={pack.title} drill={drill} backHref={unitHref(pack)} />
  );
}
