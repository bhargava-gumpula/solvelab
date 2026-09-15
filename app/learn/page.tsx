import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { LearnDashboard } from "@/components/learn/learn-dashboard";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <>
      <PageHeading
        eyebrow="Understanding makes it faster"
        title="The next thing worth learning."
        description="Lesson plans for beginner, CFOP, and refinement — tracked on this device."
      />
      <LearnDashboard />
    </>
  );
}
