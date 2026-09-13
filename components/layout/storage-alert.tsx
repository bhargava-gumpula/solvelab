"use client";
import { useStorageStatus } from "./storage-provider";
import { Button } from "@/components/ui/button";
export function StorageAlert() {
  const { status, retry } = useStorageStatus();
  if (status !== "error") return null;
  return <div className="storage-alert" role="alert"><p>Local storage could not open. Your data has not been reset. Enable site storage to save progress.</p><Button variant="outline" onClick={retry}>Retry storage</Button></div>;
}
