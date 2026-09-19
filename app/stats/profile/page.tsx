import type { Metadata } from "next";
import { SolveProfileView } from "@/components/stats/solve-profile";

export const metadata: Metadata = { title: "Solve profile" };

export default function SolveProfilePage() {
  return <SolveProfileView />;
}
