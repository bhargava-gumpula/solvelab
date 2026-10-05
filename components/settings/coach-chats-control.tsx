"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { getRepositories } from "@/lib/storage";
import { plural } from "@/lib/utils";

/** Mac app only: how many chats the AI coach has saved on this Mac, and a way to delete them all. */
export function CoachChatsControl() {
  const ready = useStorageStatus().status === "ready";
  const count = useLiveQuery(
    async () => (ready ? await getRepositories().coachChats.count() : undefined),
    [ready],
  );
  const [confirming, setConfirming] = useState(false);

  const clear = async () => {
    try {
      await getRepositories().coachChats.clear();
      toast.success("Coach chats cleared");
    } catch {
      toast.error("The coach chats couldn’t be cleared");
    }
    setConfirming(false);
  };

  return (
    <div className="mt-6 flex items-start justify-between gap-6 border-t pt-5">
      <div>
        <p className="text-sm font-medium">Coach chats</p>
        <p className="mt-0.5 text-sm text-muted-foreground" data-testid="coach-chats-note">
          {count === undefined ? "Counting…" : `${plural(count, "chat")} with your AI coach.`} They
          are kept only on this Mac, never on your Google account, and are deleted when you sign
          out. Export a backup to keep them.
        </p>
      </div>
      <Button
        variant="outline"
        className="shrink-0"
        disabled={!count}
        onClick={() => setConfirming(true)}
        data-testid="clear-coach-chats"
      >
        <Trash2 /> Clear coach chats
      </Button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear every coach chat?</AlertDialogTitle>
            <AlertDialogDescription>
              {count === 1
                ? "This deletes your chat"
                : `This deletes all ${count ?? 0} of your chats`}{" "}
              with the AI coach from this Mac. Nothing else changes, and it can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void clear()}
              data-testid="confirm-clear-coach-chats"
            >
              Clear coach chats
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
