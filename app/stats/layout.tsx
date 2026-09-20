"use client";

import { RequireAccount } from "@/components/auth/require-account";
import { StatsTabs } from "@/components/stats/stats-tabs";

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAccount area="stats">
      <StatsTabs />
      {children}
    </RequireAccount>
  );
}
