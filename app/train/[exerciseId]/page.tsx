import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PRACTICE_TOPICS } from "@/data/exercises";
import { upcoming } from "@/lib/config/features";

export function generateStaticParams() {
  return PRACTICE_TOPICS.map((topic) => ({ exerciseId: topic.trainingId }));
}

export const metadata: Metadata = { title: "Training" };

export default function TrainingSessionPage() {
  return (
    <ComingSoon area="Train" phase={upcoming.train} title="Practice is coming later.">
      Training packs ship in {upcoming.train}. For now, Coach’s skill tests show which parts of your
      solve to work on.
    </ComingSoon>
  );
}
