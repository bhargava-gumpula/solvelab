import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { upcoming } from "@/lib/config/features";

export const metadata: Metadata = { title: "Train" };

export default function TrainPage() {
  return (
    <ComingSoon area="Train" phase={upcoming.train} title="Practice is coming later.">
      For now, take the skill tests on Coach to see which parts of your solve are slow, average or
      fast for your goal. Training packs with lessons and drills for each part land in{" "}
      {upcoming.train}.
    </ComingSoon>
  );
}
