import type { Metadata } from "next";
import { HubHome } from "@/components/hub/hub-home";

export const metadata: Metadata = { title: "Learning Hub" };

export default function HubPage() {
  return <HubHome />;
}
