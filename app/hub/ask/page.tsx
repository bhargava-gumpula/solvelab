import type { Metadata } from "next";
import { GetMacApp } from "@/components/hub/get-mac-app";
import { isDesktop } from "@/lib/config/mac-app";

export const metadata: Metadata = {
  title: isDesktop() ? "Your AI coach" : "Get the Mac app",
};

export default function AskPage() {
  // The desktop build gets the chat here; until it lands it shows a placeholder.
  return isDesktop() ? (
    <p className="text-muted-foreground" data-testid="coach-chat-pending">
      The coach chat is on its way to this app.
    </p>
  ) : (
    <GetMacApp />
  );
}
