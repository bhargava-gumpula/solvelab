import type { Metadata } from "next";
import { StatsDashboard } from "@/components/stats/stats-dashboard";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return <StatsDashboard />;
}
