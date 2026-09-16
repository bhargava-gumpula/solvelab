import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { CoachDashboard } from "@/components/coach/coach-dashboard";

export const metadata: Metadata = { title: "Coach" };

export default function CoachPage() {
  return (
    <>
      <PageHeading
        eyebrow="See what’s slow"
        title="Set a goal. Time your stages."
        description="A diagnostic shows how Cross, F2L, OLL, and PLL compare to the pace you want."
      />
      <CoachDashboard />
    </>
  );
}
