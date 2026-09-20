"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { getDatabase } from "@/lib/storage/database";
import {
  attachAccountSyncHooks,
  isOfflineSyncError,
  startAccountSession,
} from "@/lib/sync/account";
import { resetLocalData } from "@/lib/storage/reset";
import { useStorageStatus } from "./storage-provider";

export function AccountSyncProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const { status: storage } = useStorageStatus();
  const syncedUid = useRef<string | null>(null);

  useEffect(() => {
    if (storage !== "ready") return;
    attachAccountSyncHooks(getDatabase());
  }, [storage]);

  useEffect(() => {
    if (status !== "signedIn") {
      syncedUid.current = null;
      return;
    }
    if (storage !== "ready" || !user) return;
    if (syncedUid.current === user.uid) return;
    syncedUid.current = user.uid;
    void startAccountSession(user.uid)
      .then(async (result) => {
        if (result !== "switched") return;
        // This browser holds another account's data. Clear it before anything
        // is read or uploaded, then start the page again from an empty copy.
        await resetLocalData(() => getDatabase().close());
        window.location.reload();
      })
      .catch((error: unknown) => {
        console.error(error);
        // Offline is normal and fixes itself; only say something is wrong when it is.
        if (!isOfflineSyncError(error)) toast.error("Couldn’t sync times to the Google account.");
      });
  }, [status, storage, user]);

  return children;
}
