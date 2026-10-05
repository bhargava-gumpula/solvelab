"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { completeSupabaseReturnFromUrl } from "@/lib/auth/actions";
import { watchSignInLinks } from "@/lib/auth/desktop-link";
import { isDesktop } from "@/lib/config/platform";

/** In the Mac app: finish a sign-in when the browser returns through `solvelab://auth/callback`. */
export function DesktopSignInLink() {
  const router = useRouter();

  useEffect(() => {
    if (!isDesktop()) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    watchSignInLinks((link) => {
      completeSupabaseReturnFromUrl(link)
        .then((result) => {
          if (result.status === "signedIn" && window.location.pathname !== result.path) {
            router.replace(result.path);
          }
        })
        .catch(console.error);
    })
      .then((unlisten) => {
        if (cancelled) unlisten();
        else stop = unlisten;
      })
      .catch(console.error);
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [router]);

  return null;
}
