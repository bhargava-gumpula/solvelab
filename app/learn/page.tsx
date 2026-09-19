import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { upcoming } from "@/lib/config/features";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <ComingSoon area="Learn" phase={upcoming.learn} title="Lessons are coming later.">
      Lesson plans for beginner, CFOP, and refinement ship in {upcoming.learn}. For now, Coach’s
      skill tests show which parts of your solve to work on.
    </ComingSoon>
  );
}
