"use client";

import { RequireAccount } from "@/components/auth/require-account";

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAccount area="stats">{children}</RequireAccount>;
}
