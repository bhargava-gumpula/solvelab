"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { takeSignInReturnPath } from "@/lib/auth/return-path";
import { useAuth } from "./auth-provider";

/** After Google sign-in, go to the timer without reloading the tab. */
export function SignInReturn() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "signedIn") return;
    const path = takeSignInReturnPath();
    if (!path) return;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === path || window.location.pathname === path) return;
    router.replace(path);
  }, [status, router]);

  return null;
}
