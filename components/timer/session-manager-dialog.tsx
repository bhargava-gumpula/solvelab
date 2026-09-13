"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ZodError } from "zod";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessions, useSolveCounts } from "@/hooks/use-local-data";
import { getRepositories } from "@/lib/storage";
import { MAX_SESSION_NAME_LENGTH } from "@/lib/storage/schemas";
import type { Session } from "@/types/domain";

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the session name.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

interface SessionManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startCreating?: boolean;
  activeSessionId: string | undefined;
}

export function SessionManagerDialog({
  open,
  onOpenChange,
  startCreating,
  activeSessionId,
}: SessionManagerDialogProps) {
  const sessions = useSessions(true);
  const counts = useSolveCounts();
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Session | null>(null);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) toast.success(success);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName;
    const ok = await run(async () => {
      const session = await getRepositories().sessions.create(name);
      await getRepositories().sessions.setActive(session.id);
    }, `Switched to “${name.trim()}”`);
    if (ok) {
      setNewName("");
      onOpenChange(false);
    }
  };

  const saveRename = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!renamingId) return;
    if (await run(() => getRepositories().sessions.rename(renamingId, renameValue)))
      setRenamingId(null);
  };

  const active = sessions?.filter((session) => !session.archivedAt) ?? [];
  const archived = sessions?.filter((session) => session.archivedAt) ?? [];

  const renderRow = (session: Session) => {
    const count = counts?.get(session.id) ?? 0;
    const isActive = session.id === activeSessionId;
    return (
      <li key={session.id} className="flex items-center gap-3 py-2.5">
        {renamingId === session.id ? (
          <form onSubmit={saveRename} className="flex flex-1 gap-2">
            <Input
              aria-label={`Rename ${session.name}`}
              value={renameValue}
              maxLength={MAX_SESSION_NAME_LENGTH}
              autoFocus
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Escape" && (event.stopPropagation(), setRenamingId(null))
              }
            />
            <Button type="submit" size="sm">
              Save
            </Button>
          </form>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-medium">
                {session.name}
                {isActive && <Badge variant="secondary">Active</Badge>}
              </p>
              <p className="tabular text-xs text-muted-foreground">
                {count} {count === 1 ? "solve" : "solves"}
              </p>
            </div>
            {!isActive && !session.archivedAt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => run(() => getRepositories().sessions.setActive(session.id))}
              >
                Switch
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${session.name}`}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setRenamingId(session.id);
                    setRenameValue(session.name);
                  }}
                >
                  <Pencil /> Rename
                </DropdownMenuItem>
                {session.archivedAt ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      run(
                        () => getRepositories().sessions.unarchive(session.id),
                        "Session restored",
                      )
                    }
                  >
                    <ArchiveRestore /> Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() =>
                      run(() => getRepositories().sessions.archive(session.id), "Session archived")
                    }
                  >
                    <Archive /> Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(session)}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </li>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sessions</DialogTitle>
            <DialogDescription>
              Separate your solves by goal, like warmups or PLL practice.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={create} className="space-y-2">
            <Label htmlFor="new-session-name">New session</Label>
            <div className="flex gap-2">
              <Input
                id="new-session-name"
                placeholder="e.g. Sub-15 Grind"
                value={newName}
                maxLength={MAX_SESSION_NAME_LENGTH}
                autoFocus={startCreating}
                onChange={(event) => setNewName(event.target.value)}
              />
              <Button type="submit" disabled={!newName.trim()}>
                Create
              </Button>
            </div>
          </form>

          <ul className="divide-y border-t" aria-label="Sessions">
            {active.map(renderRow)}
          </ul>
          {archived.length > 0 && (
            <div>
              <p className="mb-1 eyebrow">Archived</p>
              <ul className="divide-y" aria-label="Archived sessions">
                {archived.map(renderRow)}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(value) => !value && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the session and its{" "}
              {counts?.get(pendingDelete?.id ?? "") ?? 0} solves from this device. Export a backup
              first if you might want them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                const target = pendingDelete;
                if (target)
                  void run(() => getRepositories().sessions.delete(target.id), "Session deleted");
              }}
            >
              Delete session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
