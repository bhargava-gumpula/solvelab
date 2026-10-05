import type { Metadata } from "next";
import { GetMacApp } from "@/components/hub/get-mac-app";
import { features } from "@/lib/config/features";

export const metadata: Metadata = {
  title: features.coachChat ? "Your AI coach" : "Get the Mac app",
};

export default function AskPage() {
  // The desktop build gets the chat here; until it lands it shows a placeholder.
  return features.coachChat ? (
    <p className="text-muted-foreground" data-testid="coach-chat-pending">
      The coach chat is on its way to this app.
    </p>
  ) : (
    <GetMacApp />
  );
}
