"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getDatabase, initializeStorage } from "@/lib/storage/database";
type StorageStatus = "loading" | "ready" | "error";
const StorageContext = createContext<{ status: StorageStatus; retry: () => void }>({ status: "loading", retry: () => {} });

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<StorageStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { setStatus("loading"); setAttempt(value => value + 1); }, []);
  useEffect(() => {
    let active = true;
    initializeStorage(getDatabase()).then(() => { if (active) setStatus("ready"); }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [attempt]);
  return <StorageContext.Provider value={{ status, retry }}>{children}</StorageContext.Provider>;
}
export function useStorageStatus() { return useContext(StorageContext); }
