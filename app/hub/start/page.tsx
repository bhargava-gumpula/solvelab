import type { Metadata } from "next";
import { Onboarding } from "@/components/hub/onboarding";

export const metadata: Metadata = { title: "Find your level" };

export default function HubStartPage() {
  return <Onboarding />;
}
