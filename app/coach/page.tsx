import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { CoachThreadView } from "@/components/coach/coach-thread";

export const metadata: Metadata = { title: "Coach" };

export default function CoachPage() {
  return (
    <>
      <PageHeading
        eyebrow="Your coach"
        title="Find what’s slowing you down."
        description="Your coach asks for the tests it needs, then tells you what to work on."
      />
      <CoachThreadView />
    </>
  );
}
