"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStorageStatus } from "./storage-provider";

export function StorageAlert() {
  const { status, retry } = useStorageStatus();
  if (status !== "error") return null;
  return (
    <div
      role="alert"
      className="mb-5 flex flex-col gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        Local storage could not open, so solves can’t be saved. Your existing data has not been
        reset. Allow site storage for this page, then retry.
      </p>
      <Button variant="outline" size="sm" onClick={retry}>
        Retry storage
      </Button>
    </div>
  );
}
