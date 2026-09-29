import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecognitionDrill, type RecognitionCopy } from "@/components/hub/recognition-drill";
import { unitHref, type RecognitionSet } from "@/lib/hub/units";

/** Last-layer drills: the answers are case names. */
const NAME_THE_CASE: RecognitionCopy = {
  task: "Name each one as fast as you can",
  timeLabel: "Average time to name",
  prompt: "Which case is this?",
};

const DRILLS: Record<RecognitionSet, { title: string; unitId: string; copy: RecognitionCopy }> = {
  pll: { title: "Recognise PLL cases", unitId: "pll-algorithms", copy: NAME_THE_CASE },
  oll: { title: "Recognise OLL cases", unitId: "oll-algorithms", copy: NAME_THE_CASE },
  "two-look-oll": {
    title: "Recognise 2-look OLL cases",
    unitId: "two-look-oll",
    copy: NAME_THE_CASE,
  },
  "two-look-pll": {
    title: "Recognise 2-look PLL cases",
    unitId: "two-look-pll",
    copy: NAME_THE_CASE,
  },
  // The answers are algorithms, not names.
  f2l: {
    title: "Which algorithm solves this pair?",
    unitId: "advanced-f2l-cases",
    copy: {
      task: "Pick the algorithm that solves the pair for the front-right slot, as fast as you can",
      timeLabel: "Average time to answer",
      prompt: "Which algorithm solves this pair?",
    },
  },
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
      copy={drill.copy}
      backHref={unitHref({ id: drill.unitId })}
    />
  );
}
