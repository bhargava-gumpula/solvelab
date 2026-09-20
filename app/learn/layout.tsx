"use client";

import { RequireAccount } from "@/components/auth/require-account";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <RequireAccount area="learn">{children}</RequireAccount>;
}
