import type { Metadata } from "next";
import { AskAi } from "@/components/hub/ask-ai";

export const metadata: Metadata = { title: "Your AI coach" };

export default function AskPage() {
  return <AskAi />;
}
