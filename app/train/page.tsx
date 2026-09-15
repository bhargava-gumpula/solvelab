import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { TrainDashboard } from "@/components/train/train-dashboard";

export const metadata: Metadata = { title: "Train" };

export default function TrainPage() {
  return (
    <>
      <PageHeading
        eyebrow="Practice with a purpose"
        title="Turn focus into progress."
        description="Arm diagnostics and drills, time them on the timer, then retest."
      />
      <TrainDashboard />
    </>
  );
}
