import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecognitionDrill } from "@/components/hub/recognition-drill";
import { unitHref, type RecognitionSet } from "@/lib/hub/units";

const DRILLS: Record<RecognitionSet, { title: string; unitId: string }> = {
  pll: { title: "Recognise PLL cases", unitId: "pll-algorithms" },
  oll: { title: "Recognise OLL cases", unitId: "oll-algorithms" },
};

type Props = { params: Promise<{ setId: string }> };

export function generateStaticParams() {
  return Object.keys(DRILLS).map((setId) => ({ setId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setId } = await params;
  return { title: DRILLS[setId as RecognitionSet]?.title ?? "Recognition" };
}

export default async function RecognisePage({ params }: Props) {
  const { setId } = await params;
  const drill = DRILLS[setId as RecognitionSet];
  if (!drill) notFound();
  return (
    <RecognitionDrill
      set={setId as RecognitionSet}
      title={drill.title}
      backHref={unitHref({ id: drill.unitId })}
    />
  );
}
