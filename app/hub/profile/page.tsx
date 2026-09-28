import type { Metadata } from "next";
import { HubProfile } from "@/components/hub/hub-profile";

export const metadata: Metadata = { title: "Solve profile" };

export default function HubProfilePage() {
  return <HubProfile />;
}
