"use client";

import { AuthGate } from "@/components/auth/auth-gate";

export default function TrainLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate area="Train">{children}</AuthGate>;
}
