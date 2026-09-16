"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AUTH_NOT_CONFIGURED } from "@/lib/auth/config";
import { googleSignInErrorMessage, signInWithGoogle } from "@/lib/auth/actions";
import { useAuth } from "./auth-provider";
import { GoogleIcon } from "./google-icon";

/**
 * Coach / Train / Learn are local-first. Sign-in is optional (cloud sync).
 * Never block the page on auth loading — diagnostics must stay usable offline.
 */
export function AuthGate({
  area,
  children,
}: {
  area: "Coach" | "Train" | "Learn";
  children: React.ReactNode;
}) {
  const { status } = useAuth();

  return (
    <>
      {status === "signedOut" || status === "unconfigured" ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm glass">
          <p className="text-muted-foreground">
            {area} works without an account.
            {status === "unconfigured"
              ? ` ${AUTH_NOT_CONFIGURED}`
              : " Sign in anytime to sync times."}
          </p>
          {status === "signedOut" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void signInWithGoogle().catch((error) =>
                  toast.error(googleSignInErrorMessage(error)),
                );
              }}
            >
              <GoogleIcon className="size-4" />
              Sign in
            </Button>
          ) : null}
        </div>
      ) : null}
      {children}
    </>
  );
}
