import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnitView } from "@/components/hub/unit-view";
import { ALL_UNITS, getUnit } from "@/lib/hub/units";

type Props = { params: Promise<{ unitId: string }> };

export function generateStaticParams() {
  return ALL_UNITS.map((unit) => ({ unitId: unit.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { unitId } = await params;
  return { title: getUnit(unitId)?.title ?? "Unit" };
}

export default async function UnitPage({ params }: Props) {
  const { unitId } = await params;
  if (!getUnit(unitId)) notFound();
  return <UnitView unitId={unitId} />;
}
