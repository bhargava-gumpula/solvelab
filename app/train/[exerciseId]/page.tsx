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
      Stage training sessions ship in {upcoming.train}. Use Coach for the diagnostic in 3.0.
    </ComingSoon>
  );
}
