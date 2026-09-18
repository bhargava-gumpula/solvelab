"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getRepositories } from "@/lib/storage";
import { getDatabase, initializeStorage } from "@/lib/storage/database";
import { migrateLegacyLocalData } from "@/lib/storage/legacy";

export type StorageStatus = "loading" | "ready" | "error";

interface StorageContextValue {
  status: StorageStatus;
  retry: () => void;
}

const StorageContext = createContext<StorageContextValue>({ status: "loading", retry: () => {} });

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<StorageStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    initializeStorage(getDatabase())
      .then(() =>
        migrateLegacyLocalData(getRepositories()).catch((error: unknown) => {
          // Old browser-only data is a convenience; never block the app on it.
          console.error("Couldn’t move older local data into the database.", error);
        }),
      )
      .then(() => active && setStatus("ready"))
      .catch((error: unknown) => {
        console.error("Local storage failed to open.", error);
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return <StorageContext.Provider value={{ status, retry }}>{children}</StorageContext.Provider>;
}

export function useStorageStatus() {
  return useContext(StorageContext);
}
