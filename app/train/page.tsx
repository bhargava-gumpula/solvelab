import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { TrainDashboard } from "@/components/train/train-dashboard";

export const metadata: Metadata = { title: "Train" };

export default function TrainPage() {
  return (
    <>
      <PageHeading
        eyebrow="Train"
        title="What you're working on."
        description="The drills you chose to practise and the packs you've started. What to learn next is on Learn."
      />
      <TrainDashboard />
    </>
  );
}
