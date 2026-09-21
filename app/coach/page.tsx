import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { CoachDashboard } from "@/components/coach/coach-dashboard";

export const metadata: Metadata = { title: "Coach" };

export default function CoachPage() {
  return (
    <>
      <PageHeading
        eyebrow="Your coach"
        title="Find what’s slowing you down."
        description="Pick a goal, take a few short tests, and see which parts of your solve to work on."
      />
      <CoachDashboard />
    </>
  );
}
