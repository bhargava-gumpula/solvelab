"use client";

import { RequireAccount } from "@/components/auth/require-account";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <RequireAccount area="coach">{children}</RequireAccount>;
}
