"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Database, Download, Upload } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useStorageStatus } from "@/components/layout/storage-provider";
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
  type BackupDocument,
  type ImportMode,
} from "@/lib/export/backup";
import { getRepositories } from "@/lib/storage";
import { DATABASE_VERSION } from "@/lib/storage/database";
import { useAuth } from "@/components/auth/auth-provider";
import { useSettings } from "@/hooks/use-local-data";
import { isAuthConfigured } from "@/lib/auth/config";
import { setTrainingDataSharing, sharingChangeMessage } from "@/lib/training-data/controls";
import { SettingsSection } from "./settings-section";

export function DataSection() {
  const { status, retry } = useStorageStatus();
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === "signedIn";
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupDocument | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    try {
      const backup = await createBackup(getRepositories().db);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backupFileName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${backup.data.solves.length} solves`);
    } catch {
      toast.error("The backup couldn’t be created");
    }
  };

  const chooseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setMode("merge");
    setPending(result.document);
  };

  const confirmImport = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const summary = await restoreBackup(getRepositories().db, pending, mode);
      toast.success(
        `Imported ${summary.solvesAdded} solves and ${summary.sessionsAdded} sessions` +
          (summary.solvesSkipped ? ` · ${summary.solvesSkipped} already present` : ""),
      );
      setPending(null);
    } catch {
      toast.error("Import failed. Nothing was changed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsSection
      id="data"
      title="Your data"
      description={
        signedIn
          ? "This browser keeps a working copy so the timer stays fast. Signed-in times also live on the Google account in Google Cloud — not on the operator’s laptop."
          : "Signed out, the timer still works and its times stay in this browser. Coach, Stats, Train and Learn need an account, and signing out clears this browser’s copy."
      }
    >
      <div className="bg-surface-sunken flex items-start gap-3 rounded-lg p-4" role="status">
        <Database className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="flex-1 text-sm">
          <p className="font-medium">
            {status === "ready"
              ? "Local database ready"
              : status === "error"
                ? "Local storage is unavailable"
                : "Opening local database…"}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            {status === "error"
              ? "Your browser may be blocking site storage. Existing data has not been reset."
              : `Schema version ${DATABASE_VERSION}. Clearing this site’s data removes the local copy${signedIn ? "; sign in again to restore from the Google account" : ""}.`}
          </p>
        </div>
        {status === "error" && (
          <Button variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportBackup} disabled={status !== "ready"}>
          <Download /> Export backup
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInput.current?.click()}
          disabled={status !== "ready"}
        >
          <Upload /> Import backup
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Backup file"
          data-testid="backup-file-input"
          onChange={chooseFile}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Backups are JSON files with every session, solve and timer setting. Use them to move to
        another browser or device.
      </p>

      {isAuthConfigured() ? <CoachTrainingToggle /> : null}

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && !busy && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending &&
                `${pending.data.solves.length} solves in ${pending.data.sessions.length} sessions, exported ${new Date(
                  pending.exportedAt,
                ).toLocaleString()}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as ImportMode)}
            aria-label="Import mode"
            className="gap-3"
          >
            <Label
              htmlFor="import-merge"
              className="flex items-start gap-3 rounded-lg border p-3 font-normal"
            >
              <RadioGroupItem id="import-merge" value="merge" className="mt-0.5" />
              <span>
                <span className="block font-medium">Merge</span>
                <span className="text-muted-foreground">
                  Keep everything here and add anything new from the file.
                </span>
              </span>
            </Label>
            <Label
              htmlFor="import-replace"
              className="flex items-start gap-3 rounded-lg border p-3 font-normal"
            >
              <RadioGroupItem id="import-replace" value="replace" className="mt-0.5" />
              <span>
                <span className="block font-medium">Replace</span>
                <span className="text-muted-foreground">
                  Delete all sessions and solves on this device, then restore the file.
                </span>
              </span>
            </Label>
          </RadioGroup>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void confirmImport();
              }}
              className={
                mode === "replace" ? "bg-destructive text-white hover:bg-destructive/90" : undefined
              }
            >
              {mode === "replace" ? "Replace my data" : "Merge backup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}

function CoachTrainingToggle() {
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  if (!settings) return null;

  const change = async (on: boolean) => {
    setBusy(true);
    const result = await setTrainingDataSharing(on);
    toast(sharingChangeMessage(on, result));
    setBusy(false);
  };

  return (
    <div className="mt-6 flex items-start justify-between gap-6 border-t pt-5">
      <div>
        <Label htmlFor="coach-training" className="text-sm font-medium">
          Help improve the coach
        </Label>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Share your finished test results to train SolveLab’s coach: attempt times, which test,
          your goal and the day. Never your name, email, notes, scrambles or timer solves. Turning
          this off deletes what you’ve shared.{" "}
          <Link href="/privacy/#coach-training" className="underline underline-offset-4">
            Details
          </Link>
        </p>
      </div>
      <div className="pt-0.5">
        <Switch
          id="coach-training"
          checked={settings.contributeTrainingData}
          disabled={busy}
          onCheckedChange={(on) => void change(on)}
        />
      </div>
    </div>
  );
}
