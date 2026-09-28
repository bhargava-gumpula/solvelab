"use client";

import { MotionConfig } from "motion/react";
import { RequireAccount } from "@/components/auth/require-account";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAccount area="hub">
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </RequireAccount>
  );
}
