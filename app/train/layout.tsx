"use client";

import { RequireAccount } from "@/components/auth/require-account";

export default function TrainLayout({ children }: { children: React.ReactNode }) {
  return <RequireAccount area="train">{children}</RequireAccount>;
}
