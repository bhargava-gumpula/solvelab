"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { signOutAndForget } from "@/lib/auth/sign-out";
import { pushLocalChanges } from "@/lib/sync/account";

type Stage = "ask" | "saving" | "unsaved" | "leaving";

/**
 * Firestore keeps retrying a write while it is offline rather than failing, so
 * waiting for it forever would leave the button spinning. Past this, the
 * account counts as out of reach.
 */
const SAVE_TIMEOUT_MS = 6000;

/**
 * Signing out clears this browser, so it asks first, says what stays on the
 * account, and makes sure the account has the latest before anything goes.
 */
export function SignOutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [stage, setStage] = useState<Stage>("ask");
  const busy = stage === "saving" || stage === "leaving";

  const leave = () => {
    setStage("leaving");
    void signOutAndForget().catch((error: unknown) => {
      console.error(error);
      setStage("ask");
      toast.error("Couldn’t sign out. Try again.");
    });
  };

  const confirm = () => {
    setStage("saving");
    // Anything still only in this browser goes to the account first.
    void Promise.race([
      pushLocalChanges(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), SAVE_TIMEOUT_MS)),
    ])
      .then(leave)
      .catch(() => setStage("unsaved"));
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        if (!next) setStage("ask");
        onOpenChange(next);
      }}
    >
      <AlertDialogContent data-testid="sign-out-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {stage === "unsaved" ? "Your account is out of reach" : "Sign out of this browser?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {stage === "unsaved"
              ? "Some of your latest times couldn’t be saved to your Google account just now. Signing out clears this browser, so anything it hasn’t saved yet would be lost. You could cancel and try again when you’re back online."
              : "Your times, coach conversations and solve profile stay on your Google account and come back when you sign in. This browser’s copy is cleared, so the site starts fresh. Only how the app looks stays."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              // The page reloads at the end, so keep the dialog up until then.
              event.preventDefault();
              if (stage === "unsaved") leave();
              else confirm();
            }}
          >
            {stage === "saving"
              ? "Saving to your account…"
              : stage === "leaving"
                ? "Signing out…"
                : stage === "unsaved"
                  ? "Sign out anyway"
                  : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** State for the places that offer signing out: the header menu and Settings. */
export function useSignOutDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, dialog: <SignOutDialog open={open} onOpenChange={setOpen} /> };
}
