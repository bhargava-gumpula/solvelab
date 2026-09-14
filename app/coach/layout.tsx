"use client";

import { AuthGate } from "@/components/auth/auth-gate";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate area="Coach">{children}</AuthGate>;
}
