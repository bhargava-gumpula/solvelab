"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { googleSignInErrorMessage, signInWithGoogle } from "@/lib/auth/actions";
import { accessState, AREA_LABELS, AREA_REASONS, type AccountArea } from "@/lib/auth/access";
import { useAuth } from "./auth-provider";
import { GoogleIcon } from "./google-icon";

/**
 * Keeps an area that holds your own data behind a Google account. While the
 * account is still being checked it shows a placeholder, so the sign-in card
 * never flashes for someone who is signed in.
 */
export function RequireAccount({
  area,
  children,
}: {
  area: AccountArea;
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const state = accessState(status);

  if (state === "open") return children;
  if (state === "checking") {
    return (
      <div className="mx-auto grid max-w-3xl gap-4" aria-busy>
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  return <SignInWall area={area} />;
}

function SignInWall({ area }: { area: AccountArea }) {
  return (
    <section
      className="mx-auto grid max-w-xl gap-4 rounded-3xl p-6 text-center glass md:p-8"
      data-testid="sign-in-wall"
    >
      <span
        className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary"
        aria-hidden
      >
        <Lock className="size-5" />
      </span>
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in to use {AREA_LABELS[area]}.
        </h1>
        <p className="text-sm text-muted-foreground">{AREA_REASONS[area]}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          onClick={() => {
            void signInWithGoogle().catch((error: unknown) =>
              toast.error(googleSignInErrorMessage(error)),
            );
          }}
        >
          <GoogleIcon className="size-4" />
          Sign in with Google
        </Button>
        <Button asChild variant="outline">
          <Link href="/timer/">Back to the timer</Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The timer works without an account. Signing out clears this browser&apos;s copy of your
        data; your account keeps its own.
      </p>
    </section>
  );
}
