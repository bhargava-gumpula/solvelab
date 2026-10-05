"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { googleSignInErrorMessage, signInWithGoogle } from "@/lib/auth/actions";
import { accessState, AREA_LABELS, AREA_REASONS, type AccountArea } from "@/lib/auth/access";
import { useAuth } from "./auth-provider";
import { GoogleIcon } from "./google-icon";
import { localPlace } from "@/lib/config/platform";

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
    // Nothing for the first 300 ms (usually the check is done by then), then a
    // still outline of a Hub page: a cover square and two title lines.
    return (
      <div
        className="quiet-placeholder grid items-end gap-6 border-b border-[var(--hairline)] pb-8 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-10"
        aria-busy
        aria-label="Loading"
      >
        <span className="block aspect-square w-36 rounded-[1.4rem] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:w-auto" />
        <span className="grid gap-4 pb-2">
          <span className="block h-3 w-40 rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]" />
          <span className="block h-10 w-3/4 rounded-full bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]" />
          <span className="block h-3 w-1/2 rounded-full bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]" />
        </span>
      </div>
    );
  }
  return <SignInWall area={area} />;
}

function SignInWall({ area }: { area: AccountArea }) {
  return (
    <section
      className="tile mx-auto grid max-w-xl gap-4 p-6 text-center md:p-8"
      data-testid="sign-in-wall"
    >
      <span
        className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary"
        aria-hidden
      >
        <Lock className="size-5" />
      </span>
      <div className="grid gap-2">
        <h1 className="font-display text-[2.4rem] leading-[1.02]">
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
        The timer works without an account. Signing out clears this {localPlace()}&apos;s copy of
        your data; your account keeps its own.
      </p>
    </section>
  );
}
