import type { Metadata } from "next";
import { Suspense } from "react";
import { CoachChat } from "@/components/coach/coach-chat";
import { GetMacApp } from "@/components/hub/get-mac-app";
import { features } from "@/lib/config/features";

export const metadata: Metadata = {
  title: features.coachChat ? "Your AI coach" : "Get the Mac app",
};

export default function AskPage() {
  // The desktop build has the chat here; the website points people at the app.
  return features.coachChat ? (
    <Suspense>
      <CoachChat />
    </Suspense>
  ) : (
    <GetMacApp />
  );
}
