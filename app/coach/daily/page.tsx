import type { Metadata } from "next";
import { DailyCheckView } from "@/components/tests/daily-check";

export const metadata: Metadata = { title: "Daily check" };

export default function DailyCheckPage() {
  return <DailyCheckView />;
}
