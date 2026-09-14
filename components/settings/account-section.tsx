"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/components/legal/legal-links";
import { AUTH_NOT_CONFIGURED } from "@/lib/auth/config";
import { googleSignInErrorMessage, signInWithGoogle, signOutAccount } from "@/lib/auth/actions";
import { useAuth } from "@/components/auth/auth-provider";
import { GoogleIcon } from "@/components/auth/google-icon";
import { SettingsSection } from "./settings-section";

export function AccountSection() {
  const { status, user } = useAuth();

  const signingIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(googleSignInErrorMessage(error));
    }
  };

  return (
    <SettingsSection
      id="account"
      title="Account"
      description="Google sign-in unlocks Coach, Train and Learn, and keeps your times on the Google account (not on the operator’s laptop). A working copy stays in this browser so the timer stays fast."
    >
      {status === "signedIn" && user ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.displayName ?? "Signed in"}</p>
            {user.email ? (
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              Times on this account live in Google Cloud. Clearing this browser does not delete
              them; sign in on another device to restore them.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void signOutAccount()}>
            Sign out
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground" role="status">
            {status === "unconfigured"
              ? AUTH_NOT_CONFIGURED
              : status === "loading"
                ? "Checking account…"
                : "Not signed in."}
          </p>
          <Button
            type="button"
            className="w-fit"
            onClick={() => void signingIn()}
            disabled={status === "loading"}
          >
            <GoogleIcon className="size-4" />
            Sign in with Google
          </Button>
        </div>
      )}
      <LegalLinks className="mt-4" />
    </SettingsSection>
  );
}
