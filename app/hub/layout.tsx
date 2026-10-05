"use client";

import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import { RequireAccount } from "@/components/auth/require-account";
import { features } from "@/lib/config/features";
import { hubPageNeedsAccount } from "@/lib/config/mac-app";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const page = <MotionConfig reducedMotion="user">{children}</MotionConfig>;
  return hubPageNeedsAccount(pathname, features.coachChat) ? (
    <RequireAccount area="hub">{page}</RequireAccount>
  ) : (
    page
  );
}
