"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/page-heading";
import { LegalLinks } from "@/components/legal/legal-links";
import { AUTH_NOT_CONFIGURED } from "@/lib/auth/config";
import { googleSignInErrorMessage, signInWithGoogle } from "@/lib/auth/actions";
import { useAuth } from "./auth-provider";
import { GoogleIcon } from "./google-icon";

export function AuthGate({
  area,
  children,
}: {
  area: "Coach" | "Train" | "Learn";
  children: React.ReactNode;
}) {
  const { status } = useAuth();

  if (status === "signedIn") return children;

  const signingIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(googleSignInErrorMessage(error));
    }
  };

  const waiting = status === "loading";

  return (
    <>
      <PageHeading
        eyebrow="Account required"
        title={`Sign in to use ${area}.`}
        description="The timer stays free on this device. Sign in to unlock Coach, Train and Learn, and to keep times on the Google account."
      />
      <section className="max-w-lg rounded-3xl p-6 glass">
        <p className="text-sm text-muted-foreground" role="status">
          {waiting
            ? "Checking account…"
            : status === "unconfigured"
              ? AUTH_NOT_CONFIGURED
              : "Sign in with Google. You’ll land on the timer when it’s done."}
        </p>
        <Button type="button" className="mt-4" onClick={() => void signingIn()} disabled={waiting}>
          <GoogleIcon className="size-4" />
          Sign in with Google
        </Button>
        <LegalLinks className="mt-5" />
      </section>
    </>
  );
}
