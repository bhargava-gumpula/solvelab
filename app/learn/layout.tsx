"use client";

import { AuthGate } from "@/components/auth/auth-gate";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate area="Learn">{children}</AuthGate>;
}
