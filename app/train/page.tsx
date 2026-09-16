import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { upcoming } from "@/lib/config/features";

export const metadata: Metadata = { title: "Train" };

export default function TrainPage() {
  return (
    <ComingSoon area="Train" phase={upcoming.train} title="Practice is coming later.">
      3.0 is the diagnostic: time each stage and see slow / average / fast versus your goal. Stage
      practice that updates those tags lands in {upcoming.train}.
    </ComingSoon>
  );
}
